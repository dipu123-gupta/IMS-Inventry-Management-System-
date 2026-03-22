const BaseRepository = require('./BaseRepository');
const Invoice = require('../../models/Invoice');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  findInvoiceByNumber(invoiceNumber, organization) {
    return this.model.findOne({ invoiceNumber, organization });
  }

  findInvoicesWithDetails(filter, skip, limit) {
    return this.model.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name email address')
      .populate('salesOrder', 'orderNumber')
      .populate('items.product', 'name sku');
  }
}

module.exports = new InvoiceRepository();
