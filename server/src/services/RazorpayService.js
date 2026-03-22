const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../../config/env');
const logger = require('../../utils/logger');

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in standard currency (e.g., USD or INR)
 * @param {string} currency - Currency code
 * @param {string} receipt - Unique receipt ID (e.g., our Order ID)
 * @returns {Promise<Object>} - Razorpay order response
 */
const createOrder = async (amount, currency = 'USD', receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // convert to cents/paise
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    logger.error('Razorpay Order Creation Error:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay Signature
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 * @returns {boolean} - True if signature is valid
 */
const verifySignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  createOrder,
  verifySignature,
};
