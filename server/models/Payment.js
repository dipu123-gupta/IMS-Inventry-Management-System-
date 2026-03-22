const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'card', 'upi'],
    default: 'bank_transfer',
  },
  reference: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['payable', 'receivable'],
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
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
  },
}, { timestamps: true });

paymentSchema.index({ invoice: 1, organization: 1 });
paymentSchema.index({ bill: 1, organization: 1 });
paymentSchema.index({ customer: 1, organization: 1 });
paymentSchema.index({ vendor: 1, organization: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
