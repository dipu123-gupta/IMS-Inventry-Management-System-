// Handle uncaught exceptions first to catch any early startup errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('./utils/logger');
// Database connection
const connectDB = require('./config/db');
const { initRedis } = require('./utils/redisClient');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIO = require('./utils/socket');
const initCron = require('./utils/cron');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const initAllListeners = require('./src/listeners/index');


// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const vendorRoutes = require('./routes/vendors');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const activityLogRoutes = require('./routes/activityLogs');
const uploadRoutes = require('./routes/upload');
const warehouseRoutes = require('./routes/warehouses');
const customerRoutes = require('./routes/customers');
const transferRoutes = require('./routes/transfers');
const exportRoutes = require('./routes/exports');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const financeRoutes = require('./routes/finance');
const returnRoutes = require('./routes/returns');
const batchRoutes = require('./routes/batches');
const partnerRoutes = require('./routes/partner');
const twoFactorRoutes = require('./routes/twoFactor');
const quoteRoutes = require('./routes/quotes');
const billRoutes = require('./routes/bills');
const paymentRoutes = require('./routes/payments');
const razorpayRoutes = require('./routes/razorpay');
const invoiceRoutes = require('./routes/invoices');
const subscriptionRoutes = require('./routes/subscriptions');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Connect to database and Redis
connectDB();
initRedis();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketIO.init(server);

// Initialize Event Listeners (must be after socketIO.init)
initAllListeners();

// Initialize Cron Tasks
initCron();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.CLIENT_URL || '*',
  credentials: true
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// API routes - V1
const apiV1Router = express.Router();

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use('/public', express.static(path.join(__dirname, 'public')));

// Logging
if (config.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Request logging (Winston)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/products', productRoutes);
apiV1Router.use('/vendors', vendorRoutes);
apiV1Router.use('/orders', orderRoutes);
apiV1Router.use('/inventory', inventoryRoutes);
apiV1Router.use('/reports', reportRoutes);
apiV1Router.use('/notifications', notificationRoutes);
apiV1Router.use('/activity-logs', activityLogRoutes);
apiV1Router.use('/warehouses', warehouseRoutes);
apiV1Router.use('/customers', customerRoutes);
apiV1Router.use('/transfers', transferRoutes);
apiV1Router.use('/upload', uploadRoutes);
apiV1Router.use('/exports', exportRoutes);
apiV1Router.use('/subscriptions', subscriptionRoutes);
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/expenses', expenseRoutes);
apiV1Router.use('/finance', financeRoutes);
apiV1Router.use('/returns', returnRoutes);
apiV1Router.use('/batches', batchRoutes);
apiV1Router.use('/partner', partnerRoutes);
apiV1Router.use('/2fa', twoFactorRoutes);
apiV1Router.use('/quotes', quoteRoutes);
apiV1Router.use('/bills', billRoutes);
apiV1Router.use('/payments', paymentRoutes);
apiV1Router.use('/razorpay', razorpayRoutes);
apiV1Router.use('/invoices', invoiceRoutes);

// Mount v1 router
app.use('/api/v1', apiV1Router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check - Simplified for Render/ALB
app.get('/health', (req, res) => res.status(200).send('OK'));

// Detailed Diagnostics
apiV1Router.get('/status', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: 'v1.1.0', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    memoryUsage: process.memoryUsage(),
    nodeEnv: config.NODE_ENV
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.PORT;
const serverNode = server.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  if (serverNode) {
    serverNode.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

module.exports = { app, server };
