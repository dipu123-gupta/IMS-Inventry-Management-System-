const logger = require('../utils/logger');

/**
 * Middleware to check if user has required permissions
 * @param {String[]} requiredPermissions - List of permissions required
 */
const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Admins always have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      logger.warn(`Permission Denied: User ${req.user.id} lacks [${requiredPermissions.join(', ')}]`);
      return res.status(403).json({ message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}` });
    }

    next();
  };
};

module.exports = authorize;
