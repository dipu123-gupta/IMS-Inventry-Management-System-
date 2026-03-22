const mongoose = require('mongoose');
const config = require('./config/env');
const Order = require('./models/Order');

const checkOrders = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const saleCount = await Order.countDocuments({ type: 'sale' });
    const purchaseCount = await Order.countDocuments({ type: 'purchase' });
    console.log('ORDER_COUNTS:', { saleCount, purchaseCount });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkOrders();
