const mongoose = require('mongoose');
const InvoiceRepository = require('../repositories/InvoiceRepository');
const OrderRepository = require('../repositories/OrderRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

class InvoiceService {
  async getInvoices(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.search) {
      filter.invoiceNumber = { $regex: queryParams.search, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      InvoiceRepository.findInvoicesWithDetails(filter, skip, limit),
      InvoiceRepository.countDocuments(filter)
    ]);

    return { invoices, page, pages: Math.ceil(total / limit), total };
  }

  async getInvoiceById(id, organization) {
    const invoice = await InvoiceRepository.model.findOne({ _id: id, organization })
      .populate('customer', 'name email address phone')
      .populate('salesOrder', 'orderNumber')
      .populate('items.product', 'name sku');
    
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    return invoice;
  }

  async createInvoice(data, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Handle empty string for optional salesOrder from frontend
      if (data.salesOrder === '') {
        data.salesOrder = null;
      }

      const invoiceData = {
        ...data,
        organization,
        createdBy: user._id
      };

      const [invoiceDoc] = await InvoiceRepository.model.create([invoiceData], { session });
      
      await session.commitTransaction();
      
      const populated = await this.getInvoiceById(invoiceDoc._id, organization);
      eventBus.emit(EVENTS.INVOICE_CREATED, { orgId: organization, invoice: populated });
      
      return populated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateInvoice(id, data, organization) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const invoice = await InvoiceRepository.model.findOne({ _id: id, organization }).session(session);
      if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
      }

      // Handle empty string for optional salesOrder from frontend
      if (data.salesOrder === '') {
        data.salesOrder = null;
      }

      Object.assign(invoice, data);
      await invoice.save({ session });
      
      await session.commitTransaction();
      
      const populated = await this.getInvoiceById(invoice._id, organization);
      eventBus.emit(EVENTS.INVOICE_UPDATED, { orgId: organization, invoice: populated });
      
      return populated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteInvoice(id, organization) {
    const invoice = await InvoiceRepository.model.findOneAndDelete({ _id: id, organization });
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }
    
    eventBus.emit(EVENTS.INVOICE_DELETED, { orgId: organization, invoiceId: id });
    return { success: true };
  }
}

module.exports = new InvoiceService();
