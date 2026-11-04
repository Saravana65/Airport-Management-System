/**
 * Module 2: Flight Management Routes
 */

const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

// All authenticated users can view flights
router.get('/', flightController.getFlights);
router.get('/:id', flightController.getFlightById);

// ADMIN & AIRLINE_STAFF can create flights and update status
router.post('/', authorizeRoles('ADMIN', 'AIRLINE_STAFF'), flightController.createFlight);
router.patch('/:id/status', authorizeRoles('ADMIN', 'AIRLINE_STAFF', 'AIRPORT_STAFF'), flightController.updateFlightStatus);

module.exports = router;
