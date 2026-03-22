const ProductRepository = require('../repositories/ProductRepository');
const InventoryLogRepository = require('../repositories/InventoryLogRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const { emitNotification } = require('../../utils/socket');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const { NOTIFICATION_TYPE } = require('../../utils/constants');
const logger = require('../../utils/logger');

class InventoryService {
  /**
   * Adjust stock for a product in a specific warehouse.
   * Called by: OrderService, TransferService, ReturnService, inventoryController
   */
  async adjustStock({
    productId,
    warehouseId,
    quantity,
    type, // 'in' or 'out'
    reason,
    referenceId,
    userId,
    organizationId,
    session = null
  }) {
    const query = ProductRepository.model.findOne({ _id: productId, organization: organizationId });
    if (session) query.session(session);
    const product = await query;

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const stockIndex = product.warehouseStock.findIndex(
      ws => ws.warehouse.toString() === warehouseId.toString()
    );

    const previousStock = stockIndex !== -1 ? product.warehouseStock[stockIndex].quantity : 0;
    const qtyChange = type === 'in' ? quantity : -quantity;

    if (stockIndex === -1) {
      if (type === 'out') {
        throw new Error(`Insufficient stock for ${product.name} in specified warehouse (No stock record)`);
      }
      product.warehouseStock.push({ warehouse: warehouseId, quantity });
    } else {
      if (type === 'out' && product.warehouseStock[stockIndex].quantity < quantity) {
        throw new Error(`Insufficient stock for ${product.name} in specified warehouse`);
      }
      product.warehouseStock[stockIndex].quantity += qtyChange;
    }

    await product.save({ session });

    // Create Inventory Log
    const [log] = await InventoryLogRepository.model.create([{
      product: productId,
      warehouse: warehouseId,
      type,
      quantity,
      previousStock,
      newStock: previousStock + qtyChange,
      reason,
      reference: referenceId,
      user: userId,
      organization: organizationId
    }], { session });

    // Emit STOCK_ADJUSTED — drives dashboard refresh, real-time UI updates
    eventBus.emit(EVENTS.STOCK_ADJUSTED, {
      orgId: organizationId,
      product,
      log,
      type,
      quantity
    });

    // Check for low stock and emit if necessary
    await this.checkAndEmitLowStockAlert(product, organizationId, session);

    return { product, log };
  }

  /**
   * Initialize stock record for a product in a warehouse (quantity = 0).
   * Called by inventoryListeners when PRODUCT_CREATED fires.
   */
  async initializeStock(productId, warehouseId, organizationId) {
    const product = await ProductRepository.findOne({ _id: productId, organization: organizationId });
    if (!product) return;

    const existing = product.warehouseStock.find(
      ws => ws.warehouse.toString() === warehouseId.toString()
    );
    if (existing) return; // Already has a stock record

    product.warehouseStock.push({ warehouse: warehouseId, quantity: 0 });
    await product.save();

    logger.info(`Auto-initialized stock for product ${product.sku} in warehouse ${warehouseId}`);
    return product;
  }

  /**
   * Check if stock is available
   */
  async checkStockAvailability(productId, warehouseId, quantity, organizationId, session = null) {
    const query = ProductRepository.model.findOne({ _id: productId, organization: organizationId });
    if (session) query.session(session);
    const product = await query;

    if (!product) return false;

    const stock = product.warehouseStock.find(
      ws => ws.warehouse.toString() === warehouseId.toString()
    );

    return stock && stock.quantity >= quantity;
  }

  /**
   * Unified Low Stock Alert — emits event + creates notification
   */
  async checkAndEmitLowStockAlert(product, organizationId, session = null) {
    if (product.totalQuantity <= product.lowStockThreshold) {
      try {
        const [notification] = await NotificationRepository.model.create([{
          type: NOTIFICATION_TYPE.LOW_STOCK,
          title: 'Low Stock Alert',
          message: `${product.name} (${product.sku}) is at ${product.totalQuantity} total units`,
          link: `/products/${product._id}`,
          organization: organizationId
        }], { session });

        emitNotification(organizationId, notification);

        // Emit LOW_STOCK_DETECTED for dashboard and real-time UI
        eventBus.emit(EVENTS.LOW_STOCK_DETECTED, {
          orgId: organizationId,
          product
        });

        logger.info(`Low stock alert emitted for ${product.sku} (Org: ${organizationId})`);
      } catch (err) {
        logger.error('Error emitting low stock notification', err);
      }
    }
  }
}

module.exports = new InventoryService();
