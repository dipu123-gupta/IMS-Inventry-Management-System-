/**
 * Backend Constants - All enums and hard-coded values should be defined here.
 */

const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  VOID: 'void'
};

const ORDER_TYPE = {
  SALE: 'sale',
  PURCHASE: 'purchase'
};

const ORDER_PREFIX = {
  SALE: 'SO',
  PURCHASE: 'PO'
};

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

const PAYMENT_MODE = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  CARD: 'card',
  UPI: 'upi',
  CREDIT: 'credit'
};

const PAYMENT_TYPE = {
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable'
};

const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  INVOICED: 'invoiced',
  EXPIRED: 'expired'
};

const BILL_STATUS = {
  OPEN: 'open',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  VOID: 'void'
};

const NOTIFICATION_TYPE = {
  LOW_STOCK: 'low_stock',
  ORDER_UPDATE: 'order_update',
  BILL_ALERT: 'bill_alert',
  INVOICE_ALERT: 'invoice_alert',
  EXPIRY_ALERT: 'expiry_alert',
  TRANSFER_ALERT: 'transfer_alert',
  SYSTEM: 'system'
};

const RETURN_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const RETURN_TYPE = {
  SALE: 'sale',
  PURCHASE: 'purchase'
};

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  PARTNER: 'partner'
};

const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  TRIALING: 'trialing'
};

module.exports = {
  ORDER_STATUS,
  ORDER_TYPE,
  ORDER_PREFIX,
  PAYMENT_STATUS,
  PAYMENT_MODE,
  PAYMENT_TYPE,
  QUOTE_STATUS,
  BILL_STATUS,
  RETURN_STATUS,
  RETURN_TYPE,
  NOTIFICATION_TYPE,
  ROLES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS
};
