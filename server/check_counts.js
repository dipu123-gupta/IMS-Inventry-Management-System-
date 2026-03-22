const mongoose = require('mongoose');
const config = require('./config/env');
const Invoice = require('./models/Invoice');
const Bill = require('./models/Bill');
const Expense = require('./models/Expense');

const checkCounts = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const invoiceCount = await Invoice.countDocuments();
    const billCount = await Bill.countDocuments();
    const expenseCount = await Expense.countDocuments();
    console.log('COUNTS:', { invoiceCount, billCount, expenseCount });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkCounts();
