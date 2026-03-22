const router = require('express').Router();
const { getUsers, addUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const tenant = require('../middleware/tenant');
const checkLimit = require('../middleware/planLimits');
const validateZod = require('../middleware/validateZod');
const logActivity = require('../middleware/activityLogger');
const { userSchema } = require('../validators/user.schema');

router.use(auth);
router.use(tenant);

router.route('/')
  .get(role('admin', 'manager'), getUsers)
  .post(role('admin'), checkLimit('users'), validateZod(userSchema), logActivity('created', 'User'), addUser);

router.route('/:id')
  .delete(role('admin'), logActivity('deleted', 'User'), deleteUser);

module.exports = router;
