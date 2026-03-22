const router = require('express').Router();
const { exportToCSV, exportToJSON } = require('../controllers/exportController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);
router.use(role('admin', 'manager'));

router.get('/csv/:entity', exportToCSV);
router.get('/json/:entity', exportToJSON);

module.exports = router;
