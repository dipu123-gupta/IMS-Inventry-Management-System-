const ProductRepository = require('../repositories/ProductRepository');
const InventoryService = require('./InventoryService');
const { emitNotification } = require('../../utils/socket');
const { clearCachePattern } = require('../../utils/redisClient');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const { NOTIFICATION_TYPE } = require('../../utils/constants');
const logger = require('../../utils/logger');

class ProductService {
  async getProducts(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { sku: { $regex: queryParams.search, $options: 'i' } },
        { barcode: { $regex: queryParams.search, $options: 'i' } },
      ];
    }
    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.warehouse) {
      filter['warehouseStock.warehouse'] = queryParams.warehouse;
    }

    const [products, total] = await Promise.all([
      ProductRepository.findWithVendor(filter, skip, limit),
      ProductRepository.countDocuments(filter),
    ]);

    return {
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
    };
  }

  async getProductById(id, organization) {
    const product = await ProductRepository.findByIdWithVendor(id, organization);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async createProduct(data, organization) {
    // Ensure images is an array
    if (data.image && !data.images) {
      data.images = [data.image];
      delete data.image;
    }

    const product = await ProductRepository.create({ ...data, organization });

    // Emit event — triggers auto-stock init, notifications, dashboard refresh
    eventBus.emit(EVENTS.PRODUCT_CREATED, {
      orgId: organization,
      product
    });

    logger.info(`Product ${product.sku} created for organization ${organization}`);
    await clearCachePattern(`cache:${organization}:/api/v1/products*`);
    return product;
  }

  async updateProduct(id, data, organization) {
    // Handle image migration/update
    if (data.image && !data.images) {
      data.images = [data.image];
      delete data.image;
    }

    const product = await ProductRepository.updateOne(
      { _id: id, organization },
      data
    );
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Emit event — triggers low-stock check, dashboard refresh
    eventBus.emit(EVENTS.PRODUCT_UPDATED, {
      orgId: organization,
      product
    });

    logger.info(`Product ${product.sku} updated for organization ${organization}`);
    await clearCachePattern(`cache:${organization}:/api/v1/products*`);
    return product;
  }

  async deleteProduct(id, organization) {
    const product = await ProductRepository.findOne({ _id: id, organization });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const totalStock = product.warehouseStock.reduce((acc, item) => acc + item.quantity, 0);
    if (totalStock > 0) {
      const error = new Error('Cannot delete product with active stock. Please adjust stock to zero first.');
      error.statusCode = 400;
      throw error;
    }

    await ProductRepository.deleteOne({ _id: id, organization });

    // Emit event — triggers dashboard refresh
    eventBus.emit(EVENTS.PRODUCT_DELETED, {
      orgId: organization,
      productId: id
    });

    logger.info(`Product ${id} deleted for organization ${organization}`);
    await clearCachePattern(`cache:${organization}:/api/v1/products*`);
    return true;
  }

  async getCategories(organization) {
    return ProductRepository.getDistinctCategories(organization);
  }
}

module.exports = new ProductService();
