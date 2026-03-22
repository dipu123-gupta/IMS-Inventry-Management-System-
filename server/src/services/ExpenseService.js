const ExpenseRepository = require('../repositories/ExpenseRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

class ExpenseService {
  async getExpenses(organization, query = {}) {
    const filter = { organization, ...query };
    return await ExpenseRepository.model.find(filter)
      .sort({ date: -1 })
      .populate('createdBy', 'name');
  }

  async createExpense(data, organization, user) {
    const expense = await ExpenseRepository.create({
      ...data,
      organization,
      createdBy: user._id
    });

    logger.info(`Expense created: ${expense.title} - ${expense.amount}`);
    
    // Emit event for finance listeners
    eventBus.emit(EVENTS.EXPENSE_CREATED, {
      orgId: organization,
      expense
    });

    return expense;
  }

  async deleteExpense(id, organization) {
    const expense = await ExpenseRepository.findOne({ _id: id, organization });
    if (!expense) throw new Error('Expense not found');
    
    await expense.deleteOne();
    
    eventBus.emit(EVENTS.EXPENSE_DELETED, {
      orgId: organization,
      expenseId: id,
      amount: expense.amount
    });

    return true;
  }
}

module.exports = new ExpenseService();
