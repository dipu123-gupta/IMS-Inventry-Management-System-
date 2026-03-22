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
    await ActivityLogService.log({
      user: product.createdBy || '000000000000000000000000', // Placeholder if not provided
      organization: orgId,
      action: 'CREATE',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, sku: product.sku }
    });
  });

  eventBus.on(EVENTS.PRODUCT_UPDATED, async ({ orgId, product }) => {
    await ActivityLogService.log({
      user: product.createdBy || '000000000000000000000000',
      organization: orgId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, sku: product.sku }
    });
  });

  eventBus.on(EVENTS.PRODUCT_DELETED, async ({ orgId, productId }) => {
    await ActivityLogService.log({
      user: '000000000000000000000000',
      organization: orgId,
      action: 'DELETE',
      entity: 'Product',
      entityId: productId,
      details: { message: 'Product deleted' }
    });
  });

  // --- Order Events ---
  eventBus.on(EVENTS.ORDER_CREATED, async ({ orgId, order, type }) => {
    await ActivityLogService.log({
      user: order.createdBy?._id || order.createdBy || '000000000000000000000000',
      organization: orgId,
      action: 'CREATE',
      entity: type === 'sale' ? 'SalesOrder' : 'PurchaseOrder',
      entityId: order._id,
      details: { orderNumber: order.orderNumber, total: order.totalAmount }
    });
  });

  eventBus.on(EVENTS.ORDER_STATUS_CHANGED, async ({ orgId, order, previousStatus, newStatus }) => {
    await ActivityLogService.log({
      user: order.createdBy?._id || order.createdBy || '000000000000000000000000',
      organization: orgId,
      action: 'STATUS_CHANGE',
      entity: order.type === 'sale' ? 'SalesOrder' : 'PurchaseOrder',
      entityId: order._id,
      details: { from: previousStatus, to: newStatus, orderNumber: order.orderNumber }
    });
  });

  // --- Invoice & Bill Events ---
  eventBus.on('INVOICE_CREATED', async ({ orgId, invoice }) => {
    await ActivityLogService.log({
      user: invoice.createdBy || '000000000000000000000000',
      organization: orgId,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber, amount: invoice.totalAmount }
    });
  });

  eventBus.on('BILL_CREATED', async ({ orgId, bill }) => {
    await ActivityLogService.log({
      user: bill.createdBy || '000000000000000000000000',
      organization: orgId,
      action: 'CREATE',
      entity: 'Bill',
      entityId: bill._id,
      details: { billNumber: bill.billNumber, amount: bill.totalAmount }
    });
  });

  // --- Customer & Vendor Events ---
  eventBus.on(EVENTS.CUSTOMER_CREATED, async ({ orgId, customer }) => {
    await ActivityLogService.log({
      user: '000000000000000000000000',
      organization: orgId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer._id,
      details: { name: customer.name }
    });
  });

  eventBus.on(EVENTS.VENDOR_CREATED, async ({ orgId, vendor }) => {
    await ActivityLogService.log({
      user: '000000000000000000000000',
      organization: orgId,
      action: 'CREATE',
      entity: 'Vendor',
      entityId: vendor._id,
      details: { name: vendor.name }
    });
  });

  logger.info('Activity Log Listeners initialized');
};

module.exports = initActivityLogListeners;
