const router = require('express').Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

router.get('/', role('admin', 'manager'), getActivityLogs);

module.exports = router;
