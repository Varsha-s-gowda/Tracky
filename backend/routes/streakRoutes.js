const express = require('express');
const streakController = require('../controllers/streakController');

const router = express.Router();

router.get('/overview', streakController.getOverview);
router.get('/:habitId', streakController.getHabitStreak);

module.exports = router;
