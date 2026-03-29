const mongoose = require('mongoose');
const QuoteRepository = require('../repositories/QuoteRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const ProductRepository = require('../repositories/ProductRepository');
const OrderRepository = require('../repositories/OrderRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

class QuoteService {
  async getQuotes(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.search) {
      filter.$or = [
        { quoteNumber: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      QuoteRepository.findQuotes(filter, skip, limit),
      QuoteRepository.countDocuments(filter),
    ]);

    return { quotes, page, pages: Math.ceil(total / limit), total };
  }

  async getQuoteById(id, organization) {
    const quote = await QuoteRepository.findQuoteByIdWithDetails(id, organization);
    if (!quote) {
      const error = new Error('Quote not found');
      error.statusCode = 404;
      throw error;
    }
    return quote;
  }

  async createQuote(data, organization, user) {

    const customer = await CustomerRepository.findOne({ _id: data.customer, organization });
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }

    let calculatedTotal = 0;
    for (const item of data.items) {
      const product = await ProductRepository.findOne({ _id: item.product, organization });
      if (!product) {
        const error = new Error(`Product ${item.product} not found`);
        error.statusCode = 404;
        throw error;
      }
      const price = item.price || product.price;
      item.price = price;
      const subtotal = (price * item.quantity) - (item.discount || 0) + (item.tax || 0);
      calculatedTotal += subtotal;
    }

    if (!data.totalAmount) {
      data.totalAmount = calculatedTotal;
    }

    const quoteResult = await QuoteRepository.model.create([{
      ...data,
      createdBy: user._id,
      organization
    }]);

    const quote = quoteResult[0];
    logger.info(`Quote ${quote.quoteNumber} created by ${user._id} for customer ${customer.name}`);

    const populatedQuote = await QuoteRepository.findQuoteByIdWithDetails(quote._id, organization);

    // Emit QUOTE_CREATED
    eventBus.emit(EVENTS.QUOTE_CREATED, {
      orgId: organization,
      quote: populatedQuote
    });

    return populatedQuote;
  }

  async updateQuoteStatus(id, status, organization) {
    const allowedStatuses = ['draft', 'sent', 'accepted', 'declined', 'invoiced'];
    if (!allowedStatuses.includes(status)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    const quote = await QuoteRepository.model.findOne({ _id: id, organization });
    if (!quote) {
      const error = new Error('Quote not found');
      error.statusCode = 404;
      throw error;
    }

    quote.status = status;
    await quote.save();

    // Emit QUOTE_ACCEPTED if status is 'accepted'
    if (status === 'accepted') {
      eventBus.emit(EVENTS.QUOTE_ACCEPTED, {
        orgId: organization,
        quote
      });
    }

    return quote;
  }

  /**
   * Convert an accepted quote to a Sales Order.
   * Pipeline: Quote → Accept → Convert → Sales Order
   */
  async convertToSalesOrder(quoteId, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const quote = await QuoteRepository.model
        .findOne({ _id: quoteId, organization })
        .populate('items.product', 'name sku price')
        .session(session);

      if (!quote) {
        const error = new Error('Quote not found');
        error.statusCode = 404;
        throw error;
      }

      if (quote.status !== 'accepted') {
        const error = new Error('Only accepted quotes can be converted to Sales Orders');
        error.statusCode = 400;
        throw error;
      }

      // Build order data from quote — resolve warehouse for each item
      const orderItems = [];
      for (const item of quote.items) {
        const productId = item.product._id || item.product;
        let warehouseId = item.warehouse;

        // If quote item has no warehouse, use the product's first available warehouse
        if (!warehouseId) {
          const ProductRepository = require('../repositories/ProductRepository');
          const product = await ProductRepository.model
            .findOne({ _id: productId, organization })
            .session(session);
          if (product && product.warehouseStock.length > 0) {
            warehouseId = product.warehouseStock[0].warehouse;
          } else {
            // Fallback: get first warehouse in the org
            const WarehouseRepository = require('../repositories/WarehouseRepository');
            const defaultWh = await WarehouseRepository.model
              .findOne({ organization })
              .session(session);
            warehouseId = defaultWh?._id;
          }
        }

        if (!warehouseId) {
          const error = new Error(`No warehouse available for product ${item.product?.name || productId}. Please create a warehouse first.`);
          error.statusCode = 400;
          throw error;
        }

        orderItems.push({
          product: productId,
          warehouse: warehouseId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          tax: item.tax,
        });
      }

      const orderData = {
        type: 'sale',
        customer: quote.customer,
        quoteReference: quote._id,
        items: orderItems,
        notes: `Converted from Quote ${quote.quoteNumber}`,
        createdBy: user._id,
        organization,
      };

      // Create the sales order
      const [orderDoc] = await OrderRepository.model.create([orderData], { session });

      // Mark quote as invoiced
      quote.status = 'invoiced';
      await quote.save({ session });

      await session.commitTransaction();

      logger.info(`Quote ${quote.quoteNumber} converted to Sales Order ${orderDoc.orderNumber}`);

      const populated = await OrderRepository.model.findOne({ _id: orderDoc._id, organization })
        .populate('customer', 'name')
        .populate('createdBy', 'name')
        .populate('items.product', 'name sku')
        .populate('items.warehouse', 'name');

      // Emit QUOTE_CONVERTED — triggers UI refresh on both quotes and orders
      eventBus.emit(EVENTS.QUOTE_CONVERTED, {
        orgId: organization,
        quote,
        order: populated
      });

      return { quote, order: populated };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new QuoteService();
