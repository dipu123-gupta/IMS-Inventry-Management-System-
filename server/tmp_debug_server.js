// Copy of server.js with commented out execution for debugging
const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('./utils/logger');
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

console.log('Dependencies loaded.');

connectDB(); // Commented
initRedis(); // Commented

const app = express();
const server = http.createServer(app);

socketIO.init(server); // Commented
initAllListeners(); // Commented
initCron(); // Commented

console.log('Manual initialization done.');

app.use(express.json());
app.get('/test', (req, res) => res.send('OK'));

const PORT = 5005; // Use different port
server.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  process.exit(0);
});
