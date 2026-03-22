const Organization = require('../models/Organization');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const User = require('../models/User');
const PLANS = require('../config/plans');

// @desc    Create Stripe Checkout Session
// @route   POST /api/subscriptions/checkout
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { priceId } = req.body;
    const organization = await Organization.findById(req.organization).populate('owner');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Find plan by priceId
    const plan = Object.values(PLANS).find(p => p.priceId === priceId);
    if (!plan && priceId !== 'free') {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // If switching to free plan (cancel subscription)
    if (priceId === 'free') {
      if (organization.subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(organization.subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        return res.json({ message: 'Subscription will be canceled at the end of the period' });
      }
      return res.status(400).json({ message: 'No active subscription to cancel' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: organization.subscription.stripeCustomerId || undefined,
      customer_email: organization.subscription.stripeCustomerId ? undefined : organization.owner.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        organizationId: organization._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Stripe Portal Session
// @route   POST /api/subscriptions/portal
exports.createPortalSession = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.organization);

    if (!organization || !organization.subscription.stripeCustomerId) {
      return res.status(400).json({ message: 'No billing record found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current subscription status
// @route   GET /api/subscriptions/status
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.organization);
    const planInfo = PLANS[organization.subscription.plan.toUpperCase()];

    // Get actual usage
    const productCount = await Product.countDocuments({ organization: req.organization });
    const warehouseCount = await Warehouse.countDocuments({ organization: req.organization });
    const userCount = await User.countDocuments({ organization: req.organization });

    res.json({
      plan: organization.subscription.plan,
      status: organization.subscription.status,
      currentPeriodEnd: organization.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: organization.subscription.cancelAtPeriodEnd,
      limits: planInfo.limits,
      name: planInfo.name,
      usage: {
        products: productCount,
        warehouses: warehouseCount,
        users: userCount,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/subscriptions/webhook
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object;
      if (checkoutSession.mode === 'subscription') {
        const organizationId = checkoutSession.metadata.organizationId;
        const subscriptionId = checkoutSession.subscription;
        const customerId = checkoutSession.customer;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const plan = Object.values(PLANS).find(p => p.priceId === priceId)?.id || 'free';

        await Organization.findByIdAndUpdate(organizationId, {
          'subscription.stripeCustomerId': customerId,
          'subscription.stripeSubscriptionId': subscriptionId,
          'subscription.stripePriceId': priceId,
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        });
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await Organization.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': invoice.subscription },
          {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          }
        );
      }
      break;

    case 'customer.subscription.updated':
      const updatedSub = event.data.object;
      const updatedPriceId = updatedSub.items.data[0].price.id;
      const updatedPlan = Object.values(PLANS).find(p => p.priceId === updatedPriceId)?.id || 'free';

      await Organization.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': updatedSub.id },
        {
          'subscription.plan': updatedPlan,
          'subscription.status': updatedSub.status,
          'subscription.currentPeriodEnd': new Date(updatedSub.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': updatedSub.cancel_at_period_end,
        }
      );
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await Organization.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': deletedSub.id },
        {
          'subscription.plan': 'free',
          'subscription.status': 'canceled',
        }
      );
      break;
  }

  res.json({ received: true });
};
