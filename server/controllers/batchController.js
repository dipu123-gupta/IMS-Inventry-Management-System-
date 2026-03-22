const BatchService = require('../src/services/BatchService');

// @desc    Get batches for a product
// @route   GET /api/batches/product/:productId
exports.getProductBatches = async (req, res, next) => {
  try {
    const result = await BatchService.getProductBatches(req.params.productId, req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new batch
// @route   POST /api/batches
exports.createBatch = async (req, res, next) => {
  try {
    const result = await BatchService.createBatch(req.body, req.organization);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get near-expiry batches
// @route   GET /api/batches/expiring
exports.getExpiringBatches = async (req, res, next) => {
  try {
    const result = await BatchService.getExpiringBatches(req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
