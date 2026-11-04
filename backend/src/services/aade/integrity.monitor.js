/**
 * Component 2: Data Integrity Monitor
 * Audits relational integrity, foreign key references, and operational
 * completeness across all airport entities. Never deletes or mutates records.
 */

const store = require('../operations.store');

async function scanDataIntegrity() {
    const issues = [];

    // 1. Check: Flight Instances referencing nonexistent Master Flight Routes
    for (const inst of store.flightInstances) {
        const route = store.flights.find(f => f.flightNumber === inst.flightNumber);
        if (!route) {
            issues.push({
                issueCode: 'INVALID_FLIGHT_ROUTE',
                severity: 'CRITICAL',
                entityType: 'FLIGHT_INSTANCES',
                entityId: String(inst.flightInstanceId),
                message: `Flight instance #${inst.flightInstanceId} references nonexistent master flight ${inst.flightNumber}.`,
            });
        }
    }

    // 2. Check: Flight Instances referencing nonexistent Aircraft
    for (const inst of store.flightInstances) {
        if (inst.aircraftId) {
            const plane = store.aircraft.find(a => a.aircraftId === inst.aircraftId);
            if (!plane) {
                issues.push({
                    issueCode: 'INVALID_AIRCRAFT_REF',
                    severity: 'WARNING',
                    entityType: 'FLIGHT_INSTANCES',
                    entityId: String(inst.flightInstanceId),
                    message: `Flight instance #${inst.flightInstanceId} references unknown aircraft ID #${inst.aircraftId}.`,
                });
            }
        }
    }

    // 3. Check: Tickets referencing nonexistent Bookings (Orphan Tickets)
    for (const ticket of store.tickets) {
        const booking = store.bookings.find(b => b.bookingId === ticket.bookingId);
        if (!booking) {
            issues.push({
                issueCode: 'ORPHAN_TICKET',
                severity: 'CRITICAL',
                entityType: 'TICKETS',
                entityId: String(ticket.ticketId),
                message: `Ticket #${ticket.ticketId} (${ticket.ticketNumber}) has no matching parent booking record.`,
            });
        }
    }

    // 4. Check: Baggage referencing nonexistent Tickets (Orphan Baggage)
    for (const bag of store.baggage) {
        const ticket = store.tickets.find(t => t.ticketId === bag.ticketId);
        if (!ticket) {
            issues.push({
                issueCode: 'ORPHAN_BAGGAGE',
                severity: 'CRITICAL',
                entityType: 'BAGGAGE',
                entityId: String(bag.baggageId),
                message: `Baggage tag ${bag.tagNumber} references nonexistent ticket ID #${bag.ticketId}.`,
            });
        }
    }

    // 5. Check: Gate assignments referencing nonexistent Gates
    for (const inst of store.flightInstances) {
        if (inst.departureGateId) {
            const gate = store.gates.find(g => g.gateId === inst.departureGateId);
            if (!gate) {
                issues.push({
                    issueCode: 'INVALID_GATE_LINK',
                    severity: 'WARNING',
                    entityType: 'FLIGHT_INSTANCES',
                    entityId: String(inst.flightInstanceId),
                    message: `Flight instance #${inst.flightInstanceId} assigned to invalid gate ID #${inst.departureGateId}.`,
                });
            }
        }
    }

    // 6. Check: Confirmed Bookings with Zero Tickets
    for (const b of store.bookings) {
        if (b.status === 'CONFIRMED') {
            const tCount = store.tickets.filter(t => t.bookingId === b.bookingId && t.status !== 'CANCELLED').length;
            if (tCount === 0) {
                issues.push({
                    issueCode: 'EMPTY_CONFIRMED_BOOKING',
                    severity: 'WARNING',
                    entityType: 'BOOKINGS',
                    entityId: String(b.bookingId),
                    message: `Confirmed booking ${b.bookingReference} has zero active issued tickets.`,
                });
            }
        }
    }

    return issues;
}

module.exports = {
    scanDataIntegrity,
};
