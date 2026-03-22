const BatchRepository = require('../repositories/BatchRepository');
const ProductRepository = require('../repositories/ProductRepository');

class BatchService {
  async getProductBatches(productId, organization) {
    const batches = await BatchRepository.findProductBatches(productId, organization);
    return { success: true, count: batches.length, batches };
  }

  async createBatch(data, organization) {
    const { product } = data;
    
    const existingProduct = await ProductRepository.findOne({ _id: product, organization });
    if (!existingProduct) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const batch = await BatchRepository.create({
      ...data,
      organization
    });

    return { success: true, batch };
  }

  async getExpiringBatches(organization) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const batches = await BatchRepository.findExpiringBatches(organization, today, thirtyDaysFromNow);
    return { success: true, count: batches.length, batches };
  }
}

module.exports = new BatchService();
