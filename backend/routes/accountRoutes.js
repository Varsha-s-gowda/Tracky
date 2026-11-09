const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.get('/', accountController.getAccount);
router.get('/export', accountController.exportData);
router.delete('/', accountController.deleteAccount);

router.post('/goals', accountController.addGoal);
router.put('/goals/:goalId', accountController.updateGoal);
router.delete('/goals/:goalId', accountController.deleteGoal);

router.put('/working-hours', accountController.updateWorkingHours);

module.exports = router;
