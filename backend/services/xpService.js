const XPTransaction = require('../models/XPTransaction');
const Task = require('../models/Task');
const { addDaysToKey, dateKeyToUTCDate, todayKey } = require('../utils/date');

const XP_RULES = {
  TASK_COMPLETION: 10,
  HABIT_COMPLETION: 15,
  ALL_DAILY_TASKS: 20,
  HABIT_STREAK_7: 50,
  HABIT_STREAK_30: 200,
};

const LEVELS = [
  { index: 0, key: 'beginner', name: 'Beginner', minXp: 0 },
  { index: 1, key: 'consistent', name: 'Consistent', minXp: 500 },
  { index: 2, key: 'focused', name: 'Focused', minXp: 1500 },
  { index: 3, key: 'disciplined', name: 'Disciplined', minXp: 3500 },
  { index: 4, key: 'productivity_master', name: 'Productivity Master', minXp: 7000 },
];

function getLevelInfo(totalXp = 0) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const next = LEVELS[current.index + 1] || null;
  const span = next ? next.minXp - current.minXp : 1;
  const progress = next ? Math.min(100, Math.round(((xp - current.minXp) / span) * 100)) : 100;

  return {
    totalXp: xp,
    index: current.index,
    key: current.key,
    name: current.name,
    minXp: current.minXp,
    nextLevel: next ? { index: next.index, key: next.key, name: next.name, minXp: next.minXp } : null,
    xpIntoLevel: xp - current.minXp,
    xpForNextLevel: next ? next.minXp - current.minXp : 0,
    xpToNextLevel: next ? Math.max(0, next.minXp - xp) : 0,
    progress,
    isMaxLevel: !next,
  };
}

async function awardTransaction(userId, payload) {
  try {
    return await XPTransaction.create({
      userId,
      type: payload.type,
      amount: payload.amount,
      description: payload.description || '',
      taskId: payload.taskId || null,
      habitId: payload.habitId || null,
      dateKey: payload.dateKey,
      dedupeKey: payload.dedupeKey,
    });
  } catch (error) {
    // A second call for the same event is a no-op, never a duplicate reward.
    if (error.code === 11000) return null;
    throw error;
  }
}

async function awardTaskCompletion(user, task, dateKeyValue) {
  return awardTransaction(user._id, {
    type: 'task_completion',
    amount: XP_RULES.TASK_COMPLETION,
    description: `Completed “${task.title}”`,
    taskId: task._id,
    dateKey: dateKeyValue || todayKey(user.timezone),
    dedupeKey: `task_completion:${task._id}`,
  });
}

async function awardHabitCompletion(user, habit, dateKeyValue) {
  return awardTransaction(user._id, {
    type: 'habit_completion',
    amount: XP_RULES.HABIT_COMPLETION,
    description: `Completed habit “${habit.name}”`,
    habitId: habit._id,
    dateKey: dateKeyValue,
    dedupeKey: `habit_completion:${habit._id}:${dateKeyValue}`,
  });
}

async function awardDailyTaskBonus(user, dateKeyValue) {
  const start = dateKeyToUTCDate(dateKeyValue);
  const end = dateKeyToUTCDate(addDaysToKey(dateKeyValue, 1));
  const tasks = await Task.find({
    userId: user._id,
    dueDate: { $gte: start, $lt: end },
  })
    .select('status')
    .lean();

  if (!tasks.length || tasks.some((task) => task.status !== 'completed')) {
    return null;
  }

  return awardTransaction(user._id, {
    type: 'daily_all_tasks',
    amount: XP_RULES.ALL_DAILY_TASKS,
    description: 'All daily tasks completed',
    dateKey: dateKeyValue,
    dedupeKey: `daily_all_tasks:${dateKeyValue}`,
  });
}

async function awardHabitStreakBonus(user, habit, threshold, dateKeyValue) {
  if (threshold !== 7 && threshold !== 30) return null;
  const amount = threshold === 7 ? XP_RULES.HABIT_STREAK_7 : XP_RULES.HABIT_STREAK_30;
  return awardTransaction(user._id, {
    type: threshold === 7 ? 'habit_streak_7' : 'habit_streak_30',
    amount,
    description: `${threshold}-day streak: “${habit.name}”`,
    habitId: habit._id,
    dateKey: dateKeyValue,
    dedupeKey: `habit_streak_${threshold}:${habit._id}`,
  });
}

async function getTotalXp(userId) {
  const [result] = await XPTransaction.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result?.total || 0;
}

async function getXpSnapshot(user) {
  const date = todayKey(user.timezone);
  const weekStart = addDaysToKey(date, -6);
  const [total, today, week, byType] = await Promise.all([
    getTotalXp(user._id),
    XPTransaction.aggregate([
      { $match: { userId: user._id, dateKey: date } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    XPTransaction.aggregate([
      { $match: { userId: user._id, dateKey: { $gte: weekStart, $lte: date } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    XPTransaction.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalXp: total,
    level: getLevelInfo(total),
    todayXp: today[0]?.total || 0,
    weekXp: week[0]?.total || 0,
    byType: Object.fromEntries(byType.map((item) => [item._id, item.total])),
  };
}

async function getXpSummary(user, { limit = 100 } = {}) {
  const [snapshot, transactions] = await Promise.all([
    getXpSnapshot(user),
    XPTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Math.max(1, limit)))
      .select('type amount description taskId habitId dateKey createdAt')
      .lean(),
  ]);

  return {
    ...snapshot,
    levels: LEVELS,
    transactions: transactions.map((transaction) => ({
      _id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      taskId: transaction.taskId,
      habitId: transaction.habitId,
      dateKey: transaction.dateKey,
      createdAt: transaction.createdAt,
    })),
  };
}

module.exports = {
  XP_RULES,
  LEVELS,
  getLevelInfo,
  awardTaskCompletion,
  awardHabitCompletion,
  awardDailyTaskBonus,
  awardHabitStreakBonus,
  getTotalXp,
  getXpSnapshot,
  getXpSummary,
};
