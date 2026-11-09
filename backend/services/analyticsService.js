const XPTransaction = require('../models/XPTransaction');
const ApiError = require('../utils/ApiError');
const { monthKey } = require('../utils/validation');
const {
  addDaysToKey,
  dateKeyFromDate,
  daysBetweenKeys,
  eachDateKey,
  monthRange,
  startOfWeekKey,
  todayKey,
} = require('../utils/date');
const { computeRange } = require('./productivityService');
const { getHabitStreaks } = require('./streakService');
const { getSettings } = require('./settingsService');

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function averageScore(days) {
  const active = days.filter((day) => day.hasActivity);
  if (!active.length) return 0;
  return Math.round(sum(active.map((day) => day.score)) / active.length);
}

function averageScoreAllDays(days) {
  if (!days.length) return 0;
  return Math.round(sum(days.map((day) => day.score)) / days.length);
}

function aggregateMetrics(days, xpByDate = new Map()) {
  return {
    tasksTotal: sum(days.map((day) => day.tasksTotal)),
    tasksCompleted: sum(days.map((day) => day.tasksCompleted)),
    tasksPending: sum(days.map((day) => day.tasksPending)),
    highPriorityTotal: sum(days.map((day) => day.highPriorityTotal)),
    highPriorityCompleted: sum(days.map((day) => day.highPriorityCompleted)),
    habitsScheduled: sum(days.map((day) => day.habitsScheduled)),
    habitsCompleted: sum(days.map((day) => day.habitsCompleted)),
    activeDays: days.filter((day) => day.hasActivity).length,
    successfulDays: days.filter((day) => day.successful).length,
    averageScore: averageScore(days),
    xpEarned: sum(days.map((day) => xpByDate.get(day.dateKey) || 0)),
  };
}

async function getXpByDate(userId, startKey, endKey) {
  const rows = await XPTransaction.aggregate([
    { $match: { userId, dateKey: { $gte: startKey, $lte: endKey } } },
    { $group: { _id: '$dateKey', total: { $sum: '$amount' } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.total]));
}

function buildComparison(current, previous) {
  const metricDefinitions = [
    { key: 'tasksCompleted', label: 'Tasks completed', unit: 'tasks' },
    { key: 'habitsCompleted', label: 'Habits completed', unit: 'habits' },
    { key: 'averageScore', label: 'Average productivity', unit: 'points' },
    { key: 'successfulDays', label: 'Successful days', unit: 'days' },
    { key: 'xpEarned', label: 'XP earned', unit: 'XP' },
  ];

  const metrics = metricDefinitions.map((definition) => {
    const currentValue = current[definition.key] || 0;
    const previousValue = previous[definition.key] || 0;
    const delta = currentValue - previousValue;
    return {
      ...definition,
      current: currentValue,
      previous: previousValue,
      delta,
      percentChange: previousValue
        ? Math.round((delta / previousValue) * 100)
        : delta > 0
          ? 100
          : 0,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    };
  });

  return {
    metrics,
    improvements: metrics.filter((metric) => metric.direction === 'up'),
    declines: metrics.filter((metric) => metric.direction === 'down'),
  };
}

async function getWeekComparison(user, today) {
  const currentStart = startOfWeekKey(today, 1);
  const currentSpan = Math.max(0, daysBetweenKeys(currentStart, today));
  const previousStart = addDaysToKey(currentStart, -7);
  const previousEnd = addDaysToKey(previousStart, currentSpan);

  const [currentDays, previousDays, currentXp, previousXp] = await Promise.all([
    computeRange(user, currentStart, today),
    computeRange(user, previousStart, previousEnd),
    getXpByDate(user._id, currentStart, today),
    getXpByDate(user._id, previousStart, previousEnd),
  ]);

  const current = {
    start: currentStart,
    end: today,
    ...aggregateMetrics(currentDays, currentXp),
  };
  const previous = {
    start: previousStart,
    end: previousEnd,
    ...aggregateMetrics(previousDays, previousXp),
  };

  return { current, previous, comparison: buildComparison(current, previous) };
}

function findBestDay(days) {
  const active = days.filter((day) => day.hasActivity);
  if (!active.length) return null;
  return active.reduce((best, day) => (day.score > best.score ? day : best), active[0]);
}

async function getMostConsistentHabit(user) {
  const { streaks } = await getHabitStreaks(user);
  const candidates = streaks.filter((streak) => streak.totalScheduledDays > 0);
  if (!candidates.length) return null;
  const best = candidates.sort(
    (a, b) =>
      b.completionRate - a.completionRate ||
      b.currentStreak - a.currentStreak ||
      b.totalCompletedDays - a.totalCompletedDays
  )[0];
  return {
    habitId: best.habitId,
    name: best.name,
    category: best.category,
    completionRate: best.completionRate,
    currentStreak: best.currentStreak,
    longestStreak: best.longestStreak,
    totalCompletedDays: best.totalCompletedDays,
    lastCompletedDate: best.lastCompletedDate,
  };
}

async function getDailyAnalytics(user, query = {}) {
  const today = todayKey(user.timezone);
  const requested = Number(query.days);
  const daysCount = Number.isFinite(requested) ? Math.min(365, Math.max(7, Math.round(requested))) : 30;
  const start = addDaysToKey(today, -(daysCount - 1));

  const [days, xpByDate, weekComparison, mostConsistentHabit, settings] = await Promise.all([
    computeRange(user, start, today),
    getXpByDate(user._id, start, today),
    getWeekComparison(user, today),
    getMostConsistentHabit(user),
    getSettings(user._id),
  ]);

  const enriched = days.map((day) => ({
    ...day,
    xpEarned: xpByDate.get(day.dateKey) || 0,
  }));
  const totals = aggregateMetrics(enriched, xpByDate);
  const best = findBestDay(enriched);

  return {
    range: { start, end: today, days: daysCount },
    target: settings.dailyCompletionTarget,
    days: enriched,
    summary: {
      averageScore: totals.averageScore,
      averageScoreAllDays: averageScoreAllDays(enriched),
      totals,
      bestDay: best
        ? {
            date: best.dateKey,
            score: best.score,
            tasksCompleted: best.tasksCompleted,
            habitsCompleted: best.habitsCompleted,
          }
        : null,
      mostConsistentHabit,
      currentWeek: weekComparison.current,
      previousWeek: weekComparison.previous,
      comparison: weekComparison.comparison,
    },
  };
}

async function getWeeklyAnalytics(user, query = {}) {
  const today = todayKey(user.timezone);
  const requested = Number(query.weeks);
  const weeksCount = Number.isFinite(requested) ? Math.min(52, Math.max(2, Math.round(requested))) : 8;
  const currentWeekStart = startOfWeekKey(today, 1);

  const buckets = [];
  for (let index = weeksCount - 1; index >= 0; index -= 1) {
    const start = addDaysToKey(currentWeekStart, -7 * index);
    const naturalEnd = addDaysToKey(start, 6);
    const end = naturalEnd > today ? today : naturalEnd;
    buckets.push({ start, end });
  }

  const xpMap = await getXpByDate(user._id, buckets[0].start, today);
  const weekData = [];

  for (const bucket of buckets) {
    const days = await computeRange(user, bucket.start, bucket.end);
    weekData.push({
      weekStart: bucket.start,
      weekEnd: bucket.end,
      isCurrentWeek: bucket.start === currentWeekStart,
      ...aggregateMetrics(days, xpMap),
      days,
    });
  }

  const comparison = await getWeekComparison(user, today);

  return {
    range: { start: buckets[0].start, end: today, weeks: weeksCount },
    weeks: weekData,
    currentWeek: comparison.current,
    previousWeek: comparison.previous,
    comparison: comparison.comparison,
  };
}

function monthBounds(month, today) {
  const { start, end } = monthRange(month);
  const startKey = dateKeyFromDate(start);
  const endKey = dateKeyFromDate(addDaysToKey(dateKeyFromDate(end), -1));
  return { startKey, endKey: endKey > today ? today : endKey, naturalEnd: endKey };
}

async function getMonthlyAnalytics(user, query = {}) {
  const today = todayKey(user.timezone);
  const currentMonth = today.slice(0, 7);
  const requested = Number(query.months);
  const monthsCount = Number.isFinite(requested) ? Math.min(24, Math.max(2, Math.round(requested))) : 6;

  const months = [];
  for (let index = monthsCount - 1; index >= 0; index -= 1) {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push(key);
  }

  const firstStart = `${months[0]}-01`;
  const xpMap = await getXpByDate(user._id, firstStart, today);
  const monthData = [];

  for (const key of months) {
    const bounds = monthBounds(key, today);
    const days =
      bounds.startKey > bounds.endKey
        ? []
        : await computeRange(user, bounds.startKey, bounds.endKey);
    monthData.push({
      month: key,
      start: bounds.startKey,
      end: bounds.endKey,
      ...aggregateMetrics(days, xpMap),
      days,
    });
  }

  const bestMonth = monthData
    .filter((month) => month.activeDays > 0)
    .reduce((best, month) => (!best || month.averageScore > best.averageScore ? month : best), null);

  return {
    range: { start: `${months[0]}-01`, end: today, months: monthsCount },
    months: monthData,
    bestMonth: bestMonth
      ? {
          month: bestMonth.month,
          averageScore: bestMonth.averageScore,
          tasksCompleted: bestMonth.tasksCompleted,
          habitsCompleted: bestMonth.habitsCompleted,
        }
      : null,
  };
}

function heatLevel(score, hasActivity) {
  if (!hasActivity || score <= 0) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 80) return 3;
  return 4;
}

async function getHeatmap(user, query = {}) {
  const today = todayKey(user.timezone);
  let scope = 'year';
  let startKey;
  let endKey;
  let month = null;
  let year = null;

  if (query.month) {
    scope = 'month';
    month = monthKey(query.month, 'Month', { fallback: today.slice(0, 7) });
    const { start, end } = monthRange(month);
    startKey = dateKeyFromDate(start);
    endKey = dateKeyFromDate(addDaysToKey(dateKeyFromDate(end), -1));
  } else {
    const rawYear = Number(query.year);
    year = Number.isFinite(rawYear) ? Math.round(rawYear) : Number(today.slice(0, 4));
    if (year < 2000 || year > 2100) {
      throw new ApiError(400, 'Year must be between 2000 and 2100.');
    }
    startKey = `${year}-01-01`;
    endKey = `${year}-12-31`;
  }

  const computeEnd = endKey > today ? today : endKey;
  const [days, xpByDate, settings] = await Promise.all([
    startKey > computeEnd ? [] : computeRange(user, startKey, computeEnd),
    getXpByDate(user._id, startKey, computeEnd),
    getSettings(user._id),
  ]);

  const byDate = new Map(days.map((day) => [day.dateKey, day]));
  const allDays = eachDateKey(startKey, endKey).map((key) => {
    if (key > today) {
      return {
        date: key,
        score: 0,
        level: 0,
        status: 'upcoming',
        hasActivity: false,
        tasksTotal: 0,
        tasksCompleted: 0,
        habitsScheduled: 0,
        habitsCompleted: 0,
        xpEarned: 0,
        isFuture: true,
      };
    }
    const day = byDate.get(key);
    return {
      date: key,
      score: day?.score || 0,
      level: heatLevel(day?.score || 0, Boolean(day?.hasActivity)),
      status: day?.status || 'rest',
      hasActivity: Boolean(day?.hasActivity),
      tasksTotal: day?.tasksTotal || 0,
      tasksCompleted: day?.tasksCompleted || 0,
      habitsScheduled: day?.habitsScheduled || 0,
      habitsCompleted: day?.habitsCompleted || 0,
      xpEarned: xpByDate.get(key) || 0,
      isFuture: false,
    };
  });

  const activeDays = days.filter((day) => day.hasActivity);
  const best = findBestDay(days);

  return {
    scope,
    year: scope === 'year' ? year : Number(startKey.slice(0, 4)),
    month,
    start: startKey,
    end: endKey,
    target: settings.dailyCompletionTarget,
    days: allDays,
    summary: {
      activeDays: activeDays.length,
      successfulDays: days.filter((day) => day.successful).length,
      tasksCompleted: sum(days.map((day) => day.tasksCompleted)),
      habitsCompleted: sum(days.map((day) => day.habitsCompleted)),
      xpEarned: sum(allDays.map((day) => day.xpEarned)),
      averageScore: averageScore(days),
      bestDay: best
        ? { date: best.dateKey, score: best.score, tasksCompleted: best.tasksCompleted, habitsCompleted: best.habitsCompleted }
        : null,
    },
  };
}

module.exports = {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getHeatmap,
  getWeekComparison,
  aggregateMetrics,
  averageScore,
};
