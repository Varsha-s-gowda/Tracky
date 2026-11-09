const asyncHandler = require('../utils/asyncHandler');
const aiProvider = require('../services/aiProviderService');
const insightService = require('../services/insightService');
const reportService = require('../services/reportService');
const plannerService = require('../services/plannerService');
const chatService = require('../services/chatService');
const { clearContextCache } = require('../services/aiContextService');

const getStatus = asyncHandler(async (_req, res) => {
  res.json({ ai: aiProvider.getStatus() });
});

const getInsights = asyncHandler(async (req, res) => {
  const insights = await insightService.getInsights(req.user);
  res.json({ insights });
});

const generateDailyReport = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const report = await reportService.generateDailyReport(req.user, {
    date: body.date,
    useAI: body.useAI !== false,
  });
  res.status(201).json({ report });
});

const generateWeeklyReport = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const report = await reportService.generateWeeklyReport(req.user, {
    weekStart: body.weekStart,
    useAI: body.useAI !== false,
  });
  res.status(201).json({ report });
});

const listReports = asyncHandler(async (req, res) => {
  const reports = await reportService.listReports(req.user, req.query);
  res.json({ reports });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.user, req.params.id);
  res.json({ report });
});

const deleteReport = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.user, req.params.id);
  res.json({ message: 'Report deleted.' });
});

const planTasks = asyncHandler(async (req, res) => {
  const plan = await plannerService.planGoal(req.user, req.body || {});
  res.json({ plan });
});

const savePlan = asyncHandler(async (req, res) => {
  const tasks = await plannerService.saveApprovedTasks(req.user, req.body || {});
  clearContextCache(req.user._id);
  res.status(201).json({ tasks, count: tasks.length });
});

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.listConversations(req.user);
  res.json({ conversations });
});

const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createConversation(req.user, req.body || {});
  res.status(201).json({ conversation });
});

const getConversation = asyncHandler(async (req, res) => {
  const result = await chatService.getConversation(req.user, req.params.id);
  res.json(result);
});

const deleteConversation = asyncHandler(async (req, res) => {
  await chatService.deleteConversation(req.user, req.params.id);
  res.json({ message: 'Conversation deleted.' });
});

const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage(req.user, req.body || {}, req.params.id);
  res.status(201).json(result);
});

module.exports = {
  getStatus,
  getInsights,
  generateDailyReport,
  generateWeeklyReport,
  listReports,
  getReport,
  deleteReport,
  planTasks,
  savePlan,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendMessage,
};
