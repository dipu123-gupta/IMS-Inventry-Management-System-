const BillService = require('../src/services/BillService');

// @desc    Get all bills
// @route   GET /api/v1/bills
exports.getBills = async (req, res, next) => {
  try {
    const result = await BillService.getBills(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bill
// @route   GET /api/v1/bills/:id
exports.getBill = async (req, res, next) => {
  try {
    const result = await BillService.getBillById(req.params.id, req.organization);
    res.json({ success: true, bill: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create bill
// @route   POST /api/v1/bills
exports.createBill = async (req, res, next) => {
  try {
    const bill = await BillService.createBill(req.body, req.organization, req.user);
    res.status(201).json({ success: true, bill });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
// @desc    Update bill
// @route   PUT /api/v1/bills/:id
exports.updateBill = async (req, res, next) => {
  try {
    const bill = await BillService.updateBill(req.params.id, req.body, req.organization);
    res.json({ success: true, bill });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete bill
// @route   DELETE /api/v1/bills/:id
exports.deleteBill = async (req, res, next) => {
  try {
    await BillService.deleteBill(req.params.id, req.organization);
    res.json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
