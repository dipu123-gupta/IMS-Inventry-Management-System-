const mongoose = require('mongoose');
const { 
  ORDER_STATUS, 
  ORDER_TYPE, 
  PAYMENT_STATUS, 
  PAYMENT_MODE, 
  ORDER_PREFIX 
} = require('../utils/constants');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
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
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ORDER_TYPE),
      required: [true, 'Order type is required'],
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    paymentDetails: {
      method: { type: String }, // e.g. 'razorpay', 'cash'
      transactionId: { type: String },
      orderId: { type: String }, // Razorpay Order ID
      cardLast4: { type: String },
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    quoteReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: '',
    },
    customerEmail: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number, // Percentage, e.g., 18 for 18% GST
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate order number and calculate totals before validation
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const Counter = require('./Counter');
    const { ORDER_TYPE: types, ORDER_PREFIX: prefixes } = require('../utils/constants');
    const seq = await Counter.getNextSequence(this.organization, `order_${this.type}`);
    const prefix = this.type === (types.PURCHASE || 'purchase') ? (prefixes.PURCHASE || 'PO') : (prefixes.SALE || 'SO');
    this.orderNumber = `${prefix}-${String(seq).padStart(6, '0')}`;
  }
  // Calculate totals
  if (this.items) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Calculate aggregate tax and discounts from line items
    const lineItemDiscounts = this.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const lineItemTaxes = this.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    
    this.taxAmount = lineItemTaxes + ((this.subtotal - (this.discount || 0) - lineItemDiscounts) * ((this.taxRate || 0) / 100));
    this.totalAmount = this.subtotal - (this.discount || 0) - lineItemDiscounts + this.taxAmount;
  }
  next();
});

orderSchema.index({ orderNumber: 1, organization: 1 }, { unique: true });
orderSchema.index({ type: 1, organization: 1 });
orderSchema.index({ status: 1, organization: 1 });
orderSchema.index({ customer: 1, organization: 1 });
orderSchema.index({ vendor: 1, organization: 1 });
orderSchema.index({ createdAt: -1, organization: 1 });

module.exports = mongoose.model('Order', orderSchema);
