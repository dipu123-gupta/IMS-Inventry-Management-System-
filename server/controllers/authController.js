const AuthService = require('../src/services/AuthService');
const emailService = require('../src/services/EmailService');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(result).catch(err => logger.error('Welcome email failed', err));

    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.verifyLogin2FA = async (req, res, next) => {
  try {
    const result = await AuthService.verifyLogin2FA(req.body.userId, req.body.token);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user._id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
