const router = require('express').Router();
const logActivity = require('../middleware/activityLogger');
const { getExpenses, createExpense, deleteExpense } = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const tenant = require('../middleware/tenant');
const validateZod = require('../middleware/validateZod');
const { expenseSchema } = require('../validators/expense.schema');

router.use(auth);
router.use(tenant);

router.route('/')
  .get(getExpenses)
  .post(role('admin', 'manager'), validateZod(expenseSchema), logActivity('created', 'Expense'), createExpense);

router.route('/:id')
  .delete(role('admin'), logActivity('deleted', 'Expense'), deleteExpense);

module.exports = router;
