const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');

// All routes are protected
router.use(auth);

router.route('/')
  .get(getInvoices)
  .post(role('admin', 'manager'), createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(role('admin', 'manager'), updateInvoice)
  .delete(role('admin'), deleteInvoice);

module.exports = router;
