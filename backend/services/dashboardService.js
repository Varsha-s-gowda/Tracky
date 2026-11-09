const Task = require('../models/Task');
const { todayKey, dayRange, addDaysToKey } = require('../utils/date');
const { getHabitsForDate } = require('./habitService');

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function sortTodayTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
    const priorityDifference = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (priorityDifference !== 0) return priorityDifference;
    return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
  });
}

async function getDashboard(user) {
  const date = todayKey(user.timezone);
  const todayRange = dayRange(date);
  const upcomingStart = dayRange(addDaysToKey(date, 1)).start;
  const upcomingEnd = dayRange(addDaysToKey(date, 8)).start;

  const [todayTasks, upcomingTasks, allHabits] = await Promise.all([
    Task.find({
      userId: user._id,
      dueDate: { $gte: todayRange.start, $lt: todayRange.end },
    }).lean(),
    Task.find({
      userId: user._id,
      status: 'pending',
      dueDate: { $gte: upcomingStart, $lt: upcomingEnd },
    })
      .sort({ dueDate: 1, dueTime: 1 })
      .limit(5)
      .lean(),
    getHabitsForDate(user._id, date),
  ]);

  const sortedTasks = sortTodayTasks(todayTasks);
  const todayHabits = allHabits.filter((habit) => habit.scheduledToday);
  const completedTasks = todayTasks.filter((task) => task.status === 'completed').length;
  const pendingTasks = todayTasks.length - completedTasks;
  const completedHabits = todayHabits.filter((habit) => habit.completedToday).length;

  const totalTasks = todayTasks.length;
  const totalHabits = todayHabits.length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const habitCompletionRate = totalHabits
    ? Math.round((completedHabits / totalHabits) * 100)
    : 0;
  const totalItems = totalTasks + totalHabits;
  const completedItems = completedTasks + completedHabits;
  const overallCompletionRate = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  return {
    date,
    timezone: user.timezone,
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      taskCompletionRate,
      totalHabits,
      completedHabits,
      habitCompletionRate,
      totalItems,
      completedItems,
      overallCompletionRate,
    },
    todayTasks: sortedTasks,
    todayHabits,
    upcomingTasks,
    progress: {
      taskCompletionRate,
      habitCompletionRate,
      overallCompletionRate,
      completedItems,
      totalItems,
    },
  };
}

module.exports = { getDashboard };
