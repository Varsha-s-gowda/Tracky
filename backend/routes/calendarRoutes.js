const express = require('express');
const calendarController = require('../controllers/calendarController');

const router = express.Router();

router.get('/', calendarController.getCalendarView);

module.exports = router;
