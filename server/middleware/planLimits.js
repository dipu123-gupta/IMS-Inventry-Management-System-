const PLANS = require('../config/plans');
const ProductRepository = require('../src/repositories/ProductRepository');
const WarehouseRepository = require('../src/repositories/WarehouseRepository');
const UserRepository = require('../src/repositories/UserRepository');

const checkLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const orgPlan = (req.user.organization?.subscription?.plan || 'FREE').toUpperCase();
      const planLimits = PLANS[orgPlan]?.limits;
      
      if (!planLimits) {
         return next(); // Or handle as error if needed, but 'FREE' should exist
      }

      let currentCount = 0;
      let limit = 0;
      let message = '';

      switch (resource) {
        case 'products':
          currentCount = await ProductRepository.countDocuments({ organization: req.organization });
          limit = planLimits.maxProducts;
          message = `You have reached the limit of ${limit} products for the ${PLANS[orgPlan].name} plan.`;
          break;
        case 'warehouses':
          currentCount = await WarehouseRepository.countDocuments({ organization: req.organization });
          limit = planLimits.maxWarehouses;
          message = `You have reached the limit of ${limit} warehouses for the ${PLANS[orgPlan].name} plan.`;
          break;
        case 'users':
          currentCount = await UserRepository.countDocuments({ organization: req.organization });
          limit = planLimits.maxUsers;
          message = `You have reached the limit of ${limit} users for the ${PLANS[orgPlan].name} plan.`;
          break;
        default:
          return next();
      }

      if (currentCount >= limit) {
        return res.status(403).json({
          message,
          code: 'LIMIT_EXCEEDED',
          limit,
          current: currentCount
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkLimit;
