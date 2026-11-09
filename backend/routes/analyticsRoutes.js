const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/daily', analyticsController.getDaily);
router.get('/weekly', analyticsController.getWeekly);
router.get('/monthly', analyticsController.getMonthly);
router.get('/heatmap', analyticsController.getHeatmap);

module.exports = router;
