/**
 * Centralized Event Bus — Foundation of the event-driven architecture.
 * 
 * All modules emit events through this bus, and listeners in
 * /src/listeners/ subscribe to drive cross-module auto-sync.
 */
const EventEmitter = require('events');

class IMSEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow many listeners (one per module per event)
    this.setMaxListeners(50);
  }
}

const eventBus = new IMSEventBus();

// ─── Event Constants ───────────────────────────────────────────

const EVENTS = {
  // Product
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',

  // Inventory / Stock
  STOCK_ADJUSTED: 'stock:adjusted',
  LOW_STOCK_DETECTED: 'stock:low',

  // Orders
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:statusChanged',
  ORDER_CANCELLED: 'order:cancelled',

  // Quotes
  QUOTE_CREATED: 'quote:created',
  QUOTE_ACCEPTED: 'quote:accepted',
  QUOTE_CONVERTED: 'quote:converted',

  // Bills & Invoices
  BILL_CREATED: 'bill:created',
  BILL_PAID: 'bill:paid',
  BILL_UPDATED: 'bill:updated',
  BILL_DELETED: 'bill:deleted',
  BILL_STATUS_CHANGED: 'bill:statusChanged',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_PAID: 'invoice:paid',
  INVOICE_UPDATED: 'invoice:updated',
  INVOICE_DELETED: 'invoice:deleted',

  // Payments
  PAYMENT_RECORDED: 'payment:recorded',

  // Customer
  CUSTOMER_BALANCE_CHANGED: 'customer:balanceChanged',

  // Transfers
  TRANSFER_CREATED: 'transfer:created',
  TRANSFER_APPROVED: 'transfer:approved',
  TRANSFER_RECEIVED: 'transfer:received',

  // Returns
  RETURN_COMPLETED: 'return:completed',
  RETURN_DELETED: 'return:deleted',

  // Expenses
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_DELETED: 'expense:deleted',

  // Dashboard (aggregated refresh signal)
  DASHBOARD_UPDATE: 'dashboard:update',
};

module.exports = { eventBus, EVENTS };
