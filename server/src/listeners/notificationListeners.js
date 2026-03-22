const { eventBus, EVENTS } = require('../../utils/eventBus');
const Notification = require('../../models/Notification');
const { emitNotification } = require('../../utils/socket');
const { NOTIFICATION_TYPE } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * Notification Listeners — Centralizes all automated notification logic
 */
const initNotificationListeners = () => {
  // 1. Order Notifications
  eventBus.on(EVENTS.ORDER_CREATED, async ({ orgId, order, type }) => {
    try {
      const notification = await Notification.create({
        type: NOTIFICATION_TYPE.ORDER_UPDATE,
        title: `New ${type === 'purchase' ? 'Purchase' : 'Sales'} Order`,
        message: `Order ${order?.orderNumber || 'N/A'} created - Total: $${Number(order?.totalAmount || 0).toFixed(2)}`,
        link: `/orders/${order?._id || ''}`,
        organization: orgId,
      });
      if (orgId) emitNotification(orgId.toString(), notification);
    } catch (err) {
      logger.error('Error in ORDER_CREATED notification listener:', err);
    }
  });

  // 2. Low Stock Alerts (Already handled in InventoryService for now)

  // 3. Payment Notifications
  eventBus.on(EVENTS.PAYMENT_RECORDED, async ({ orgId, payment }) => {
    try {
      const notification = await Notification.create({
        type: NOTIFICATION_TYPE.SYSTEM,
        title: `Payment ${payment?.type === 'receivable' ? 'Received' : 'Made'}`,
        message: `${payment?.paymentNumber || 'N/A'} — Amount: $${Number(payment?.amount || 0).toFixed(2)}`,
        link: '/billing',
        organization: orgId
      });
      if (orgId) emitNotification(orgId.toString(), notification);
    } catch (err) {
      logger.error('Error in PAYMENT_RECORDED notification listener:', err);
    }
  });

  // 4. Transfer Notifications
  eventBus.on(EVENTS.TRANSFER_APPROVED, async ({ orgId, transfer }) => {
    try {
      const notification = await Notification.create({
        type: NOTIFICATION_TYPE.TRANSFER_ALERT,
        title: 'Inventory Transfer Approved',
        message: `Transfer from warehouse ${transfer?.fromWarehouse || 'N/A'} is now approved.`,
        link: '/inventory/transfers',
        organization: orgId
      });
      if (orgId) emitNotification(orgId.toString(), notification);
    } catch (err) {
      logger.error('Error in TRANSFER_APPROVED notification listener:', err);
    }
  });

  logger.info('Notification Listeners initialized');
};

module.exports = initNotificationListeners;
