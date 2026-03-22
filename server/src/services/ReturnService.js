const mongoose = require('mongoose');
const ReturnRepository = require('../repositories/ReturnRepository');
const InventoryService = require('./InventoryService');
const OrderRepository = require('../repositories/OrderRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

class ReturnService {
  async getReturns(organization) {
    const returns = await ReturnRepository.findReturnsWithDetails(organization);
    return { success: true, count: returns.length, returns };
  }

  async createReturn(data, organization, user) {
    const { orderId, type, items, notes, totalRefundAmount } = data;

    const order = await OrderRepository.findOne({ _id: orderId, organization });
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    const returnRequest = await ReturnRepository.create({
      order: orderId,
      organization,
      type,
      items,
      notes,
      totalRefundAmount,
      createdBy: user.id
    });

    return { success: true, return: returnRequest };
  }

  async completeReturn(id, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const returnReq = await ReturnRepository.model.findOne({ _id: id, organization }).session(session);
      if (!returnReq) {
        const error = new Error('Return not found');
        error.statusCode = 404;
        throw error;
      }
      if (returnReq.status === 'completed') {
        const error = new Error('Return already completed');
        error.statusCode = 400;
        throw error;
      }

      for (const item of returnReq.items) {
        await InventoryService.adjustStock({
          productId: item.product,
          warehouseId: item.warehouse,
          quantity: item.quantity,
          type: returnReq.type === 'sale' ? 'in' : 'out',
          reason: `Return ${returnReq.returnNumber} (${item.condition || 'completed'})`,
          referenceId: returnReq._id,
          userId: user._id,
          organizationId: organization,
          session
        });
      }

      returnReq.status = 'completed';
      await returnReq.save({ session });

      await session.commitTransaction();
      logger.info(`Return ${returnReq.returnNumber} (${returnReq.type}) completed for order ${returnReq.order}. Total Amount: ${returnReq.totalRefundAmount || 0}`);
      
      // Emit event
      eventBus.emit(EVENTS.RETURN_COMPLETED, {
        orgId: organization,
        returnDoc: returnReq
      });

      return { success: true, return: returnReq };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new ReturnService();
