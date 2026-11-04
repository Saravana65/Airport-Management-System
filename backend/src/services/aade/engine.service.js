/**
 * Component 10: Central Autonomous Airport Data Engine (AADE) Service
 * Orchestrates the scheduled and on-demand monitoring cycles, health inspections,
 * conflict sweeps, alert deduplication, and recommendation generation.
 */

const healthMonitor = require('./health.monitor');
const integrityMonitor = require('./integrity.monitor');
const duplicateDetector = require('./duplicate.detector');
const conflictDetector = require('./conflict.detector');
const utilizationAnalyzer = require('./utilization.analyzer');
const eventManager = require('./event.manager');
const recommendationEngine = require('./recommendation.engine');
const approvalManager = require('./approval.manager');
const auditManager = require('./audit.manager');
const store = require('../operations.store');

let intervalHandle = null;
let isCycleRunning = false;
let totalCyclesRun = 0;
let lastCycleTime = null;
let engineStartedAt = new Date().toISOString();

async function runMonitoringCycle() {
    if (isCycleRunning) {
        console.log('[AADE] Previous monitoring cycle still active; skipping overlapping run.');
        return null;
    }

    isCycleRunning = true;
    const startTime = Date.now();

    try {
        // 1. Database & Table Health Sweep
        const health = await healthMonitor.checkDatabaseHealth();

        // 2. Relational Integrity Scan
        const integrityIssues = await integrityMonitor.scanDataIntegrity();

        // 3. Duplicate Booking & Seat Collision Scan
        const duplicateIssues = await duplicateDetector.scanDuplicateBookings();

        // 4. Flight & Gate Conflict Scan
        const conflicts = await conflictDetector.scanConflicts();

        // 5. Resource Utilization Telemetry
        const utilization = await utilizationAnalyzer.analyzeResourceUtilization();

        // 6. Alert Creation with Cryptographic Deduplication
        for (const issue of integrityIssues) {
            await eventManager.createOrUpdateAlert({
                alertType: issue.issueCode,
                severity: issue.severity,
                title: `Data Integrity: ${issue.issueCode}`,
                message: issue.message,
                entityType: issue.entityType,
                entityId: issue.entityId,
            });
        }

        for (const dup of duplicateIssues) {
            await eventManager.createOrUpdateAlert({
                alertType: dup.issueCode,
                severity: dup.severity,
                title: `Booking Anomaly: ${dup.issueCode}`,
                message: dup.message,
                entityType: dup.entityType,
                entityId: dup.entityId,
            });
        }

        for (const conf of conflicts) {
            await eventManager.createOrUpdateAlert({
                alertType: conf.conflictType,
                severity: conf.severity,
                title: `Airside Conflict: ${conf.conflictType}`,
                message: conf.message,
                entityType: 'GATES',
                entityId: String(conf.gateId),
            });
        }

        // 7. Rule-Based Recommendation & Approval Generation
        const newRecommendations = await recommendationEngine.generateRecommendations(
            conflicts,
            duplicateIssues,
            integrityIssues
        );

        totalCyclesRun++;
        lastCycleTime = new Date().toISOString();
        const durationMs = Date.now() - startTime;

        // Log cycle completion event
        await eventManager.recordEvent({
            eventType: 'AADE_CYCLE_COMPLETED',
            severity: 'INFO',
            description: `Monitoring cycle #${totalCyclesRun} completed in ${durationMs}ms. Detected ${conflicts.length} conflicts, ${duplicateIssues.length} duplicate issues, ${integrityIssues.length} integrity issues. Generated ${newRecommendations.length} recommendations.`,
        });

        return {
            cycleNumber: totalCyclesRun,
            durationMs,
            timestamp: lastCycleTime,
            summary: {
                healthStatus: health.overallStatus,
                conflictsDetected: conflicts.length,
                duplicateIssuesDetected: duplicateIssues.length,
                integrityIssuesDetected: integrityIssues.length,
                newRecommendationsGenerated: newRecommendations.length,
                activeAlertsCount: store.aadeAlerts.filter(a => a.status === 'ACTIVE').length,
                pendingApprovalsCount: store.aadeApprovals.filter(a => a.decision === 'PENDING').length,
            },
            health,
            conflicts,
            duplicateIssues,
            integrityIssues,
            utilization,
        };
    } catch (err) {
        console.error('[AADE Error] Monitoring cycle encountered an error:', err.message);
        healthMonitor.recordFailedOperation();
        return null;
    } finally {
        isCycleRunning = false;
    }
}

function startEngine(intervalMs = 30000) {
    if (intervalHandle) {
        console.log('[AADE] Engine is already running.');
        return;
    }
    console.log(`[AADE] Starting Autonomous Airport Data Engine (Interval: ${intervalMs}ms)...`);
    // Run an initial cycle immediately
    runMonitoringCycle();
    intervalHandle = setInterval(runMonitoringCycle, intervalMs);
}

function stopEngine() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log('[AADE] Autonomous Airport Data Engine stopped.');
    }
}

function getEngineStatus() {
    return {
        status: intervalHandle ? 'ACTIVE' : 'IDLE',
        engineStartedAt,
        totalCyclesRun,
        lastCycleTime,
        isCycleRunning,
        activeAlertsCount: store.aadeAlerts.filter(a => a.status === 'ACTIVE').length,
        pendingApprovalsCount: store.aadeApprovals.filter(a => a.decision === 'PENDING').length,
        recommendationsCount: store.aadeRecommendations.length,
        auditLogsCount: store.aadeAuditLogs.length,
    };
}

module.exports = {
    runMonitoringCycle,
    startEngine,
    stopEngine,
    getEngineStatus,
    healthMonitor,
    integrityMonitor,
    duplicateDetector,
    conflictDetector,
    utilizationAnalyzer,
    eventManager,
    recommendationEngine,
    approvalManager,
    auditManager,
};
