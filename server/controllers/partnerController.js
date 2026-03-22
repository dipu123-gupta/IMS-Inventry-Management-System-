const Organization = require('../models/Organization');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get platform-wide statistics (Super Admin only)
// @route   GET /api/partner/stats
exports.getPartnerStats = async (req, res, next) => {
  try {
    // Basic stats
    const [orgCount, userCount, totalRevenueResult] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { type: 'sale', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Monthly growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await Organization.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        organizations: orgCount,
        users: userCount,
        revenue: totalRevenue
      },
      growth: monthlyGrowth
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all organizations
// @route   GET /api/partner/organizations
exports.getAllOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orgs.length, organizations: orgs });
  } catch (error) {
    next(error);
  }
};
