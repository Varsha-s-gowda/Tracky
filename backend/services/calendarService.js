const Task = require('../models/Task');
const HabitLog = require('../models/HabitLog');
const { todayKey, monthRange } = require('../utils/date');
const { monthKey } = require('../utils/validation');

async function getCalendar(user, query = {}) {
  const fallback = todayKey(user.timezone).slice(0, 7);
  const month = monthKey(query.month, 'Month', { fallback });
  const { start, end } = monthRange(month);

  const [tasks, habitLogs] = await Promise.all([
    Task.find({
      userId: user._id,
      dueDate: { $gte: start, $lt: end },
    })
      .sort({ dueDate: 1, dueTime: 1 })
      .lean(),
    HabitLog.find({
      userId: user._id,
      date: { $gte: start, $lt: end },
      completed: true,
    })
      .populate('habitId', 'name category')
      .sort({ date: 1, completedAt: 1 })
      .lean(),
  ]);

  return {
    month,
    tasks,
    habitLogs,
    summary: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === 'completed').length,
      habitCompletions: habitLogs.length,
    },
  };
}

module.exports = { getCalendar };
