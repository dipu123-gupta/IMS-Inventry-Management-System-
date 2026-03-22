const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validateZod = require('../middleware/validateZod');
const { customerSchema } = require('../validators/customer.schema');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

/**
 * @openapi
 * /api/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Sales]
 */
router.route('/')
  .get(getCustomers)
  /**
   * @openapi
   * /api/customers:
   *   post:
   *     summary: Create a new customer
   *     tags: [Sales]
   */
  .post(validateZod(customerSchema), logActivity('created', 'Customer'), createCustomer);

/**
 * @openapi
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer details
 *     tags: [Sales]
 */
router.route('/:id')
  .get(getCustomer)
  /**
   * @openapi
   * /api/customers/{id}:
   *   put:
   *     summary: Update customer details
   *     tags: [Sales]
   */
  .put(validateZod(customerSchema), logActivity('updated', 'Customer'), updateCustomer)
  /**
   * @openapi
   * /api/customers/{id}:
   *   delete:
   *     summary: Delete a customer
   *     tags: [Sales]
   */
  .delete(role(['admin']), logActivity('deleted', 'Customer'), deleteCustomer);

module.exports = router;
