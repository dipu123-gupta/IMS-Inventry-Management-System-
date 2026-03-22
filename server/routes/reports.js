const router = require('express').Router();
const { 
  getDashboard, 
  getSalesReport, 
  getInventoryReport, 
  exportCSV,
  getCategoryAnalysis,
  getWarehousePerformance,
  getInventoryVelocity
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/category-analysis', getCategoryAnalysis);
router.get('/warehouse-performance', getWarehousePerformance);
router.get('/velocity', getInventoryVelocity);
router.get('/export/csv', exportCSV);

module.exports = router;
