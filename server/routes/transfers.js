const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getTransfers, createTransfer, getTransfer, approveTransfer, receiveTransfer } = require('../controllers/transferController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const tenant = require('../middleware/tenant');
const validateZod = require('../middleware/validateZod');
const { transferSchema } = require('../validators/transfer.schema');

router.use(auth);
router.use(tenant);

router.route('/')
  .get(getTransfers)
  .post(validateZod(transferSchema), logActivity('initiated', 'Transfer'), createTransfer);

router.route('/:id/approve')
  .put(role('admin', 'manager'), logActivity('approved', 'Transfer'), approveTransfer);

router.route('/:id/receive')
  .put(role('admin', 'manager'), logActivity('received', 'Transfer'), receiveTransfer);

router.route('/:id')
  .get(getTransfer);

module.exports = router;
