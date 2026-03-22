const mongoose = require('mongoose');
const config = require('./config/env');

const cleanIndexes = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const collection = mongoose.connection.collection('products');
    const indexes = await collection.indexes();
    
    for (const idx of indexes) {
      if (idx.name === '_id_') continue;
      console.log(`Dropping index: ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
    
    console.log('All secondary indexes dropped.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
cleanIndexes();
