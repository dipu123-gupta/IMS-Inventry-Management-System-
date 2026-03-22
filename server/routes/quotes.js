const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const role = require('../middleware/role');
const logActivity = require('../middleware/activityLogger');
const {
  getQuotes,
  getQuote,
  createQuote,
  updateQuoteStatus,
  convertToOrder
} = require('../controllers/quoteController');
const validateZod = require('../middleware/validateZod');
const { quoteSchema } = require('../validators/quote.schema');

// All routes are protected
router.use(auth);
router.use(tenant);

router.route('/')
  .get(getQuotes)
  .post(role('admin', 'manager'), validateZod(quoteSchema), logActivity('created', 'Quote'), createQuote);

router.route('/:id')
  .get(getQuote);

router.put('/:id/status', role('admin', 'manager'), logActivity('updated status', 'Quote'), updateQuoteStatus);
router.post('/:id/convert', role('admin', 'manager'), logActivity('converted to order', 'Quote'), convertToOrder);

module.exports = router;
