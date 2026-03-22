const UserService = require('../src/services/UserService');

// @desc    Get all users in organization
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const result = await UserService.getUsers(req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Add new user to organization
// @route   POST /api/users
exports.addUser = async (req, res, next) => {
  try {
    const result = await UserService.addUser(req.body, req.organization);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Remove user from organization
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const result = await UserService.deleteUser(req.params.id, req.organization, req.user._id || req.user.id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
