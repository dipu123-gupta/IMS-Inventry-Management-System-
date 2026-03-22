const FinanceRepository = require('../repositories/FinanceRepository');
const mongoose = require('mongoose');

class FinanceService {
  async getSummary(organization, { startDate, endDate }) {
    const match = { organization: new mongoose.Types.ObjectId(organization) };
    if (startDate && endDate) {
      match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // We use the 'Finance' collection as the source of truth (Ledger)
    const ledgerStats = await FinanceRepository.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const stats = { revenue: 0, expense: 0 };
    ledgerStats.forEach(s => { stats[s._id] = s.total; });

    // COGS is specifically from Bills (Purchase Orders converted to Bills)
    const cogsResult = await FinanceRepository.model.aggregate([
      { $match: { ...match, category: 'Cost of Goods' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const cogs = cogsResult[0]?.total || 0;

    return {
      totalRevenue: stats.revenue || 0,
      totalExpenses: stats.expense || 0,
      cogs,
      grossProfit: (stats.revenue || 0) - cogs,
      netProfit: (stats.revenue || 0) - (stats.expense || 0)
    };
  }

  async getChartData(organization) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const match = { 
      organization: new mongoose.Types.ObjectId(organization),
      date: { $gte: sixMonthsAgo }
    };

    const monthlyData = await FinanceRepository.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%b %Y', date: '$date' } },
            type: '$type'
          },
          total: { $sum: '$amount' },
          date: { $first: '$date' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    const months = {};
    // Pre-fill last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
      months[key] = { month: key.split(' ')[0], revenue: 0, expenses: 0, profit: 0 };
    }

    monthlyData.forEach(item => {
      const key = item._id.month;
      if (months[key]) {
        if (item._id.type === 'revenue') months[key].revenue = item.total;
        if (item._id.type === 'expense') months[key].expenses = item.total;
      }
    });

    return Object.values(months).map(m => ({
      ...m,
      profit: m.revenue - m.expenses
    }));
  }
}

module.exports = new FinanceService();
