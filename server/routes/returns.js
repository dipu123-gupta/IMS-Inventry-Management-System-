const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getReturns, createReturn, completeReturn } = require('../controllers/returnController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const tenant = require('../middleware/tenant');
const validateZod = require('../middleware/validateZod');
const { returnSchema } = require('../validators/return.schema');

router.use(auth);
router.use(tenant);

router.route('/')
  .get(getReturns)
  .post(role('admin', 'manager'), validateZod(returnSchema), logActivity('created', 'Return'), createReturn);

router.route('/:id/complete')
  .put(role('admin', 'manager'), logActivity('completed', 'Return'), completeReturn);

module.exports = router;
