const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    priceId: null,
    price: 0,
    limits: {
      maxProducts: 20,
      maxWarehouses: 5,
      maxUsers: 20,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 29,
    limits: {
      maxProducts: 500,
      maxWarehouses: 5,
      maxUsers: 10,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    price: 99,
    limits: {
      maxProducts: 10000,
      maxWarehouses: 50,
      maxUsers: 100,
    },
  },
};

module.exports = PLANS;
