/**
 * Phase 08: Autonomous Airport Data Engine (AADE) Routes
 * API endpoints for health, alerts, conflicts, recommendations,
 * human approval workflows, and audit history.
 */

const express = require('express');
const router = express.Router();
const aadeController = require('../controllers/aade.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// All AADE routes require authentication
router.use(authenticateUser);

// Staff roles authorized to access monitoring and operational recommendations
const STAFF = ['ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF'];

// Engine Telemetry & Health
router.get('/status', authorizeRoles(...STAFF), aadeController.getStatus);
router.get('/health', authorizeRoles(...STAFF), aadeController.getHealth);
router.post('/run', authorizeRoles(...STAFF), aadeController.runCycle);

// Alerts & Events
router.get('/alerts', authorizeRoles(...STAFF), aadeController.getAlerts);
router.patch('/alerts/:id/resolve', authorizeRoles(...STAFF), aadeController.resolveAlert);
router.patch('/alerts/:id/dismiss', authorizeRoles(...STAFF), aadeController.dismissAlert);
router.get('/events', authorizeRoles(...STAFF), aadeController.getEvents);

// Conflicts & Utilization
router.get('/conflicts', authorizeRoles(...STAFF), aadeController.getConflicts);
router.get('/utilization', authorizeRoles(...STAFF), aadeController.getUtilization);

// Recommendations & Human-In-The-Loop Approval Workflow
router.get('/recommendations', authorizeRoles(...STAFF), aadeController.getRecommendations);
router.get('/approvals', authorizeRoles(...STAFF), aadeController.getApprovals);
router.post('/approvals/:id/approve', authorizeRoles(...STAFF), aadeController.approveAction);
router.post('/approvals/:id/reject', authorizeRoles(...STAFF), aadeController.rejectAction);

// Audit History
router.get('/audit', authorizeRoles(...STAFF), aadeController.getAuditLogs);

module.exports = router;
