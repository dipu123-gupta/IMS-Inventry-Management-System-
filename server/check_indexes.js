const mongoose = require('mongoose');
const config = require('./config/env');

const checkIndexes = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const indexes = await mongoose.connection.collection('products').indexes();
    console.log('INDEXES:', JSON.stringify(indexes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkIndexes();
