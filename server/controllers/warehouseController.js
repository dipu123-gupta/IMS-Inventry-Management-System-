const WarehouseService = require('../src/services/WarehouseService');

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
exports.getWarehouses = async (req, res, next) => {
  try {
    const result = await WarehouseService.getWarehouses(req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
// @access  Private/Admin
exports.createWarehouse = async (req, res, next) => {
  try {
    const result = await WarehouseService.createWarehouse(req.body, req.organization);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
exports.getWarehouse = async (req, res, next) => {
  try {
    const result = await WarehouseService.getWarehouseById(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private/Admin
exports.updateWarehouse = async (req, res, next) => {
  try {
    const result = await WarehouseService.updateWarehouse(req.params.id, req.body, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private/Admin
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const result = await WarehouseService.deleteWarehouse(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
