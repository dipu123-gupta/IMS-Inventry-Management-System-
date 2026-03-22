const { eventBus, EVENTS } = require('../../utils/eventBus');
const Finance = require('../../models/Finance');
const logger = require('../../utils/logger');

/**
 * Finance Listeners — Drives automated financial tracking (Ledger)
 */
const initFinanceListeners = () => {
  // 1. Record Revenue on Invoice Created (Accrual basis)
  eventBus.on(EVENTS.INVOICE_CREATED, async ({ orgId, invoice }) => {
    try {
      if (!invoice || !orgId) return;
      await Finance.create({
        type: 'revenue',
        amount: invoice.totalAmount,
        category: 'Sales',
        description: `Revenue from Invoice ${invoice.invoiceNumber}`,
        date: new Date(),
        reference: invoice._id,
        referenceModel: 'Invoice',
        organization: orgId
      });
      logger.info(`Auto-recorded revenue ledger for Invoice ${invoice.invoiceNumber}`);
    } catch (err) {
      logger.error('Error in INVOICE_CREATED finance listener:', err);
    }
  });

  // 2. Record Expense on Bill Created (Accrual basis)
  eventBus.on(EVENTS.BILL_CREATED, async ({ orgId, bill }) => {
    try {
      if (!bill || !orgId) return;
      await Finance.create({
        type: 'expense',
        amount: bill.totalAmount,
        category: 'Cost of Goods',
        description: `Cost from Bill ${bill.billNumber}`,
        date: new Date(),
        reference: bill._id,
        referenceModel: 'Bill',
        organization: orgId
      });
      logger.info(`Auto-recorded COGS ledger for Bill ${bill.billNumber}`);
    } catch (err) {
      logger.error('Error in BILL_CREATED finance listener:', err);
    }
  });

  // 3. Record Direct Expense
  eventBus.on(EVENTS.EXPENSE_CREATED, async ({ orgId, expense }) => {
    try {
      await Finance.create({
        type: 'expense',
        amount: expense.amount,
        category: expense.category,
        description: `Expense: ${expense.title}`,
        date: expense.date || new Date(),
        reference: expense._id,
        referenceModel: 'Expense',
        organization: orgId
      });
      logger.info(`Auto-recorded ledger for Expense ${expense.title}`);
    } catch (err) {
      logger.error('Error in EXPENSE_CREATED finance listener:', err);
    }
  });

  // 4. Handle Expense Deletion
  eventBus.on(EVENTS.EXPENSE_DELETED, async ({ orgId, expenseId }) => {
    try {
      await Finance.deleteOne({ reference: expenseId, organization: orgId });
      logger.info(`Removed ledger entry for deleted expense ${expenseId}`);
    } catch (err) {
      logger.error('Error in EXPENSE_DELETED finance listener:', err);
    }
  });

  // 4. Handle Payments (Cash Flow Awareness)
  eventBus.on(EVENTS.PAYMENT_RECORDED, async ({ orgId, payment }) => {
    try {
      // In a real dual-entry system, we'd adjust Accounts Receivable/Payable here.
      // For this IMS, we'll mark the payment in the ledger for cash-flow reports if needed.
      logger.info(`Ledger aware of cash flow: ${payment.paymentNumber} (${payment.amount})`);
    } catch (err) {
      logger.error('Error in PAYMENT_RECORDED finance listener:', err);
    }
  });

  // 5. Handle Returns (Negative Revenue)
  eventBus.on(EVENTS.RETURN_COMPLETED, async ({ orgId, returnDoc }) => {
    if (returnDoc.type !== 'sale') return;
    try {
      await Finance.create({
        type: 'expense',
        amount: returnDoc.totalRefundAmount || 0,
        category: 'Returns',
        description: `Refund for Return ${returnDoc.returnNumber}`,
        date: new Date(),
        reference: returnDoc._id,
        referenceModel: 'Return',
        organization: orgId
      });
      logger.info(`Auto-recorded refund ledger for Return ${returnDoc.returnNumber}`);
    } catch (err) {
      logger.error('Error in RETURN_COMPLETED finance listener:', err);
    }
  });

  logger.info('Finance Listeners (v2 Ledger) initialized');
};

module.exports = initFinanceListeners;
