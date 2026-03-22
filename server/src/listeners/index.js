const initInventoryListeners = require('./inventoryListeners');
const initFinanceListeners = require('./financeListeners');
const initNotificationListeners = require('./notificationListeners');
const initDashboardListeners = require('./dashboardListeners');
const initTransferListeners = require('./transferListeners');
const initActivityLogListeners = require('./activityLogListeners');

/**
 * Register all event bus listeners
 */
const initAllListeners = () => {
  initInventoryListeners();
  initFinanceListeners();
  initNotificationListeners();
  initDashboardListeners();
  initTransferListeners();
  initActivityLogListeners();
};

module.exports = initAllListeners;
