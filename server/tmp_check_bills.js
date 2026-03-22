const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the server root
dotenv.config({ path: path.join(__dirname, '.env') });

const Bill = require('./models/Bill');
const Counter = require('./models/Counter');

async function checkBills() {
    try {
        const uri = process.env.MONGO_URI;
        console.log('Connecting to:', uri ? 'URI found' : 'URI MISSING');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const bills = await Bill.find({}, 'billNumber organization').sort({ createdAt: -1 }).limit(20);
        console.log('Last 20 Bills:', bills.map(b => ({ number: b.billNumber, org: b.organization })));

        const counters = await Counter.find({ model: 'bill' });
        console.log('Bill Counters:', counters.map(c => ({ org: c.organization, seq: c.seq })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBills();
