const ActivityLogService = require('../src/services/ActivityLogService');

// @desc    Get activity logs
// @route   GET /api/activity-logs
exports.getActivityLogs = async (req, res, next) => {
  try {
    const result = await ActivityLogService.getLogs(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
