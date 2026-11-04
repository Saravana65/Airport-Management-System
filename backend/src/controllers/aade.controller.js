/**
 * Phase 08: Autonomous Airport Data Engine (AADE) Controller
 * Exposes endpoints for engine status, health, alerts, conflicts,
 * resource utilization, recommendations, human approvals, and audit trails.
 */

const engineService = require('../services/aade/engine.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getStatus(req, res, next) {
    try {
        const status = engineService.getEngineStatus();
        return successResponse(res, status, 'AADE telemetry status retrieved.');
    } catch (err) {
        next(err);
    }
}

async function getHealth(req, res, next) {
    try {
        const health = await engineService.healthMonitor.checkDatabaseHealth();
        return successResponse(res, health, 'Database and operational store health check.');
    } catch (err) {
        next(err);
    }
}

async function getAlerts(req, res, next) {
    try {
        const alerts = await engineService.eventManager.getAlerts(req.query);
        return successResponse(res, alerts, 'Active operational alerts retrieved.');
    } catch (err) {
        next(err);
    }
}

async function resolveAlert(req, res, next) {
    try {
        const alert = await engineService.eventManager.resolveAlert(req.params.id, req.user);
        if (!alert) return errorResponse(res, 'Alert not found.', 404);
        return successResponse(res, alert, `Alert #${req.params.id} marked as RESOLVED.`);
    } catch (err) {
        next(err);
    }
}

async function dismissAlert(req, res, next) {
    try {
        const alert = await engineService.eventManager.dismissAlert(req.params.id, req.user);
        if (!alert) return errorResponse(res, 'Alert not found.', 404);
        return successResponse(res, alert, `Alert #${req.params.id} DISMISSED.`);
    } catch (err) {
        next(err);
    }
}

async function getEvents(req, res, next) {
    try {
        const events = await engineService.eventManager.getEvents(req.query.limit ? parseInt(req.query.limit, 10) : 50);
        return successResponse(res, events, 'AADE event stream retrieved.');
    } catch (err) {
        next(err);
    }
}

async function getConflicts(req, res, next) {
    try {
        const conflicts = await engineService.conflictDetector.scanConflicts();
        const duplicates = await engineService.duplicateDetector.scanDuplicateBookings();
        return successResponse(res, { conflicts, duplicates }, 'Airside conflicts and booking anomalies retrieved.');
    } catch (err) {
        next(err);
    }
}

async function getUtilization(req, res, next) {
    try {
        const utilization = await engineService.utilizationAnalyzer.analyzeResourceUtilization();
        return successResponse(res, utilization, 'Resource utilization metrics calculated.');
    } catch (err) {
        next(err);
    }
}

async function getRecommendations(req, res, next) {
    try {
        const recommendations = await engineService.recommendationEngine.getRecommendations(req.query);
        return successResponse(res, recommendations, 'AADE recommendations retrieved.');
    } catch (err) {
        next(err);
    }
}

async function getApprovals(req, res, next) {
    try {
        const approvals = await engineService.approvalManager.getApprovals(req.query);
        return successResponse(res, approvals, 'AADE human approval queue retrieved.');
    } catch (err) {
        next(err);
    }
}

async function approveAction(req, res, next) {
    try {
        const result = await engineService.approvalManager.approveAction(
            req.params.id,
            req.user,
            req.body.remarks
        );
        return successResponse(res, result, 'Action approved and executed successfully.');
    } catch (err) {
        next(err);
    }
}

async function rejectAction(req, res, next) {
    try {
        const result = await engineService.approvalManager.rejectAction(
            req.params.id,
            req.user,
            req.body.remarks
        );
        return successResponse(res, result, 'Action proposal rejected.');
    } catch (err) {
        next(err);
    }
}

async function getAuditLogs(req, res, next) {
    try {
        const logs = await engineService.auditManager.getAuditLogs(req.query.limit ? parseInt(req.query.limit, 10) : 100);
        return successResponse(res, logs, 'AADE immutable audit logs retrieved.');
    } catch (err) {
        next(err);
    }
}

async function runCycle(req, res, next) {
    try {
        const cycleResult = await engineService.runMonitoringCycle();
        return successResponse(res, cycleResult, 'AADE monitoring cycle executed successfully.');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStatus,
    getHealth,
    getAlerts,
    resolveAlert,
    dismissAlert,
    getEvents,
    getConflicts,
    getUtilization,
    getRecommendations,
    getApprovals,
    approveAction,
    rejectAction,
    getAuditLogs,
    runCycle,
};
