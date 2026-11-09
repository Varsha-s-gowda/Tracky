const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { monthKey } = require('../utils/validation');
const {
  addDaysToKey,
  dateKeyFromDate,
  dateKeyInTimeZone,
  eachDateKey,
  monthRange,
  todayKey,
  weekdayFromKey,
} = require('../utils/date');
const { computeRange } = require('./productivityService');
const { getSettings } = require('./settingsService');

function percent(completed, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function scheduledKeysForHabit(habit, today, timezone) {
  const createdKey = dateKeyInTimeZone(habit.createdAt || new Date(), timezone);
  if (createdKey > today) return [];
  const keys = [];
  for (let key = createdKey; key <= today; key = addDaysToKey(key, 1)) {
    if (habit.frequency === 'daily') {
      keys.push(key);
    } else if (
      habit.frequency === 'weekly' &&
      (habit.daysOfWeek || []).includes(weekdayFromKey(key))
    ) {
      keys.push(key);
    }
  }
  return keys;
}

function calculateHabitStreak(habit, completedKeys, today, timezone) {
  const scheduled = scheduledKeysForHabit(habit, today, timezone);
  const scheduledSet = new Set(scheduled);
  const completedScheduled = scheduled.filter((key) => completedKeys.has(key));

  let current = 0;
  for (let index = scheduled.length - 1; index >= 0; index -= 1) {
    const key = scheduled[index];
    if (key === today && !completedKeys.has(key)) continue;
    if (completedKeys.has(key)) {
      current += 1;
    } else {
      break;
    }
  }

  let best = 0;
  let run = 0;
  for (const key of scheduled) {
    if (completedKeys.has(key)) {
      run += 1;
      if (run > best) best = run;
    } else if (key < today) {
      run = 0;
    }
  }

  const todayIsPending = scheduledSet.has(today) && !completedKeys.has(today);
  const effectiveScheduled = scheduled.filter(
    (key) => key !== today || completedKeys.has(key)
  );
  const effectiveCompleted = completedScheduled.filter((key) => key !== today || completedKeys.has(today));
  const missedDays = effectiveScheduled.filter((key) => !completedKeys.has(key));
  const lastCompletedKey = [...completedKeys].filter((key) => key <= today).sort().at(-1) || null;

  const weekStart = addDaysToKey(today, -6);
  const monthStart = addDaysToKey(today, -29);
  const weekScheduled = effectiveScheduled.filter((key) => key >= weekStart);
  const monthScheduled = effectiveScheduled.filter((key) => key >= monthStart);

  return {
    habitId: habit._id,
    name: habit.name,
    category: habit.category,
    frequency: habit.frequency,
    daysOfWeek: habit.daysOfWeek || [],
    target: habit.target,
    isActive: habit.isActive,
    currentStreak: current,
    longestStreak: best,
    totalCompletedDays: completedKeys.size,
    completedScheduledDays: completedScheduled.length,
    totalScheduledDays: scheduled.length,
    completionRate: percent(effectiveCompleted.length, effectiveScheduled.length),
    lastCompletedDate: lastCompletedKey,
    missedDays: missedDays.length,
    scheduledToday: scheduledSet.has(today),
    completedToday: completedKeys.has(today),
    todayPending: todayIsPending,
    weeklyConsistency: percent(
      weekScheduled.filter((key) => completedKeys.has(key)).length,
      weekScheduled.length
    ),
    monthlyConsistency: percent(
      monthScheduled.filter((key) => completedKeys.has(key)).length,
      monthScheduled.length
    ),
  };
}

function habitStatusForDate(habit, dateKeyValue, completedKeys, today) {
  const createdKey = dateKeyInTimeZone(habit.createdAt || new Date(), habit.__timezone || 'UTC');
  const scheduled =
    dateKeyValue >= createdKey &&
    (habit.frequency === 'daily' ||
      (habit.frequency === 'weekly' && (habit.daysOfWeek || []).includes(weekdayFromKey(dateKeyValue))));

  // Future dates are always upcoming, even if a stray future-dated log exists.
  if (dateKeyValue > today) {
    return { date: dateKeyValue, status: 'upcoming', scheduled, completed: false };
  }
  if (completedKeys.has(dateKeyValue)) {
    return { date: dateKeyValue, status: 'completed', scheduled: true, completed: true };
  }
  if (scheduled && dateKeyValue === today) {
    return { date: dateKeyValue, status: 'pending', scheduled: true, completed: false };
  }
  if (scheduled) {
    return { date: dateKeyValue, status: 'missed', scheduled: true, completed: false };
  }
  return { date: dateKeyValue, status: 'rest', scheduled: false, completed: false };
}

async function getHabitStreaks(user) {
  const today = todayKey(user.timezone);
  const [habits, logs] = await Promise.all([
    Habit.find({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean(),
    HabitLog.find({ userId: user._id, completed: true }).select('habitId date').lean(),
  ]);

  const logsByHabit = new Map();
  for (const log of logs) {
    const logKey = dateKeyFromDate(log.date);
    // Future-dated logs are ignored until that date actually arrives.
    if (logKey > today) continue;
    const habitId = String(log.habitId);
    if (!logsByHabit.has(habitId)) logsByHabit.set(habitId, new Set());
    logsByHabit.get(habitId).add(logKey);
  }

  const streaks = habits.map((habit) =>
    calculateHabitStreak(
      habit,
      logsByHabit.get(String(habit._id)) || new Set(),
      today,
      user.timezone
    )
  );

  return { today, habits, logsByHabit, streaks };
}

async function getOverallStreak(user, settings, { includeDays = false } = {}) {
  const today = todayKey(user.timezone);

  const [taskEarliest, habitEarliest, logEarliest] = await Promise.all([
    Task.findOne({ userId: user._id }).sort({ dueDate: 1 }).select('dueDate').lean(),
    Habit.findOne({ userId: user._id }).sort({ createdAt: 1 }).select('createdAt').lean(),
    HabitLog.findOne({ userId: user._id, completed: true }).sort({ date: 1 }).select('date').lean(),
  ]);

  const candidates = [];
  if (taskEarliest?.dueDate) candidates.push(dateKeyFromDate(taskEarliest.dueDate));
  if (habitEarliest?.createdAt) {
    candidates.push(dateKeyInTimeZone(habitEarliest.createdAt, user.timezone));
  }
  if (logEarliest?.date) candidates.push(dateKeyFromDate(logEarliest.date));

  const earliestCandidate = candidates.length ? candidates.sort()[0] : today;
  const earliest = earliestCandidate < today ? earliestCandidate : today;
  const floor = addDaysToKey(today, -3650);
  const start = earliest < floor ? floor : earliest;

  const days = await computeRange(user, start, today);

  let current = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (day.dateKey === today && day.status === 'missed') continue;
    if (day.status === 'rest') continue;
    if (day.status === 'success') {
      current += 1;
    } else {
      break;
    }
  }

  let best = 0;
  let run = 0;
  for (const day of days) {
    if (day.status === 'success') {
      run += 1;
      if (run > best) best = run;
    } else if (day.status === 'missed') {
      run = 0;
    }
  }

  const tracked = days.filter((day) => day.hasActivity);
  const successful = days.filter((day) => day.successful);
  const successKeys = new Set(successful.map((day) => day.dateKey));
  const missed = tracked.filter((day) => !successKeys.has(day.dateKey));
  const lastCompletedDate = successful.length ? successful[successful.length - 1].dateKey : null;

  const weekStart = addDaysToKey(today, -6);
  const monthStart = addDaysToKey(today, -29);
  const weekDays = tracked.filter((day) => day.dateKey >= weekStart);
  const monthDays = tracked.filter((day) => day.dateKey >= monthStart);

  const result = {
    currentStreak: current,
    longestStreak: best,
    totalSuccessfulDays: successful.length,
    totalTrackedDays: tracked.length,
    consistencyRate: percent(successful.length, tracked.length),
    lastCompletedDate,
    missedDays: missed.length,
    target: settings.dailyCompletionTarget,
    weeklyConsistency: percent(
      weekDays.filter((day) => day.successful).length,
      weekDays.length
    ),
    monthlyConsistency: percent(
      monthDays.filter((day) => day.successful).length,
      monthDays.length
    ),
    history: days.slice(-90).map((day) => ({
      date: day.dateKey,
      score: day.score,
      status: day.status,
      successful: day.successful,
      tasksCompleted: day.tasksCompleted,
      habitsCompleted: day.habitsCompleted,
    })),
  };

  if (includeDays) result.days = days;
  return result;
}

async function buildOverallMonthCalendar(user, month, days, today) {
  const { start, end } = monthRange(month);
  const startKey = dateKeyFromDate(start);
  const endKey = dateKeyFromDate(addDaysToKey(dateKeyFromDate(end), -1));
  const byDate = new Map((days || []).map((day) => [day.dateKey, day]));

  return eachDateKey(startKey, endKey).map((key) => {
    if (key > today) {
      return {
        date: key,
        score: 0,
        status: 'upcoming',
        successful: false,
        hasActivity: false,
        tasksCompleted: 0,
        habitsCompleted: 0,
      };
    }
    const day = byDate.get(key);
    return {
      date: key,
      score: day?.score || 0,
      status: day?.status || 'rest',
      successful: Boolean(day?.successful),
      hasActivity: Boolean(day?.hasActivity),
      tasksCompleted: day?.tasksCompleted || 0,
      habitsCompleted: day?.habitsCompleted || 0,
    };
  });
}

async function getStreakOverview(user, query = {}) {
  const today = todayKey(user.timezone);
  const fallbackMonth = today.slice(0, 7);
  const month = monthKey(query.month, 'Month', { fallback: fallbackMonth });
  const settings = await getSettings(user._id);

  const [overall, habitData] = await Promise.all([
    getOverallStreak(user, settings, { includeDays: true }),
    getHabitStreaks(user),
  ]);

  const calendar = await buildOverallMonthCalendar(user, month, overall.days, today);
  const { days, ...overallSummary } = overall;

  const habitTotals = habitData.streaks.reduce(
    (totals, streak) => ({
      completions: totals.completions + streak.totalCompletedDays,
      current: Math.max(totals.current, streak.currentStreak),
      best: Math.max(totals.best, streak.longestStreak),
    }),
    { completions: 0, current: 0, best: 0 }
  );

  return {
    date: today,
    timezone: user.timezone,
    target: settings.dailyCompletionTarget,
    overall: overallSummary,
    habits: habitData.streaks,
    calendar: { month, days: calendar },
    totals: {
      activeHabits: habitData.streaks.length,
      totalHabitCompletions: habitTotals.completions,
      bestHabitStreak: habitTotals.best,
      currentHabitStreak: habitTotals.current,
    },
  };
}

async function getHabitStreakDetail(user, habitId, query = {}) {
  if (!mongoose.isValidObjectId(habitId)) {
    throw new ApiError(400, 'Invalid habit identifier.');
  }
  const habit = await Habit.findOne({ _id: habitId, userId: user._id }).lean();
  if (!habit) {
    throw new ApiError(404, 'Habit not found.');
  }

  const today = todayKey(user.timezone);
  const fallbackMonth = today.slice(0, 7);
  const month = monthKey(query.month, 'Month', { fallback: fallbackMonth });

  const logs = await HabitLog.find({
    userId: user._id,
    habitId: habit._id,
    completed: true,
  })
    .select('date completedAt')
    .sort({ date: 1 })
    .lean();

  const completedKeys = new Set(
    logs
      .map((log) => dateKeyFromDate(log.date))
      .filter((key) => key <= today)
  );
  const streak = calculateHabitStreak(habit, completedKeys, today, user.timezone);

  const habitWithZone = { ...habit, __timezone: user.timezone };
  const { start, end } = monthRange(month);
  const startKey = dateKeyFromDate(start);
  const endKey = dateKeyFromDate(addDaysToKey(dateKeyFromDate(end), -1));
  const calendar = eachDateKey(startKey, endKey).map((key) =>
    habitStatusForDate(habitWithZone, key, completedKeys, today)
  );

  const historyStart = addDaysToKey(today, -89);
  const history = eachDateKey(historyStart, today).map((key) =>
    habitStatusForDate(habitWithZone, key, completedKeys, today)
  );

  return {
    date: today,
    timezone: user.timezone,
    habit: {
      _id: habit._id,
      name: habit.name,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      daysOfWeek: habit.daysOfWeek || [],
      target: habit.target,
      isActive: habit.isActive,
      createdAt: habit.createdAt,
    },
    streak,
    calendar: { month, days: calendar },
    history,
    completions: logs
      .map((log) => ({
        date: dateKeyFromDate(log.date),
        completedAt: log.completedAt,
      }))
      .filter((log) => log.date <= today),
  };
}

async function getStreakStats(user) {
  const settings = await getSettings(user._id);
  const [overall, habitData] = await Promise.all([
    getOverallStreak(user, settings),
    getHabitStreaks(user),
  ]);
  const bestHabitStreak = habitData.streaks.reduce(
    (best, streak) => Math.max(best, streak.longestStreak, streak.currentStreak),
    0
  );
  return {
    overall,
    habits: habitData.streaks,
    bestHabitStreak,
    maxStreak: Math.max(overall.longestStreak, overall.currentStreak, bestHabitStreak),
    totalHabitCompletions: habitData.streaks.reduce(
      (total, streak) => total + streak.totalCompletedDays,
      0
    ),
  };
}

function getHabitCalendarDay(user, habit, completedKeys, dateKeyValue, today) {
  return habitStatusForDate({ ...habit, __timezone: user.timezone }, dateKeyValue, completedKeys, today);
}

module.exports = {
  percent,
  calculateHabitStreak,
  getHabitStreaks,
  getOverallStreak,
  getStreakOverview,
  getHabitStreakDetail,
  getStreakStats,
  getHabitCalendarDay,
  scheduledKeysForHabit,
  habitStatusForDate,
};
