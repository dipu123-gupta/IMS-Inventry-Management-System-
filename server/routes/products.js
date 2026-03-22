const router = require('express').Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories,
} = require('../controllers/productController');
const validateZod = require('../middleware/validateZod');
const { productSchema } = require('../validators/product.schema');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const logActivity = require('../middleware/activityLogger');
const tenant = require('../middleware/tenant');
const checkLimit = require('../middleware/planLimits');
const redisCache = require('../middleware/redisCache');

router.use(auth); // All product routes require auth
router.use(tenant); // All product routes require tenant context

router.get('/categories/list', getCategories);

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products for the organization
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', redisCache(300), getProducts);

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - organizationId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku, category, price]
 *             properties:
 *               name: { type: string }
 *               sku: { type: string }
 *               category: { type: string }
 *               price: { type: number }
 *               lowStockThreshold: { type: number }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', role('admin', 'manager'), checkLimit('products'), validateZod(productSchema), logActivity('created', 'Product'), createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', getProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', role('admin', 'manager'), validateZod(productSchema), logActivity('updated', 'Product'), updateProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', role('admin'), logActivity('deleted', 'Product'), deleteProduct);

module.exports = router;
