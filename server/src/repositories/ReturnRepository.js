const BaseRepository = require('./BaseRepository');
const Return = require('../../models/Return');

class ReturnRepository extends BaseRepository {
  constructor() {
    super(Return);
  }

  findReturnsWithDetails(organization) {
    return this.model.find({ organization })
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name');
  }
}

module.exports = new ReturnRepository();
