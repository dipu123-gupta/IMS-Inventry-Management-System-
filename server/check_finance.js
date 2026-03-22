const mongoose = require('mongoose');
const config = require('./config/env');
const Finance = require('./models/Finance');

const checkFinanceData = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const count = await Finance.countDocuments();
    console.log('FINANCE_COUNT:', count);
    const sample = await Finance.find().limit(5);
    console.log('SAMPLE:', JSON.stringify(sample, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkFinanceData();
