/**
 * Component 9: Audit History Manager
 * Maintains an immutable append-only execution log for all autonomous
 * interventions, human approvals, and state modifications.
 */

const store = require('../operations.store');

async function recordAuditLog({
    approvalId = null,
    actionType,
    user,
    beforeState,
    afterState,
    executionStatus = 'SUCCESS',
    details,
}) {
    const audit = {
        auditId: store.aadeAuditLogs.length + 1,
        approvalId,
        actionType,
        executedByUserId: user?.userId || null,
        executedByEmail: user?.email || 'SYSTEM_DAEMON',
        beforeState: beforeState || null,
        afterState: afterState || null,
        executionStatus,
        details,
        executedAt: new Date().toISOString(),
    };

    store.aadeAuditLogs.unshift(audit);
    return audit;
}

async function getAuditLogs(limit = 100) {
    return [...store.aadeAuditLogs].slice(0, limit);
}

module.exports = {
    recordAuditLog,
    getAuditLogs,
};
