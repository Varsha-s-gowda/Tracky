const Task = require('../models/Task');
const UserAchievement = require('../models/UserAchievement');
const Achievement = require('../models/Achievement');
const {
  addDaysToKey,
  dateKeyToUTCDate,
  startOfWeekKey,
  todayKey,
  weekdayFromKey,
} = require('../utils/date');
const { computeRange } = require('./productivityService');
const { getHabitStreaks, getOverallStreak } = require('./streakService');
const { getSettings } = require('./settingsService');
const { getXpSnapshot } = require('./xpService');

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function plainTask(task) {
  return {
    id: String(task._id),
    title: task.title,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : null,
    status: task.status,
    recurrence: task.recurrence,
    postponeCount: task.postponeCount || 0,
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function averageScore(days) {
  const active = days.filter((day) => day.hasActivity);
  if (!active.length) return 0;
  return Math.round(sum(active.map((day) => day.score)) / active.length);
}

function weekdayBreakdown(days) {
  const buckets = Array.from({ length: 7 }, () => ({ total: 0, activeDays: 0 }));
  for (const day of days) {
    if (!day.hasActivity) continue;
    const index = weekdayFromKey(day.dateKey);
    buckets[index].total += day.score;
    buckets[index].activeDays += 1;
  }
  return buckets.map((bucket, index) => ({
    weekday: index,
    name: WEEKDAY_NAMES[index],
    activeDays: bucket.activeDays,
    averageScore: bucket.activeDays ? Math.round(bucket.total / bucket.activeDays) : 0,
  }));
}

function metricSummary(days) {
  const active = days.filter((day) => day.hasActivity);
  return {
    activeDays: active.length,
    successfulDays: days.filter((day) => day.successful).length,
    averageScore: averageScore(days),
    tasksTotal: sum(days.map((day) => day.tasksTotal)),
    tasksCompleted: sum(days.map((day) => day.tasksCompleted)),
    tasksPending: sum(days.map((day) => day.tasksPending)),
    highPriorityTotal: sum(days.map((day) => day.highPriorityTotal)),
    highPriorityCompleted: sum(days.map((day) => day.highPriorityCompleted)),
    habitsScheduled: sum(days.map((day) => day.habitsScheduled)),
    habitsCompleted: sum(days.map((day) => day.habitsCompleted)),
    bestDay: active.length
      ? active.reduce((best, day) => (day.score > best.score ? day : best), active[0])
      : null,
    worstDay: active.length
      ? active.reduce((worst, day) => (day.score < worst.score ? day : worst), active[0])
      : null,
  };
}

function buildPromptText(context) {
  const habits = context.habits.map((habit) => ({
    name: habit.name,
    frequency: habit.frequency,
    daysOfWeek: habit.daysOfWeek,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    completionRate: habit.completionRate,
    missedDays: habit.missedDays,
    scheduledToday: habit.scheduledToday,
    completedToday: habit.completedToday,
  }));

  return JSON.stringify(
    {
      today: context.today,
      timezone: context.timezone,
      user: context.user,
      settings: context.settings,
      xp: context.xp,
      overallStreak: context.overallStreak,
      productivity: context.productivity,
      tasks: context.tasks,
      habits,
      achievements: context.achievements,
      weekdays: context.weekdays,
    },
    null,
    2
  ).slice(0, 14000);
}

async function buildContext(user) {
  const today = todayKey(user.timezone);
  const start30 = addDaysToKey(today, -29);
  const tomorrow = addDaysToKey(today, 1);
  const yesterday = addDaysToKey(today, -1);
  const currentWeekStart = startOfWeekKey(today, 1);
  const previousWeekStart = addDaysToKey(currentWeekStart, -7);
  const previousWeekEnd = addDaysToKey(previousWeekStart, 6);

  const [
    settings,
    tasksLast30,
    pendingHighPriority,
    overdue,
    postponed,
    habitData,
    days30,
    currentWeekDays,
    previousWeekDays,
    xp,
    unlockedRows,
    definitions,
  ] = await Promise.all([
    getSettings(user._id),
    Task.find({
      userId: user._id,
      dueDate: { $gte: dateKeyToUTCDate(start30), $lt: dateKeyToUTCDate(tomorrow) },
    })
      .select('title priority category dueDate status recurrence postponeCount')
      .sort({ dueDate: -1 })
      .limit(1200)
      .lean(),
    Task.find({
      userId: user._id,
      status: 'pending',
      priority: 'high',
      dueDate: { $lt: dateKeyToUTCDate(tomorrow) },
    })
      .select('title priority category dueDate status postponeCount')
      .sort({ dueDate: 1 })
      .limit(10)
      .lean(),
    Task.find({
      userId: user._id,
      status: 'pending',
      dueDate: { $lt: dateKeyToUTCDate(today) },
    })
      .select('title priority category dueDate status postponeCount')
      .sort({ dueDate: 1 })
      .limit(10)
      .lean(),
    Task.find({ userId: user._id, postponeCount: { $gt: 0 } })
      .select('title priority category dueDate status postponeCount')
      .sort({ postponeCount: -1 })
      .limit(5)
      .lean(),
    getHabitStreaks(user),
    computeRange(user, start30, today, { persist: false }),
    computeRange(user, currentWeekStart, today, { persist: false }),
    computeRange(user, previousWeekStart, previousWeekEnd, { persist: false }),
    getXpSnapshot(user),
    UserAchievement.find({ userId: user._id })
      .select('achievementKey unlockedAt')
      .sort({ unlockedAt: -1 })
      .lean(),
    Achievement.find({ isActive: true }).select('key name description').lean(),
  ]);

  const overallStreak = await getOverallStreak(user, settings);
  const definitionByKey = new Map(definitions.map((definition) => [definition.key, definition]));
  const metrics30 = metricSummary(days30);
  const currentMetrics = metricSummary(currentWeekDays);
  const previousMetrics = metricSummary(previousWeekDays);

  const missedTasks = tasksLast30.filter(
    (task) => task.status === 'pending' && new Date(task.dueDate) < dateKeyToUTCDate(today)
  );

  const habits = habitData.streaks.map((habit) => ({
    habitId: String(habit.habitId),
    name: habit.name,
    category: habit.category,
    frequency: habit.frequency,
    daysOfWeek: habit.daysOfWeek || [],
    target: habit.target,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    completionRate: habit.completionRate,
    totalCompletedDays: habit.totalCompletedDays,
    totalScheduledDays: habit.totalScheduledDays,
    missedDays: habit.missedDays,
    lastCompletedDate: habit.lastCompletedDate,
    scheduledToday: habit.scheduledToday,
    completedToday: habit.completedToday,
    todayPending: habit.todayPending,
  }));

  const frequentlyMissedHabits = [...habits]
    .filter((habit) => habit.totalScheduledDays >= 3)
    .sort(
      (a, b) =>
        b.missedDays - a.missedDays ||
        a.completionRate - b.completionRate ||
        a.currentStreak - b.currentStreak
    )
    .slice(0, 3);

  const weekdays = weekdayBreakdown(days30);

  return {
    generatedAt: new Date().toISOString(),
    today,
    yesterday,
    timezone: user.timezone,
    user: {
      name: user.name,
      timezone: user.timezone,
      workingHours: user.workingHours || null,
      goals: (user.goals || [])
        .filter((goal) => goal.status !== 'completed')
        .slice(0, 10)
        .map((goal) => ({
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate
            ? new Date(goal.targetDate).toISOString().slice(0, 10)
            : null,
        })),
    },
    settings: {
      dailyCompletionTarget: settings.dailyCompletionTarget,
      weeklyGoals: settings.weeklyGoals,
      coachTone: settings.coachTone,
      coachDetail: settings.coachDetail,
    },
    xp: {
      totalXp: xp.totalXp,
      level: xp.level.name,
      nextLevel: xp.level.nextLevel?.name || null,
      xpToNextLevel: xp.level.xpToNextLevel,
    },
    overallStreak: {
      currentStreak: overallStreak.currentStreak,
      longestStreak: overallStreak.longestStreak,
      consistencyRate: overallStreak.consistencyRate,
      lastCompletedDate: overallStreak.lastCompletedDate,
      missedDays: overallStreak.missedDays,
    },
    productivity: {
      last30: metrics30,
      currentWeek: currentMetrics,
      previousWeek: previousMetrics,
      weekScoreDelta: currentMetrics.averageScore - previousMetrics.averageScore,
      weekTasksDelta: currentMetrics.tasksCompleted - previousMetrics.tasksCompleted,
      weekHabitsDelta: currentMetrics.habitsCompleted - previousMetrics.habitsCompleted,
    },
    tasks: {
      last30Count: tasksLast30.length,
      completedCount: tasksLast30.filter((task) => task.status === 'completed').length,
      pendingCount: tasksLast30.filter((task) => task.status === 'pending').length,
      missedCount: missedTasks.length,
      missed: missedTasks.slice(0, 5).map(plainTask),
      pendingHighPriority: pendingHighPriority.map(plainTask),
      overdue: overdue.map(plainTask),
      frequentlyPostponed: postponed.map(plainTask),
    },
    habits,
    frequentlyMissedHabits,
    weekdays,
    achievements: {
      unlockedCount: unlockedRows.length,
      unlocked: unlockedRows.slice(0, 20).map((row) => ({
        key: row.achievementKey,
        name: definitionByKey.get(row.achievementKey)?.name || row.achievementKey,
        unlockedAt: row.unlockedAt,
      })),
    },
  };
}

async function getContext(user, { cache: useCache = true } = {}) {
  const key = String(user._id);
  const now = Date.now();
  const cached = cache.get(key);
  if (useCache && cached && cached.expiresAt > now) return cached.context;

  const context = await buildContext(user);
  cache.set(key, { context, expiresAt: now + CACHE_TTL_MS });

  if (cache.size > 500) {
    for (const [cacheKey, entry] of cache.entries()) {
      if (entry.expiresAt <= now) cache.delete(cacheKey);
    }
  }

  return context;
}

function clearContextCache(userId) {
  if (userId) cache.delete(String(userId));
  else cache.clear();
}

module.exports = {
  getContext,
  buildContext,
  buildPromptText,
  clearContextCache,
  plainTask,
};
