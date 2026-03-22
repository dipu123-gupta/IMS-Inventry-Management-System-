const mongoose = require('mongoose');
const PaymentRepository = require('../repositories/PaymentRepository');
const BillRepository = require('../repositories/BillRepository');
const VendorRepository = require('../repositories/VendorRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const OrderRepository = require('../repositories/OrderRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const InvoiceRepository = require('../repositories/InvoiceRepository');
const Counter = require('../../models/Counter');
const { emitNotification } = require('../../utils/socket');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const { NOTIFICATION_TYPE } = require('../../utils/constants');
const logger = require('../../utils/logger');

class PaymentService {
  async getPayments(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.type) filter.type = queryParams.type;
    if (queryParams.paymentMode) filter.paymentMode = queryParams.paymentMode;

    const [payments, total] = await Promise.all([
      PaymentRepository.findPayments(filter, skip, limit),
      PaymentRepository.countDocuments(filter),
    ]);

    return { payments, page, pages: Math.ceil(total / limit), total };
  }

  async recordPayment(data, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check for idempotency to prevent duplicate payments
      if (data.idempotencyKey) {
        const existingPayment = await PaymentRepository.model.findOne({ 
          idempotencyKey: data.idempotencyKey, 
          organization 
        }).session(session);
        
        if (existingPayment) {
          await session.abortTransaction();
          return existingPayment; // Return existing if already processed
        }
      }

      if (!data.paymentNumber) {
        const count = await PaymentRepository.countDocuments({ organization });
        data.paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
      }

      data.organization = organization;
      data.createdBy = user._id;

      let paymentResult;
      let billPaid = false;
      let paidBill = null;

      if (data.type === 'payable') {
        // Vendor Payment (Paying a Bill)
        if (data.bill) {
          const bill = await BillRepository.model.findOne({ _id: data.bill, organization }).session(session);
          if (!bill) {
            const error = new Error('Bill not found');
            error.statusCode = 404;
            throw error;
          }

          if (bill.amountPaid + data.amount > bill.totalAmount) {
            const error = new Error('Payment amount exceeds bill balance');
            error.statusCode = 400;
            throw error;
          }

          bill.amountPaid += data.amount;
          if (bill.amountPaid >= bill.totalAmount) {
            bill.status = 'paid';
            billPaid = true;
          } else {
            bill.status = 'partially_paid';
          }
          await bill.save({ session });
          paidBill = bill;
          
          data.vendor = bill.vendor;
        } else if (data.vendor) {
          const vendor = await VendorRepository.findOne({ _id: data.vendor, organization }).session(session);
          if (!vendor) {
            const error = new Error('Vendor not found');
            error.statusCode = 404;
            throw error;
          }
        } else {
          const error = new Error('Either Bill or Vendor is required for payable');
          error.statusCode = 400;
          throw error;
        }

        paymentResult = await PaymentRepository.model.create([data], { session });

      } else if (data.type === 'receivable') {
        // Customer Payment (Receiving Payment)
        
        // Detailed Invoice Payment Tracking
        if (data.invoice) {
          const invoice = await InvoiceRepository.findOne({ _id: data.invoice, organization }).session(session);
          if (!invoice) {
            const error = new Error('Invoice not found');
            error.statusCode = 404;
            throw error;
          }

          if (invoice.balance < data.amount) {
            const error = new Error(`Payment amount (${data.amount}) exceeds invoice balance (${invoice.balance})`);
            error.statusCode = 400;
            throw error;
          }

          invoice.amountPaid += data.amount;
          invoice.balance -= data.amount;
          
          if (invoice.balance <= 0) {
            invoice.status = 'paid';
          } else if (invoice.amountPaid > 0) {
            invoice.status = 'partial';
          }
          await invoice.save({ session });
          
          data.customer = invoice.customer;
        }

        if (!data.customer) {
          const error = new Error('Customer is required for receivable payments');
          error.statusCode = 400;
          throw error;
        }

        const customer = await CustomerRepository.findOne({ _id: data.customer, organization }).session(session);
        if (!customer) {
          const error = new Error('Customer not found');
          error.statusCode = 404;
          throw error;
        }

        customer.currentBalance = Math.max(0, customer.currentBalance - data.amount);
        await customer.save({ session });

        paymentResult = await PaymentRepository.model.create([data], { session });

        // Emit customer balance change
        eventBus.emit(EVENTS.CUSTOMER_BALANCE_CHANGED, {
          orgId: organization,
          customer
        });
        
        if (data.invoice) {
          eventBus.emit('INVOICE_PAID', {
            orgId: organization,
            invoiceId: data.invoice,
            amount: data.amount
          });
        }
      }

      // Create payment notification
      const [payNotification] = await NotificationRepository.model.create([{
        type: NOTIFICATION_TYPE.SYSTEM,
        title: `Payment ${data.type === 'receivable' ? 'Received' : 'Made'}`,
        message: `${data.paymentNumber} — Amount: ${data.amount}`,
        link: '/billing',
        organization
      }], { session });
      emitNotification(organization.toString(), payNotification);

      await session.commitTransaction();

      const payment = paymentResult[0];
      logger.info(`Payment ${payment.paymentNumber} (${payment.type}) created by ${user._id} for amount ${payment.amount}`);

      // Emit PAYMENT_RECORDED — drives finance sync, dashboard refresh
      eventBus.emit(EVENTS.PAYMENT_RECORDED, {
        orgId: organization,
        payment
      });

      // If a bill was fully paid, emit BILL_PAID
      if (billPaid && paidBill) {
        eventBus.emit(EVENTS.BILL_PAID, {
          orgId: organization,
          bill: paidBill
        });
      }

      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new PaymentService();
