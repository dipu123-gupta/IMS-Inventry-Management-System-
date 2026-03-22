const { Parser } = require('json2csv');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

exports.exportToCSV = async (req, res, next) => {
  try {
    const { entity } = req.params; // products, orders, vendors
    let data;
    let fields;

    if (entity === 'products') {
      data = await Product.find({ organization: req.organization }).populate('vendor', 'name');
      fields = ['name', 'sku', 'category', 'price', 'cost', 'totalQuantity', 'lowStockThreshold'];
    } else if (entity === 'orders') {
      data = await Order.find({ organization: req.organization }).populate('customer', 'name').populate('vendor', 'name');
      fields = ['orderNumber', 'type', 'totalAmount', 'status', 'paymentStatus', 'createdAt'];
    } else if (entity === 'vendors') {
      data = await Vendor.find({ organization: req.organization });
      fields = ['name', 'email', 'phone', 'contactPerson', 'address'];
    } else {
      return res.status(400).json({ message: 'Invalid entity' });
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${entity}-export-${new Date().toISOString()}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

exports.exportToJSON = async (req, res, next) => {
  try {
    const { entity } = req.params;
    let data;

    if (entity === 'products') {
      data = await Product.find({ organization: req.organization }).populate('vendor', 'name');
    } else if (entity === 'orders') {
      data = await Order.find({ organization: req.organization });
    } else if (entity === 'vendors') {
      data = await Vendor.find({ organization: req.organization });
    } else {
      return res.status(400).json({ message: 'Invalid entity' });
    }

    res.header('Content-Type', 'application/json');
    res.attachment(`${entity}-export-${new Date().toISOString()}.json`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    next(error);
  }
};
