const FinanceService = require('../src/services/FinanceService');

// @desc    Get financial summary (Revenue, Expense, Profit)
// @route   GET /api/finance/summary
exports.getFinanceSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await FinanceService.getSummary(req.organization, { startDate, endDate });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly profit/loss data for charts
// @route   GET /api/finance/chart
exports.getFinanceChart = async (req, res, next) => {
  try {
    const chartData = await FinanceService.getChartData(req.organization);
    res.json({ success: true, chartData });
  } catch (error) {
    next(error);
  }
};
