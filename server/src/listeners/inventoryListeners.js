const { eventBus, EVENTS } = require('../../utils/eventBus');
const InventoryService = require('../services/InventoryService');
const Warehouse = require('../../models/Warehouse');
const logger = require('../../utils/logger');

/**
 * Inventory Listeners — Handles automated stock logic
 */
const initInventoryListeners = () => {
  // 1. Auto-initialize stock when a product is created
  eventBus.on(EVENTS.PRODUCT_CREATED, async ({ orgId, product }) => {
    try {
      // Find all warehouses for this org
      const warehouses = await Warehouse.find({ organization: orgId });
      
      for (const warehouse of warehouses) {
        await InventoryService.initializeStock(product._id, warehouse._id, orgId);
      }
      
      logger.info(`Auto-stock initialization completed for product ${product.sku}`);
    } catch (err) {
      logger.error(`Error in PRODUCT_CREATED listener for ${product?._id}:`, err);
    }
  });

  logger.info('Inventory Listeners initialized');
};

module.exports = initInventoryListeners;
