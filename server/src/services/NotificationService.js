const NotificationRepository = require('../repositories/NotificationRepository');
const { emitNotification } = require('../../utils/socket');
const logger = require('../../utils/logger');

class NotificationService {
  /**
   * Create and send a notification
   * @param {Object} data { type, title, message, link, organization, user }
   */
  async createNotification(data) {
    try {
      const notification = await NotificationRepository.model.create({
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || '',
        organization: data.organization,
        user: data.user || null,
      });

      // Emit real-time notification via Socket.io
      emitNotification(data.organization.toString(), notification);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for an organization
   */
  async getNotifications(organizationId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      NotificationRepository.model.find({ organization: organizationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NotificationRepository.model.countDocuments({ organization: organizationId, read: false })
    ]);

    return { notifications, unreadCount, page: Number(page), total: await NotificationRepository.model.countDocuments({ organization: organizationId }) };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, organizationId) {
    return await NotificationRepository.model.findOneAndUpdate(
      { _id: notificationId, organization: organizationId },
      { read: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for an organization
   */
  async markAllAsRead(organizationId) {
    return await NotificationRepository.model.updateMany(
      { organization: organizationId, read: false },
      { read: true }
    );
  }
}

module.exports = new NotificationService();
