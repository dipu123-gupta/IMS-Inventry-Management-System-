const { eventBus, EVENTS } = require('../../utils/eventBus');
const ActivityLogService = require('../services/ActivityLogService');
const logger = require('../../utils/logger');

/**
 * Initialize Activity Log Listeners
 * Tracks all important business events and records them in the ActivityLog
 */
const initActivityLogListeners = () => {
  // --- Product Events ---
  eventBus.on(EVENTS.PRODUCT_CREATED, async ({ orgId, product }) => {
    try {
      await ActivityLogService.log({
        user: product?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: 'Product',
        entityId: product?._id,
        details: { name: product?.name, sku: product?.sku }
      });
    } catch (err) {
      logger.error('Error in PRODUCT_CREATED activity listener:', err);
    }
  });

  eventBus.on(EVENTS.PRODUCT_UPDATED, async ({ orgId, product }) => {
    try {
      await ActivityLogService.log({
        user: product?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'UPDATE',
        entity: 'Product',
        entityId: product?._id,
        details: { name: product?.name, sku: product?.sku }
      });
    } catch (err) {
      logger.error('Error in PRODUCT_UPDATED activity listener:', err);
    }
  });

  eventBus.on(EVENTS.PRODUCT_DELETED, async ({ orgId, productId }) => {
    try {
      await ActivityLogService.log({
        user: '000000000000000000000000',
        organization: orgId,
        action: 'DELETE',
        entity: 'Product',
        entityId: productId,
        details: { message: 'Product deleted' }
      });
    } catch (err) {
      logger.error('Error in PRODUCT_DELETED activity listener:', err);
    }
  });

  // --- Order Events ---
  eventBus.on(EVENTS.ORDER_CREATED, async ({ orgId, order, type }) => {
    try {
      await ActivityLogService.log({
        user: order?.createdBy?._id || order?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: type === 'sale' ? 'SalesOrder' : 'PurchaseOrder',
        entityId: order?._id,
        details: { orderNumber: order?.orderNumber, total: order?.totalAmount }
      });
    } catch (err) {
      logger.error('Error in ORDER_CREATED activity listener:', err);
    }
  });

  eventBus.on(EVENTS.ORDER_STATUS_CHANGED, async ({ orgId, order, previousStatus, newStatus }) => {
    try {
      await ActivityLogService.log({
        user: order?.createdBy?._id || order?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'STATUS_CHANGE',
        entity: order?.type === 'sale' ? 'SalesOrder' : 'PurchaseOrder',
        entityId: order?._id,
        details: { from: previousStatus, to: newStatus, orderNumber: order?.orderNumber }
      });
    } catch (err) {
      logger.error('Error in ORDER_STATUS_CHANGED activity listener:', err);
    }
  });

  // --- Invoice & Bill Events ---
  eventBus.on(EVENTS.INVOICE_CREATED, async ({ orgId, invoice }) => {
    try {
      if (!invoice || !orgId) return;
      await ActivityLogService.log({
        user: invoice?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: 'Invoice',
        entityId: invoice?._id,
        details: { invoiceNumber: invoice?.invoiceNumber, amount: invoice?.totalAmount }
      });
    } catch (err) {
      logger.error('Error in INVOICE_CREATED activity listener:', err);
    }
  });

  eventBus.on(EVENTS.BILL_CREATED, async ({ orgId, bill }) => {
    try {
      if (!bill || !orgId) return;
      await ActivityLogService.log({
        user: bill?.createdBy || '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: 'Bill',
        entityId: bill?._id,
        details: { billNumber: bill?.billNumber, amount: bill?.totalAmount }
      });
    } catch (err) {
      logger.error('Error in BILL_CREATED activity listener:', err);
    }
  });

  // --- Customer & Vendor Events ---
  eventBus.on(EVENTS.CUSTOMER_CREATED, async ({ orgId, customer }) => {
    try {
      await ActivityLogService.log({
        user: '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: 'Customer',
        entityId: customer?._id,
        details: { name: customer?.name }
      });
    } catch (err) {
      logger.error('Error in CUSTOMER_CREATED activity listener:', err);
    }
  });

  eventBus.on(EVENTS.VENDOR_CREATED, async ({ orgId, vendor }) => {
    try {
      await ActivityLogService.log({
        user: '000000000000000000000000',
        organization: orgId,
        action: 'CREATE',
        entity: 'Vendor',
        entityId: vendor?._id,
        details: { name: vendor?.name }
      });
    } catch (err) {
      logger.error('Error in VENDOR_CREATED activity listener:', err);
    }
  });

  logger.info('Activity Log Listeners initialized');
};

module.exports = initActivityLogListeners;
