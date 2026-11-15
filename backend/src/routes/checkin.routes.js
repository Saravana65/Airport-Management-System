/**
 * Module 5: Check-in Operations Routes
 */

const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/eligible', checkinController.getEligibleTickets);
router.get('/retrieve', checkinController.retrieveBooking);
router.get('/staff/overview', authorizeRoles('ADMIN', 'AIRLINE_STAFF', 'AIRPORT_STAFF'), checkinController.getStaffCheckInOverview);
router.get('/', checkinController.getCheckIns);
router.post('/', checkinController.processCheckIn);

module.exports = router;
