/**
 * Component 7: Rule-Based Recommendation Engine
 * Generates transparent, human-explainable corrective recommendations for detected anomalies.
 * Explains: What was detected, why it matters, suggested action, and affected records.
 */

const store = require('../operations.store');

async function generateRecommendations(conflicts = [], duplicates = [], integrityIssues = []) {
    const newRecommendations = [];

    // 1. Process Gate Conflicts
    for (const conf of conflicts) {
        if (conf.conflictType === 'OVERLAPPING_GATE_ASSIGNMENT') {
            const { gateId, conflictingFlightInstanceId, conflictingFlight, primaryFlight } = conf.details;

            // Find current gate details
            const currentGate = store.gates.find(g => g.gateId === gateId);
            const airportCode = currentGate?.airportCode || 'BOM';

            // Find an alternative available gate at the same airport
            const candidateGate = store.gates.find(
                g => g.airportCode === airportCode &&
                     g.gateId !== gateId &&
                     g.status === 'AVAILABLE'
            );

            if (candidateGate) {
                const rec = {
                    recommendationId: store.aadeRecommendations.length + 1,
                    category: 'GATE_ALLOCATION',
                    title: `Reassign Flight ${conflictingFlight} to Gate ${candidateGate.terminal}-${candidateGate.gateNumber}`,
                    detectedIssue: `Stand conflict: Both ${primaryFlight} and ${conflictingFlight} are scheduled for Gate ${currentGate ? `${currentGate.terminal}-${currentGate.gateNumber}` : gateId}.`,
                    rationale: `Aerobridge overlap will cause airside ground gridlock. Gate ${candidateGate.terminal}-${candidateGate.gateNumber} is clear and available in the same airport.`,
                    suggestedAction: `Reallocate departure gate for Flight ${conflictingFlight} from Gate ${currentGate ? currentGate.gateNumber : gateId} to Gate ${candidateGate.gateNumber}.`,
                    actionType: 'REASSIGN_GATE',
                    actionPayload: {
                        flightInstanceId: conflictingFlightInstanceId,
                        flightNumber: conflictingFlight,
                        currentGateId: gateId,
                        proposedGateId: candidateGate.gateId,
                        proposedGateName: `${candidateGate.terminal}-${candidateGate.gateNumber}`,
                    },
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                };

                // Prevent duplicate recommendation
                const alreadyExists = store.aadeRecommendations.some(
                    r => r.actionType === 'REASSIGN_GATE' &&
                         r.actionPayload.flightInstanceId === conflictingFlightInstanceId &&
                         r.status === 'PENDING'
                );

                if (!alreadyExists) {
                    store.aadeRecommendations.unshift(rec);
                    newRecommendations.push(rec);

                    // Automatically enqueue for Human Approval
                    const approval = {
                        approvalId: store.aadeApprovals.length + 1,
                        recommendationId: rec.recommendationId,
                        actionType: rec.actionType,
                        title: rec.title,
                        description: rec.suggestedAction,
                        actionPayload: rec.actionPayload,
                        decision: 'PENDING',
                        decisionByUserId: null,
                        decisionRemarks: null,
                        requestedAt: new Date().toISOString(),
                        decidedAt: null,
                    };
                    store.aadeApprovals.unshift(approval);
                }
            }
        }

        if (conf.conflictType === 'GATE_IN_MAINTENANCE') {
            const { flightInstanceId, flightNumber, gateId } = conf.details;
            const currentGate = store.gates.find(g => g.gateId === gateId);
            const candidateGate = store.gates.find(g => g.airportCode === currentGate?.airportCode && g.status === 'AVAILABLE');

            if (candidateGate) {
                const rec = {
                    recommendationId: store.aadeRecommendations.length + 1,
                    category: 'GATE_MAINTENANCE_RELOCATION',
                    title: `Relocate Flight ${flightNumber} from Closed Gate ${currentGate.gateNumber}`,
                    detectedIssue: `Flight ${flightNumber} assigned to stand under MAINTENANCE.`,
                    rationale: `Aircraft cannot embark at a closed maintenance aerobridge.`,
                    suggestedAction: `Move flight to open Gate ${candidateGate.terminal}-${candidateGate.gateNumber}.`,
                    actionType: 'REASSIGN_GATE',
                    actionPayload: {
                        flightInstanceId,
                        flightNumber,
                        currentGateId: gateId,
                        proposedGateId: candidateGate.gateId,
                        proposedGateName: `${candidateGate.terminal}-${candidateGate.gateNumber}`,
                    },
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                };

                const alreadyExists = store.aadeRecommendations.some(
                    r => r.actionType === 'REASSIGN_GATE' &&
                         r.actionPayload.flightInstanceId === flightInstanceId &&
                         r.status === 'PENDING'
                );

                if (!alreadyExists) {
                    store.aadeRecommendations.unshift(rec);
                    newRecommendations.push(rec);

                    store.aadeApprovals.unshift({
                        approvalId: store.aadeApprovals.length + 1,
                        recommendationId: rec.recommendationId,
                        actionType: rec.actionType,
                        title: rec.title,
                        description: rec.suggestedAction,
                        actionPayload: rec.actionPayload,
                        decision: 'PENDING',
                        decisionByUserId: null,
                        decisionRemarks: null,
                        requestedAt: new Date().toISOString(),
                        decidedAt: null,
                    });
                }
            }
        }

        if (conf.conflictType === 'UNRECORDED_FLIGHT_DELAY') {
            const { flightInstanceId, flightNumber } = conf.details;
            const rec = {
                recommendationId: store.aadeRecommendations.length + 1,
                category: 'FLIGHT_STATUS_CORRECTION',
                title: `Transition Flight ${flightNumber} Status to DELAYED`,
                detectedIssue: `Flight ${flightNumber} scheduled departure time elapsed by >45 minutes.`,
                rationale: `Keeping flight as SCHEDULED distorts airport departure board telemetry and misleads passengers.`,
                suggestedAction: `Update flight status to DELAYED and publish automated notification to passengers.`,
                actionType: 'UPDATE_FLIGHT_STATUS',
                actionPayload: {
                    flightInstanceId,
                    flightNumber,
                    targetStatus: 'DELAYED',
                    reason: 'AADE detected operational departure schedule overrun',
                },
                status: 'PENDING',
                createdAt: new Date().toISOString(),
            };

            const alreadyExists = store.aadeRecommendations.some(
                r => r.actionType === 'UPDATE_FLIGHT_STATUS' &&
                     r.actionPayload.flightInstanceId === flightInstanceId &&
                     r.status === 'PENDING'
            );

            if (!alreadyExists) {
                store.aadeRecommendations.unshift(rec);
                newRecommendations.push(rec);

                store.aadeApprovals.unshift({
                    approvalId: store.aadeApprovals.length + 1,
                    recommendationId: rec.recommendationId,
                    actionType: rec.actionType,
                    title: rec.title,
                    description: rec.suggestedAction,
                    actionPayload: rec.actionPayload,
                    decision: 'PENDING',
                    decisionByUserId: null,
                    decisionRemarks: null,
                    requestedAt: new Date().toISOString(),
                    decidedAt: null,
                });
            }
        }
    }

    // 2. Process Duplicate Seat Collisions
    for (const dup of duplicates) {
        if (dup.issueCode === 'DUPLICATE_SEAT_ASSIGNMENT') {
            const { flightInstanceId, flightNumber, seatNumber, conflictingTicketIds } = dup.details;
            const secondaryTicketId = conflictingTicketIds[1];

            // Propose alternate seat (e.g. 14B)
            const targetSeat = `${parseInt(seatNumber, 10) || 14}B`;

            const rec = {
                recommendationId: store.aadeRecommendations.length + 1,
                category: 'SEAT_COLLISION_RESOLUTION',
                title: `Reassign Duplicate Seat ${seatNumber} on Flight ${flightNumber}`,
                detectedIssue: `Two active tickets (${conflictingTicketIds.join(', ')}) hold identical seat ${seatNumber}.`,
                rationale: `Dual assignment will trigger a physical passenger boarding conflict at the aerobridge.`,
                suggestedAction: `Reallocate Ticket #${secondaryTicketId} to alternate unallocated Seat ${targetSeat}.`,
                actionType: 'REASSIGN_SEAT',
                actionPayload: {
                    ticketId: secondaryTicketId,
                    flightInstanceId,
                    currentSeat: seatNumber,
                    proposedSeat: targetSeat,
                },
                status: 'PENDING',
                createdAt: new Date().toISOString(),
            };

            const alreadyExists = store.aadeRecommendations.some(
                r => r.actionType === 'REASSIGN_SEAT' &&
                     r.actionPayload.ticketId === secondaryTicketId &&
                     r.status === 'PENDING'
            );

            if (!alreadyExists) {
                store.aadeRecommendations.unshift(rec);
                newRecommendations.push(rec);

                store.aadeApprovals.unshift({
                    approvalId: store.aadeApprovals.length + 1,
                    recommendationId: rec.recommendationId,
                    actionType: rec.actionType,
                    title: rec.title,
                    description: rec.suggestedAction,
                    actionPayload: rec.actionPayload,
                    decision: 'PENDING',
                    decisionByUserId: null,
                    decisionRemarks: null,
                    requestedAt: new Date().toISOString(),
                    decidedAt: null,
                });
            }
        }
    }

    return newRecommendations;
}

async function getRecommendations(filters = {}) {
    let list = [...store.aadeRecommendations];
    if (filters.status && filters.status !== 'ALL') {
        list = list.filter(r => r.status === filters.status.toUpperCase());
    }
    return list;
}

module.exports = {
    generateRecommendations,
    getRecommendations,
};
