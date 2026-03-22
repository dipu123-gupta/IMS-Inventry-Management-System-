const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  items: [billItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['open', 'partially_paid', 'paid', 'void'],
    default: 'open',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
}, { timestamps: true });

// Auto-generate bill number and calculate totals
billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const Counter = require('./Counter');
    const seq = await Counter.getNextSequence(this.organization, 'bill');
    this.billNumber = `BILL-${String(seq).padStart(6, '0')}`;
  }

  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;
  }
  
  this.balance = this.totalAmount - this.amountPaid;
  next();
});

billSchema.index({ billNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
