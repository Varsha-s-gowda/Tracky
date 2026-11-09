const mongoose = require('mongoose');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const {
  requiredString,
  optionalString,
  oneOf,
  dateKey,
  timeString,
  stringArray,
  booleanValue,
} = require('../utils/validation');
const {
  dateKeyToUTCDate,
  dateKeyFromDate,
  nextRecurrenceDateKey,
  todayKey,
} = require('../utils/date');
const rewardsService = require('./rewardsService');

const PRIORITIES = ['low', 'medium', 'high'];
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];
const STATUSES = ['pending', 'completed'];
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCreatePayload(body) {
  return {
    title: requiredString(body.title, 'Task title', { min: 1, max: 120 }),
    description: optionalString(body.description, 'Description', { max: 2000 }),
    priority: oneOf(body.priority, PRIORITIES, 'Priority', 'medium'),
    category: optionalString(body.category, 'Category', { max: 50 }) || 'General',
    tags: stringArray(body.tags, 'Tags', { maxItems: 10, maxLength: 30 }),
    dueDate: dateKeyToUTCDate(dateKey(body.dueDate, 'Due date')),
    dueTime: timeString(body.dueTime),
    recurrence: oneOf(body.recurrence, RECURRENCES, 'Recurrence', 'none'),
  };
}

function normalizeUpdatePayload(body) {
  const updates = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (has('title')) {
    updates.title = requiredString(body.title, 'Task title', { min: 1, max: 120 });
  }
  if (has('description')) {
    updates.description = optionalString(body.description, 'Description', { max: 2000 });
  }
  if (has('priority')) {
    updates.priority = oneOf(body.priority, PRIORITIES, 'Priority');
  }
  if (has('category')) {
    updates.category = optionalString(body.category, 'Category', { max: 50 }) || 'General';
  }
  if (has('tags')) {
    updates.tags = stringArray(body.tags, 'Tags', { maxItems: 10, maxLength: 30 });
  }
  if (has('dueDate')) {
    updates.dueDate = dateKeyToUTCDate(dateKey(body.dueDate, 'Due date'));
  }
  if (has('dueTime')) {
    updates.dueTime = timeString(body.dueTime);
  }
  if (has('recurrence')) {
    updates.recurrence = oneOf(body.recurrence, RECURRENCES, 'Recurrence');
  }

  return updates;
}

function sortTasks(tasks, sortBy) {
  const timeValue = (task) => task.dueTime || '23:59';

  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityDifference = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (priorityDifference !== 0) return priorityDifference;
    }

    if (sortBy === 'created') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    const dateDifference = new Date(a.dueDate) - new Date(b.dueDate);
    if (dateDifference !== 0) return dateDifference;
    return timeValue(a).localeCompare(timeValue(b));
  });
}

async function listTasks(userId, query = {}) {
  const filter = { userId };

  if (query.status && query.status !== 'all') {
    filter.status = oneOf(query.status, STATUSES, 'Status filter');
  }
  if (query.priority && query.priority !== 'all') {
    filter.priority = oneOf(query.priority, PRIORITIES, 'Priority filter');
  }
  if (query.date) {
    const rangeStart = dateKeyToUTCDate(dateKey(query.date, 'Date'));
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
    filter.dueDate = { $gte: rangeStart, $lt: rangeEnd };
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { title: search },
      { description: search },
      { category: search },
      { tags: search },
    ];
  }

  const sortBy = oneOf(query.sort, ['dueDate', 'priority', 'created'], 'Sort option', 'dueDate');
  const tasks = await Task.find(filter).limit(500).lean();

  return sortTasks(tasks, sortBy);
}

async function getOwnedTask(taskId, userId) {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new ApiError(400, 'Invalid task identifier.');
  }

  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  return task;
}

async function createTask(userId, body, user) {
  const payload = normalizeCreatePayload(body);
  const taskId = new mongoose.Types.ObjectId();

  const task = await Task.create({
    _id: taskId,
    userId,
    ...payload,
    ...(payload.recurrence !== 'none' ? { recurrenceSeriesId: taskId } : {}),
  });

  if (user) {
    await rewardsService.handleTaskDatesChanged(user, [dateKeyFromDate(task.dueDate)]);
  }

  return task;
}

async function updateTask(taskId, userId, body, user) {
  const task = await getOwnedTask(taskId, userId);
  const updates = normalizeUpdatePayload(body);
  const previousDueDate = dateKeyFromDate(task.dueDate);

  // Track how often a pending task is pushed to a later date. The AI coach uses
  // this real signal to spot work the user keeps avoiding.
  if (updates.dueDate && task.status === 'pending') {
    const nextDueDate = dateKeyFromDate(updates.dueDate);
    if (nextDueDate > previousDueDate) {
      task.postponeCount = (task.postponeCount || 0) + 1;
      task.lastPostponedAt = new Date();
    }
  }

  Object.assign(task, updates);

  if (task.recurrence === 'none') {
    task.recurrenceSeriesId = undefined;
  } else if (!task.recurrenceSeriesId) {
    task.recurrenceSeriesId = task._id;
  }

  await task.save();

  if (user) {
    const nextDueDate = dateKeyFromDate(task.dueDate);
    await rewardsService.handleTaskDatesChanged(
      user,
      previousDueDate === nextDueDate ? [nextDueDate] : [previousDueDate, nextDueDate]
    );
  }

  return task;
}

async function createTasks(user, items = []) {
  const payloads = items.map((item) => normalizeCreatePayload(item || {}));
  const documents = payloads.map((payload) => {
    const taskId = new mongoose.Types.ObjectId();
    return {
      _id: taskId,
      userId: user._id,
      ...payload,
      ...(payload.recurrence !== 'none' ? { recurrenceSeriesId: taskId } : {}),
    };
  });

  const tasks = await Task.insertMany(documents);
  const dates = [...new Set(payloads.map((payload) => dateKeyFromDate(payload.dueDate)))];
  await rewardsService.handleTaskDatesChanged(user, dates);
  return tasks;
}

async function createNextOccurrence(task, user) {
  if (task.recurrence === 'none') return null;

  if (!task.recurrenceSeriesId) {
    task.recurrenceSeriesId = task._id;
    await task.save();
  }

  const baseKey = dateKeyFromDate(task.dueDate);
  const currentDay = todayKey(user.timezone);
  let nextKey = nextRecurrenceDateKey(baseKey, task.recurrence);
  let guard = 0;

  // When completing an overdue recurring task, move forward to the next
  // occurrence that is still in the future. The guard prevents a runaway loop
  // if a task is years overdue.
  while (nextKey && nextKey <= currentDay && guard < 500) {
    nextKey = nextRecurrenceDateKey(nextKey, task.recurrence);
    guard += 1;
  }

  if (!nextKey) return null;

  const nextDueDate = dateKeyToUTCDate(nextKey);
  const existing = await Task.exists({
    userId: task.userId,
    recurrenceSeriesId: task.recurrenceSeriesId,
    dueDate: nextDueDate,
  });

  if (existing) return null;

  try {
    return await Task.create({
      userId: task.userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      tags: task.tags,
      dueDate: nextDueDate,
      dueTime: task.dueTime,
      recurrence: task.recurrence,
      status: 'pending',
      recurrenceSeriesId: task.recurrenceSeriesId,
      generatedFrom: task._id,
    });
  } catch (error) {
    // A concurrent request may have already generated this occurrence.
    if (error.code === 11000) return null;
    throw error;
  }
}

async function setTaskCompletion(taskId, userId, body, user) {
  const task = await getOwnedTask(taskId, userId);
  const currentlyCompleted = task.status === 'completed';
  const shouldComplete =
    typeof body.completed === 'boolean'
      ? booleanValue(body.completed, 'Completed')
      : !currentlyCompleted;

  if (shouldComplete && !currentlyCompleted) {
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    const nextTask = await createNextOccurrence(task, user);
    const rewards = await rewardsService.handleTaskCompletion(user, task);
    return { task, nextTask, rewards };
  }

  if (!shouldComplete && currentlyCompleted) {
    task.status = 'pending';
    task.completedAt = null;
    await task.save();
    const rewards = await rewardsService.handleTaskUndo(user, task);
    return { task, nextTask: null, rewards };
  }

  return { task, nextTask: null, rewards: null };
}

async function deleteTask(taskId, userId, user) {
  const task = await getOwnedTask(taskId, userId);
  const dueDateKey = dateKeyFromDate(task.dueDate);
  await task.deleteOne();
  if (user) {
    await rewardsService.handleTaskDatesChanged(user, [dueDateKey]);
  }
  return task;
}

module.exports = {
  listTasks,
  createTask,
  createTasks,
  updateTask,
  setTaskCompletion,
  deleteTask,
  getOwnedTask,
};
