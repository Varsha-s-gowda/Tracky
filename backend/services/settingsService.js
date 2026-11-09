const UserSettings = require('../models/UserSettings');
const ApiError = require('../utils/ApiError');
const { booleanValue, numberInRange, timeString, oneOf } = require('../utils/validation');

const DEFAULT_SETTINGS = {
  dailyCompletionTarget: 60,
  weeklyGoals: {
    tasks: 20,
    habits: 25,
    productivityScore: 75,
  },
  notifications: {
    xpAlerts: true,
    achievementAlerts: true,
    weeklySummary: true,
    dailyReminder: false,
    reminderTime: '09:00',
    taskReminders: true,
    habitReminders: true,
    streakMilestones: true,
    dailyGoal: true,
    dailyReports: true,
    weeklyReports: true,
    browserNotifications: false,
  },
  coachTone: 'supportive',
  coachDetail: 'concise',
};

function plainSettings(document) {
  const value = document.toObject ? document.toObject() : document;
  return {
    _id: value._id,
    userId: value.userId,
    dailyCompletionTarget: value.dailyCompletionTarget ?? DEFAULT_SETTINGS.dailyCompletionTarget,
    weeklyGoals: {
      ...DEFAULT_SETTINGS.weeklyGoals,
      ...(value.weeklyGoals || {}),
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(value.notifications || {}),
    },
    coachTone: value.coachTone || DEFAULT_SETTINGS.coachTone,
    coachDetail: value.coachDetail || DEFAULT_SETTINGS.coachDetail,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function getSettings(userId) {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return plainSettings(settings);
}

function normalizeWeeklyGoals(value, current) {
  const input = value && typeof value === 'object' ? value : {};
  const base = current || DEFAULT_SETTINGS.weeklyGoals;

  return {
    tasks: Object.prototype.hasOwnProperty.call(input, 'tasks')
      ? numberInRange(input.tasks, 'Weekly task goal', { min: 0, max: 1000 })
      : base.tasks,
    habits: Object.prototype.hasOwnProperty.call(input, 'habits')
      ? numberInRange(input.habits, 'Weekly habit goal', { min: 0, max: 1000 })
      : base.habits,
    productivityScore: Object.prototype.hasOwnProperty.call(input, 'productivityScore')
      ? numberInRange(input.productivityScore, 'Weekly productivity goal', { min: 1, max: 100 })
      : base.productivityScore,
  };
}

function normalizeNotifications(value, current) {
  const input = value && typeof value === 'object' ? value : {};
  const base = { ...DEFAULT_SETTINGS.notifications, ...(current || {}) };
  const updates = {};

  for (const key of [
    'xpAlerts',
    'achievementAlerts',
    'weeklySummary',
    'dailyReminder',
    'taskReminders',
    'habitReminders',
    'streakMilestones',
    'dailyGoal',
    'dailyReports',
    'weeklyReports',
    'browserNotifications',
  ]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      updates[key] = booleanValue(input[key], key);
    }
  }
  if (Object.prototype.hasOwnProperty.call(input, 'reminderTime')) {
    updates.reminderTime = timeString(input.reminderTime, 'Reminder time') || '09:00';
  }

  return { ...base, ...updates };
}

async function updateSettings(userId, body = {}) {
  const settings = await getSettings(userId);
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'dailyCompletionTarget')) {
    updates.dailyCompletionTarget = numberInRange(
      body.dailyCompletionTarget,
      'Daily completion target',
      { min: 1, max: 100 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(body, 'weeklyGoals')) {
    updates.weeklyGoals = normalizeWeeklyGoals(body.weeklyGoals, settings.weeklyGoals);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'notifications')) {
    updates.notifications = normalizeNotifications(body.notifications, settings.notifications);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'coachTone')) {
    updates.coachTone = oneOf(
      body.coachTone,
      ['supportive', 'direct', 'analytical'],
      'Coach tone'
    );
  }

  if (Object.prototype.hasOwnProperty.call(body, 'coachDetail')) {
    updates.coachDetail = oneOf(body.coachDetail, ['concise', 'detailed'], 'Coach detail level');
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'No valid settings were provided.');
  }

  const updated = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return plainSettings(updated);
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
};
