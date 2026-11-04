/**
 * Module 5: Check-in Operations Routes
 */

const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/eligible', checkinController.getEligibleTickets);
router.get('/', checkinController.getCheckIns);
router.post('/', checkinController.processCheckIn);

module.exports = router;
