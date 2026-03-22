const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getProductBatches, createBatch, getExpiringBatches } = require('../controllers/batchController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const validateZod = require('../middleware/validateZod');
const { batchSchema } = require('../validators/batch.schema');

router.use(auth);
router.use(tenant);

router.get('/expiring', getExpiringBatches);
router.get('/product/:productId', getProductBatches);
router.post('/', validateZod(batchSchema), logActivity('created', 'Batch'), createBatch);

module.exports = router;
