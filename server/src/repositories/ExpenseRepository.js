const BaseRepository = require('./BaseRepository');
const Expense = require('../../models/Expense');

class ExpenseRepository extends BaseRepository {
  constructor() {
    super(Expense);
  }
}

module.exports = new ExpenseRepository();
