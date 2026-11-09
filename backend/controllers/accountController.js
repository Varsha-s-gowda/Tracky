const asyncHandler = require('../utils/asyncHandler');
const accountService = require('../services/accountService');
const { clearContextCache } = require('../services/aiContextService');

const getAccount = asyncHandler(async (req, res) => {
  const user = await accountService.getAccount(req.user._id);
  res.json({ user });
});

const addGoal = asyncHandler(async (req, res) => {
  const goal = await accountService.addGoal(req.user._id, req.body || {});
  clearContextCache(req.user._id);
  res.status(201).json({ goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await accountService.updateGoal(req.user._id, req.params.goalId, req.body || {});
  clearContextCache(req.user._id);
  res.json({ goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  await accountService.deleteGoal(req.user._id, req.params.goalId);
  clearContextCache(req.user._id);
  res.json({ message: 'Goal deleted.' });
});

const updateWorkingHours = asyncHandler(async (req, res) => {
  const workingHours = await accountService.updateWorkingHours(req.user._id, req.body || {});
  clearContextCache(req.user._id);
  res.json({ workingHours });
});

const exportData = asyncHandler(async (req, res) => {
  const data = await accountService.exportData(req.user._id);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="tracky-export-${new Date().toISOString().slice(0, 10)}.json"`
  );
  res.json(data);
});

const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.user._id, req.body || {});
  clearContextCache(req.user._id);
  res.json({ message: 'Your account and all of your data have been deleted.' });
});

module.exports = {
  getAccount,
  addGoal,
  updateGoal,
  deleteGoal,
  updateWorkingHours,
  exportData,
  deleteAccount,
};
