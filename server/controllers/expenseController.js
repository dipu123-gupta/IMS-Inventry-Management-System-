const ExpenseService = require('../src/services/ExpenseService');

// @desc    Get all expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const expenses = await ExpenseService.getExpenses(req.organization);
    res.json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create expense
// @route   POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    const expense = await ExpenseService.createExpense(req.body, req.organization, req.user);
    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    await ExpenseService.deleteExpense(req.params.id, req.organization);
    res.json({ success: true, message: 'Expense removed' });
  } catch (error) {
    next(error);
  }
};
