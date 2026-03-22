const { eventBus, EVENTS } = require('../../utils/eventBus');
const BillRepository = require('../repositories/BillRepository');
const OrderRepository = require('../repositories/OrderRepository');
const Counter = require('../../models/Counter');
const { BILL_STATUS, ORDER_STATUS } = require('../../utils/constants');

class BillService {
  async getBills(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.vendor) filter.vendor = queryParams.vendor;
    if (queryParams.search) {
      filter.billNumber = { $regex: queryParams.search, $options: 'i' };
    }

    const [bills, total] = await Promise.all([
      BillRepository.findWithDetails(filter, skip, limit),
      BillRepository.countDocuments(filter),
    ]);

    return { 
      bills, 
      page, 
      pages: Math.ceil(total / limit), 
      total 
    };
  }

  async getBillById(id, organization) {
    const bill = await BillRepository.findByIdWithDetails(id, organization);
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    return bill;
  }

  async createBill(data, organization, user) {
    const bill = await BillRepository.create({
      ...data,
      organization,
      createdBy: user._id
    });
    eventBus.emit(EVENTS.BILL_CREATED, { orgId: organization, bill });
    return bill;
  }

  async updateBill(id, data, organization) {
    const bill = await BillRepository.model.findOne({ _id: id, organization });
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    Object.assign(bill, data);
    await bill.save();
    
    const populated = await this.getBillById(id, organization);
    eventBus.emit(EVENTS.BILL_UPDATED, { orgId: organization, bill: populated });
    return populated;
  }

  async updateBillStatus(id, status, organization) {
    const bill = await BillRepository.model.findOne({ _id: id, organization });
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    bill.status = status;
    await bill.save();
    
    eventBus.emit(EVENTS.BILL_STATUS_CHANGED, { orgId: organization, billId: id, status });
    return bill;
  }

  async deleteBill(id, organization) {
    const bill = await BillRepository.model.findOneAndDelete({ _id: id, organization });
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    eventBus.emit(EVENTS.BILL_DELETED, { orgId: organization, billId: id });
    return { success: true };
  }
}

module.exports = new BillService();
