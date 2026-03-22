const mongoose = require('mongoose');
const config = require('./config/env');

const checkIndexes = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const indexes = await mongoose.connection.collection('products').indexes();
    indexes.forEach(idx => {
      console.log(`- NAME: ${idx.name}`);
      console.log(`  KEY: ${JSON.stringify(idx.key)}`);
      if (idx.unique) console.log('  UNIQUE: true');
      if (idx.sparse) console.log('  SPARSE: true');
      if (idx.partialFilterExpression) console.log(`  PARTIAL: ${JSON.stringify(idx.partialFilterExpression)}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkIndexes();
