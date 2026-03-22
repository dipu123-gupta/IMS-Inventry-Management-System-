const BaseRepository = require('./BaseRepository');
const Payment = require('../../models/Payment');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findPayments(filter, skip, limit) {
    return this.model.find(filter)
      .populate('vendor', 'name email')
      .populate('customer', 'name email')
      .populate('bill', 'billNumber totalAmount amountPaid')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new PaymentRepository();
