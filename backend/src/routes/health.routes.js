/**
 * Health Routes
 * /api/health and /api/health/database
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.getAppHealth);
router.get('/database', healthController.getDatabaseHealth);

module.exports = router;
