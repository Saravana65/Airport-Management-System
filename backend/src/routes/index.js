/**
 * Main Application API Router
 * Aggregates all modular sub-routers under /api prefix.
 */

const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

// Health Check API
router.use('/health', healthRoutes);

// Authentication & Profile API
router.use('/auth', authRoutes);

// Administrator User & Role Management API
router.use('/admin', adminRoutes);

module.exports = router;
