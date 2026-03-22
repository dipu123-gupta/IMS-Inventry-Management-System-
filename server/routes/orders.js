const router = require('express').Router();
const {
  getOrders, getOrder, createOrder, updateOrderStatus,
  getMyCustomerOrders, getMyVendorOrders, sendOrderEmail,
  generateInvoiceData, convertToInvoice, convertToBill
} = require('../controllers/orderController');
const { generateInvoice } = require('../utils/pdfGenerator');
const validateZod = require('../middleware/validateZod');
const { orderSchema } = require('../validators/order.schema');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const logActivity = require('../middleware/activityLogger');

const tenant = require('../middleware/tenant');

router.use(auth);
router.use(tenant);

/**
 * @openapi
 * /api/orders/my-orders:
 *   get:
 *     summary: Get orders for the logged-in customer/vendor
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 *     responses:
 *       200:
 *         description: List of linked orders
 */
router.get('/my-orders', getMyCustomerOrders);

/**
 * @openapi
 * /api/orders/vendor-orders:
 *   get:
 *     summary: Get POs for the logged-in vendor
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 */
router.get('/vendor-orders', getMyVendorOrders);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: List all orders (Internal Staff only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [purchase, sale] }
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', getOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 */
router.get('/:id', getOrder);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new order (Sale or Purchase)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, items]
 *             properties:
 *               type: { type: string, enum: [purchase, sale] }
 *               items: 
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', role('admin', 'manager'), validateZod(orderSchema), logActivity('created', 'Order'), createOrder);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 */
router.put('/:id/status', role('admin', 'manager'), logActivity('updated status', 'Order'), updateOrderStatus);

/**
 * @openapi
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Generate and stream Invoice PDF
 *     tags: [Orders]
 */
router.get('/:id/invoice', async (req, res, next) => {
  await generateInvoice(req.params.id, req.organization, res);
});

/**
 * @openapi
 * /api/orders/{id}/invoice-data:
 *   get:
 *     summary: Get structured data for invoice view
 *     tags: [Orders]
 */
router.get('/:id/invoice-data', generateInvoiceData);

/**
 * @openapi
 * /api/orders/{id}/convert:
 *   post:
 *     summary: Convert Sales Order to Invoice
 *     tags: [Orders]
 */
router.post('/:id/convert', role('admin', 'manager'), logActivity('converted to invoice', 'Order'), convertToInvoice);

/**
 * @openapi
 * /api/orders/{id}/convert-bill:
 *   post:
 *     summary: Convert Purchase Order to Bill
 *     tags: [Orders]
 */
router.post('/:id/convert-bill', role('admin', 'manager'), logActivity('converted to bill', 'Order'), convertToBill);

/**
 * @openapi
 * /api/orders/{id}/email:
 *   post:
 *     summary: Email Order Invoice to Customer
 *     tags: [Orders]
 */
router.post('/:id/email', role('admin', 'manager'), logActivity('emailed', 'Order Invoice'), sendOrderEmail);

module.exports = router;
