const CustomerRepository = require('../repositories/CustomerRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');

class CustomerService {
  async getCustomers(organization) {
    const customers = await CustomerRepository.findAll(organization);
    return { success: true, count: customers.length, customers };
  }

  async getCustomerById(id, organization) {
    const customer = await CustomerRepository.findByIdWithHistory(id, organization);
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, customer };
  }

  async createCustomer(data, organization) {
    const customer = await CustomerRepository.create({ ...data, organization });
    eventBus.emit(EVENTS.CUSTOMER_CREATED, { orgId: organization, customer });
    return { success: true, customer };
  }

  async updateCustomer(id, data, organization) {
    const customer = await CustomerRepository.updateOne(
      { _id: id, organization },
      data
    );
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    eventBus.emit(EVENTS.CUSTOMER_UPDATED, { orgId: organization, customer });
    return { success: true, customer };
  }

  async deleteCustomer(id, organization) {
    const customer = await CustomerRepository.deleteOne({ _id: id, organization });
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    eventBus.emit(EVENTS.CUSTOMER_DELETED, { orgId: organization, customerId: id });
    return { success: true, message: 'Customer deleted' };
  }
}

module.exports = new CustomerService();
