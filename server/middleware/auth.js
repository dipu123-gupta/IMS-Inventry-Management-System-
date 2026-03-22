const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      const error = new Error('No token, authorization denied');
      error.statusCode = 401;
      return next(error);
    }

    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('organization');

    if (!user) {
      const error = new Error('Token is not valid or user no longer exists');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Token is not valid');
    error.statusCode = 401;
    next(error);
  }
};

module.exports = auth;
