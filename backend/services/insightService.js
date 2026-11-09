const { addDaysToKey, daysBetweenKeys, todayKey } = require('../utils/date');
const { getContext } = require('./aiContextService');

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

function nextMilestone(currentStreak) {
  const next = MILESTONES.find((milestone) => milestone > currentStreak);
  if (!next) return null;
  return { milestone: next, daysTo: next - currentStreak };
}

function buildInsights(context) {
  const { productivity, tasks, habits, overallStreak, settings, frequentlyMissedHabits } = context;
  const current = productivity.currentWeek;
  const previous = productivity.previousWeek;
  const target = settings.dailyCompletionTarget;
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (current.successfulDays > 0) {
    strengths.push(
      `You met your ${target}/100 daily target on ${current.successfulDays} ${
        current.successfulDays === 1 ? 'day' : 'days'
      } this week.`
    );
  }
  if (overallStreak.currentStreak >= 2) {
    strengths.push(`Your overall consistency streak is ${overallStreak.currentStreak} days.`);
  }
  if (current.habitsScheduled > 0) {
    const rate = Math.round((current.habitsCompleted / current.habitsScheduled) * 100);
    if (rate >= 70) strengths.push(`You completed ${rate}% of scheduled habit check-ins this week.`);
  }
  if (current.tasksCompleted > 0) {
    strengths.push(`You completed ${current.tasksCompleted} ${
      current.tasksCompleted === 1 ? 'task' : 'tasks'
    } this week.`);
  }
  if (previous.activeDays > 0 && current.averageScore > previous.averageScore) {
    strengths.push(
      `Your average score improved by ${current.averageScore - previous.averageScore} points versus last week.`
    );
  }

  if (current.activeDays > 0 && current.averageScore < target) {
    weaknesses.push(
      `Your weekly average score is ${current.averageScore}/100, below your ${target}/100 target.`
    );
  }
  if (tasks.missedCount > 0) {
    weaknesses.push(
      `${tasks.missedCount} ${tasks.missedCount === 1 ? 'task is' : 'tasks are'} past due and still pending.`
    );
  }
  if (current.habitsScheduled > 0) {
    const rate = Math.round((current.habitsCompleted / current.habitsScheduled) * 100);
    if (rate < 50) weaknesses.push(`Habit completion is at ${rate}% this week.`);
  }
  if (previous.activeDays > 0 && current.averageScore < previous.averageScore) {
    weaknesses.push(
      `Your average score is down ${previous.averageScore - current.averageScore} points versus last week.`
    );
  }
  if (context.tasks.overdue.length > 0) {
    weaknesses.push(`${context.tasks.overdue.length} pending ${
      context.tasks.overdue.length === 1 ? 'task is' : 'tasks are'
    } overdue.`);
  }

  if (tasks.pendingHighPriority.length > 0) {
    recommendations.push({
      id: 'pending_high_priority',
      title: 'Clear one high-priority task first',
      detail: `Start with "${tasks.pendingHighPriority[0].title}". It is due ${
        tasks.pendingHighPriority[0].dueDate || 'soon'
      } and still pending.`,
      category: 'focus',
      priority: 'high',
      link: '/tasks',
    });
  }
  if (frequentlyMissedHabits.length > 0 && current.habitsScheduled > 0) {
    const habit = frequentlyMissedHabits[0];
    recommendations.push({
      id: `habit:${habit.habitId}`,
      title: `Make "${habit.name}" easier to keep`,
      detail: `It has been missed ${habit.missedDays} ${
        habit.missedDays === 1 ? 'time' : 'times'
      } and is at ${habit.completionRate}% completion. Try a smaller target or a fixed time of day.`,
      category: 'habits',
      priority: 'medium',
      link: '/habits',
    });
  }
  if (current.averageScore < target && current.activeDays > 0) {
    recommendations.push({
      id: 'focus_block',
      title: 'Protect one focused block tomorrow',
      detail: `A single 25-minute block on your highest-priority task is the fastest way to move your daily score toward ${target}.`,
      category: 'productivity',
      priority: 'medium',
      link: '/tasks',
    });
  }
  if (tasks.frequentlyPostponed.length > 0) {
    const task = tasks.frequentlyPostponed[0];
    recommendations.push({
      id: `postponed:${task.id}`,
      title: 'Decide on a repeatedly postponed task',
      detail: `"${task.title}" has been moved ${task.postponeCount} ${
        task.postponeCount === 1 ? 'time' : 'times'
      }. Either schedule a realistic date or archive it.`,
      category: 'planning',
      priority: 'medium',
      link: '/tasks',
    });
  }

  const bestWeekday = [...context.weekdays]
    .filter((day) => day.activeDays > 0)
    .sort((a, b) => b.averageScore - a.averageScore)[0];
  const worstWeekday = [...context.weekdays]
    .filter((day) => day.activeDays > 0)
    .sort((a, b) => a.averageScore - b.averageScore)[0];

  const upcomingMilestones = [];
  for (const habit of habits) {
    const next = nextMilestone(habit.currentStreak);
    if (next && next.daysTo <= 14) {
      upcomingMilestones.push({
        type: 'habit',
        name: habit.name,
        habitId: habit.habitId,
        currentStreak: habit.currentStreak,
        milestone: next.milestone,
        daysTo: next.daysTo,
      });
    }
  }
  const nextOverall = nextMilestone(overallStreak.currentStreak);
  if (nextOverall && nextOverall.daysTo <= 14) {
    upcomingMilestones.push({
      type: 'overall',
      name: 'Overall consistency',
      currentStreak: overallStreak.currentStreak,
      milestone: nextOverall.milestone,
      daysTo: nextOverall.daysTo,
    });
  }
  upcomingMilestones.sort((a, b) => a.daysTo - b.daysTo);

  const summaryParts = [];
  if (current.activeDays > 0) {
    summaryParts.push(
      `This week you completed ${current.tasksCompleted} tasks and ${current.habitsCompleted} habit check-ins, with an average score of ${current.averageScore}/100.`
    );
  } else {
    summaryParts.push('There is no recorded activity this week yet.');
  }
  if (overallStreak.currentStreak > 0) {
    summaryParts.push(`Your overall streak is ${overallStreak.currentStreak} days.`);
  }
  if (bestWeekday) {
    summaryParts.push(`${bestWeekday.name} is currently your strongest day at ${bestWeekday.averageScore}/100.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    hasData: current.activeDays > 0 || context.tasks.last30Count > 0 || habits.length > 0,
    summary: summaryParts.join(' '),
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    recommendations: recommendations.slice(0, 5),
    bestWeekday: bestWeekday || null,
    leastProductiveWeekday: worstWeekday || null,
    scoreTrend:
      previous.activeDays === 0
        ? 'flat'
        : current.averageScore > previous.averageScore
          ? 'up'
          : current.averageScore < previous.averageScore
            ? 'down'
            : 'flat',
    scoreDelta:
      previous.activeDays === 0 ? 0 : current.averageScore - previous.averageScore,
    frequentlyMissedHabits,
    upcomingMilestones: upcomingMilestones.slice(0, 4),
    pendingHighPriority: tasks.pendingHighPriority,
    overdueTasks: tasks.overdue,
    frequentlyPostponed: tasks.frequentlyPostponed,
    bestDay: productivity.last30.bestDay
      ? {
          dateKey: productivity.last30.bestDay.dateKey,
          score: productivity.last30.bestDay.score,
          tasksCompleted: productivity.last30.bestDay.tasksCompleted,
          habitsCompleted: productivity.last30.bestDay.habitsCompleted,
        }
      : null,
    worstDay: productivity.last30.worstDay
      ? {
          dateKey: productivity.last30.worstDay.dateKey,
          score: productivity.last30.worstDay.score,
        }
      : null,
    stats: {
      tasksCompleted: current.tasksCompleted,
      tasksPending: current.tasksPending,
      habitsCompleted: current.habitsCompleted,
      habitsScheduled: current.habitsScheduled,
      averageScore: current.averageScore,
      successfulDays: current.successfulDays,
      activeDays: current.activeDays,
      overallStreak: overallStreak.currentStreak,
      level: context.xp.level,
      totalXp: context.xp.totalXp,
    },
    nextActions: {
      tasksDueTomorrow: tasks.pendingHighPriority.slice(0, 3),
      habitNames: habits
        .filter((habit) => habit.scheduledToday && !habit.completedToday)
        .slice(0, 3)
        .map((habit) => habit.name),
      pendingHabits: habits
        .filter((habit) => habit.scheduledToday && !habit.completedToday)
        .slice(0, 5)
        .map((habit) => ({ habitId: habit.habitId, name: habit.name })),
    },
  };
}

async function getInsights(user) {
  const context = await getContext(user);
  return buildInsights(context);
}

function daysUntil(dateKeyValue, timezone) {
  return daysBetweenKeys(todayKey(timezone), dateKeyValue);
}

module.exports = {
  getInsights,
  buildInsights,
  nextMilestone,
  MILESTONES,
  addDaysToKey,
  daysUntil,
};
