const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.get('/status', aiController.getStatus);
router.get('/insights', aiController.getInsights);

router.get('/reports', aiController.listReports);
router.post('/reports/daily', aiController.generateDailyReport);
router.post('/reports/weekly', aiController.generateWeeklyReport);
router.get('/reports/:id', aiController.getReport);
router.delete('/reports/:id', aiController.deleteReport);

router.post('/planner/plan', aiController.planTasks);
router.post('/planner/save', aiController.savePlan);

router.get('/chat/conversations', aiController.listConversations);
router.post('/chat/conversations', aiController.createConversation);
router.get('/chat/conversations/:id', aiController.getConversation);
router.delete('/chat/conversations/:id', aiController.deleteConversation);
router.post('/chat/conversations/:id/messages', aiController.sendMessage);
router.post('/chat/messages', aiController.sendMessage);

module.exports = router;
