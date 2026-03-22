const QuoteService = require('../src/services/QuoteService');

// @desc    Get all quotes
// @route   GET /api/v1/quotes
exports.getQuotes = async (req, res, next) => {
  try {
    const result = await QuoteService.getQuotes(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quote
// @route   GET /api/v1/quotes/:id
exports.getQuote = async (req, res, next) => {
  try {
    const result = await QuoteService.getQuoteById(req.params.id, req.organization);
    res.json({ success: true, quote: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create quote
// @route   POST /api/v1/quotes
exports.createQuote = async (req, res, next) => {
  try {
    const quote = await QuoteService.createQuote(req.body, req.organization, req.user);
    res.status(201).json({ success: true, quote });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update quote status
// @route   PUT /api/v1/quotes/:id/status
exports.updateQuoteStatus = async (req, res, next) => {
  try {
    const quote = await QuoteService.updateQuoteStatus(req.params.id, req.body.status, req.organization);
    res.json({ success: true, quote });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Convert accepted quote to sales order
// @route   POST /api/v1/quotes/:id/convert
exports.convertToOrder = async (req, res, next) => {
  try {
    const result = await QuoteService.convertToSalesOrder(req.params.id, req.organization, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
