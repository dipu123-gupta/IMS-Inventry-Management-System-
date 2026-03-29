const OrderService = require('../src/services/OrderService');
const { generateInvoiceBuffer } = require('../utils/pdfGenerator');
const emailService = require('../src/services/EmailService');
const logger = require('../utils/logger');

// @desc    Get all orders (filtered by type)
// @route   GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const result = await OrderService.getOrders(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const result = await OrderService.getOrderById(req.params.id, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Create order (purchase or sale)
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { orderDoc, populated } = await OrderService.createOrder(req.body, req.organization, req.user);
    
    // Set audit data for middleware (which runs after res.json is called)
    // Send order confirmation email (non-blocking)
    if (orderDoc.type === 'sale') {
      emailService.sendOrderConfirmation(req.user, orderDoc).catch(err => logger.error('Order email failed', err));
    }

    res.status(201).json(populated);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { auditBefore, order } = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.organization, req.user);
    
    req.auditBefore = auditBefore;
    req.auditAfter = order;
    req.auditDetails = { message: `Updated order ${order.orderNumber} status to ${req.body.status}` };

    res.json(order);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get current customer's orders
// @route   GET /api/orders/my-orders
exports.getMyCustomerOrders = async (req, res, next) => {
  try {
    const result = await OrderService.getMyCustomerOrders(req.user, req.organization);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get current vendor's orders
// @route   GET /api/v1/orders/vendor-orders
exports.getMyVendorOrders = async (req, res, next) => {
  try {
    const result = await OrderService.getMyVendorOrders(req.user, req.organization);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Email Order Invoice/Details to Customer
// @route   POST /api/v1/orders/:id/email
exports.sendOrderEmail = async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.params.id, req.organization);
    
    if (!order.customer || !order.customer.email) {
      const error = new Error('Order does not have a linked customer with an email address');
      error.statusCode = 400;
      throw error;
    }

    // Generate PDF buffer using existing utility (we will modify pdfGenerator to export a buffer generator)
    const pdfBuffer = await generateInvoiceBuffer(order._id, req.organization);

    const emailHtml = `
      <h3>${req.organization.name || 'Our Company'}</h3>
      <p>Dear ${order.customerName || order.customer.name || 'Customer'},</p>
      <p>Please find attached your ${order.type === 'purchase' ? 'Purchase Order' : 'Invoice'} for <b>${order.orderNumber}</b>.</p>
      <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
      <br>
      <p>Thank you for your business!</p>
    `;

    await emailService.sendMail({
      to: order.customerEmail || order.customer.email,
      subject: `${order.type === 'purchase' ? 'Purchase Order' : 'Invoice'} - ${order.orderNumber}`,
      html: emailHtml,
      text: `Please find attached your document for ${order.orderNumber}.`,
      attachmentFilename: `${order.orderNumber}.pdf`,
      attachmentBuffer: pdfBuffer
    });

    res.json({ success: true, message: `Email triggered successfully to ${order.customerEmail || order.customer.email}` });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.generateInvoiceData = async (req, res, next) => {
  try {
    const result = await OrderService.generateInvoice(req.params.id, req.organization);
    res.json({ success: true, order: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Convert Sales Order to Invoice
// @route   POST /api/v1/orders/:id/convert
exports.convertToInvoice = async (req, res, next) => {
  try {
    const invoice = await OrderService.convertToInvoice(req.params.id, req.organization, req.user);
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Convert Purchase Order to Bill
// @route   POST /api/v1/orders/:id/convert-bill
exports.convertToBill = async (req, res, next) => {
  try {
    const bill = await OrderService.convertToBill(req.params.id, req.organization, req.user);
    res.status(201).json({ success: true, bill });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
