const BaseRepository = require('./BaseRepository');
const Order = require('../../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  findOrders(filter, skip, limit) {
    return this.model.find(filter)
      .populate('vendor', 'name')
      .populate('createdBy', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findOrderByIdWithDetails(id, organization, session = null) {
    let query = this.model.findOne({ _id: id, organization })
      .populate('vendor', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku price');
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  getCustomerOrders(customerId, organization) {
    return this.model.find({ 
      customer: customerId,
      organization 
    }).sort({ createdAt: -1 })
      .populate('items.product', 'name sku price')
      .populate('items.warehouse', 'name');
  }

  getVendorOrders(vendorId, organization) {
    return this.model.find({ 
      vendor: vendorId,
      organization,
      type: 'purchase'
    }).sort({ createdAt: -1 })
      .populate('items.product', 'name sku price')
      .populate('items.warehouse', 'name');
  }
}

module.exports = new OrderRepository();
