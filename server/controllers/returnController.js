const ReturnService = require('../src/services/ReturnService');

// @desc    Get all returns
// @route   GET /api/returns
exports.getReturns = async (req, res, next) => {
  try {
    const result = await ReturnService.getReturns(req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a return request
// @route   POST /api/returns
exports.createReturn = async (req, res, next) => {
  try {
    const result = await ReturnService.createReturn(req.body, req.organization, req.user);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Complete a return (Update Inventory)
// @route   PUT /api/returns/:id/complete
exports.completeReturn = async (req, res, next) => {
  try {
    const result = await ReturnService.completeReturn(req.params.id, req.organization, req.user);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
