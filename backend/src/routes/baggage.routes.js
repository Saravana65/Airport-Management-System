/**
 * Module 6: Baggage Management Routes
 */

const express = require('express');
const router = express.Router();
const baggageController = require('../controllers/baggage.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

// Staff telemetry overview (Admin, Airport Staff, Airline Staff)
router.get('/staff/overview', authorizeRoles('ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF'), baggageController.getStaffBaggageOverview);

// All authenticated users can query baggage (passengers strictly scoped to own; staff can search/filter all)
router.get('/', baggageController.getBaggage);

// Retrieve baggage by tag number (passengers strictly scoped to own; staff can inspect any)
router.get('/:tagNumber', baggageController.getBaggageByTag);

// Register baggage (Staff can register for any valid booking; Passenger can register for their own valid booking)
router.post('/', authorizeRoles('ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF', 'PASSENGER'), baggageController.registerBaggage);

// Update baggage handling status (Staff only: ADMIN, AIRPORT_STAFF, AIRLINE_STAFF; Passengers blocked with 403)
router.patch('/:id/status', authorizeRoles('ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF'), baggageController.updateBaggageStatus);

module.exports = router;
