const asyncHandler = require('../utils/asyncHandler');
const xpService = require('../services/xpService');

const getXp = asyncHandler(async (req, res) => {
  const data = await xpService.getXpSummary(req.user, { limit: req.query.limit });
  res.json(data);
});

module.exports = { getXp };
