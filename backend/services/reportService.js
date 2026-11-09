const mongoose = require('mongoose');
const AIReport = require('../models/AIReport');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const UserAchievement = require('../models/UserAchievement');
const Achievement = require('../models/Achievement');
const ApiError = require('../utils/ApiError');
const {
  addDaysToKey,
  dateKeyFromDate,
  dateKeyInTimeZone,
  dateKeyToUTCDate,
  daysBetweenKeys,
  eachDateKey,
  startOfWeekKey,
  todayKey,
} = require('../utils/date');
const { dateKey: validateDateKey } = require('../utils/validation');
const { computeRange } = require('./productivityService');
const { getHabitStreaks, getOverallStreak } = require('./streakService');
const { getSettings } = require('./settingsService');
const { getInsights } = require('./insightService');
const { isHabitScheduled } = require('./productivityService');
const aiProvider = require('./aiProviderService');

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function averageScore(days) {
  const active = days.filter((day) => day.hasActivity);
  if (!active.length) return 0;
  return Math.round(sum(active.map((day) => day.score)) / active.length);
}

function aggregate(days) {
  const active = days.filter((day) => day.hasActivity);
  return {
    tasksTotal: sum(days.map((day) => day.tasksTotal)),
    tasksCompleted: sum(days.map((day) => day.tasksCompleted)),
    tasksPending: sum(days.map((day) => day.tasksPending)),
    highPriorityTotal: sum(days.map((day) => day.highPriorityTotal)),
    highPriorityCompleted: sum(days.map((day) => day.highPriorityCompleted)),
    habitsScheduled: sum(days.map((day) => day.habitsScheduled)),
    habitsCompleted: sum(days.map((day) => day.habitsCompleted)),
    activeDays: active.length,
    successfulDays: days.filter((day) => day.successful).length,
    averageScore: averageScore(days),
    bestDay: active.length
      ? active.reduce((best, day) => (day.score > best.score ? day : best), active[0])
      : null,
  };
}

function formatDayLabel(dateKeyValue) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateKeyToUTCDate(dateKeyValue));
}

function formatWeekLabel(startKey, endKey) {
  return `Week of ${formatDayLabel(startKey)} – ${formatDayLabel(endKey)}`;
}

function plainTask(task) {
  return {
    _id: task._id,
    title: task.title,
    priority: task.priority,
    category: task.category,
    dueDate: dateKeyFromDate(task.dueDate),
    status: task.status,
  };
}

async function achievementsForRange(userId, startKey, endKey) {
  const start = dateKeyToUTCDate(startKey);
  const end = addDaysToKey(endKey, 1);
  const rows = await UserAchievement.find({
    userId,
    unlockedAt: { $gte: start, $lt: dateKeyToUTCDate(end) },
  })
    .sort({ unlockedAt: 1 })
    .lean();
  if (!rows.length) return [];
  const definitions = await Achievement.find({
    key: { $in: rows.map((row) => row.achievementKey) },
  })
    .select('key name')
    .lean();
  const names = new Map(definitions.map((definition) => [definition.key, definition.name]));
  return rows.map((row) => ({
    key: row.achievementKey,
    name: names.get(row.achievementKey) || row.achievementKey,
    unlockedAt: row.unlockedAt,
  }));
}

async function habitRangeStats(user, startKey, endKey) {
  const habits = await Habit.find({ userId: user._id }).lean();
  const lastKey = endKey < todayKey(user.timezone) ? endKey : todayKey(user.timezone);
  const rangeKeys = eachDateKey(startKey, lastKey);
  const logs = await HabitLog.find({
    userId: user._id,
    completed: true,
    date: {
      $gte: dateKeyToUTCDate(startKey),
      $lte: dateKeyToUTCDate(lastKey),
    },
  })
    .select('habitId date')
    .lean();

  const completedPairs = new Set(
    logs.map((log) => `${log.habitId}:${dateKeyFromDate(log.date)}`)
  );

  let scheduled = 0;
  let completed = 0;
  const byHabit = [];
  for (const habit of habits) {
    const createdKey = dateKeyInTimeZone(habit.createdAt || new Date(), user.timezone);
    let habitScheduled = 0;
    let habitCompleted = 0;
    for (const key of rangeKeys) {
      if (key < createdKey) continue;
      if (!isHabitScheduled(habit, key)) continue;
      habitScheduled += 1;
      if (completedPairs.has(`${habit._id}:${key}`)) habitCompleted += 1;
    }
    scheduled += habitScheduled;
    completed += habitCompleted;
    if (habitScheduled > 0) {
      byHabit.push({
        habitId: String(habit._id),
        name: habit.name,
        scheduled: habitScheduled,
        completed: habitCompleted,
        missed: habitScheduled - habitCompleted,
        completionRate: Math.round((habitCompleted / habitScheduled) * 100),
      });
    }
  }

  return {
    scheduled,
    completed,
    missed: scheduled - completed,
    completionRate: scheduled ? Math.round((completed / scheduled) * 100) : 0,
    byHabit,
  };
}

async function generateNarrative(kind, report, settings) {
  if (!aiProvider.isConfigured()) {
    return { status: 'not_configured' };
  }

  const system = [
    'You are the Tracky AI productivity coach.',
    'Use ONLY the JSON data supplied by the user. Never invent tasks, habits, scores, dates, or achievements.',
    'If a value is missing, say that the data is not available instead of guessing.',
    'Keep the tone ' + (settings.coachTone || 'supportive') + ' and the writing ' + (settings.coachDetail || 'concise') + '.',
    kind === 'weekly'
      ? 'Write a weekly report narrative with a short overview, key wins, and concrete focus areas for next week.'
      : 'Write a daily report narrative with a short overview, key wins, and concrete recommendations for tomorrow.',
    'Return strict JSON only with this shape: {"summary": string, "highlights": string[], "focus": string[]}.',
    'Do not include markdown fences or any text outside the JSON object.',
  ].join(' ');

  try {
    const { data, meta } = await aiProvider.generateJson({
      system,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            kind,
            today: report.periodKey,
            rangeStart: report.rangeStart,
            rangeEnd: report.rangeEnd,
            metrics: report.metrics,
            sections: report.sections,
            recommendations: report.recommendations,
            insights: report.insights,
          }),
        },
      ],
      temperature: 0.35,
      maxTokens: 900,
    });

    const summary = typeof data?.summary === 'string' ? data.summary.trim().slice(0, 4000) : '';
    const highlights = Array.isArray(data?.highlights)
      ? data.highlights.filter((item) => typeof item === 'string').map((item) => item.slice(0, 300)).slice(0, 6)
      : [];
    const focus = Array.isArray(data?.focus)
      ? data.focus.filter((item) => typeof item === 'string').map((item) => item.slice(0, 300)).slice(0, 6)
      : [];

    if (!summary) {
      return { status: 'failed', error: 'The AI narrative response was missing a summary.' };
    }

    return { status: 'generated', summary, highlights, focus, model: meta.model };
  } catch (error) {
    console.error('AI narrative generation failed:', error.message);
    return { status: 'failed', error: 'AI narrative could not be generated right now.' };
  }
}

function buildDailyContent({ day, tasks, habits, achievements, insights, overallStreak, settings }) {
  const completed = tasks.filter((task) => task.status === 'completed');
  const pending = tasks.filter((task) => task.status !== 'completed');
  const scheduledHabits = habits.filter((habit) => habit.scheduledToday);
  const completedHabits = scheduledHabits.filter((habit) => habit.completedToday);

  const sections = [
    {
      key: 'overview',
      title: 'Day at a glance',
      body: `Productivity score ${day.score}/100 against a target of ${day.target}/100. ${
        day.successful ? 'This day met the target.' : 'This day fell short of the target.'
      }`,
      items: [],
    },
    {
      key: 'tasks',
      title: 'Tasks',
      body: `${completed.length} completed, ${pending.length} pending.`,
      items: [
        ...completed.slice(0, 8).map((task) => `Completed: ${task.title}`),
        ...pending.slice(0, 8).map((task) => `Pending: ${task.title}`),
      ],
    },
    {
      key: 'habits',
      title: 'Habits',
      body: `${completedHabits.length} of ${scheduledHabits.length} scheduled habits completed.`,
      items: scheduledHabits.slice(0, 12).map(
        (habit) => `${habit.completedToday ? 'Completed' : 'Missed'}: ${habit.name}`
      ),
    },
    {
      key: 'streaks',
      title: 'Streak changes',
      body: `Overall consistency streak is ${overallStreak.currentStreak} days (best ${overallStreak.longestStreak}).`,
      items: [],
    },
    {
      key: 'achievements',
      title: 'Achievements',
      body: achievements.length
        ? `${achievements.length} achievement${achievements.length === 1 ? '' : 's'} unlocked.`
        : 'No achievements unlocked on this day.',
      items: achievements.map((achievement) => achievement.name),
    },
  ];

  const recommendations = insights.recommendations.slice(0, 4);
  const summary = `You completed ${completed.length} of ${tasks.length} tasks and ${completedHabits.length} of ${scheduledHabits.length} scheduled habits. Your productivity score was ${day.score}/100 (${day.successful ? 'target met' : 'target not met'}).`;

  return {
    title: `Daily report · ${formatDayLabel(day.dateKey)}`,
    summary,
    sections,
    recommendations,
    metrics: {
      ...day,
      tasksCompletedCount: completed.length,
      tasksPendingCount: pending.length,
      habitsCompletedCount: completedHabits.length,
      habitsScheduledCount: scheduledHabits.length,
      overallCurrentStreak: overallStreak.currentStreak,
      overallLongestStreak: overallStreak.longestStreak,
      achievementsUnlocked: achievements.length,
      target: settings.dailyCompletionTarget,
    },
    insights: {
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      bestWeekday: insights.bestWeekday,
      upcomingMilestones: insights.upcomingMilestones,
      pendingHighPriority: insights.pendingHighPriority,
    },
    extra: {
      tomorrowRecommendations: insights.recommendations.slice(0, 3).map((item) => item.title),
    },
  };
}

async function persistReport(userId, payload) {
  return AIReport.findOneAndUpdate(
    { userId, type: payload.type, periodKey: payload.periodKey },
    { $set: { ...payload, userId, generatedAt: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

async function generateDailyReport(user, options = {}) {
  const settings = await getSettings(user._id);
  const today = todayKey(user.timezone);
  const date = options.date
    ? validateDateKey(options.date, 'Report date')
    : today;

  if (date > today) {
    throw new ApiError(400, 'Daily reports cannot be generated for a future date.');
  }

  const [days, tasksRaw, habitList, achievements, insights, overallStreak] = await Promise.all([
    computeRange(user, date, date, { persist: true }),
    Task.find({
      userId: user._id,
      dueDate: {
        $gte: dateKeyToUTCDate(date),
        $lt: dateKeyToUTCDate(addDaysToKey(date, 1)),
      },
    })
      .select('title priority category dueDate status')
      .sort({ priority: -1, dueTime: 1 })
      .lean(),
    Habit.find({ userId: user._id, isActive: true }).sort({ createdAt: 1 }).lean(),
    achievementsForRange(user._id, date, date),
    getInsights(user),
    getOverallStreak(user, settings),
  ]);

  const day = days[0];
  const logs = await HabitLog.find({
    userId: user._id,
    date: dateKeyToUTCDate(date),
    completed: true,
  })
    .select('habitId')
    .lean();
  const completedHabitIds = new Set(logs.map((log) => String(log.habitId)));

  const habits = habitList
    .filter((habit) => dateKeyInTimeZone(habit.createdAt || new Date(), user.timezone) <= date)
    .map((habit) => ({
      ...habit,
      scheduledToday: isHabitScheduled(habit, date),
      completedToday: completedHabitIds.has(String(habit._id)),
    }));

  const content = buildDailyContent({
    day,
    tasks: tasksRaw,
    habits,
    achievements,
    insights,
    overallStreak,
    settings,
  });

  const aiEnabled = options.useAI !== false;
  const narrative = aiEnabled
    ? await generateNarrative('daily', { ...content, type: 'daily', periodKey: date, rangeStart: date, rangeEnd: date, metrics: content.metrics }, settings)
    : { status: 'skipped' };

  const payload = {
    type: 'daily',
    periodKey: date,
    rangeStart: date,
    rangeEnd: date,
    title: content.title,
    summary: narrative.status === 'generated' ? narrative.summary : content.summary,
    sections: [
      ...content.sections,
      ...(narrative.status === 'generated' && narrative.highlights.length
        ? [{ key: 'ai_highlights', title: 'AI highlights', body: '', items: narrative.highlights }]
        : []),
      ...(narrative.status === 'generated' && narrative.focus.length
        ? [{ key: 'ai_focus', title: 'AI focus', body: '', items: narrative.focus }]
        : []),
    ],
    recommendations: content.recommendations,
    metrics: content.metrics,
    insights: { ...content.insights, ...content.extra },
    source: narrative.status === 'generated' ? 'ai' : 'rules',
    aiStatus: narrative.status,
    aiError: narrative.error || '',
    model: narrative.model || '',
  };

  if (options.persist === false) return payload;
  return persistReport(user._id, payload);
}

function buildWeeklyContent({ startKey, endKey, current, previous, habits, insights, achievements, overallStreak, settings, missed }) {
  const bestHabit = [...habits]
    .filter((habit) => habit.totalScheduledDays > 0)
    .sort((a, b) => b.completionRate - a.completionRate || b.currentStreak - a.currentStreak)[0];
  const leastHabit = [...habits]
    .filter((habit) => habit.totalScheduledDays > 0)
    .sort((a, b) => a.completionRate - b.completionRate || b.missedDays - a.missedDays)[0];

  const comparison = [
    {
      key: 'tasks',
      label: 'Tasks completed',
      current: current.tasksCompleted,
      previous: previous.tasksCompleted,
    },
    {
      key: 'habits',
      label: 'Habit check-ins',
      current: current.habitsCompleted,
      previous: previous.habitsCompleted,
    },
    {
      key: 'score',
      label: 'Average score',
      current: current.averageScore,
      previous: previous.averageScore,
    },
    {
      key: 'successfulDays',
      label: 'Successful days',
      current: current.successfulDays,
      previous: previous.successfulDays,
    },
  ].map((metric) => ({
    ...metric,
    delta: metric.current - metric.previous,
    direction:
      metric.current > metric.previous ? 'up' : metric.current < metric.previous ? 'down' : 'flat',
  }));

  const sections = [
    {
      key: 'overview',
      title: 'Week at a glance',
      body: `You completed ${current.tasksCompleted} tasks and ${current.habitsCompleted} habit check-ins. Your average score was ${current.averageScore}/100 with ${current.successfulDays} successful days.`,
      items: [],
    },
    {
      key: 'comparison',
      title: 'Compared with last week',
      body: `Average score ${previous.averageScore} → ${current.averageScore}. Tasks ${previous.tasksCompleted} → ${current.tasksCompleted}.`,
      items: comparison.map(
        (metric) =>
          `${metric.label}: ${metric.current} (${metric.delta >= 0 ? '+' : ''}${metric.delta})`
      ),
    },
    {
      key: 'habits',
      title: 'Habit consistency',
      body: bestHabit
        ? `Most consistent: ${bestHabit.name} at ${bestHabit.completionRate}%. Least consistent: ${leastHabit.name} at ${leastHabit.completionRate}%.`
        : 'No habit check-ins were recorded in this period.',
      items: habits.slice(0, 10).map(
        (habit) =>
          `${habit.name}: ${habit.completionRate}% (${habit.totalCompletedDays}/${habit.totalScheduledDays})`
      ),
    },
    {
      key: 'missed',
      title: 'Missed activities',
      body: `${missed.tasks.length} tasks and ${missed.habits.missed} scheduled habit check-ins were missed.`,
      items: [
        ...missed.tasks.slice(0, 8).map((task) => `Task: ${task.title}`),
        ...missed.habits.byHabit
          .filter((habit) => habit.missed > 0)
          .slice(0, 8)
          .map((habit) => `${habit.name}: ${habit.missed} missed`),
      ],
    },
    {
      key: 'streaks',
      title: 'Streak improvements',
      body: `Overall consistency streak is ${overallStreak.currentStreak} days (best ${overallStreak.longestStreak}).`,
      items: habits
        .filter((habit) => habit.currentStreak > 0)
        .slice(0, 8)
        .map((habit) => `${habit.name}: ${habit.currentStreak}-day current streak`),
    },
    {
      key: 'achievements',
      title: 'Achievements',
      body: achievements.length
        ? `${achievements.length} achievement${achievements.length === 1 ? '' : 's'} unlocked this week.`
        : 'No achievements unlocked this week.',
      items: achievements.map((achievement) => achievement.name),
    },
  ];

  const recommendations = [
    ...(leastHabit
      ? [
          {
            title: `Rebuild "${leastHabit.name}"`,
            detail: `It finished the week at ${leastHabit.completionRate}% with ${leastHabit.missedDays} missed check-ins. Reduce the target or anchor it to an existing routine.`,
            category: 'habits',
            priority: 'medium',
          },
        ]
      : []),
    ...insights.recommendations,
  ].slice(0, 5);

  return {
    title: `Weekly report · ${formatWeekLabel(startKey, endKey)}`,
    summary: `This week you completed ${current.tasksCompleted} tasks and ${current.habitsCompleted} habit check-ins, with ${current.successfulDays} successful days and an average score of ${current.averageScore}/100.`,
    sections,
    recommendations,
    metrics: {
      ...current,
      previous,
      comparison,
      habitsBest: bestHabit
        ? { name: bestHabit.name, completionRate: bestHabit.completionRate }
        : null,
      habitsLeast: leastHabit
        ? { name: leastHabit.name, completionRate: leastHabit.completionRate }
        : null,
      missedTasks: missed.tasks.length,
      missedHabits: missed.habits.missed,
      achievementsUnlocked: achievements.length,
      target: settings.dailyCompletionTarget,
    },
    insights,
  };
}

async function generateWeeklyReport(user, options = {}) {
  const settings = await getSettings(user._id);
  const today = todayKey(user.timezone);
  const currentWeekStart = startOfWeekKey(today, 1);
  let startKey = options.weekStart
    ? validateDateKey(options.weekStart, 'Week start')
    : currentWeekStart;
  startKey = startOfWeekKey(startKey, 1);

  if (startKey > currentWeekStart) {
    throw new ApiError(400, 'Weekly reports cannot be generated for a future week.');
  }

  const isCurrentWeek = startKey === currentWeekStart;
  const endKey = isCurrentWeek ? today : addDaysToKey(startKey, 6);
  const previousStart = addDaysToKey(startKey, -7);
  const previousEnd = addDaysToKey(previousStart, daysBetweenKeys(startKey, endKey));

  const [currentDays, previousDays, habitData, insights, achievements, overallStreak, habitStats] =
    await Promise.all([
      computeRange(user, startKey, endKey, { persist: false }),
      computeRange(user, previousStart, previousEnd, { persist: false }),
      getHabitStreaks(user),
      getInsights(user),
      achievementsForRange(user._id, startKey, endKey),
      getOverallStreak(user, settings),
      habitRangeStats(user, startKey, endKey),
    ]);

  const missedTasks = await Task.find({
    userId: user._id,
    status: 'pending',
    dueDate: {
      $gte: dateKeyToUTCDate(startKey),
      $lt: dateKeyToUTCDate(addDaysToKey(endKey, 1)),
    },
  })
    .select('title priority category dueDate status')
    .sort({ dueDate: 1 })
    .limit(20)
    .lean();

  const current = aggregate(currentDays);
  const previous = aggregate(previousDays);
  const content = buildWeeklyContent({
    startKey,
    endKey,
    current,
    previous,
    habits: habitData.streaks,
    insights,
    achievements,
    overallStreak,
    settings,
    missed: { tasks: missedTasks, habits: habitStats },
  });

  const narrative = options.useAI !== false
    ? await generateNarrative(
        'weekly',
        {
          ...content,
          type: 'weekly',
          periodKey: startKey,
          rangeStart: startKey,
          rangeEnd: endKey,
        },
        settings
      )
    : { status: 'skipped' };

  const payload = {
    type: 'weekly',
    periodKey: startKey,
    rangeStart: startKey,
    rangeEnd: endKey,
    title: content.title,
    summary: narrative.status === 'generated' ? narrative.summary : content.summary,
    sections: [
      ...content.sections,
      ...(narrative.status === 'generated' && narrative.highlights.length
        ? [{ key: 'ai_highlights', title: 'AI highlights', body: '', items: narrative.highlights }]
        : []),
      ...(narrative.status === 'generated' && narrative.focus.length
        ? [{ key: 'ai_focus', title: 'AI focus for next week', body: '', items: narrative.focus }]
        : []),
    ],
    recommendations: content.recommendations,
    metrics: content.metrics,
    insights: content.insights,
    source: narrative.status === 'generated' ? 'ai' : 'rules',
    aiStatus: narrative.status,
    aiError: narrative.error || '',
    model: narrative.model || '',
  };

  if (options.persist === false) return payload;
  return persistReport(user._id, payload);
}

async function ensureDailyReport(user, date) {
  const existing = await AIReport.findOne({ userId: user._id, type: 'daily', periodKey: date }).lean();
  if (existing) return existing;
  const report = await generateDailyReport(user, { date, useAI: false });
  if (report.metrics?.hasActivity === false && !report.metrics?.tasksTotal) {
    await AIReport.deleteOne({ _id: report._id });
    return null;
  }
  return report;
}

async function ensureWeeklyReport(user) {
  const today = todayKey(user.timezone);
  const currentWeekStart = startOfWeekKey(today, 1);
  const previousWeekStart = addDaysToKey(currentWeekStart, -7);
  if (previousWeekStart < '2000-01-01') return null;
  const existing = await AIReport.findOne({
    userId: user._id,
    type: 'weekly',
    periodKey: previousWeekStart,
  }).lean();
  if (existing) return existing;
  const report = await generateWeeklyReport(user, { weekStart: previousWeekStart, useAI: false });
  if (!report.metrics?.activeDays) {
    await AIReport.deleteOne({ _id: report._id });
    return null;
  }
  return report;
}

async function listReports(user, query = {}) {
  const filter = { userId: user._id };
  if (query.type === 'daily' || query.type === 'weekly') filter.type = query.type;
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
  return AIReport.find(filter).sort({ periodKey: -1, generatedAt: -1 }).limit(limit).lean();
}

async function getReport(user, reportId) {
  if (!mongoose.isValidObjectId(reportId)) {
    throw new ApiError(400, 'Invalid report identifier.');
  }
  const report = await AIReport.findOne({ _id: reportId, userId: user._id }).lean();
  if (!report) throw new ApiError(404, 'Report not found.');
  return report;
}

async function deleteReport(user, reportId) {
  if (!mongoose.isValidObjectId(reportId)) {
    throw new ApiError(400, 'Invalid report identifier.');
  }
  const report = await AIReport.findOneAndDelete({ _id: reportId, userId: user._id });
  if (!report) throw new ApiError(404, 'Report not found.');
  return report;
}

module.exports = {
  generateDailyReport,
  generateWeeklyReport,
  ensureDailyReport,
  ensureWeeklyReport,
  listReports,
  getReport,
  deleteReport,
};
