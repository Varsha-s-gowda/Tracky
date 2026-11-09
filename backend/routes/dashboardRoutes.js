const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/today', dashboardController.getToday);

module.exports = router;
