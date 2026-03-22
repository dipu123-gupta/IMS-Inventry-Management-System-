const mongoose = require('mongoose');
const OrderRepository = require('../repositories/OrderRepository');
const InventoryService = require('./InventoryService');
const CustomerRepository = require('../repositories/CustomerRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const InvoiceRepository = require('../repositories/InvoiceRepository');
const BillRepository = require('../repositories/BillRepository');
const QuoteRepository = require('../repositories/QuoteRepository');
const NotificationService = require('./NotificationService');
const { ORDER_STATUS, ORDER_TYPE, QUOTE_STATUS, NOTIFICATION_TYPE } = require('../../utils/constants');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

class OrderService {
  async getOrders(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.type) filter.type = queryParams.type;
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.search) {
      filter.$or = [
        { orderNumber: { $regex: queryParams.search, $options: 'i' } },
        { customerName: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      OrderRepository.findOrders(filter, skip, limit),
      OrderRepository.countDocuments(filter),
    ]);

    return { orders, page, pages: Math.ceil(total / limit), total };
  }

  async getOrderById(id, organization) {
    const order = await OrderRepository.findOrderByIdWithDetails(id, organization);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  async createOrder(data, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    let orderDoc;
    try {
      const { type, items, customer, paymentStatus, paymentMethod, quoteReference } = data;

      const orderArr = await OrderRepository.model.create(
        [{ 
          ...data, 
          items: items.map(item => ({
            ...item,
            discount: item.discount || 0,
            tax: item.tax || 0
          })),
          createdBy: user._id, 
          organization 
        }], 
        { session }
      );
      orderDoc = orderArr[0];

      // Update stock and create inventory logs
      for (const item of items) {
        // For Sales: Adjust immediately. For Purchase: Only if status is completed/shipped (unlikely at creation)
        if (type === ORDER_TYPE.SALE || data.status === ORDER_STATUS.COMPLETED || data.status === ORDER_STATUS.SHIPPED) {
          await InventoryService.adjustStock({
            productId: item.product,
            warehouseId: item.warehouse,
            quantity: item.quantity,
            type: type === ORDER_TYPE.PURCHASE ? 'in' : 'out',
            reason: `${type === ORDER_TYPE.PURCHASE ? 'Purchase' : 'Sale'} Order: ${orderDoc.orderNumber}`,
            referenceId: orderDoc._id,
            userId: user._id,
            organizationId: organization,
            session
          });
        }
      }

      // Order notification
      await NotificationService.createNotification({
        type: NOTIFICATION_TYPE.ORDER_UPDATE,
        title: `New ${type === ORDER_TYPE.PURCHASE ? 'Purchase' : 'Sales'} Order`,
        message: `Order ${orderDoc.orderNumber} created - Total: $${orderDoc.totalAmount.toFixed(2)}`,
        link: `/orders/${orderDoc._id}`,
        organization: organization,
      });

      // Update customer balance if it's a credit sale
      if (type === 'sale' && customer && paymentMethod === 'credit') {
        const customerDoc = await CustomerRepository.findOne({ _id: customer, organization }).session(session);
        if (customerDoc) {
          customerDoc.currentBalance += orderDoc.totalAmount;
          customerDoc.purchaseHistory.push({ order: orderDoc._id, date: new Date(), amount: orderDoc.totalAmount });
          await customerDoc.save({ session });
        }
      }

      // If linking a quote, update quote status
      if (quoteReference) {
        const quote = await QuoteRepository.model.findOne({ _id: quoteReference, organization }).session(session);
        if (quote) {
          quote.status = QUOTE_STATUS.ACCEPTED;
          await quote.save({ session });
        }
      }

      await session.commitTransaction();
      
      logger.info(`Order ${orderDoc.orderNumber} (${type}) created by user ${user._id}. Total Amount: ${orderDoc.totalAmount}`);
      
      const populated = await OrderRepository.model.findOne({ _id: orderDoc._id, organization })
        .populate('vendor', 'name')
        .populate('customer', 'name')
        .populate('createdBy', 'name')
        .populate('items.product', 'name sku')
        .populate('items.warehouse', 'name');

      // Emit ORDER_CREATED — drives dashboard refresh, real-time UI, finance sync
      eventBus.emit(EVENTS.ORDER_CREATED, {
        orgId: organization,
        order: populated,
        type
      });

      return { orderDoc, populated };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateOrderStatus(id, status, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await OrderRepository.model.findOne({ _id: id, organization }).session(session);
      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }

      // Status transition validation
      const forbiddenTransitions = {
        [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.DRAFT, ORDER_STATUS.PENDING],
        [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PROCESSING]
      };

      if (forbiddenTransitions[order.status]?.includes(status)) {
        const error = new Error(`Cannot transition from ${order.status} to ${status}`);
        error.statusCode = 400;
        throw error;
      }

      const auditBefore = JSON.parse(JSON.stringify(order));

      // If PO is moving to SHIPPED or COMPLETED, add stock
      if (order.type === ORDER_TYPE.PURCHASE && (status === ORDER_STATUS.SHIPPED || status === ORDER_STATUS.COMPLETED) && order.status !== ORDER_STATUS.SHIPPED && order.status !== ORDER_STATUS.COMPLETED) {
        for (const item of order.items) {
          await InventoryService.adjustStock({
            productId: item.product,
            warehouseId: item.warehouse,
            quantity: item.quantity,
            type: 'in',
            reason: `Purchase Order Received: ${order.orderNumber}`,
            referenceId: order._id,
            userId: user._id,
            organizationId: organization,
            session
          });
        }
      }

      if (status === ORDER_STATUS.CANCELLED && (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.SHIPPED)) {
        for (const item of order.items) {
          await InventoryService.adjustStock({
            productId: item.product,
            warehouseId: item.warehouse,
            quantity: item.quantity,
            type: order.type === ORDER_TYPE.PURCHASE ? 'out' : 'in',
            reason: `Cancelled Order: ${order.orderNumber}`,
            referenceId: order._id,
            userId: user._id,
            organizationId: organization,
            session
          });
        }

        if (order.type === 'sale' && order.customer && order.paymentMethod === 'credit') {
          const customer = await CustomerRepository.findOne({ _id: order.customer, organization }).session(session);
          if (customer) {
            customer.currentBalance -= order.totalAmount;
            await customer.save({ session });
          }
        }
      }

      order.status = status;
      await order.save({ session });

      await NotificationService.createNotification({
        type: NOTIFICATION_TYPE.ORDER_UPDATE,
        title: 'Order Status Updated',
        message: `Order ${order.orderNumber} status changed to ${status}`,
        link: `/orders/${order._id}`,
        organization: organization,
      });

      // AUTO-INVOICING: If Sales Order is completed/shipped, automatically create invoice
      if (order.type === ORDER_TYPE.SALE && (status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.SHIPPED)) {
        const existingInvoice = await InvoiceRepository.findOne({ salesOrder: order._id, organization }).session(session);
        if (!existingInvoice) {
          const inv = await this._processConvertToInvoice(order, organization, user, session);
          eventBus.emit('INVOICE_CREATED', { orgId: organization, invoice: inv });
        }
      }

      // AUTO-BILLING: If Purchase Order is completed/shipped, automatically create bill
      if (order.type === ORDER_TYPE.PURCHASE && (status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.SHIPPED)) {
        const existingBill = await BillRepository.findOne({ purchaseOrder: order._id, organization }).session(session);
        if (!existingBill) {
          const bl = await this._processConvertToBill(order, organization, user, session);
          eventBus.emit('BILL_CREATED', { orgId: organization, bill: bl });
        }
      }

      await session.commitTransaction();

      // Emit status change event
      const eventName = status === ORDER_STATUS.CANCELLED ? EVENTS.ORDER_CANCELLED : EVENTS.ORDER_STATUS_CHANGED;
      eventBus.emit(eventName, {
        orgId: organization,
        order,
        previousStatus: auditBefore.status,
        newStatus: status
      });

      return { auditBefore, order };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getMyCustomerOrders(user, organization) {
    if (user.role !== 'customer') {
      const error = new Error('Access denied. Customers only.');
      error.statusCode = 403;
      throw error;
    }
    if (!user.customerPortalLink) {
      const error = new Error('User is not linked to a customer profile.');
      error.statusCode = 400;
      throw error;
    }
    const orders = await OrderRepository.getCustomerOrders(user.customerPortalLink, organization);
    return { success: true, count: orders.length, orders };
  }

  async getMyVendorOrders(user, organization) {
    if (user.role !== ROLES.VENDOR) {
      const error = new Error('Access denied. Vendors only.');
      error.statusCode = 403;
      throw error;
    }
    if (!user.vendorPortalLink) {
      const error = new Error('User is not linked to a vendor profile.');
      error.statusCode = 400;
      throw error;
    }
    const orders = await OrderRepository.getVendorOrders(user.vendorPortalLink, organization);
    return { success: true, count: orders.length, orders };
  }

  /**
   * Generate Invoice for a completed order.
   * This logic can be expanded to create a PDF and send via email.
   */
  async generateInvoice(orderId, organization) {
    const order = await OrderRepository.model.findOne({ _id: orderId, organization })
      .populate('items.product', 'name sku price')
      .populate('customer', 'name email address')
      .populate('organization', 'name address logo');

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.PROCESSING) {
      const error = new Error('Invoice can only be generated for processing or completed orders');
      error.statusCode = 400;
      throw error;
    }

    // Mark as invoiced if needed (business logic)
    // Here we just return the order details prepared for receipt/invoice view
    return order;
  }

  /**
   * Convert a Sales Order to an Invoice.
   * Status must be processing or completed.
   *  /**
   * Internal process to convert Sales Order to Invoice
   */
  async _processConvertToInvoice(order, organization, user, session) {
    const invoiceData = {
      salesOrder: order._id,
      customer: order.customer,
      customerName: order.customerName,
      items: order.items.map(item => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: (order.discount || 0) + order.items.reduce((sum, i) => sum + (i.discount || 0), 0),
      totalAmount: order.totalAmount,
      balance: order.totalAmount,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
      organization,
      createdBy: user._id
    };

    const [invoiceDoc] = await InvoiceRepository.model.create([invoiceData], { session });
    
    // Mark order as completed if it was just shipped/processing
    if (order.status !== ORDER_STATUS.COMPLETED) {
      order.status = ORDER_STATUS.COMPLETED;
      await order.save({ session });
    }

    return invoiceDoc;
  }

  /**
   * Internal process to convert Purchase Order to Bill
   */
  async _processConvertToBill(order, organization, user, session) {
    const billData = {
      purchaseOrder: order._id,
      vendor: order.vendor,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      organization,
      createdBy: user._id,
      status: 'open'
    };

    const [billDoc] = await BillRepository.model.create([billData], { session });

    if (order.status !== ORDER_STATUS.COMPLETED) {
      order.status = ORDER_STATUS.COMPLETED;
      await order.save({ session });
    }

    return billDoc;
  }

  /**
   * Public API to convert Sales Order to Invoice
   */
  async convertToInvoice(orderId, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await OrderRepository.model.findOne({ _id: orderId, organization }).session(session);
      if (!order) throw new Error('Order not found');
      
      const invoiceDoc = await this._processConvertToInvoice(order, organization, user, session);
      
      await session.commitTransaction();

      const populated = await InvoiceRepository.model.findOne({ _id: invoiceDoc._id, organization })
        .populate('customer', 'name email')
        .populate('items.product', 'name sku');

      eventBus.emit('INVOICE_CREATED', { orgId: organization, invoice: populated });
      return populated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Public API to convert Purchase Order to Bill
   */
  async convertToBill(orderId, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await OrderRepository.model.findOne({ _id: orderId, organization }).session(session);
      if (!order) throw new Error('Order not found');
      
      const billDoc = await this._processConvertToBill(order, organization, user, session);
      
      await session.commitTransaction();

      const BillService = require('./BillService');
      const populated = await BillService.getBillById(billDoc._id, organization);

      eventBus.emit('BILL_CREATED', { orgId: organization, bill: populated });
      return populated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new OrderService();
