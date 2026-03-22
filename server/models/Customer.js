const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0 // Positive means they owe us (credit system)
  },
  purchaseHistory: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    date: Date,
    amount: Number
  }]
}, { timestamps: true });

customerSchema.index({ email: 1, organization: 1 }, { unique: true, sparse: true });
customerSchema.index({ phone: 1, organization: 1 });

module.exports = mongoose.model('Customer', customerSchema);
