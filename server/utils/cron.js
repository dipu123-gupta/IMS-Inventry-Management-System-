const cron = require('node-cron');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const NotificationService = require('../src/services/NotificationService');
const { NOTIFICATION_TYPE } = require('./constants');
const emailService = require('../src/services/EmailService');
const logger = require('./logger');

const initCron = () => {
  // 1. Daily Low Stock Check (Every day at midnight)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running Daily Low Stock Audit...');
    try {
      const allProducts = await Product.find({}).populate('vendor', 'name');
      const lowStockProducts = allProducts.filter(p => p.isLowStock);
      
      if (lowStockProducts.length > 0) {
        // Group by organization
        const productsByOrg = lowStockProducts.reduce((acc, p) => {
          const orgId = p.organization.toString();
          if (!acc[orgId]) acc[orgId] = [];
          acc[orgId].push(p);
          return acc;
        }, {});

        for (const [orgId, products] of Object.entries(productsByOrg)) {
          // Create in-app notification for each organization
          await NotificationService.createNotification({
            type: NOTIFICATION_TYPE.LOW_STOCK,
            title: 'Daily Stock Audit Alert',
            message: `${products.length} products are currently below threshold.`,
            link: '/inventory',
            organization: orgId,
          });
        }

        // Send Global System Email Alert to Admin (if configured)
        if (process.env.ADMIN_EMAIL) {
          const productList = lowStockProducts.map(p => `- ${p.name} (Org: ${p.organization}): ${p.totalQuantity} (Threshold: ${p.lowStockThreshold})`).join('\n');
          await emailService.sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `⚠️ System-Wide Low Stock Alert - ${new Date().toLocaleDateString()}`,
            text: `The following products across all organizations are running low:\n\n${productList}\n\nPlease audit regional stocks.`,
          });
        }
      }
      logger.info('Low Stock Audit Completed.');
    } catch (err) {
      logger.error('Error in Low Stock Audit:', err);
    }

  });

  // 2. Quote Expiration Check (Daily at 2 AM)
  cron.schedule('0 2 * * *', async () => {
    logger.info('Checking for expired quotes...');
    try {
      const now = new Date();
      const expiredQuotes = await Quote.updateMany(
        { status: 'sent', validUntil: { $lt: now } },
        { status: 'declined', notes: 'Automatically declined due to expiration.' }
      );
      if (expiredQuotes.modifiedCount > 0) {
        logger.info(`${expiredQuotes.modifiedCount} quotes marked as expired.`);
      }
    } catch (err) {
      logger.error('Error in Quote Expiration Check:', err);
    }
  });

  // 3. Overdue Bill Alerts (Daily at 3 AM)
  cron.schedule('0 3 * * *', async () => {
    logger.info('Scanning for overdue bills...');
    try {
      const now = new Date();
      const overdueBills = await Order.find({
        type: 'purchase',
        status: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'paid' },
        dueDate: { $lt: now }
      }).populate('vendor', 'name');

      for (const bill of overdueBills) {
        // Create notification for each overdue bill
        await NotificationService.createNotification({
          type: NOTIFICATION_TYPE.BILL_ALERT,
          title: 'Overdue Bill Alert',
          message: `Bill ${bill.orderNumber} for ${bill.vendor?.name} is overdue.`,
          link: `/billing`,
          organization: bill.organization
        });
      }
      if (overdueBills.length > 0) {
        logger.info(`${overdueBills.length} overdue bills identified.`);
      }
    } catch (err) {
      logger.error('Error in Overdue Bill Check:', err);
    }
  });

  // 4. Overdue Invoice Alerts (Daily at 4 AM)
  cron.schedule('0 4 * * *', async () => {
    logger.info('Scanning for overdue invoices...');
    try {
      const now = new Date();
      const overdueInvoices = await Invoice.find({
        status: { $in: ['sent', 'partial'] },
        dueDate: { $lt: now }
      }).populate('customer', 'name');

      for (const inv of overdueInvoices) {
        await NotificationService.createNotification({
          type: NOTIFICATION_TYPE.INVOICE_ALERT,
          title: 'Overdue Invoice Alert',
          message: `Invoice ${inv.invoiceNumber} for ${inv.customer?.name} is overdue.`,
          link: `/invoices`,
          organization: inv.organization
        });
      }
      if (overdueInvoices.length > 0) {
        logger.info(`${overdueInvoices.length} overdue invoices identified.`);
      }
    } catch (err) {
      logger.error('Error in Overdue Invoice Check:', err);
    }
  });

  // 5. Quote Expiring Reminder (Daily at 5 AM)
  cron.schedule('0 5 * * *', async () => {
    logger.info('Checking for expiring quotes...');
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3); // 3 days from now
      
      const expiringQuotes = await Quote.find({
        status: 'sent',
        validUntil: { 
          $gte: new Date(), 
          $lte: targetDate 
        }
      }).populate('customer', 'name');

      for (const quote of expiringQuotes) {
        await NotificationService.createNotification({
          type: NOTIFICATION_TYPE.EXPIRY_ALERT,
          title: 'Quote Expiring Soon',
          message: `Quote ${quote.quoteNumber} for ${quote.customer?.name} expires on ${new Date(quote.validUntil).toLocaleDateString()}.`,
          link: `/billing`,
          organization: quote.organization
        });
      }
    } catch (err) {
      logger.error('Error in Quote Expiry Reminder:', err);
    }
  });

  // 6. Weekly System Health Report (Every Monday at 1 AM)
  cron.schedule('0 1 * * 1', async () => {
    logger.info('Running Weekly Performance Sync...');
    // Logic for cleanup or specialized report generation
  });
};

module.exports = initCron;
