const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getWarehouses, createWarehouse, getWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validateZod = require('../middleware/validateZod');
const { warehouseSchema } = require('../validators/warehouse.schema');

const tenant = require('../middleware/tenant');

const checkLimit = require('../middleware/planLimits');

router.use(auth);
router.use(tenant);

/**
 * @openapi
 * /api/warehouses:
 *   get:
 *     summary: List all organization warehouses
 *     tags: [Warehouses]
 */
router.get('/', role('admin', 'manager'), getWarehouses);

/**
 * @openapi
 * /api/warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 */
router.post('/', role('admin', 'manager'), checkLimit('warehouses'), validateZod(warehouseSchema), logActivity('created', 'Warehouse'), createWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   get:
 *     summary: Get warehouse details
 *     tags: [Warehouses]
 */
router.get('/:id', getWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   put:
 *     summary: Update warehouse info
 *     tags: [Warehouses]
 */
router.put('/:id', role('admin', 'manager'), validateZod(warehouseSchema), logActivity('updated', 'Warehouse'), updateWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Remove a warehouse
 *     tags: [Warehouses]
 */
router.delete('/:id', role('admin'), logActivity('deleted', 'Warehouse'), deleteWarehouse);

module.exports = router;
