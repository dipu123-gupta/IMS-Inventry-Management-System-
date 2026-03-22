const { eventBus, EVENTS } = require('../../utils/eventBus');
const { emitDataChange } = require('../../utils/socket');
const logger = require('../../utils/logger');

/**
 * Transfer Listeners — Sync transfer status changes to the frontend in real-time.
 */
const initTransferListeners = () => {
  // When a new transfer is requested
  eventBus.on(EVENTS.TRANSFER_CREATED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', { action: 'created', transfer });
    logger.info(`Transfer created event broadcasted (Transfer: ${transfer.transferNumber})`);
  });

  // When a transfer is approved (stock deducted from origin)
  eventBus.on(EVENTS.TRANSFER_APPROVED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', { action: 'approved', transfer });
    logger.info(`Transfer approved event broadcasted (Transfer: ${transfer.transferNumber})`);
  });

  // When a transfer is received (stock added to destination)
  eventBus.on(EVENTS.TRANSFER_RECEIVED, ({ orgId, transfer }) => {
    emitDataChange(orgId, 'transfers', { action: 'received', transfer });
    logger.info(`Transfer received event broadcasted (Transfer: ${transfer.transferNumber})`);
  });
};

module.exports = initTransferListeners;
