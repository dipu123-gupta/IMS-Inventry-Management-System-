const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['revenue', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Payment', 'Return', 'Expense', 'Invoice', 'Bill']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Finance', financeSchema);
