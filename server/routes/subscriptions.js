const router = require('express').Router();
const express = require('express');
const {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  handleWebhook,
} = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const role = require('../middleware/role');

// Webhook needs raw body, must be before other body parsers or handled specifically
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(auth);
router.use(tenant);

router.get('/status', getSubscriptionStatus);
router.post('/checkout', role('admin'), createCheckoutSession);
router.post('/portal', role('admin'), createPortalSession);

module.exports = router;
