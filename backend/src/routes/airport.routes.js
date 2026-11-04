/**
 * Module 1: Airport, Airline & Aircraft Management Routes
 */

const express = require('express');
const router = express.Router();
const airportController = require('../controllers/airport.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Airports
router.get('/airports', authenticateUser, airportController.getAirports);
router.get('/airports/:code', authenticateUser, airportController.getAirportByCode);
router.post('/airports', authenticateUser, authorizeRoles('ADMIN'), airportController.createAirport);
router.put('/airports/:code', authenticateUser, authorizeRoles('ADMIN'), airportController.updateAirport);

// Airlines
router.get('/airlines', authenticateUser, airportController.getAirlines);
router.get('/airlines/:code', authenticateUser, airportController.getAirlineByCode);
router.post('/airlines', authenticateUser, authorizeRoles('ADMIN'), airportController.createAirline);
router.put('/airlines/:code', authenticateUser, authorizeRoles('ADMIN'), airportController.updateAirline);

// Aircraft Fleet
router.get('/aircraft', authenticateUser, airportController.getAircraft);
router.get('/aircraft/:id', authenticateUser, airportController.getAircraftById);
router.post('/aircraft', authenticateUser, authorizeRoles('ADMIN', 'AIRLINE_STAFF'), airportController.createAircraft);
router.put('/aircraft/:id', authenticateUser, authorizeRoles('ADMIN', 'AIRLINE_STAFF'), airportController.updateAircraft);

module.exports = router;
