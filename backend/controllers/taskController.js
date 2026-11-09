const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/taskService');

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user._id, req.query);
  res.json({ tasks });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body || {});
  res.status(201).json({ task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user._id, req.body || {});
  res.json({ task });
});

const completeTask = asyncHandler(async (req, res) => {
  const { task, nextTask } = await taskService.setTaskCompletion(
    req.params.id,
    req.user._id,
    req.body || {},
    req.user
  );
  res.json({ task, nextTask });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user._id);
  res.json({ message: 'Task deleted successfully.' });
});

module.exports = { getTasks, createTask, updateTask, completeTask, deleteTask };
