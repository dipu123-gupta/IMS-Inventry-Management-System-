const router = require('express').Router();
const { getPartnerStats, getAllOrganizations } = require('../controllers/partnerController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.use(auth);
router.use(role('partner')); // Only super-admins/partners

router.get('/stats', getPartnerStats);
router.get('/organizations', getAllOrganizations);

module.exports = router;
