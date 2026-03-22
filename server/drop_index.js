const mongoose = require('mongoose');
const config = require('./config/env');

const dropIndex = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('products');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    const indexName = 'variants.sku_1_organization_1';
    const exists = indexes.find(idx => idx.name === indexName);

    if (exists) {
      console.log(`Dropping index: ${indexName}`);
      await collection.dropIndex(indexName);
      console.log('Index dropped successfully');
    } else {
      console.log(`Index ${indexName} not found`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

dropIndex();
