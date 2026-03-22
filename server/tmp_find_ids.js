const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
require('dotenv').config();

async function findIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const customer = await Customer.findOne();
        const order = await Order.findOne({ type: 'sale' });
        console.log('Customer ID:', customer?._id);
        console.log('Order ID:', order?._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findIds();
