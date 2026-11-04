/**
 * Component 4: Flight & Gate Conflict Detector
 * Detects overlapping gate allocations, assignments to unavailable stands,
 * cascading delay impacts, and invalid timetable state transitions.
 */

const store = require('../operations.store');

// Helper to convert 'HH:MM' or 'YYYY-MM-DD HH:MM:SS' into minutes of day
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes(' ')) {
        const parts = timeStr.split(' ')[1].split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

async function scanConflicts() {
    const conflicts = [];
    const BUFFER_MINUTES = 30; // standard turnaround separation

    // 1. Overlapping Gate Allocations
    // Group active flights by departureGateId
    const gateAssignments = new Map();
    for (const inst of store.flightInstances) {
        if (!inst.departureGateId || ['CANCELLED', 'ARRIVED'].includes(inst.status)) continue;
        const gateId = inst.departureGateId;
        if (!gateAssignments.has(gateId)) {
            gateAssignments.set(gateId, []);
        }
        gateAssignments.get(gateId).push(inst);
    }

    for (const [gateId, flights] of gateAssignments.entries()) {
        const gate = store.gates.find(g => g.gateId === gateId);
        if (flights.length > 1) {
            // Check all pairs for overlapping schedule windows
            for (let i = 0; i < flights.length; i++) {
                for (let j = i + 1; j < flights.length; j++) {
                    const f1 = flights[i];
                    const f2 = flights[j];

                    const t1 = timeToMinutes(f1.scheduledDeparture);
                    const t2 = timeToMinutes(f2.scheduledDeparture);

                    if (Math.abs(t1 - t2) < BUFFER_MINUTES) {
                        conflicts.push({
                            conflictType: 'OVERLAPPING_GATE_ASSIGNMENT',
                            severity: 'CRITICAL',
                            gateId,
                            gateIdentifier: gate ? `${gate.airportCode} ${gate.terminal}-${gate.gateNumber}` : `Gate #${gateId}`,
                            flightInstances: [f1.flightInstanceId, f2.flightInstanceId],
                            flightNumbers: [f1.flightNumber, f2.flightNumber],
                            message: `Stand conflict: Gate ${gate ? `${gate.terminal}-${gate.gateNumber}` : gateId} has simultaneous departure allocations for ${f1.flightNumber} and ${f2.flightNumber} within ${BUFFER_MINUTES}m turnaround buffer.`,
                            details: {
                                gateId,
                                primaryFlight: f1.flightNumber,
                                conflictingFlight: f2.flightNumber,
                                primaryFlightInstanceId: f1.flightInstanceId,
                                conflictingFlightInstanceId: f2.flightInstanceId,
                                timeDifferenceMinutes: Math.abs(t1 - t2),
                            },
                        });
                    }
                }
            }
        }
    }

    // 2. Flights Assigned to Unavailable / Maintenance Gates
    for (const inst of store.flightInstances) {
        if (!inst.departureGateId || ['CANCELLED', 'ARRIVED'].includes(inst.status)) continue;
        const gate = store.gates.find(g => g.gateId === inst.departureGateId);
        if (gate && gate.status === 'MAINTENANCE') {
            conflicts.push({
                conflictType: 'GATE_IN_MAINTENANCE',
                severity: 'CRITICAL',
                gateId: gate.gateId,
                gateIdentifier: `${gate.airportCode} ${gate.terminal}-${gate.gateNumber}`,
                flightInstances: [inst.flightInstanceId],
                flightNumbers: [inst.flightNumber],
                message: `Flight ${inst.flightNumber} is assigned to Gate ${gate.terminal}-${gate.gateNumber} which is currently closed for MAINTENANCE.`,
                details: {
                    gateId: gate.gateId,
                    flightNumber: inst.flightNumber,
                    flightInstanceId: inst.flightInstanceId,
                    gateStatus: gate.status,
                },
            });
        }
    }

    // 3. Stalled Departure Transition (Scheduled departure in past but status still SCHEDULED)
    for (const inst of store.flightInstances) {
        if (inst.status === 'SCHEDULED' && inst.scheduledDeparture) {
            const schedMins = timeToMinutes(inst.scheduledDeparture);
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();

            // If scheduled time was >45 mins ago, flag as potentially unrecorded delay
            if (currentMins > schedMins + 45 && Math.abs(currentMins - schedMins) < 720) {
                conflicts.push({
                    conflictType: 'UNRECORDED_FLIGHT_DELAY',
                    severity: 'WARNING',
                    flightInstances: [inst.flightInstanceId],
                    flightNumbers: [inst.flightNumber],
                    message: `Operational delay detected: Flight ${inst.flightNumber} scheduled departure was at ${inst.scheduledDeparture.split(' ')[1]}, but status remains SCHEDULED.`,
                    details: {
                        flightInstanceId: inst.flightInstanceId,
                        flightNumber: inst.flightNumber,
                        scheduledDeparture: inst.scheduledDeparture,
                    },
                });
            }
        }
    }

    return conflicts;
}

module.exports = {
    scanConflicts,
};
