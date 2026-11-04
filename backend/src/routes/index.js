/**
 * Main Application API Router
 * Aggregates all modular sub-routers under /api prefix.
 */

const express = require('express');
const router = express.Router();

// Core System & Auth Routers
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

// Phase 07 Operations Routers
const airportRoutes = require('./airport.routes');
const flightRoutes = require('./flight.routes');
const passengerRoutes = require('./passenger.routes');
const bookingRoutes = require('./booking.routes');
const checkinRoutes = require('./checkin.routes');
const baggageRoutes = require('./baggage.routes');
const gateRoutes = require('./gate.routes');
const employeeRoutes = require('./employee.routes');
const aadeRoutes = require('./aade.routes');

// Health Check API
router.use('/health', healthRoutes);

// Authentication & Profile API
router.use('/auth', authRoutes);

// Administrator User & Role Management API
router.use('/admin', adminRoutes);

// Module 1: Airports, Airlines, Aircraft
router.use('/', airportRoutes);

// Module 2: Flights
router.use('/flights', flightRoutes);

// Module 3: Passengers
router.use('/passengers', passengerRoutes);

// Module 4: Bookings & Tickets
router.use('/bookings', bookingRoutes);

// Module 5: Check-in Operations
router.use('/checkin', checkinRoutes);

// Module 6: Baggage Tracking
router.use('/baggage', baggageRoutes);

// Module 7: Gate Management
router.use('/gates', gateRoutes);

// Module 8: Employee & Workforce Management
router.use('/employees', employeeRoutes);

// Phase 08: Autonomous Airport Data Engine (AADE)
router.use('/aade', aadeRoutes);

module.exports = router;
