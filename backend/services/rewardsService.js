const HabitLog = require('../models/HabitLog');
const { dateKeyFromDate, todayKey } = require('../utils/date');
const xpService = require('./xpService');
const streakService = require('./streakService');
const achievementService = require('./achievementService');
const productivityService = require('./productivityService');

function plainAwards(awards) {
  return awards
    .filter(Boolean)
    .map((award) => ({
      _id: award._id,
      type: award.type,
      amount: award.amount,
      description: award.description,
      dateKey: award.dateKey,
    }));
}

async function handleTaskCompletion(user, task) {
  const dueDateKey = dateKeyFromDate(task.dueDate);
  const completionDateKey = todayKey(user.timezone);

  const awards = await Promise.all([
    xpService.awardTaskCompletion(user, task, completionDateKey),
    xpService.awardDailyTaskBonus(user, dueDateKey),
  ]);

  await productivityService.recomputeDates(user, [dueDateKey, completionDateKey]);
  const achievementResult = await achievementService.evaluateAchievements(user, { notify: true });
  const xp = await xpService.getXpSnapshot(user);

  const plain = plainAwards(awards);

  return {
    xpAwards: plain,
    xpEarned: plain.reduce((total, award) => total + award.amount, 0),
    newlyUnlocked: achievementResult.newlyUnlocked,
    xp,
  };
}

async function handleTaskUndo(user, task) {
  const dueDateKey = dateKeyFromDate(task.dueDate);
  await productivityService.recomputeDates(user, [dueDateKey, todayKey(user.timezone)]);
  return { xpAwards: [], xpEarned: 0, newlyUnlocked: [] };
}

async function handleTaskDatesChanged(user, dateKeys) {
  await productivityService.recomputeDates(user, dateKeys);
}

async function handleHabitLog(user, habit, dateKeyValue, completed) {
  if (!completed) {
    await productivityService.recomputeDay(user, dateKeyValue);
    return { xpAwards: [], xpEarned: 0, newlyUnlocked: [], xp: null };
  }

  const awards = [await xpService.awardHabitCompletion(user, habit, dateKeyValue)];

  const logs = await HabitLog.find({
    userId: user._id,
    habitId: habit._id,
    completed: true,
  })
    .select('date')
    .lean();
  const today = todayKey(user.timezone);
  const completedKeys = new Set(
    logs
      .map((log) => dateKeyFromDate(log.date))
      .filter((key) => key <= today)
  );
  const streak = streakService.calculateHabitStreak(habit, completedKeys, today, user.timezone);

  const best = Math.max(streak.currentStreak, streak.longestStreak);
  if (best >= 7) {
    awards.push(await xpService.awardHabitStreakBonus(user, habit, 7, dateKeyValue));
  }
  if (best >= 30) {
    awards.push(await xpService.awardHabitStreakBonus(user, habit, 30, dateKeyValue));
  }

  await productivityService.recomputeDay(user, dateKeyValue);
  const achievementResult = await achievementService.evaluateAchievements(user, { notify: true });
  const xp = await xpService.getXpSnapshot(user);

  const plain = plainAwards(awards);

  return {
    xpAwards: plain,
    xpEarned: plain.reduce((total, award) => total + award.amount, 0),
    newlyUnlocked: achievementResult.newlyUnlocked,
    xp,
    streak,
  };
}

module.exports = {
  handleTaskCompletion,
  handleTaskUndo,
  handleTaskDatesChanged,
  handleHabitLog,
};
