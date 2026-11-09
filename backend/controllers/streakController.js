const asyncHandler = require('../utils/asyncHandler');
const streakService = require('../services/streakService');

const getOverview = asyncHandler(async (req, res) => {
  const data = await streakService.getStreakOverview(req.user, req.query);
  res.json(data);
});

const getHabitStreak = asyncHandler(async (req, res) => {
  const data = await streakService.getHabitStreakDetail(req.user, req.params.habitId, req.query);
  res.json(data);
});

module.exports = { getOverview, getHabitStreak };
