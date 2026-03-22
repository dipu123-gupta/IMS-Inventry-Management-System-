const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  fromWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'shipped', 'received'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  shippedAt: Date,
  receivedAt: Date,
  rejectionReason: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Generate unique transfer number
transferSchema.pre('save', async function (next) {
  if (this.isNew || !this.transferNumber) {
    const Counter = require('./Counter');
    const seq = await Counter.getNextSequence(this.organization, 'transfer');
    this.transferNumber = `TRF-${String(seq).padStart(5, '0')}`;
  }
  next();
});

transferSchema.index({ transferNumber: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Transfer', transferSchema);
