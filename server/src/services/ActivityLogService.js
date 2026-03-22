const ActivityLog = require('../../models/ActivityLog');
const logger = require('../../utils/logger');

class ActivityLogService {
  /**
   * Log an activity
   * @param {Object} data - Log data
   * @param {String} data.user - User ID
   * @param {String} data.organization - Organization ID
   * @param {String} data.action - Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
   * @param {String} data.entity - Entity type (e.g., 'Product', 'Invoice')
   * @param {String} data.entityId - ID of the entity
   * @param {Object} data.details - Extra details
   * @param {Object} data.before - State before change
   * @param {Object} data.after - State after change
   */
  async log(data) {
    try {
      const log = await ActivityLog.create(data);
      return log;
    } catch (error) {
      logger.error('Failed to create activity log:', error);
      // Don't throw - we don't want to crash the main process if logging fails
      return null;
    }
  }

  /**
   * Get logs for an organization
   */
  async getLogs(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.user) filter.user = queryParams.user;
    if (queryParams.entity) filter.entity = queryParams.entity;
    if (queryParams.action) filter.action = queryParams.action;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email'),
      ActivityLog.countDocuments(filter)
    ]);

    return {
      logs,
      page,
      pages: Math.ceil(total / limit),
      total
    };
  }
}

module.exports = new ActivityLogService();
