const asyncHandler = require('../utils/asyncHandler');
const { getDashboard } = require('../services/dashboardService');

const getToday = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user);
  res.json(data);
});

module.exports = { getToday };
