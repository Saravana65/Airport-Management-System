/**
 * Phase 09: Multi-Language Integration Router
 * Endpoints for C Algorithm Engine (Gates, Runway Queue, Baggage Routing)
 * and Java OOP Services (Bookings, State Machine, Dynamic Pricing).
 */

const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Protect all integration endpoints with authentication
router.use(authenticateUser);

const ALL_ROLES = ['ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF', 'PASSENGER'];
const STAFF_ROLES = ['ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF'];

// Status & Telemetry
router.get('/status', authorizeRoles(...ALL_ROLES), (req, res) => integrationController.getIntegrationStatus(req, res));

// C Algorithm Engine Endpoints
router.get('/c/gate-allocation', authorizeRoles(...STAFF_ROLES), (req, res) => integrationController.getGateAllocation(req, res));
router.get('/c/runway-queue', authorizeRoles(...STAFF_ROLES), (req, res) => integrationController.getRunwayPriorityQueue(req, res));
router.get('/c/baggage-routing', authorizeRoles(...STAFF_ROLES), (req, res) => integrationController.getBaggageRouting(req, res));

// Java OOP Microservice Endpoints
router.get('/java/bookings', authorizeRoles(...ALL_ROLES), (req, res) => integrationController.getJavaBookings(req, res));
router.get('/java/bookings/:id', authorizeRoles(...ALL_ROLES), (req, res) => integrationController.getJavaBookingById(req, res));
router.post('/java/bookings', authorizeRoles(...ALL_ROLES), (req, res) => integrationController.createJavaBooking(req, res));
router.post('/java/bookings/:id/transition', authorizeRoles(...STAFF_ROLES), (req, res) => integrationController.transitionJavaBooking(req, res));
router.post('/java/pricing/calculate', authorizeRoles(...ALL_ROLES), (req, res) => integrationController.calculateJavaPricing(req, res));

module.exports = router;
