/**
 * Component 6: Event and Alert Manager
 * Emits chronological operational events and manages active alerts with
 * deterministic cryptographic deduplication to eliminate duplicate alert spam.
 */

const crypto = require('crypto');
const store = require('../operations.store');

function generateHashKey(alertType, entityType, entityId) {
    return crypto
        .createHash('md5')
        .update(`${alertType}:${entityType || 'GLOBAL'}:${entityId || 'NONE'}`)
        .digest('hex');
}

async function recordEvent({ eventType, severity = 'INFO', description, entityType, entityId }) {
    const event = {
        eventId: store.aadeEvents.length + 1,
        eventType,
        severity,
        description,
        entityType: entityType || null,
        entityId: entityId ? String(entityId) : null,
        status: 'LOGGED',
        createdAt: new Date().toISOString(),
    };
    store.aadeEvents.push(event);
    return event;
}

async function createOrUpdateAlert({ alertType, severity = 'WARNING', title, message, entityType, entityId }) {
    const hashKey = generateHashKey(alertType, entityType, entityId);
    const existing = store.aadeAlerts.find(a => a.hashKey === hashKey && ['ACTIVE', 'ACKNOWLEDGED'].includes(a.status));

    if (existing) {
        existing.occurrenceCount = (existing.occurrenceCount || 1) + 1;
        existing.lastDetectedAt = new Date().toISOString();
        existing.message = message; // update with latest telemetry
        return { alert: existing, isNew: false };
    }

    const newAlert = {
        alertId: store.aadeAlerts.length + 1,
        hashKey,
        alertType,
        severity,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId ? String(entityId) : null,
        status: 'ACTIVE',
        occurrenceCount: 1,
        firstDetectedAt: new Date().toISOString(),
        lastDetectedAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedByUserId: null,
    };

    store.aadeAlerts.unshift(newAlert);

    // Also log to chronological event stream
    await recordEvent({
        eventType: `ALERT_${severity}`,
        severity,
        description: `Alert created: ${title}`,
        entityType,
        entityId,
    });

    return { alert: newAlert, isNew: true };
}

async function getAlerts(filters = {}) {
    let list = [...store.aadeAlerts];
    if (filters.status && filters.status !== 'ALL') {
        list = list.filter(a => a.status === filters.status.toUpperCase());
    }
    if (filters.severity) {
        list = list.filter(a => a.severity === filters.severity.toUpperCase());
    }
    return list;
}

async function getEvents(limit = 50) {
    return [...store.aadeEvents].reverse().slice(0, limit);
}

async function resolveAlert(alertId, user = null) {
    const numId = parseInt(alertId, 10);
    const alert = store.aadeAlerts.find(a => a.alertId === numId);
    if (!alert) return null;

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedByUserId = user?.userId || null;

    await recordEvent({
        eventType: 'ALERT_RESOLVED',
        severity: 'INFO',
        description: `Alert #${alert.alertId} (${alert.title}) marked as RESOLVED by ${user?.email || 'System'}.`,
        entityType: alert.entityType,
        entityId: alert.entityId,
    });

    return alert;
}

async function dismissAlert(alertId, user = null) {
    const numId = parseInt(alertId, 10);
    const alert = store.aadeAlerts.find(a => a.alertId === numId);
    if (!alert) return null;

    alert.status = 'DISMISSED';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedByUserId = user?.userId || null;

    return alert;
}

module.exports = {
    recordEvent,
    createOrUpdateAlert,
    getAlerts,
    getEvents,
    resolveAlert,
    dismissAlert,
};
