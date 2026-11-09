const express = require('express');
const xpController = require('../controllers/xpController');

const router = express.Router();

router.get('/', xpController.getXp);

module.exports = router;
