const router = require('express').Router();
const { setup2FA, verify2FA, disable2FA } = require('../controllers/2faController');
const auth = require('../middleware/auth');

router.use(auth);

/**
 * @openapi
 * /api/2fa/setup:
 *   get:
 *     summary: Generate 2FA secret and QR code
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/setup', setup2FA);

/**
 * @openapi
 * /api/2fa/verify:
 *   post:
 *     summary: Verify token and enable 2FA
 *     tags: [Security]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 */
router.post('/verify', verify2FA);

/**
 * @openapi
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     tags: [Security]
 */
router.post('/disable', disable2FA);

module.exports = router;
