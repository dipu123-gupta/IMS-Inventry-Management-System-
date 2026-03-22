const VendorService = require('../src/services/VendorService');

// @desc    Get all vendors
// @route   GET /api/v1/vendors
exports.getVendors = async (req, res, next) => {
  try {
    const result = await VendorService.getVendors(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/v1/vendors/:id
exports.getVendor = async (req, res, next) => {
  try {
    const result = await VendorService.getVendorById(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Create vendor
// @route   POST /api/v1/vendors
exports.createVendor = async (req, res, next) => {
  try {
    const result = await VendorService.createVendor(req.body, req.organization);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/v1/vendors/:id
exports.updateVendor = async (req, res, next) => {
  try {
    const result = await VendorService.updateVendor(req.params.id, req.body, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/v1/vendors/:id
exports.deleteVendor = async (req, res, next) => {
  try {
    const result = await VendorService.deleteVendor(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
