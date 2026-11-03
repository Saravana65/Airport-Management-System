/**
 * Main Application API Router
 * Aggregates all modular sub-routers under /api prefix.
 */

const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');

// Health Check API
router.use('/health', healthRoutes);

module.exports = router;
