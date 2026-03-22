const mongoose = require('mongoose');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { emitNotification } = require('../utils/socket');

// @desc    Get inventory logs
// @route   GET /api/inventory/logs
exports.getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { organization: req.organization };
    if (req.query.product) filter.product = req.query.product;
    if (req.query.type) filter.type = req.query.type;

    const [logs, total] = await Promise.all([
      InventoryLog.find(filter)
        .populate('product', 'name sku')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InventoryLog.countDocuments(filter),
    ]);

    res.json({ logs, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/inventory/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    // Fetch products and use the isLowStock virtual
    const allProducts = await Product.find({ organization: req.organization }).populate('vendor', 'name');
    const products = allProducts.filter(p => p.isLowStock);

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Manually adjust stock
// @route   POST /api/inventory/adjust
exports.adjustStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, warehouseId, warehouse: warehouseAlias, type, quantity, reason } = req.body;
    const effectiveWarehouseId = warehouseId || warehouseAlias;

    const product = await Product.findOne({ _id: productId, organization: req.organization }).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find stock in specific warehouse
    let stockIndex = product.warehouseStock.findIndex(
      ws => ws.warehouse && ws.warehouse.toString() === effectiveWarehouseId
    );

    const previousStock = stockIndex !== -1 ? product.warehouseStock[stockIndex].quantity : 0;

    if (type === 'in') {
      if (stockIndex === -1) {
        product.warehouseStock.push({ warehouse: warehouseId, quantity });
        stockIndex = product.warehouseStock.length - 1;
      } else {
        product.warehouseStock[stockIndex].quantity += quantity;
      }
    } else if (type === 'out') {
      if (stockIndex === -1 || product.warehouseStock[stockIndex].quantity < quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Insufficient stock in this warehouse' });
      }
      product.warehouseStock[stockIndex].quantity -= quantity;
    } else {
      // adjustment — set to exact value
      if (stockIndex === -1) {
        product.warehouseStock.push({ warehouse: warehouseId, quantity });
        stockIndex = product.warehouseStock.length - 1;
      } else {
        product.warehouseStock[stockIndex].quantity = quantity;
      }
    }

    await product.save({ session });

    const log = await InventoryLog.create([{
      product: productId,
      warehouse: warehouseId,
      type,
      quantity,
      previousStock,
      newStock: product.warehouseStock[stockIndex].quantity,
      reason: reason || 'Manual adjustment',
      user: req.user._id,
      organization: req.organization,
    }], { session });

    // Check for low stock notification
    if (product.totalQuantity <= product.lowStockThreshold) {
      const [notification] = await Notification.create([{
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is down to ${product.totalQuantity} total units after adjustment`,
        link: `/products/${product._id}`,
        organization: req.organization,
      }], { session });
      emitNotification(req.organization.toString(), notification);
    }

    await session.commitTransaction();
    const logger = require('../utils/logger');
    logger.info(`Stock adjusted for product ${productId} in warehouse ${warehouseId}. New stock: ${product.warehouseStock[stockIndex].quantity}. Reason: ${reason || 'Manual adjustment'}`);
    res.json({ product, log: log[0] });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
