const Task = require('../models/Task');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const DailyProductivity = require('../models/DailyProductivity');
const { getSettings } = require('./settingsService');
const {
  addDaysToKey,
  dateKeyFromDate,
  dateKeyInTimeZone,
  dateKeyToUTCDate,
  eachDateKey,
  isValidDateKey,
  todayKey,
  weekdayFromKey,
} = require('../utils/date');

const WEIGHTS = {
  tasks: 40,
  highPriority: 20,
  habits: 30,
  consistency: 10,
};

const BREAKDOWN_LABELS = {
  tasks: 'Task completion',
  highPriority: 'High-priority completion',
  habits: 'Habit completion',
  consistency: 'Consistency',
};

function isHabitScheduled(habit, dateKeyValue, createdKey) {
  if (dateKeyValue < createdKey) return false;
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    return (habit.daysOfWeek || []).includes(weekdayFromKey(dateKeyValue));
  }
  return false;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function groupByDate(documents) {
  const map = new Map();
  for (const document of documents) {
    const key = dateKeyFromDate(document.date || document.dueDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(document);
  }
  return map;
}

function dateRangeFilter(startKey, endKey) {
  return {
    $gte: dateKeyToUTCDate(startKey),
    $lt: dateKeyToUTCDate(addDaysToKey(endKey, 1)),
  };
}

function buildBreakdown(values) {
  const available = [];
  if (values.tasksTotal > 0) available.push('tasks');
  if (values.highPriorityTotal > 0) available.push('highPriority');
  if (values.habitsScheduled > 0) available.push('habits');
  if (values.hasActivity) available.push('consistency');

  const totalWeight = sum(available.map((key) => WEIGHTS[key]));
  const breakdown = available.map((key) => {
    const ratioByKey = {
      tasks: values.tasksTotal ? values.tasksCompleted / values.tasksTotal : 0,
      highPriority: values.highPriorityTotal
        ? values.highPriorityCompleted / values.highPriorityTotal
        : 0,
      habits: values.habitsScheduled ? values.habitsCompleted / values.habitsScheduled : 0,
      consistency: values.consistencyRatio,
    };
    const ratio = Math.min(1, Math.max(0, ratioByKey[key] || 0));
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      weight: WEIGHTS[key],
      ratio: Math.round(ratio * 1000) / 10,
      points: Math.round(ratio * WEIGHTS[key] * 10) / 10,
    };
  });

  const points = sum(breakdown.map((item) => item.points));
  const score = totalWeight ? Math.round((points / totalWeight) * 100) : 0;

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
    totalWeight,
  };
}

async function computeRange(user, startKey, endKey, { persist = true } = {}) {
  if (startKey > endKey) {
    return [];
  }

  const settings = await getSettings(user._id);
  const target = settings.dailyCompletionTarget;

  // Seven extra days give the consistency factor a running window. They are
  // persisted as well so later range queries remain warm.
  const computeStart = addDaysToKey(startKey, -7);
  const filter = dateRangeFilter(computeStart, endKey);

  const [tasks, habitLogs, habits, priorDays] = await Promise.all([
    Task.find({
      userId: user._id,
      dueDate: filter,
    })
      .select('dueDate status priority')
      .lean(),
    HabitLog.find({
      userId: user._id,
      date: filter,
      completed: true,
    })
      .select('habitId date')
      .lean(),
    Habit.find({ userId: user._id }).select('frequency daysOfWeek isActive createdAt').lean(),
    DailyProductivity.find({
      userId: user._id,
      dateKey: { $gte: addDaysToKey(computeStart, -7), $lt: computeStart },
    })
      .select('dateKey status hasActivity')
      .sort({ dateKey: 1 })
      .lean(),
  ]);

  const tasksByDate = groupByDate(tasks);
  const logsByDate = new Map();
  for (const log of habitLogs) {
    const key = dateKeyFromDate(log.date);
    if (!logsByDate.has(key)) logsByDate.set(key, new Set());
    logsByDate.get(key).add(String(log.habitId));
  }

  const habitInfo = habits.map((habit) => ({
    ...habit,
    createdKey: dateKeyInTimeZone(habit.createdAt || new Date(), user.timezone),
  }));

  const recentStatuses = priorDays.map((day) => ({
    dateKey: day.dateKey,
    status: day.status,
    hasActivity: day.hasActivity,
  }));

  const computed = [];

  for (const dateKeyValue of eachDateKey(computeStart, endKey)) {
    const dayTasks = tasksByDate.get(dateKeyValue) || [];
    const completedHabitIds = logsByDate.get(dateKeyValue) || new Set();

    const tasksTotal = dayTasks.length;
    const tasksCompleted = dayTasks.filter((task) => task.status === 'completed').length;
    const highPriorityTotal = dayTasks.filter((task) => task.priority === 'high').length;
    const highPriorityCompleted = dayTasks.filter(
      (task) => task.priority === 'high' && task.status === 'completed'
    ).length;

    let habitsScheduled = 0;
    let habitsCompleted = 0;
    for (const habit of habitInfo) {
      const completed = completedHabitIds.has(String(habit._id));
      const scheduledForHabit = isHabitScheduled(habit, dateKeyValue, habit.createdKey);
      const countsToday = (habit.isActive && scheduledForHabit) || completed;
      if (countsToday) {
        habitsScheduled += 1;
        if (completed) habitsCompleted += 1;
      }
    }

    const scheduledItems = tasksTotal + habitsScheduled;
    const completedItems = tasksCompleted + habitsCompleted;
    const hasActivity = scheduledItems > 0;

    const previousActive = recentStatuses
      .slice(-7)
      .filter((day) => day.hasActivity);
    const consistencyRatio = previousActive.length
      ? previousActive.filter((day) => day.status === 'success').length / previousActive.length
      : 0;

    const { score, breakdown } = buildBreakdown({
      tasksTotal,
      tasksCompleted,
      highPriorityTotal,
      highPriorityCompleted,
      habitsScheduled,
      habitsCompleted,
      consistencyRatio,
      hasActivity,
    });

    const status = !hasActivity ? 'rest' : score >= target ? 'success' : 'missed';

    const day = {
      dateKey: dateKeyValue,
      date: dateKeyToUTCDate(dateKeyValue),
      score,
      target,
      successful: status === 'success',
      hasActivity,
      status,
      tasksTotal,
      tasksCompleted,
      tasksPending: tasksTotal - tasksCompleted,
      highPriorityTotal,
      highPriorityCompleted,
      habitsScheduled,
      habitsCompleted,
      scheduledItems,
      completedItems,
      breakdown,
      consistencyRatio: Math.round(consistencyRatio * 100),
    };

    computed.push(day);
    recentStatuses.push({ dateKey: dateKeyValue, status, hasActivity });
    if (recentStatuses.length > 21) recentStatuses.shift();
  }

  if (persist && computed.length) {
    await DailyProductivity.bulkWrite(
      computed.map((day) => ({
        updateOne: {
          filter: { userId: user._id, dateKey: day.dateKey },
          update: {
            $set: {
              userId: user._id,
              date: dateKeyToUTCDate(day.dateKey),
              dateKey: day.dateKey,
              score: day.score,
              target: day.target,
              successful: day.successful,
              hasActivity: day.hasActivity,
              status: day.status,
              tasksTotal: day.tasksTotal,
              tasksCompleted: day.tasksCompleted,
              highPriorityTotal: day.highPriorityTotal,
              highPriorityCompleted: day.highPriorityCompleted,
              habitsScheduled: day.habitsScheduled,
              habitsCompleted: day.habitsCompleted,
              scheduledItems: day.scheduledItems,
              completedItems: day.completedItems,
              breakdown: day.breakdown,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  return computed.filter((day) => day.dateKey >= startKey && day.dateKey <= endKey);
}

async function computeDay(user, dateKeyValue) {
  const days = await computeRange(user, dateKeyValue, dateKeyValue);
  return days[0] || null;
}

async function recomputeDay(user, dateKeyValue) {
  if (!dateKeyValue) return null;
  return computeDay(user, dateKeyValue);
}

async function recomputeDates(user, dateKeys) {
  const unique = [...new Set(dateKeys.filter(Boolean))].sort();
  const results = [];
  for (const key of unique) {
    results.push(await recomputeDay(user, key));
  }
  return results;
}

async function getProductivityScore(user, query = {}) {
  const today = todayKey(user.timezone);
  const date = query.date && isValidDateKey(query.date) ? query.date : today;
  const settings = await getSettings(user._id);

  const day = await computeDay(user, date);
  const weekStart = addDaysToKey(date, -6);
  const weekDays = await computeRange(user, weekStart, date);
  const monthStart = `${date.slice(0, 7)}-01`;
  const monthDays = await computeRange(user, monthStart, date);

  const average = (days) => {
    const active = days.filter((item) => item.hasActivity);
    if (!active.length) return 0;
    return Math.round(sum(active.map((item) => item.score)) / active.length);
  };

  return {
    date,
    timezone: user.timezone,
    target: settings.dailyCompletionTarget,
    day,
    week: {
      start: weekStart,
      end: date,
      averageScore: average(weekDays),
      successfulDays: weekDays.filter((item) => item.successful).length,
      trackedDays: weekDays.filter((item) => item.hasActivity).length,
      tasksCompleted: sum(weekDays.map((item) => item.tasksCompleted)),
      habitsCompleted: sum(weekDays.map((item) => item.habitsCompleted)),
      days: weekDays,
    },
    month: {
      start: monthStart,
      end: date,
      averageScore: average(monthDays),
      successfulDays: monthDays.filter((item) => item.successful).length,
      trackedDays: monthDays.filter((item) => item.hasActivity).length,
      tasksCompleted: sum(monthDays.map((item) => item.tasksCompleted)),
      habitsCompleted: sum(monthDays.map((item) => item.habitsCompleted)),
      days: monthDays,
    },
  };
}

module.exports = {
  WEIGHTS,
  computeRange,
  computeDay,
  recomputeDay,
  recomputeDates,
  getProductivityScore,
  isHabitScheduled,
  dateRangeFilter,
};
