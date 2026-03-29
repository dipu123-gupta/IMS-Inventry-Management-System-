const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  type: {
    type: String,
    enum: ['sale', 'purchase'],
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    reason: String,
    condition: {
      type: String,
      enum: ['good', 'damaged', 'defective'],
      default: 'good'
    }
  }],
  totalRefundAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Auto-generate return number
returnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const Counter = mongoose.model('Counter');
    const seq = await Counter.getNextSequence(this.organization, 'return');
    const prefix = 'RET';
    this.returnNumber = `${prefix}-${String(seq).padStart(6, '0')}`;
  }
  next();
});

returnSchema.index({ returnNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Return', returnSchema);
