const asyncHandler = require('../utils/asyncHandler');
const habitService = require('../services/habitService');
const { clearContextCache } = require('../services/aiContextService');

const getHabits = asyncHandler(async (req, res) => {
  const data = await habitService.listHabits(req.user._id, req.query, req.user);
  res.json(data);
});

const createHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.createHabit(req.user._id, req.body || {}, req.user);
  clearContextCache(req.user._id);
  res.status(201).json({ habit });
});

const updateHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.updateHabit(
    req.params.id,
    req.user._id,
    req.body || {},
    req.user
  );
  clearContextCache(req.user._id);
  res.json({ habit });
});

const deleteHabit = asyncHandler(async (req, res) => {
  await habitService.deleteHabit(req.params.id, req.user._id, req.user);
  clearContextCache(req.user._id);
  res.json({ message: 'Habit deleted successfully.' });
});

const logHabit = asyncHandler(async (req, res) => {
  const { log, habit, date, rewards } = await habitService.logHabit(
    req.params.id,
    req.user._id,
    req.body || {},
    req.user
  );
  clearContextCache(req.user._id);

  res.json({
    log: {
      ...log.toObject(),
      date,
    },
    habit: {
      ...habit.toObject(),
      completedToday: log.completed,
      scheduledToday: habitService.isScheduledOn(habit, date),
    },
    rewards,
  });
});

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, logHabit };
