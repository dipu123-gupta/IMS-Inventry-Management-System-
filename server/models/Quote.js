const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
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
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  }
});

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  items: [quoteItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'declined', 'invoiced'],
    default: 'draft',
  },
  validUntil: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  termsAndConditions: {
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

// Auto-generate quote number
quoteSchema.pre('save', async function (next) {
  if (!this.quoteNumber) {
    const Counter = require('./Counter');
    const seq = await Counter.getNextSequence(this.organization, 'quote');
    this.quoteNumber = `EST-${String(seq).padStart(6, '0')}`;
  }
  next();
});

quoteSchema.index({ quoteNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Quote', quoteSchema);
