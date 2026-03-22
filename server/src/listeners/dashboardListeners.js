const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

/**
 * Dashboard Listeners — Drives real-time analytical updates
 */
const initDashboardListeners = () => {
  // 1. Refresh dashboard on key business events
  const refreshDashboard = ({ orgId }) => {
    try {
      // Emit trigger for dashboard refresh
      eventBus.emit(EVENTS.DASHBOARD_UPDATE, { orgId });
      logger.info(`Dashboard refresh signal emitted for org ${orgId}`);
    } catch (err) {
      logger.error('Error in Dashboard refresh listener:', err);
    }
  };

  // Listen to events that impact dashboard metrics
  eventBus.on(EVENTS.ORDER_CREATED, refreshDashboard);
  eventBus.on(EVENTS.STOCK_ADJUSTED, refreshDashboard);
  eventBus.on(EVENTS.PAYMENT_RECORDED, refreshDashboard);
  eventBus.on(EVENTS.PRODUCT_CREATED, refreshDashboard);
  eventBus.on(EVENTS.RETURN_COMPLETED, refreshDashboard);
  eventBus.on(EVENTS.INVOICE_CREATED, refreshDashboard);
  eventBus.on(EVENTS.BILL_CREATED, refreshDashboard);

  logger.info('Dashboard Listeners initialized');
};

module.exports = initDashboardListeners;
