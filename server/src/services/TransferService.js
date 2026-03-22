const mongoose = require('mongoose');
const TransferRepository = require('../repositories/TransferRepository');
const WarehouseRepository = require('../repositories/WarehouseRepository');
const InventoryService = require('./InventoryService');
const { eventBus, EVENTS } = require('../../utils/eventBus');

class TransferService {
  async getTransfers(organization) {
    const transfers = await TransferRepository.findTransfersWithDetails(organization);
    return { success: true, count: transfers.length, transfers };
  }

  async getTransferById(id, organization) {
    const transfer = await TransferRepository.findTransferByIdWithDetails(id, organization);
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, transfer };
  }

  async createTransfer(data, organization, user) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { fromWarehouse, toWarehouse, items, notes } = data;

      if (fromWarehouse === toWarehouse) {
        const error = new Error('Source and destination warehouses must be different');
        error.statusCode = 400;
        throw error;
      }

      const transferResult = await TransferRepository.model.create([{
        fromWarehouse,
        toWarehouse,
        items,
        notes,
        createdBy: user._id,
        organization,
        status: 'pending'
      }], { session });
      const transfer = transferResult[0];

      for (const item of items) {
        const isAvailable = await InventoryService.checkStockAvailability(
          item.product,
          fromWarehouse,
          item.quantity,
          organization
        );
        if (!isAvailable) {
          const error = new Error(`Insufficient stock for product in source warehouse`);
          error.statusCode = 400;
          throw error;
        }
      }

      await session.commitTransaction();

      // Emit event
      eventBus.emit(EVENTS.TRANSFER_CREATED, {
        orgId: organization,
        transfer
      });

      return { success: true, transfer };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async approveTransfer(id, organization) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const transfer = await TransferRepository.model.findOne({ _id: id, organization }).session(session);
      if (!transfer) {
        const error = new Error('Transfer not found');
        error.statusCode = 404;
        throw error;
      }
      if (transfer.status !== 'pending') {
        const error = new Error('Transfer is not in pending status');
        error.statusCode = 400;
        throw error;
      }

      const fromWh = await WarehouseRepository.findById(transfer.fromWarehouse).session(session);
      const toWh = await WarehouseRepository.findById(transfer.toWarehouse).session(session);

      for (const item of transfer.items) {
        await InventoryService.adjustStock({
          productId: item.product,
          warehouseId: transfer.fromWarehouse,
          quantity: item.quantity,
          type: 'out',
          reason: `Transfer OUT to ${toWh?.name || 'Destination'} (#${transfer.transferNumber})`,
          referenceId: transfer._id,
          userId: transfer.createdBy,
          organizationId: organization,
          session
        });
      }

      transfer.status = 'approved';
      await transfer.save({ session });

      await session.commitTransaction();

      // Emit event
      eventBus.emit(EVENTS.TRANSFER_APPROVED, {
        orgId: organization,
        transfer
      });

      return { success: true, transfer };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async receiveTransfer(id, organization) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const transfer = await TransferRepository.model.findOne({ _id: id, organization }).session(session);
      if (!transfer) {
        const error = new Error('Transfer not found');
        error.statusCode = 404;
        throw error;
      }
      if (transfer.status !== 'approved') {
        const error = new Error('Transfer must be approved before receiving');
        error.statusCode = 400;
        throw error;
      }

      const fromWh = await WarehouseRepository.findById(transfer.fromWarehouse).session(session);
      
      for (const item of transfer.items) {
        await InventoryService.adjustStock({
          productId: item.product,
          warehouseId: transfer.toWarehouse,
          quantity: item.quantity,
          type: 'in',
          reason: `Transfer IN from ${fromWh?.name || 'Origin'} (#${transfer.transferNumber})`,
          referenceId: transfer._id,
          userId: transfer.createdBy,
          organizationId: organization,
          session
        });
      }

      transfer.status = 'received';
      await transfer.save({ session });

      await session.commitTransaction();

      // Emit event
      eventBus.emit(EVENTS.TRANSFER_RECEIVED, {
        orgId: organization,
        transfer
      });

      return { success: true, transfer };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new TransferService();
