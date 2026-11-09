const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');

const getDaily = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDailyAnalytics(req.user, req.query);
  res.json(data);
});

const getWeekly = asyncHandler(async (req, res) => {
  const data = await analyticsService.getWeeklyAnalytics(req.user, req.query);
  res.json(data);
});

const getMonthly = asyncHandler(async (req, res) => {
  const data = await analyticsService.getMonthlyAnalytics(req.user, req.query);
  res.json(data);
});

const getHeatmap = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHeatmap(req.user, req.query);
  res.json(data);
});

module.exports = { getDaily, getWeekly, getMonthly, getHeatmap };
