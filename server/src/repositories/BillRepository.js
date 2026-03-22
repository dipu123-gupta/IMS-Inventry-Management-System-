const BaseRepository = require('./BaseRepository');
const Bill = require('../../models/Bill');

class BillRepository extends BaseRepository {
  constructor() {
    super(Bill);
  }

  findWithDetails(filter, skip, limit) {
    return this.model.find(filter)
      .populate('vendor', 'name email company')
      .populate('items.product', 'name sku')
      .populate('purchaseOrder', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findByIdWithDetails(id, organization) {
    return this.model.findOne({ _id: id, organization })
      .populate('vendor', 'name email address phone company')
      .populate('items.product', 'name sku price')
      .populate('purchaseOrder', 'orderNumber totalAmount');
  }
}

module.exports = new BillRepository();
