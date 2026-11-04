/**
 * Component 8: Approval-Based Action Manager
 * Enforces human-in-the-loop governance: Never modifies operational data
 * automatically without authorized staff review, double validation, and audit recording.
 */

const store = require('../operations.store');
const { recordAuditLog } = require('./audit.manager');
const { recordEvent } = require('./event.manager');
const flightService = require('../flight.service');

async function getApprovals(filters = {}) {
    let list = [...store.aadeApprovals];
    if (filters.decision && filters.decision !== 'ALL') {
        list = list.filter(a => a.decision === filters.decision.toUpperCase());
    }
    return list;
}

async function approveAction(approvalId, user, remarks = '') {
    const numId = parseInt(approvalId, 10);
    const approval = store.aadeApprovals.find(a => a.approvalId === numId);

    if (!approval) {
        const err = new Error(`Approval request #${approvalId} not found.`);
        err.statusCode = 404;
        throw err;
    }

    if (approval.decision !== 'PENDING') {
        const err = new Error(`Approval request #${approvalId} has already been decided (${approval.decision}).`);
        err.statusCode = 400;
        throw err;
    }

    const { actionType, actionPayload } = approval;
    let beforeState = null;
    let afterState = null;

    // Execute the approved operational action with re-validation
    if (actionType === 'REASSIGN_GATE') {
        const { flightInstanceId, proposedGateId } = actionPayload;
        const flightInst = store.flightInstances.find(f => f.flightInstanceId === flightInstanceId);
        if (!flightInst) {
            const err = new Error(`Target flight instance #${flightInstanceId} no longer exists.`);
            err.statusCode = 404;
            throw err;
        }

        // Re-validate target gate
        const targetGate = store.gates.find(g => g.gateId === proposedGateId);
        if (!targetGate || targetGate.status === 'MAINTENANCE') {
            const err = new Error(`Proposed gate #${proposedGateId} is not available.`);
            err.statusCode = 409;
            throw err;
        }

        beforeState = {
            flightInstanceId,
            departureGateId: flightInst.departureGateId,
        };

        // Apply reassignment
        flightInst.departureGateId = proposedGateId;
        afterState = {
            flightInstanceId,
            departureGateId: proposedGateId,
            assignedGateName: `${targetGate.terminal}-${targetGate.gateNumber}`,
        };
    } else if (actionType === 'REASSIGN_SEAT') {
        const { ticketId, proposedSeat } = actionPayload;
        const ticket = store.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) {
            const err = new Error(`Target ticket #${ticketId} no longer exists.`);
            err.statusCode = 404;
            throw err;
        }

        beforeState = { ticketId, seatNumber: ticket.seatNumber };
        ticket.seatNumber = proposedSeat;
        afterState = { ticketId, seatNumber: proposedSeat };
    } else if (actionType === 'UPDATE_FLIGHT_STATUS') {
        const { flightInstanceId, targetStatus, reason } = actionPayload;
        const flightInst = store.flightInstances.find(f => f.flightInstanceId === flightInstanceId);
        if (!flightInst) {
            const err = new Error(`Target flight instance #${flightInstanceId} no longer exists.`);
            err.statusCode = 404;
            throw err;
        }

        beforeState = { flightInstanceId, status: flightInst.status };
        await flightService.updateFlightStatus(flightInstanceId, targetStatus, reason);
        afterState = { flightInstanceId, status: targetStatus };
    } else {
        const err = new Error(`Unsupported action type: ${actionType}`);
        err.statusCode = 400;
        throw err;
    }

    // Update approval record
    approval.decision = 'APPROVED';
    approval.decisionByUserId = user?.userId || null;
    approval.decisionRemarks = remarks || 'Approved by authorized operator.';
    approval.decidedAt = new Date().toISOString();

    // Update parent recommendation if present
    if (approval.recommendationId) {
        const rec = store.aadeRecommendations.find(r => r.recommendationId === approval.recommendationId);
        if (rec) rec.status = 'EXECUTED';
    }

    // Write immutable audit log
    await recordAuditLog({
        approvalId: approval.approvalId,
        actionType,
        user,
        beforeState,
        afterState,
        executionStatus: 'SUCCESS',
        details: `Operator ${user?.email} approved: ${approval.title}. ${remarks}`,
    });

    await recordEvent({
        eventType: 'AADE_ACTION_EXECUTED',
        severity: 'INFO',
        description: `Executed approved action: ${approval.title}`,
        entityType: 'APPROVAL',
        entityId: String(approval.approvalId),
    });

    return {
        approval,
        beforeState,
        afterState,
    };
}

async function rejectAction(approvalId, user, remarks = '') {
    const numId = parseInt(approvalId, 10);
    const approval = store.aadeApprovals.find(a => a.approvalId === numId);

    if (!approval) {
        const err = new Error(`Approval request #${approvalId} not found.`);
        err.statusCode = 404;
        throw err;
    }

    if (approval.decision !== 'PENDING') {
        const err = new Error(`Approval request #${approvalId} has already been decided (${approval.decision}).`);
        err.statusCode = 400;
        throw err;
    }

    approval.decision = 'REJECTED';
    approval.decisionByUserId = user?.userId || null;
    approval.decisionRemarks = remarks || 'Rejected by operator discretion.';
    approval.decidedAt = new Date().toISOString();

    if (approval.recommendationId) {
        const rec = store.aadeRecommendations.find(r => r.recommendationId === approval.recommendationId);
        if (rec) rec.status = 'REJECTED';
    }

    await recordAuditLog({
        approvalId: approval.approvalId,
        actionType: approval.actionType,
        user,
        beforeState: null,
        afterState: null,
        executionStatus: 'SUCCESS',
        details: `Operator ${user?.email} rejected proposal #${approval.approvalId}: ${approval.title}. Remarks: ${remarks || 'None'}`,
    });

    return approval;
}

module.exports = {
    getApprovals,
    approveAction,
    rejectAction,
};
