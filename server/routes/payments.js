const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const {
  getPayments,
  recordPayment
} = require('../controllers/paymentController');
const validateZod = require('../middleware/validateZod');
const { paymentSchema } = require('../validators/payment.schema');

// All routes are protected
router.use(auth);
router.use(tenant);

router.route('/')
  .get(getPayments)
  .post(validateZod(paymentSchema), recordPayment);

module.exports = router;
