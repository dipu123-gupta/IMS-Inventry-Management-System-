const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const role = require('../middleware/role');
const validateZod = require('../middleware/validateZod');
const { billSchema } = require('../validators/bill.schema');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill
} = require('../controllers/billController');

// All routes are protected
router.use(auth);
router.use(tenant);

router.route('/')
  .get(getBills)
  .post(role('admin', 'manager'), validateZod(billSchema), createBill);

router.route('/:id')
  .get(getBill)
  .put(role('admin', 'manager'), updateBill)
  .delete(role('admin'), deleteBill);

module.exports = router;
