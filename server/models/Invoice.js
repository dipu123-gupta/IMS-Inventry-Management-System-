const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: String,
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
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerName: String,
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
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
    enum: ['sent', 'partial', 'paid', 'void', 'overdue'],
    default: 'sent',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  notes: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Auto-generate invoice number and calculate totals
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const Counter = require('./Counter');
    const seq = await Counter.getNextSequence(this.organization, 'invoice');
    this.invoiceNumber = `INV-${String(seq).padStart(6, '0')}`;
  }

  // Calculate totals if items exist
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lineItemDiscounts = this.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const lineItemTaxes = this.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    
    this.taxAmount = lineItemTaxes;
    this.discountAmount = lineItemDiscounts;
    this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;
  }
  
  this.balance = this.totalAmount - this.amountPaid;
  next();
});

invoiceSchema.index({ invoiceNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
