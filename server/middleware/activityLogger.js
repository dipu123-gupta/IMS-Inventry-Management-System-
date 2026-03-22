const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      // Log only on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        ActivityLog.create({
          user: req.user._id,
          action,
          entity,
          entityId: req.params.id || (data && data._id) || null,
          details: req.auditDetails || { message: `${req.user.name} ${action} ${entity}` },
          before: req.auditBefore || null,
          after: req.auditAfter || data || null,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          organization: req.organization,
        }).catch((err) => console.error('Activity log error:', err));
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = logActivity;
