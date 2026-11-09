const asyncHandler = require('../utils/asyncHandler');
const achievementService = require('../services/achievementService');

const getAchievements = asyncHandler(async (req, res) => {
  const data = await achievementService.evaluateAchievements(req.user);
  res.json(data);
});

module.exports = { getAchievements };
