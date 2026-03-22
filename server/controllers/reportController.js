const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const ActivityLog = require('../models/ActivityLog');
const Invoice = require('../models/Invoice');
const Bill = require('../models/Bill');
const Organization = require('../models/Organization');

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalProducts, totalOrders, recentOrders, recentLogs, recentInvoices, recentBills] = await Promise.all([
      Product.countDocuments({ organization: req.organization }),
      Order.countDocuments({ organization: req.organization }),
      Order.find({ organization: req.organization }).populate('customer', 'name').sort({ createdAt: -1 }).limit(5),
      ActivityLog.find({ organization: req.organization }).populate('user', 'name').sort({ createdAt: -1 }).limit(10),
      Invoice.find({ organization: req.organization }).populate('customer', 'name').sort({ createdAt: -1 }).limit(5),
      Bill.find({ organization: req.organization }).populate('vendor', 'name').sort({ createdAt: -1 }).limit(5),
    ]);

    // Low stock count (Aggregated across all warehouses)
    const lowStockResult = await Product.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(req.organization) } },
      { $addFields: { totalQty: { $sum: "$warehouseStock.quantity" } } },
      { $match: { $expr: { $lte: ["$totalQty", "$lowStockThreshold"] } } },
      { $count: "count" }
    ]);
    const lowStockCount = lowStockResult[0]?.count || 0;

    // Revenue from completed sales
    const revenueResult = await Order.aggregate([
      { $match: { organization: req.organization, type: 'sale', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Purchase cost
    const costResult = await Order.aggregate([
      { $match: { organization: req.organization, type: 'purchase', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalCost = costResult[0]?.total || 0;

    // Monthly sales for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      { $match: { organization: req.organization, type: 'sale', status: { $ne: 'cancelled' }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top products by quantity sold
    const topProducts = await Order.aggregate([
      { $match: { organization: req.organization, type: 'sale', status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      stats: { totalProducts, totalOrders, totalRevenue, totalCost, lowStockCount },
      monthlySales,
      topProducts,
      recentOrders,
      recentLogs,
      recentInvoices,
      recentBills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sales report
// @route   GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { organization: req.organization, type: 'sale', status: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    res.json({ orders, totalRevenue, totalOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Inventory report
// @route   GET /api/reports/inventory
exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find({ organization: req.organization })
      .populate('supplier', 'name')
      .sort({ category: 1, name: 1 });

    const stats = await Product.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(req.organization) } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$cost'] } },
          totalItems: { $sum: '$quantity' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const { totalValue, totalItems, lowStockCount } = stats[0] || { totalValue: 0, totalItems: 0, lowStockCount: 0 };

    res.json({ products, totalValue, totalItems, lowStockCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Export data as CSV
// @route   GET /api/reports/export/csv
exports.exportCSV = async (req, res, next) => {
  try {
    const { type } = req.query; // 'products' | 'orders' | 'inventory'

    const org = await Organization.findById(req.organization);
    const currency = org?.settings?.currency || 'USD';

    if (type === 'products') {
      const products = await Product.find({ organization: req.organization }).lean();
      let headers = `Name,SKU,Category,Price (${currency}),Cost (${currency}),Quantity,Warehouse\n`;
      let data = products.map(
        (p) => `"${p.name}","${p.sku}","${p.category}",${p.price},${p.cost},${p.quantity || 0},"${p.warehouse || ''}"`
      );
    } else if (type === 'orders') {
      const orders = await Order.find({ organization: req.organization }).lean();
      let headers = `Order Number,Type,Status,Total Amount (${currency}),Date\n`;
      let data = orders.map(
        (o) =>
          `"${o.orderNumber}","${o.type}","${o.status}",${o.totalAmount},"${new Date(o.createdAt).toISOString()}"`
      );
    } else {
      const logs = await InventoryLog.find({ organization: req.organization }).populate('product', 'name sku').lean();
      let headers = 'Product,SKU,Type,Quantity,Previous Stock,New Stock,Reason,Date\n';
      let data = logs.map(
        (l) =>
          `"${l.product?.name || ''}","${l.product?.sku || ''}","${l.type}",${l.quantity},${l.previousStock},${l.newStock},"${l.reason}","${new Date(l.createdAt).toISOString()}"`
      );
    }

    const csv = headers + data.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type || 'export'}_report.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Get category analysis (Revenue & Stock by Category)
// @route   GET /api/reports/category-analysis
exports.getCategoryAnalysis = async (req, res, next) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.organization);
    
    const analysis = await Product.aggregate([
      { $match: { organization: orgId } },
      {
        $project: {
          category: 1,
          cost: 1,
          totalQuantity: { $sum: "$warehouseStock.quantity" }
        }
      },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$totalQuantity' },
          inventoryValue: { $sum: { $multiply: ['$totalQuantity', '$cost'] } },
        }
      },
      { $sort: { inventoryValue: -1 } }
    ]);

    // Revenue by category from orders
    const salesAnalysis = await Order.aggregate([
      { $match: { organization: orgId, type: 'sale', status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          category: '$_id',
          revenue: 1,
          orderCount: { $size: '$orderCount' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({ inventory: analysis, sales: salesAnalysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get warehouse performance
// @route   GET /api/reports/warehouse-performance
exports.getWarehousePerformance = async (req, res, next) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.organization);
    
    const performance = await Product.aggregate([
      { $match: { organization: orgId } },
      { $unwind: '$warehouseStock' },
      {
        $group: {
          _id: '$warehouseStock.warehouse',
          totalQuantity: { $sum: '$warehouseStock.quantity' },
          uniqueProducts: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id',
          foreignField: '_id',
          as: 'warehouse'
        }
      },
      { $unwind: '$warehouse' },
      {
        $project: {
          name: '$warehouse.name',
          location: '$warehouse.location',
          totalQuantity: 1,
          productCount: { $size: '$uniqueProducts' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    res.json(performance);
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory velocity (Forecasting)
// @route   GET /api/reports/velocity
exports.getInventoryVelocity = async (req, res, next) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.organization);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const velocityData = await Order.aggregate([
      { 
        $match: { 
          organization: orgId, 
          type: 'sale', 
          status: { $ne: 'cancelled' },
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          soldDays: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }
        }
      },
      {
        $project: {
          productId: '$_id',
          totalSold: 1,
          avgDailyVelocity: { $divide: ['$totalSold', 30] } // 30 day average
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          currentStock: { $sum: '$product.warehouseStock.quantity' },
          lowStockThreshold: '$product.lowStockThreshold',
          totalSold: 1,
          avgDailyVelocity: 1,
          daysOfStockRemaining: {
            $cond: [
              { $gt: ['$avgDailyVelocity', 0] },
              { $divide: [{ $sum: '$product.warehouseStock.quantity' }, '$avgDailyVelocity'] },
              999 // Infinite if no sales
            ]
          }
        }
      },
      { $sort: { daysOfStockRemaining: 1 } }
    ]);

    res.json(velocityData);
  } catch (error) {
    next(error);
  }
};
