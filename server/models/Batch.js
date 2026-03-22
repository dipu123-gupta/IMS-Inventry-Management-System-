const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  manufacturingDate: Date,
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }
}, { timestamps: true });

// Auto-generate batch number if not provided
batchSchema.pre('save', async function (next) {
  if (!this.batchNumber) {
    const Counter = mongoose.model('Counter');
    const seq = await Counter.getNextSequence(this.organization, 'batch');
    this.batchNumber = `BAT-${String(seq).padStart(6, '0')}`;
  }
  next();
});

// Ensure unique batch number per product per organization
batchSchema.index({ product: 1, batchNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
