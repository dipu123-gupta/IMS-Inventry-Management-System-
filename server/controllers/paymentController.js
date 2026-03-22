const PaymentService = require('../src/services/PaymentService');

// @desc    Get all payments
// @route   GET /api/v1/payments
exports.getPayments = async (req, res, next) => {
  try {
    const result = await PaymentService.getPayments(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new payment
// @route   POST /api/v1/payments
exports.recordPayment = async (req, res, next) => {
  try {
    const payment = await PaymentService.recordPayment(req.body, req.organization, req.user);
    res.status(201).json({ success: true, payment });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
