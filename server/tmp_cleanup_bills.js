const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Bill = require('./models/Bill');
const Counter = require('./models/Counter');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Delete all bills for the test organization (or all)
        const delBills = await Bill.deleteMany({});
        console.log('Deleted bills:', delBills.deletedCount);

        // 2. Reset Counter for 'bill'
        const delCounter = await Counter.deleteMany({ model: 'bill' });
        console.log('Cleared bill counters');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
