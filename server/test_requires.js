const modules = [
  './config/env',
  'express',
  'cors',
  'helmet',
  'express-mongo-sanitize',
  'xss-clean',
  'hpp',
  './utils/logger',
  './config/db',
  './utils/redisClient',
  'express-rate-limit',
  'morgan',
  'path',
  'http',
  './utils/socket',
  './utils/cron',
  'swagger-ui-express',
  './config/swagger',
  './src/listeners/index',
  './routes/auth',
  './routes/products',
  './routes/vendors',
  './routes/orders',
  './routes/inventory',
  './routes/reports',
  './routes/notifications',
  './routes/activityLogs',
  './routes/upload',
  './routes/warehouses',
  './routes/customers',
  './routes/transfers',
  './routes/exports',
  './routes/users',
  './routes/expenses',
  './routes/finance',
  './routes/returns',
  './routes/batches',
  './routes/partner',
  './routes/twoFactor',
  './routes/quotes',
  './routes/bills',
  './routes/payments',
  './routes/razorpay',
  './routes/invoices',
  './routes/subscriptions',
  './middleware/errorHandler'
];

modules.forEach(m => {
  try {
    console.log(`Requiring ${m}...`);
    require(m);
    console.log(`Successfully required ${m}`);
  } catch (err) {
    console.error(`FAILED to require ${m}:`, err.message);
    console.error(err.stack);
    process.exit(1);
  }
});
console.log('All modules required successfully!');
process.exit(0);
