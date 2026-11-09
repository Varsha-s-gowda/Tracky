const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const ApiError = require('../utils/ApiError');
const {
  requiredString,
  optionalString,
  oneOf,
  dateKey,
  booleanValue,
  numberInRange,
  weekdays,
} = require('../utils/validation');
const { dateKeyToUTCDate, todayKey, weekdayFromKey } = require('../utils/date');
const rewardsService = require('./rewardsService');
const productivityService = require('./productivityService');

const FREQUENCIES = ['daily', 'weekly'];

function normalizeTarget(value) {
  const target = value && typeof value === 'object' ? value : {};

  return {
    value: numberInRange(target.value, 'Target', { min: 0.1, max: 100000 }),
    unit: optionalString(target.unit, 'Target unit', { max: 30 }) || 'times',
  };
}

function normalizeFrequency(frequency, days) {
  if (frequency === 'daily') return [];
  if (frequency === 'weekly') return weekdays(days);
  throw new ApiError(400, 'Frequency must be either daily or weekly.');
}

function normalizeCreatePayload(body) {
  const frequency = oneOf(body.frequency, FREQUENCIES, 'Frequency', 'daily');

  return {
    name: requiredString(body.name, 'Habit name', { min: 1, max: 100 }),
    description: optionalString(body.description, 'Description', { max: 1000 }),
    category: optionalString(body.category, 'Category', { max: 50 }) || 'Personal',
    frequency,
    daysOfWeek: normalizeFrequency(frequency, body.daysOfWeek),
    target: normalizeTarget(body.target),
    isActive: booleanValue(body.isActive, 'Active status', true),
  };
}

function normalizeUpdatePayload(body, habit) {
  const updates = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (has('name')) {
    updates.name = requiredString(body.name, 'Habit name', { min: 1, max: 100 });
  }
  if (has('description')) {
    updates.description = optionalString(body.description, 'Description', { max: 1000 });
  }
  if (has('category')) {
    updates.category = optionalString(body.category, 'Category', { max: 50 }) || 'Personal';
  }
  if (has('frequency')) {
    updates.frequency = oneOf(body.frequency, FREQUENCIES, 'Frequency');
  }
  if (has('daysOfWeek') || has('frequency')) {
    const frequency = updates.frequency || habit.frequency;
    const days = has('daysOfWeek') ? body.daysOfWeek : habit.daysOfWeek;
    updates.daysOfWeek = normalizeFrequency(frequency, days);
  }
  if (has('target')) {
    updates.target = normalizeTarget(body.target);
  }
  if (has('isActive')) {
    updates.isActive = booleanValue(body.isActive, 'Active status');
  }

  return updates;
}

function isScheduledOn(habit, dateKeyValue) {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    return habit.daysOfWeek.includes(weekdayFromKey(dateKeyValue));
  }
  return false;
}

async function getHabitsForDate(userId, dateKeyValue, { includeInactive = false } = {}) {
  const filter = { userId };
  if (!includeInactive) filter.isActive = true;

  const [habits, logs] = await Promise.all([
    Habit.find(filter).sort({ createdAt: -1 }).lean(),
    HabitLog.find({
      userId,
      date: dateKeyToUTCDate(dateKeyValue),
      completed: true,
    })
      .select('habitId completed')
      .lean(),
  ]);

  const completedIds = new Set(logs.map((log) => log.habitId.toString()));

  return habits.map((habit) => ({
    ...habit,
    scheduledToday: isScheduledOn(habit, dateKeyValue),
    completedToday: completedIds.has(habit._id.toString()),
  }));
}

async function listHabits(userId, query, user) {
  const date = query.date
    ? dateKey(query.date, 'Date')
    : todayKey(user.timezone);
  const includeInactive = query.includeInactive === 'true';
  const habits = await getHabitsForDate(userId, date, { includeInactive });

  return { date, habits };
}

async function getOwnedHabit(habitId, userId) {
  if (!mongoose.isValidObjectId(habitId)) {
    throw new ApiError(400, 'Invalid habit identifier.');
  }

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found.');
  }

  return habit;
}

async function createHabit(userId, body, user) {
  const payload = normalizeCreatePayload(body);
  const habit = await Habit.create({ userId, ...payload });
  if (user) {
    await productivityService.recomputeDay(user, todayKey(user.timezone));
  }
  return habit;
}

async function updateHabit(habitId, userId, body, user) {
  const habit = await getOwnedHabit(habitId, userId);
  const updates = normalizeUpdatePayload(body, habit);
  Object.assign(habit, updates);
  await habit.save();
  if (user) {
    await productivityService.recomputeDay(user, todayKey(user.timezone));
  }
  return habit;
}

async function deleteHabit(habitId, userId, user) {
  const habit = await getOwnedHabit(habitId, userId);
  await Promise.all([
    habit.deleteOne(),
    HabitLog.deleteMany({ userId, habitId: habit._id }),
  ]);
  if (user) {
    await productivityService.recomputeDay(user, todayKey(user.timezone));
  }
  return habit;
}

async function logHabit(habitId, userId, body, user) {
  const habit = await getOwnedHabit(habitId, userId);
  const date = body.date ? dateKey(body.date, 'Date') : todayKey(user.timezone);
  const completed = booleanValue(body.completed, 'Completed', true);
  const dateValue = dateKeyToUTCDate(date);

  const update = {
    completed,
    completedAt: completed ? new Date() : null,
  };

  const filter = { userId, habitId: habit._id, date: dateValue };

  try {
    const log = await HabitLog.findOneAndUpdate(
      filter,
      { $set: update, $setOnInsert: { userId, habitId: habit._id, date: dateValue } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const rewards = await rewardsService.handleHabitLog(user, habit, date, completed);
    return { log, habit, date, rewards };
  } catch (error) {
    // Two concurrent requests can both attempt the upsert. The unique index
    // guarantees one record, so retry as a normal update for the loser.
    if (error.code === 11000) {
      const log = await HabitLog.findOneAndUpdate(filter, { $set: update }, { new: true });
      const rewards = await rewardsService.handleHabitLog(user, habit, date, completed);
      return { log, habit, date, rewards };
    }
    throw error;
  }
}

module.exports = {
  listHabits,
  getHabitsForDate,
  getOwnedHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabit,
  isScheduledOn,
};
