const BaseRepository = require('./BaseRepository');
const Batch = require('../../models/Batch');

class BatchRepository extends BaseRepository {
  constructor() {
    super(Batch);
  }

  async findProductBatches(productId, organization) {
    return this.model.find({ 
      product: productId, 
      organization,
      quantity: { $gt: 0 }
    }).sort({ expiryDate: 1 });
  }

  async findExpiringBatches(organization, today, thirtyDaysFromNow) {
    return this.model.find({
      organization,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: today },
      quantity: { $gt: 0 }
    }).populate('product', 'name sku').populate('warehouse', 'name');
  }
}

module.exports = new BatchRepository();
