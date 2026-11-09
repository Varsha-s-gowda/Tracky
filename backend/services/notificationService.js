const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const AIReport = require('../models/AIReport');
const DailyProductivity = require('../models/DailyProductivity');
const ApiError = require('../utils/ApiError');
const {
  addDaysToKey,
  dateKeyToUTCDate,
  startOfWeekKey,
  todayKey,
} = require('../utils/date');
const { getSettings } = require('./settingsService');
const { getInsights } = require('./insightService');
const { computeDay } = require('./productivityService');
const reportService = require('./reportService');

const PREFERENCE_BY_TYPE = {
  task_reminder: 'taskReminders',
  pending_priority: 'taskReminders',
  habit_reminder: 'habitReminders',
  streak_milestone: 'streakMilestones',
  achievement: 'achievementAlerts',
  daily_goal: 'dailyGoal',
  daily_report: 'dailyReports',
  weekly_report: 'weeklyReports',
  system: null,
};

function isEnabled(type, settings) {
  const key = PREFERENCE_BY_TYPE[type];
  if (!key) return true;
  return settings.notifications?.[key] !== false;
}

function plainNotification(document) {
  const value = document.toObject ? document.toObject() : document;
  return {
    _id: value._id,
    type: value.type,
    title: value.title,
    body: value.body,
    link: value.link,
    readAt: value.readAt,
    createdAt: value.createdAt,
  };
}

async function createNotification(userId, payload, { settings } = {}) {
  const resolvedSettings = settings || (await getSettings(userId));
  if (!isEnabled(payload.type, resolvedSettings)) return null;

  try {
    const notification = await Notification.create({
      userId,
      type: payload.type,
      title: String(payload.title || '').slice(0, 160),
      body: String(payload.body || '').slice(0, 500),
      link: String(payload.link || '').slice(0, 300),
      dedupeKey: String(payload.dedupeKey || '').slice(0, 200),
    });
    return plainNotification(notification);
  } catch (error) {
    // The unique dedupe index makes reminder generation idempotent.
    if (error.code === 11000) return null;
    throw error;
  }
}

async function createAchievementNotifications(user, newlyUnlocked) {
  if (!newlyUnlocked?.length) return [];
  const settings = await getSettings(user._id);
  const created = [];
  for (const achievement of newlyUnlocked) {
    const notification = await createNotification(
      user._id,
      {
        type: 'achievement',
        title: 'Achievement unlocked',
        body: `${achievement.name} — ${achievement.description || 'A new milestone is yours.'}`,
        link: '/achievements',
        dedupeKey: `achievement:${achievement.key}`,
      },
      { settings }
    );
    if (notification) created.push(notification);
  }
  return created;
}

async function syncNotifications(user) {
  const settings = await getSettings(user._id);
  const today = todayKey(user.timezone);
  const yesterday = addDaysToKey(today, -1);
  const currentWeekStart = startOfWeekKey(today, 1);
  const previousWeekStart = addDaysToKey(currentWeekStart, -7);
  const previousWeekEnd = addDaysToKey(previousWeekStart, 6);

  const [insights, day] = await Promise.all([getInsights(user), computeDay(user, today)]);
  const tasks = [];

  for (const task of insights.pendingHighPriority.slice(0, 5)) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: task.dueDate && task.dueDate < today ? 'pending_priority' : 'task_reminder',
          title: task.dueDate && task.dueDate < today ? 'Overdue high-priority task' : 'High-priority task pending',
          body: `${task.title}${task.dueDate ? ` · due ${task.dueDate}` : ''}`,
          link: '/tasks',
          dedupeKey: `task:${task.id}:${today}`,
        },
        { settings }
      )
    );
  }

  const pendingHabits = (insights.nextActions?.pendingHabits || []).slice(0, 5);
  for (const habit of pendingHabits) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: 'habit_reminder',
          title: 'Habit still open today',
          body: `You have not checked off "${habit.name}" yet.`,
          link: '/habits',
          dedupeKey: `habit:${habit.habitId}:${today}`,
        },
        { settings }
      )
    );
  }

  for (const milestone of (insights.upcomingMilestones || []).filter((item) => item.daysTo <= 2).slice(0, 4)) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: 'streak_milestone',
          title: `${milestone.daysTo} day${milestone.daysTo === 1 ? '' : 's'} from a ${milestone.milestone}-day streak`,
          body:
            milestone.type === 'habit'
              ? `Keep "${milestone.name}" going to reach ${milestone.milestone} days.`
              : `Your overall consistency streak is ${milestone.currentStreak} days. Reach ${milestone.milestone} next.`,
          link: '/streaks',
          dedupeKey: `streak:${milestone.type}:${milestone.habitId || 'overall'}:${milestone.milestone}`,
        },
        { settings }
      )
    );
  }

  if (day.hasActivity) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: 'daily_goal',
          title: day.successful ? 'Daily goal reached' : 'Keep your streak alive',
          body: day.successful
            ? `You reached ${day.score}/100 today. Anything else is a bonus.`
            : `You are at ${day.score}/100 against a target of ${day.target}. One focused task could close the gap.`,
          link: '/dashboard',
          dedupeKey: `daily_goal:${today}`,
        },
        { settings }
      )
    );
  }

  // Persist yesterday's real-data report once the day has activity, so the
  // report history remains useful even if the user never opens the coach page.
  const [yesterdayActive, previousWeekActive] = await Promise.all([
    DailyProductivity.exists({ userId: user._id, dateKey: yesterday, hasActivity: true }),
    DailyProductivity.exists({
      userId: user._id,
      dateKey: { $gte: previousWeekStart, $lte: previousWeekEnd },
      hasActivity: true,
    }),
  ]);

  if (yesterdayActive) {
    try {
      await reportService.ensureDailyReport(user, yesterday);
    } catch (error) {
      console.error('Daily report sync failed:', error.message);
    }
  }
  if (previousWeekActive) {
    try {
      await reportService.ensureWeeklyReport(user);
    } catch (error) {
      console.error('Weekly report sync failed:', error.message);
    }
  }

  const [yesterdayReport, weeklyReport] = await Promise.all([
    AIReport.exists({ userId: user._id, type: 'daily', periodKey: yesterday }),
    AIReport.exists({ userId: user._id, type: 'weekly', periodKey: previousWeekStart }),
  ]);

  if (yesterdayReport) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: 'daily_report',
          title: 'Daily report ready',
          body: `Your summary for ${yesterday} is ready to view.`,
          link: '/coach?tab=reports',
          dedupeKey: `daily_report:${yesterday}`,
        },
        { settings }
      )
    );
  }
  if (weeklyReport) {
    tasks.push(
      createNotification(
        user._id,
        {
          type: 'weekly_report',
          title: 'Weekly report ready',
          body: 'Your latest weekly report is ready with next-week focus areas.',
          link: '/coach?tab=reports',
          dedupeKey: `weekly_report:${previousWeekStart}`,
        },
        { settings }
      )
    );
  }

  await Promise.allSettled(tasks);

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({
    userId: user._id,
    $or: [{ readAt: { $lt: cutoff } }, { dismissedAt: { $lt: cutoff } }],
  }).catch(() => {});

  return { today };
}

async function listNotifications(user, query = {}) {
  await syncNotifications(user).catch((error) => {
    console.error('Notification sync failed:', error.message);
  });

  const unreadOnly = query.unread === 'true';
  const filter = { userId: user._id, dismissedAt: null };
  if (unreadOnly) filter.readAt = null;
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId: user._id, dismissedAt: null, readAt: null }),
    Notification.countDocuments({ userId: user._id, dismissedAt: null }),
  ]);

  return {
    notifications: notifications.map(plainNotification),
    unreadCount,
    total,
    hasMore: total > limit,
  };
}

async function getUnreadCount(user) {
  return Notification.countDocuments({ userId: user._id, dismissedAt: null, readAt: null });
}

async function markRead(user, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, 'Invalid notification identifier.');
  }
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: user._id, dismissedAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found.');
  return plainNotification(notification);
}

async function markAllRead(user) {
  const result = await Notification.updateMany(
    { userId: user._id, dismissedAt: null, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { updated: result.modifiedCount || 0 };
}

async function deleteNotification(user, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, 'Invalid notification identifier.');
  }
  const now = new Date();
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: user._id, dismissedAt: null },
    { $set: { dismissedAt: now, readAt: now } }
  );
  if (!notification) throw new ApiError(404, 'Notification not found.');
  return { deleted: true };
}

async function clearAll(user) {
  const now = new Date();
  const result = await Notification.updateMany(
    { userId: user._id, dismissedAt: null },
    { $set: { dismissedAt: now, readAt: now } }
  );
  return { deleted: result.modifiedCount || 0 };
}

module.exports = {
  createNotification,
  createAchievementNotifications,
  syncNotifications,
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
  isEnabled,
  PREFERENCE_BY_TYPE,
  plainNotification,
};
