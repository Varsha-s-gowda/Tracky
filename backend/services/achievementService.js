const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Task = require('../models/Task');
const HabitLog = require('../models/HabitLog');
const XPTransaction = require('../models/XPTransaction');
const { getStreakStats } = require('./streakService');
const { getLevelInfo, getTotalXp } = require('./xpService');

const ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'first_task',
    name: 'First Task Completed',
    description: 'Complete your first task in Tracky.',
    category: 'Tasks',
    tier: 'bronze',
    icon: 'task',
    criteriaType: 'task_count',
    criteriaValue: 1,
    sortOrder: 1,
  },
  {
    key: 'first_habit',
    name: 'First Habit Completed',
    description: 'Check off your first habit for the day.',
    category: 'Habits',
    tier: 'bronze',
    icon: 'habit',
    criteriaType: 'habit_count',
    criteriaValue: 1,
    sortOrder: 2,
  },
  {
    key: 'streak_3',
    name: '3-Day Streak',
    description: 'Build a three-day streak on any habit or your daily consistency.',
    category: 'Streaks',
    tier: 'silver',
    icon: 'flame',
    criteriaType: 'streak',
    criteriaValue: 3,
    sortOrder: 3,
  },
  {
    key: 'streak_7',
    name: '7-Day Streak',
    description: 'Keep a habit or your daily consistency alive for seven days.',
    category: 'Streaks',
    tier: 'silver',
    icon: 'flame',
    criteriaType: 'streak',
    criteriaValue: 7,
    sortOrder: 4,
  },
  {
    key: 'streak_30',
    name: '30-Day Streak',
    description: 'Reach a thirty-day habit or consistency streak.',
    category: 'Streaks',
    tier: 'gold',
    icon: 'flame',
    criteriaType: 'streak',
    criteriaValue: 30,
    sortOrder: 5,
  },
  {
    key: 'tasks_100',
    name: '100 Tasks Completed',
    description: 'Complete one hundred tasks over your Tracky journey.',
    category: 'Tasks',
    tier: 'gold',
    icon: 'check',
    criteriaType: 'task_count',
    criteriaValue: 100,
    sortOrder: 6,
  },
  {
    key: 'perfect_week',
    name: 'Perfect Week',
    description: 'Meet your daily completion target seven days in a row.',
    category: 'Consistency',
    tier: 'gold',
    icon: 'calendar',
    criteriaType: 'week_streak',
    criteriaValue: 7,
    sortOrder: 7,
  },
  {
    key: 'productivity_champion',
    name: 'Productivity Champion',
    description: 'Reach Productivity Master level with 7,000 XP.',
    category: 'Levels',
    tier: 'platinum',
    icon: 'crown',
    criteriaType: 'level',
    criteriaValue: 5,
    sortOrder: 8,
  },
];

async function seedAchievements() {
  if (!ACHIEVEMENT_DEFINITIONS.length) return;
  await Achievement.bulkWrite(
    ACHIEVEMENT_DEFINITIONS.map((definition) => ({
      updateOne: {
        filter: { key: definition.key },
        update: { $set: definition },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

async function getCompletedTaskCount(userId) {
  const [currentTaskIds, xpTaskIds] = await Promise.all([
    Task.distinct('_id', { userId, status: 'completed' }),
    XPTransaction.distinct('taskId', {
      userId,
      type: 'task_completion',
      taskId: { $ne: null },
    }),
  ]);
  const unique = new Set([
    ...currentTaskIds.map((id) => String(id)),
    ...xpTaskIds.filter(Boolean).map((id) => String(id)),
  ]);
  return unique.size;
}

function progressValueFor(definition, stats) {
  switch (definition.criteriaType) {
    case 'task_count':
      return stats.completedTaskCount;
    case 'habit_count':
      return stats.habitCompletedCount;
    case 'streak':
      return stats.maxStreak;
    case 'week_streak':
      return stats.overallLongestStreak;
    case 'level':
      return stats.levelIndex + 1;
    default:
      return 0;
  }
}

async function evaluateAchievements(user, { notify = false } = {}) {
  const [definitions, completedTaskCount, habitCompletedCount, streakStats, totalXp] =
    await Promise.all([
      Achievement.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      getCompletedTaskCount(user._id),
      HabitLog.countDocuments({ userId: user._id, completed: true }),
      getStreakStats(user),
      getTotalXp(user._id),
    ]);

  if (!definitions.length) {
    await seedAchievements();
    return evaluateAchievements(user, { notify });
  }

  const level = getLevelInfo(totalXp);
  const stats = {
    completedTaskCount,
    habitCompletedCount,
    maxStreak: streakStats.maxStreak,
    overallLongestStreak: streakStats.overall.longestStreak,
    levelIndex: level.index,
  };

  const existing = await UserAchievement.find({ userId: user._id }).lean();
  const existingByKey = new Map(existing.map((item) => [item.achievementKey, item]));
  const newlyUnlocked = [];
  const achievements = [];

  for (const definition of definitions) {
    const rawProgress = progressValueFor(definition, stats);
    const previous = existingByKey.get(definition.key);
    const unlocked = Boolean(previous) || rawProgress >= definition.criteriaValue;

    if (!previous && unlocked) {
      try {
        const created = await UserAchievement.create({
          userId: user._id,
          achievementKey: definition.key,
          achievementId: definition._id,
          unlockedAt: new Date(),
          progress: {
            current: Math.min(rawProgress, definition.criteriaValue),
            target: definition.criteriaValue,
          },
        });
        existingByKey.set(definition.key, created.toObject());
        newlyUnlocked.push({ ...definition, unlockedAt: created.unlockedAt });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }

    const stored = existingByKey.get(definition.key);
    const current = Math.min(rawProgress, definition.criteriaValue);

    achievements.push({
      ...definition,
      unlocked: Boolean(stored),
      unlockedAt: stored?.unlockedAt || null,
      progress: {
        current: stored ? definition.criteriaValue : current,
        target: definition.criteriaValue,
        percent: Math.round((current / definition.criteriaValue) * 100),
      },
    });
  }

  return {
    achievements,
    newlyUnlocked: notify ? newlyUnlocked : [],
    stats: {
      completedTaskCount,
      habitCompletedCount,
      maxStreak: stats.maxStreak,
      overallLongestStreak: stats.overallLongestStreak,
      totalXp,
      level: level.name,
    },
  };
}

module.exports = {
  ACHIEVEMENT_DEFINITIONS,
  seedAchievements,
  evaluateAchievements,
  getCompletedTaskCount,
};
