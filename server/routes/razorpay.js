const router = require('express').Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const logger = require('../utils/logger');
const razorpayService = require('../src/services/RazorpayService');
const Order = require('../models/Order');

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/v1/razorpay/create-order/:orderId
 * @access  Private
 */
router.post('/create-order/:orderId', auth, tenant, async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    // Assuming Order model has totalAmount
    const order = await Order.findOne({ _id: orderId, organization: req.organization });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const rzpOrder = await razorpayService.createOrder(
      order.totalAmount, 
      'USD', // Or get from order/org config
      order._id.toString()
    );

    res.json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (error) {
    logger.error('Razorpay Order Creation Failed:', error);
    next(error);
  }
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/v1/razorpay/verify-payment
 * @access  Private
 */
router.post('/verify-payment', auth, tenant, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    const isValid = razorpayService.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update Order Status in DB
    await Order.findByIdAndUpdate(order_id, {
      paymentStatus: 'paid',
      paymentDetails: {
        method: 'razorpay',
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
      }
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    logger.error('Payment Verification Failed:', error);
    next(error);
  }
});

module.exports = router;
