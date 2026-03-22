const InvoiceService = require('../src/services/InvoiceService');

// @desc    Get all invoices
// @route   GET /api/v1/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const result = await InvoiceService.getInvoices(req.organization, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.params.id, req.organization);
    res.json({ success: true, invoice });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/v1/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.createInvoice(req.body, req.organization, req.user);
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.updateInvoice(req.params.id, req.body, req.organization);
    res.json({ success: true, invoice });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
exports.deleteInvoice = async (req, res, next) => {
  try {
    await InvoiceService.deleteInvoice(req.params.id, req.organization);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
