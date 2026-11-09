const ApiError = require('../utils/ApiError');
const {
  requiredString,
  optionalString,
  dateKey,
  numberInRange,
} = require('../utils/validation');
const { addDaysToKey, isValidDateKey, todayKey } = require('../utils/date');
const aiProvider = require('./aiProviderService');
const { getContext, buildPromptText } = require('./aiContextService');
const taskService = require('./taskService');

const PRIORITIES = ['low', 'medium', 'high'];
const MAX_PLAN_TASKS = 30;

function isReasonableDate(value) {
  return typeof value === 'string' && isValidDateKey(value);
}

function sanitizeTask(raw, { today, maxDate }) {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const dueDate = isReasonableDate(raw.dueDate) && raw.dueDate >= today && raw.dueDate <= maxDate
    ? raw.dueDate
    : today;

  const estimate =
    typeof raw.estimatedMinutes === 'number' && Number.isFinite(raw.estimatedMinutes)
      ? Math.min(480, Math.max(5, Math.round(raw.estimatedMinutes)))
      : null;

  return {
    title: title.slice(0, 120),
    description: typeof raw.description === 'string' ? raw.description.trim().slice(0, 1000) : '',
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    category:
      typeof raw.category === 'string' && raw.category.trim()
        ? raw.category.trim().slice(0, 50)
        : 'AI Plan',
    dueDate,
    dueTime: typeof raw.dueTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.dueTime)
      ? raw.dueTime
      : '',
    recurrence: 'none',
    estimatedMinutes: estimate,
  };
}

function sanitizePlan(data, { today, maxDate, goal, deadline }) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) {
    throw new ApiError(502, 'The AI planner returned an invalid plan.', {
      code: 'AI_INVALID_RESPONSE',
    });
  }

  const tasks = data.tasks
    .map((raw) => sanitizeTask(raw, { today, maxDate }))
    .filter(Boolean)
    .slice(0, MAX_PLAN_TASKS);

  if (!tasks.length) {
    throw new ApiError(502, 'The AI planner did not return any usable tasks.', {
      code: 'AI_INVALID_RESPONSE',
    });
  }

  // Keep the plan dates ordered so the schedule summary is predictable.
  tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const schedule = Array.isArray(data.schedule)
    ? data.schedule
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
          date: isReasonableDate(entry.date) ? entry.date : today,
          focus: typeof entry.focus === 'string' ? entry.focus.trim().slice(0, 160) : '',
          tasks: Array.isArray(entry.tasks)
            ? entry.tasks.filter((item) => typeof item === 'string').map((item) => item.slice(0, 160)).slice(0, 8)
            : [],
        }))
        .filter((entry) => entry.date >= today && entry.date <= maxDate)
        .slice(0, 60)
    : [];

  return {
    goal,
    deadline: deadline || null,
    title:
      typeof data.title === 'string' && data.title.trim()
        ? data.title.trim().slice(0, 120)
        : goal.slice(0, 120),
    summary: typeof data.summary === 'string' ? data.summary.trim().slice(0, 2000) : '',
    tasks,
    schedule,
    tips: Array.isArray(data.tips)
      ? data.tips.filter((item) => typeof item === 'string').map((item) => item.slice(0, 240)).slice(0, 6)
      : [],
  };
}

async function planGoal(user, body = {}) {
  aiProvider.ensureConfigured();

  const goal = requiredString(body.goal, 'Goal', { min: 3, max: 500 });
  const today = todayKey(user.timezone);
  const deadline = body.deadline ? dateKey(body.deadline, 'Deadline') : '';
  if (deadline && deadline <= today) {
    throw new ApiError(400, 'Deadline must be in the future.');
  }

  const maxDate = deadline || addDaysToKey(today, 90);
  if (maxDate < today) {
    throw new ApiError(400, 'The planning window is invalid.');
  }

  const dailyMinutes = body.dailyMinutes === undefined || body.dailyMinutes === ''
    ? 60
    : numberInRange(body.dailyMinutes, 'Daily planning time', { min: 15, max: 480 });

  const context = await getContext(user);

  const system = [
    'You are the Tracky AI task planner.',
    'You break a user goal into realistic, actionable tasks and a day-by-day schedule.',
    'Use the USER_DATA for context about the user\'s existing workload, habits, strengths, and working hours.',
    'Never invent tasks that conflict with the deadline. Never schedule more than the available daily planning minutes.',
    'Return strict JSON only with this exact shape:',
    '{"title": string, "summary": string, "tasks": [{"title": string, "description": string, "priority": "low"|"medium"|"high", "category": string, "dueDate": "YYYY-MM-DD", "dueTime": "HH:mm"|"", "estimatedMinutes": number}], "schedule": [{"date": "YYYY-MM-DD", "focus": string, "tasks": string[]}], "tips": string[]}',
    `Tasks must be dated between ${today} and ${maxDate}. Do not include markdown or any text outside the JSON object.`,
    `USER_DATA:\n${buildPromptText(context)}`,
  ].join('\n');

  const { data, meta } = await aiProvider.generateJson({
    system,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          goal,
          deadline: deadline || null,
          today,
          dailyMinutes,
          maxDate,
          workingHours: context.user.workingHours,
          activeGoals: context.user.goals,
        }),
      },
    ],
    temperature: 0.3,
    maxTokens: 2600,
  });

  const plan = sanitizePlan(data, { today, maxDate, goal, deadline });
  plan.provider = meta.provider;
  plan.model = meta.model;
  plan.generatedAt = new Date().toISOString();
  return plan;
}

async function saveApprovedTasks(user, body = {}) {
  const rawTasks = Array.isArray(body.tasks) ? body.tasks : [];
  if (!rawTasks.length) {
    throw new ApiError(400, 'Select at least one task to save.');
  }
  if (rawTasks.length > MAX_PLAN_TASKS) {
    throw new ApiError(400, `A plan can save at most ${MAX_PLAN_TASKS} tasks at once.`);
  }

  const goalTitle = optionalString(body.goalTitle, 'Goal title', { max: 120 });
  const today = todayKey(user.timezone);

  const normalized = rawTasks.map((task) => ({
    title: task?.title,
    description: task?.description,
    priority: task?.priority,
    category: task?.category || 'AI Plan',
    dueDate: task?.dueDate || today,
    dueTime: task?.dueTime || '',
    recurrence: 'none',
    tags: [...(Array.isArray(task?.tags) ? task.tags : []), ...(goalTitle ? ['AI Plan'] : [])],
  }));

  const tasks = await taskService.createTasks(user, normalized);
  return tasks;
}

module.exports = {
  planGoal,
  saveApprovedTasks,
  sanitizePlan,
  sanitizeTask,
  MAX_PLAN_TASKS,
  PRIORITIES,
};
