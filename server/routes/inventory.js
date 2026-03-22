const router = require('express').Router();
const { getLogs, getLowStock, adjustStock } = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const logActivity = require('../middleware/activityLogger');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

/**
 * @openapi
 * /api/inventory/logs:
 *   get:
 *     summary: Get all inventory transaction logs
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 */
router.get('/logs', getLogs);

/**
 * @openapi
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get products below organization thresholds
 *     tags: [Inventory]
 */
router.get('/low-stock', getLowStock);

/**
 * @openapi
 * /api/inventory/adjust:
 *   post:
 *     summary: Manually adjust stock levels
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, warehouseId, quantity, type]
 *             properties:
 *               productId: { type: string }
 *               warehouseId: { type: string }
 *               quantity: { type: number }
 *               type: { type: string, enum: [add, subtract] }
 */
router.post('/adjust', role('admin', 'manager'), logActivity('adjusted stock', 'Inventory'), adjustStock);

module.exports = router;
