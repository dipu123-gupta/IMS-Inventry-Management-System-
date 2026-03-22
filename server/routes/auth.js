const router = require('express').Router();
const { register, login, getMe, verifyLogin2FA } = require('../controllers/authController');
const validateZod = require('../middleware/validateZod');
const { registerSchema, loginSchema, verify2FASchema } = require('../validators/auth.schema');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify 2FA token during login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, token]
 *             properties:
 *               userId: { type: string }
 *               token: { type: string }
 */
router.post('/verify-2fa', validateZod(verify2FASchema), verifyLogin2FA);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user and organization
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, organizationName]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               organizationName: { type: string }
 *               inviteCode: { type: string, description: "Optional invite code to join existing org" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', validateZod(registerSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateZod(loginSchema), login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved
 *       401:
 *         description: Not authorized
 */
router.get('/me', auth, getMe);

module.exports = router;
