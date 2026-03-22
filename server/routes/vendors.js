const router = require('express').Router();
const {
  getVendors, getVendor, createVendor, updateVendor, deleteVendor
} = require('../controllers/vendorController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validateZod = require('../middleware/validateZod');
const { vendorSchema } = require('../validators/vendor.schema');
const logActivity = require('../middleware/activityLogger');
const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

/**
 * @openapi
 * /api/vendors:
 *   get:
 *     summary: List all vendors
 *     tags: [Purchasing]
 */
router.get('/', getVendors);

/**
 * @openapi
 * /api/vendors/{id}:
 *   get:
 *     summary: Get vendor details
 *     tags: [Purchasing]
 */
router.get('/:id', getVendor);

/**
 * @openapi
 * /api/vendors:
 *   post:
 *     summary: Create a new vendor
 *     tags: [Purchasing]
 */
router.post('/', role('admin', 'manager'), validateZod(vendorSchema), logActivity('created', 'Vendor'), createVendor);

/**
 * @openapi
 * /api/vendors/{id}:
 *   put:
 *     summary: Update vendor details
 *     tags: [Purchasing]
 */
router.put('/:id', role('admin', 'manager'), validateZod(vendorSchema), logActivity('updated', 'Vendor'), updateVendor);

/**
 * @openapi
 * /api/vendors/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Purchasing]
 */
router.delete('/:id', role('admin'), logActivity('deleted', 'Vendor'), deleteVendor);

module.exports = router;
