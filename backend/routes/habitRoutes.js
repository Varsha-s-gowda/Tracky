const express = require('express');
const habitController = require('../controllers/habitController');

const router = express.Router();

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/log', habitController.logHabit);

module.exports = router;
