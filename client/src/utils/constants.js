/**
 * Frontend Constants - Should align with backend constants in server/utils/constants.js
 */

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  VOID: 'void'
};

export const ORDER_TYPE = {
  SALE: 'sale',
  PURCHASE: 'purchase'
};

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

export const PAYMENT_MODE = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  CARD: 'card',
  UPI: 'upi',
  CREDIT: 'credit'
};

export const PAYMENT_TYPE = {
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable'
};

export const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  INVOICED: 'invoiced',
  EXPIRED: 'expired'
};

export const BILL_STATUS = {
  OPEN: 'open',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  VOID: 'void'
};

export const NOTIFICATION_TYPE = {
  LOW_STOCK: 'low_stock',
  ORDER_UPDATE: 'order_update',
  SYSTEM: 'system'
};

export const RETURN_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const RETURN_TYPE = {
  SALE: 'sale',
  PURCHASE: 'purchase'
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  PARTNER: 'partner'
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAST_DEUE: 'past_due',
  CANCELED: 'canceled',
  TRIALING: 'trialing'
};
