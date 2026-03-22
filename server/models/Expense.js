const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'salary', 'marketing', 'maintenance', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: String,
  paidTo: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi'],
    default: 'cash'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
