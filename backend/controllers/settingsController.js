const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settingsService');
const { clearContextCache } = require('../services/aiContextService');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id);
  res.json({ settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.user._id, req.body || {});
  clearContextCache(req.user._id);
  res.json({ settings });
});

module.exports = { getSettings, updateSettings };
