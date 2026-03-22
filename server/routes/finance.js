const router = require('express').Router();
const { getFinanceSummary, getFinanceChart } = require('../controllers/financeController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const tenant = require('../middleware/tenant');
const redisCache = require('../middleware/redisCache');

router.use(auth);
router.use(tenant);

router.get('/summary', role('admin', 'manager'), redisCache(300), getFinanceSummary);
router.get('/chart', role('admin', 'manager'), redisCache(300), getFinanceChart);

module.exports = router;
