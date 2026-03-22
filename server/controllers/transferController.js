const TransferService = require('../src/services/TransferService');

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private
exports.getTransfers = async (req, res, next) => {
  try {
    const result = await TransferService.getTransfers(req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create transfer & update stock
// @route   POST /api/transfers
// @access  Private
exports.createTransfer = async (req, res, next) => {
  try {
    const result = await TransferService.createTransfer(req.body, req.organization, req.user);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get single transfer
// @route   GET /api/transfers/:id
// @access  Private
exports.getTransfer = async (req, res, next) => {
  try {
    const result = await TransferService.getTransferById(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Approve transfer & deduct from source
// @route   PUT /api/transfers/:id/approve
exports.approveTransfer = async (req, res, next) => {
  try {
    const result = await TransferService.approveTransfer(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Receive transfer & add to destination
// @route   PUT /api/transfers/:id/receive
exports.receiveTransfer = async (req, res, next) => {
  try {
    const result = await TransferService.receiveTransfer(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
