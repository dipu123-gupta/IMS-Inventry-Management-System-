const { eventBus, EVENTS } = require('./eventBus');
const logger = require('./logger');
const config = require('../config/env');

let io;

const init = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: config.CLIENT_URL || '*',
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Users join their organization room for scoped broadcasts
    socket.on('join', (room) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    // Allow joining org room explicitly
    socket.on('join:org', (orgId) => {
      if (orgId) {
        socket.join(orgId.toString());
        logger.info(`Socket ${socket.id} joined org room: ${orgId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Wire Event Bus → Socket Broadcasts ───────────────────────
  wireEventBusToSocket();

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// ─── Notification Helper (existing, kept for backward compat) ───
const emitNotification = (organizationId, notification) => {
  if (io) {
    if (organizationId) {
      io.to(organizationId.toString()).emit('notification', notification);
    } else if (notification.user) {
      io.to(notification.user.toString()).emit('notification', notification);
    } else {
      io.emit('notification', notification);
    }
  }
};

// ─── Module-Specific Data Change Broadcaster ────────────────────
/**
 * Emit a real-time data change to all connected clients in an org.
 * @param {string} orgId - Organization ID (socket room)
 * @param {string} module - Module name (e.g. 'products', 'orders')
 * @param {string} action - Action type (e.g. 'created', 'updated')
 * @param {object} data - The payload to send
 */
const emitDataChange = (orgId, module, action, data) => {
  if (io && orgId) {
    io.to(orgId.toString()).emit(`data:${module}`, { action, data, timestamp: Date.now() });
  }
};

// ─── Wire Event Bus events to Socket broadcasts ────────────────
const wireEventBusToSocket = () => {
  // Products
  eventBus.on(EVENTS.PRODUCT_CREATED, ({ orgId, product }) => {
    emitDataChange(orgId, 'products', 'created', product);
  });
  eventBus.on(EVENTS.PRODUCT_UPDATED, ({ orgId, product }) => {
    emitDataChange(orgId, 'products', 'updated', product);
  });
  eventBus.on(EVENTS.PRODUCT_DELETED, ({ orgId, productId }) => {
    emitDataChange(orgId, 'products', 'deleted', { _id: productId });
  });

  // Stock / Inventory
  eventBus.on(EVENTS.STOCK_ADJUSTED, ({ orgId, product, log }) => {
    emitDataChange(orgId, 'inventory', 'stockAdjusted', { product, log });
  });
  eventBus.on(EVENTS.LOW_STOCK_DETECTED, ({ orgId, product }) => {
    emitDataChange(orgId, 'inventory', 'lowStock', { product });
  });

  // Orders
  eventBus.on(EVENTS.ORDER_CREATED, ({ orgId, order }) => {
    emitDataChange(orgId, 'orders', 'created', order);
  });
  eventBus.on(EVENTS.ORDER_STATUS_CHANGED, ({ orgId, order }) => {
    emitDataChange(orgId, 'orders', 'statusChanged', order);
  });
  eventBus.on(EVENTS.ORDER_CANCELLED, ({ orgId, order }) => {
    emitDataChange(orgId, 'orders', 'cancelled', order);
  });

  // Quotes
  eventBus.on(EVENTS.QUOTE_CREATED, ({ orgId, quote }) => {
    emitDataChange(orgId, 'quotes', 'created', quote);
  });
  eventBus.on(EVENTS.QUOTE_ACCEPTED, ({ orgId, quote }) => {
    emitDataChange(orgId, 'quotes', 'accepted', quote);
  });
  eventBus.on(EVENTS.QUOTE_CONVERTED, ({ orgId, quote, order }) => {
    emitDataChange(orgId, 'quotes', 'converted', { quote, order });
  });

  // Bills
  eventBus.on(EVENTS.BILL_CREATED, ({ orgId, bill }) => {
    emitDataChange(orgId, 'bills', 'created', bill);
  });
  eventBus.on(EVENTS.BILL_UPDATED, ({ orgId, bill }) => {
    emitDataChange(orgId, 'bills', 'updated', bill);
  });
  eventBus.on(EVENTS.BILL_PAID, ({ orgId, bill }) => {
    emitDataChange(orgId, 'bills', 'paid', bill);
  });
  eventBus.on(EVENTS.BILL_DELETED, ({ orgId, billId }) => {
    emitDataChange(orgId, 'bills', 'deleted', { _id: billId });
  });

  // Invoices
  eventBus.on(EVENTS.INVOICE_CREATED, ({ orgId, invoice }) => {
    emitDataChange(orgId, 'invoices', 'created', invoice);
  });
  eventBus.on(EVENTS.INVOICE_UPDATED, ({ orgId, invoice }) => {
    emitDataChange(orgId, 'invoices', 'updated', invoice);
  });
  eventBus.on(EVENTS.INVOICE_PAID, ({ orgId, invoice }) => {
    emitDataChange(orgId, 'invoices', 'paid', invoice);
  });
  eventBus.on(EVENTS.INVOICE_DELETED, ({ orgId, invoiceId }) => {
    emitDataChange(orgId, 'invoices', 'deleted', { _id: invoiceId });
  });

  // Payments
  eventBus.on(EVENTS.PAYMENT_RECORDED, ({ orgId, payment }) => {
    emitDataChange(orgId, 'payments', 'recorded', payment);
  });

  // Customers
  eventBus.on(EVENTS.CUSTOMER_BALANCE_CHANGED, ({ orgId, customer }) => {
    emitDataChange(orgId, 'customers', 'balanceChanged', customer);
  });

  // Transfers
  eventBus.on(EVENTS.TRANSFER_CREATED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', 'created', transfer);
  });
  eventBus.on(EVENTS.TRANSFER_APPROVED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', 'approved', transfer);
  });
  eventBus.on(EVENTS.TRANSFER_RECEIVED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', 'received', transfer);
  });

  // Returns
  eventBus.on(EVENTS.RETURN_COMPLETED, ({ orgId, returnDoc }) => {
    emitDataChange(orgId, 'returns', 'completed', returnDoc);
  });

  // Expenses
  eventBus.on(EVENTS.EXPENSE_CREATED, ({ orgId, expense }) => {
    emitDataChange(orgId, 'expenses', 'created', expense);
  });

  // Dashboard (aggregated refresh)
  eventBus.on(EVENTS.DASHBOARD_UPDATE, ({ orgId, stats }) => {
    emitDataChange(orgId, 'dashboard', 'refresh', stats || {});
  });

  logger.info('Event Bus → Socket.IO wiring initialized');
};

module.exports = { init, getIO, emitNotification, emitDataChange };
