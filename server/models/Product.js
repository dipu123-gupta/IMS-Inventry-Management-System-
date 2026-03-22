const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
    },
    images: [{
      type: String, // URLs to uploaded images
    }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
    },
    trackBatches: {
      type: Boolean,
      default: false
    },
    isPerishable: {
      type: Boolean,
      default: false
    },
    minStockLevel: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    cost: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    warehouseStock: [{
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      },
      quantity: {
        type: Number,
        default: 0,
        min: 0
      },
      shelfLocation: {
        type: String,
        default: ''
      }
    }],
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    image: {
      type: String,
      default: '',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    variants: [{
      name: String,
      sku: { type: String, sparse: true },
      price: Number,
      cost: Number,
      options: [{
        name: String, // e.g., 'Size'
        value: String // e.g., 'XL'
      }],
      warehouseStock: [{
        warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
        quantity: { type: Number, default: 0 }
      }]
    }],
  },
  { timestamps: true }
);

// Virtual: total quantity across all warehouses and variants
productSchema.virtual('totalQuantity').get(function () {
  let total = 0;
  if (this.warehouseStock) {
    total += this.warehouseStock.reduce((acc, item) => acc + item.quantity, 0);
  }
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach(variant => {
      if (variant.warehouseStock) {
        total += variant.warehouseStock.reduce((acc, item) => acc + item.quantity, 0);
      }
    });
  }
  return total;
});

// Virtual: check if low stock (based on total aggregated quantity)
productSchema.virtual('isLowStock').get(function () {
  const total = this.totalQuantity; // Uses the updated virtual above
  return total <= this.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Generate barcode and SKU if not present
productSchema.pre('save', function (next) {
  if (!this.barcode) {
    // Generate a random 12 digit number
    this.barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }
  
  if (!this.sku) {
    // Generate an auto-SKU: PROD-YEAR-RANDOM
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.sku = `SKU-${year}-${random}`;
  }

  // Handle variants SKUs
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach((variant, index) => {
      if (!variant.sku || variant.sku.trim() === '') {
        // Auto-generate variant SKU if missing
        variant.sku = `${this.sku}-V${index + 1}`;
      } else {
        variant.sku = variant.sku.trim().toUpperCase();
      }
    });
  }
  next();
});

productSchema.index({ sku: 1, organization: 1 }, { unique: true });
productSchema.index({ 'variants.sku': 1, organization: 1 }, { unique: true, partialFilterExpression: { 'variants.sku': { $type: 'string' } } });
productSchema.index({ category: 1, organization: 1 });
productSchema.index({ barcode: 1, organization: 1 });
productSchema.index({ isActive: 1, organization: 1 });

module.exports = mongoose.model('Product', productSchema);
