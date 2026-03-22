const mongoose = require('mongoose');
const config = require('./config/env');
const Order = require('./models/Order');
const Finance = require('./models/Finance');
const Invoice = require('./models/Invoice');
const Bill = require('./models/Bill');

const syncLedger = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing (start fresh for sync)
    await Finance.deleteMany({});
    console.log('Cleared existing finance ledger');

    // 1. Sync Invoices (Revenue)
    const invoices = await Invoice.find({});
    for (const inv of invoices) {
      await Finance.create({
        type: 'revenue',
        amount: inv.totalAmount,
        category: 'Sales',
        description: `Revenue from Invoice ${inv.invoiceNumber}`,
        date: inv.createdAt,
        reference: inv._id,
        referenceModel: 'Invoice',
        organization: inv.organization
      });
    }
    console.log(`Synced ${invoices.length} invoices`);

    // 2. Sync Bills (Expense)
    const bills = await Bill.find({});
    for (const bill of bills) {
      await Finance.create({
        type: 'expense',
        amount: bill.totalAmount,
        category: 'Cost of Goods',
        description: `Cost from Bill ${bill.billNumber}`,
        date: bill.createdAt,
        reference: bill._id,
        referenceModel: 'Bill',
        organization: bill.organization
      });
    }
    console.log(`Synced ${bills.length} bills`);

    // 3. Fallback: Sync Orders that don't have invoices/bills yet (to make dashboard look good)
    const sales = await Order.find({ type: 'sale', status: { $ne: 'cancelled' } });
    for (const sale of sales) {
      // Check if already invoiced (avoid double counting)
      const invExists = await Invoice.findOne({ salesOrder: sale._id });
      if (!invExists) {
        await Finance.create({
          type: 'revenue',
          amount: sale.totalAmount,
          category: 'Sales',
          description: `Revenue from Sales Order ${sale.orderNumber}`,
          date: sale.createdAt,
          reference: sale._id,
          referenceModel: 'Order',
          organization: sale.organization
        });
      }
    }
    console.log(`Synced non-invoiced sales orders`);

    const purchases = await Order.find({ type: 'purchase', status: { $ne: 'cancelled' } });
    for (const pur of purchases) {
      const billExists = await Bill.findOne({ purchaseOrder: pur._id });
      if (!billExists) {
        await Finance.create({
          type: 'expense',
          amount: pur.totalAmount,
          category: 'Cost of Goods',
          description: `Cost from Purchase Order ${pur.orderNumber}`,
          date: pur.createdAt,
          reference: pur._id,
          referenceModel: 'Order',
          organization: pur.organization
        });
      }
    }
    console.log(`Synced non-billed purchase orders`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

syncLedger();
