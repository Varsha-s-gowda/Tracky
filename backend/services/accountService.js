const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const XPTransaction = require('../models/XPTransaction');
const DailyProductivity = require('../models/DailyProductivity');
const UserAchievement = require('../models/UserAchievement');
const UserSettings = require('../models/UserSettings');
const AIReport = require('../models/AIReport');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const {
  requiredString,
  optionalString,
  dateKey,
  timeString,
  oneOf,
  weekdays,
} = require('../utils/validation');
const { dateKeyToUTCDate } = require('../utils/date');

function serializeGoal(goal) {
  const value = goal.toObject ? goal.toObject() : goal;
  return {
    _id: value._id,
    title: value.title,
    description: value.description || '',
    targetDate: value.targetDate,
    status: value.status || 'active',
    createdAt: value.createdAt,
  };
}

function serializeUser(user) {
  const value = user.toJSON ? user.toJSON() : user;
  return {
    _id: value._id,
    name: value.name,
    email: value.email,
    profileImage: value.profileImage || '',
    timezone: value.timezone,
    goals: (value.goals || []).map(serializeGoal),
    workingHours: value.workingHours || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseTargetDate(value) {
  if (value === undefined || value === null || value === '') return null;
  return dateKeyToUTCDate(dateKey(value, 'Target date'));
}

function normalizeGoalPayload(body, { partial = false } = {}) {
  const updates = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('title')) {
    updates.title = requiredString(body.title, 'Goal title', { min: 2, max: 120 });
  }
  if (!partial || has('description')) {
    updates.description = optionalString(body.description, 'Goal description', { max: 500 });
  }
  if (!partial || has('targetDate')) {
    updates.targetDate = parseTargetDate(body.targetDate);
  }
  if (has('status')) {
    updates.status = oneOf(body.status, ['active', 'completed'], 'Goal status');
  } else if (!partial) {
    updates.status = 'active';
  }

  return updates;
}

async function getAccount(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');
  return serializeUser(user);
}

async function addGoal(userId, body = {}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const goal = normalizeGoalPayload(body);
  user.goals.push(goal);
  await user.save();

  const created = user.goals[user.goals.length - 1];
  return serializeGoal(created);
}

async function updateGoal(userId, goalId, body = {}) {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new ApiError(400, 'Invalid goal identifier.');
  }
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const goal = user.goals.id(goalId);
  if (!goal) throw new ApiError(404, 'Goal not found.');

  const updates = normalizeGoalPayload(body, { partial: true });
  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'No valid goal changes were provided.');
  }

  Object.assign(goal, updates);
  await user.save();
  return serializeGoal(goal);
}

async function deleteGoal(userId, goalId) {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new ApiError(400, 'Invalid goal identifier.');
  }
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const goal = user.goals.id(goalId);
  if (!goal) throw new ApiError(404, 'Goal not found.');

  goal.deleteOne();
  await user.save();
  return { deleted: true };
}

async function updateWorkingHours(userId, body = {}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const current = user.workingHours || { start: '09:00', end: '17:00', daysOfWeek: [1, 2, 3, 4, 5] };
  const start = timeString(body.start, 'Working start time') || current.start || '09:00';
  const end = timeString(body.end, 'Working end time') || current.end || '17:00';
  if (start >= end) {
    throw new ApiError(400, 'Working end time must be after the start time.');
  }

  const days =
    body.daysOfWeek === undefined
      ? current.daysOfWeek?.length
        ? current.daysOfWeek
        : [1, 2, 3, 4, 5]
      : weekdays(body.daysOfWeek, 'Working days');

  user.workingHours = { start, end, daysOfWeek: days };
  await user.save();
  return user.workingHours;
}

async function exportData(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const [
    settings,
    tasks,
    habits,
    habitLogs,
    xpTransactions,
    dailyProductivity,
    achievements,
    aiReports,
    chatConversations,
    chatMessages,
    notifications,
  ] = await Promise.all([
    UserSettings.findOne({ userId }).lean(),
    Task.find({ userId }).sort({ dueDate: 1 }).lean(),
    Habit.find({ userId }).sort({ createdAt: 1 }).lean(),
    HabitLog.find({ userId }).sort({ date: 1 }).lean(),
    XPTransaction.find({ userId }).sort({ createdAt: 1 }).lean(),
    DailyProductivity.find({ userId }).sort({ dateKey: 1 }).lean(),
    UserAchievement.find({ userId }).sort({ unlockedAt: 1 }).lean(),
    AIReport.find({ userId }).sort({ generatedAt: 1 }).lean(),
    ChatConversation.find({ userId }).sort({ lastMessageAt: 1 }).lean(),
    ChatMessage.find({ userId }).sort({ createdAt: 1 }).lean(),
    Notification.find({ userId, dismissedAt: null }).sort({ createdAt: 1 }).lean(),
  ]);

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user: serializeUser(user),
    settings,
    tasks,
    habits,
    habitLogs,
    xpTransactions,
    dailyProductivity,
    achievements,
    aiReports,
    chatConversations,
    chatMessages,
    notifications,
  };
}

async function deleteAccount(userId, body = {}) {
  if (typeof body.password !== 'string' || !body.password) {
    throw new ApiError(400, 'Password is required to delete your account.');
  }
  if (body.confirm !== 'DELETE') {
    throw new ApiError(400, 'Type DELETE to confirm account deletion.');
  }

  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found.');

  const matches = await user.comparePassword(body.password);
  if (!matches) {
    throw new ApiError(400, 'Your password is incorrect.');
  }

  await Promise.all([
    Task.deleteMany({ userId }),
    Habit.deleteMany({ userId }),
    HabitLog.deleteMany({ userId }),
    XPTransaction.deleteMany({ userId }),
    DailyProductivity.deleteMany({ userId }),
    UserAchievement.deleteMany({ userId }),
    UserSettings.deleteMany({ userId }),
    AIReport.deleteMany({ userId }),
    ChatConversation.deleteMany({ userId }),
    ChatMessage.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
  ]);

  await user.deleteOne();
  return { deleted: true };
}

module.exports = {
  getAccount,
  addGoal,
  updateGoal,
  deleteGoal,
  updateWorkingHours,
  exportData,
  deleteAccount,
  serializeGoal,
  serializeUser,
};
