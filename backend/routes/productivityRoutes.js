const express = require('express');
const productivityController = require('../controllers/productivityController');

const router = express.Router();

router.get('/score', productivityController.getScore);

module.exports = router;
