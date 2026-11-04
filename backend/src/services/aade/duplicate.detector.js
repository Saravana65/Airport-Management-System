/**
 * Component 3: Duplicate Booking Detector
 * Identifies duplicate booking references, seat allocation collisions on the same flight,
 * and multiple concurrent bookings by the same traveler.
 */

const store = require('../operations.store');

async function scanDuplicateBookings() {
    const issues = [];

    // 1. Check for Duplicate Booking References (PNRs)
    const pnrMap = new Map();
    for (const b of store.bookings) {
        if (!b.bookingReference) continue;
        const pnr = b.bookingReference.toUpperCase();
        if (pnrMap.has(pnr)) {
            pnrMap.get(pnr).push(b.bookingId);
        } else {
            pnrMap.set(pnr, [b.bookingId]);
        }
    }

    for (const [pnr, ids] of pnrMap.entries()) {
        if (ids.length > 1) {
            issues.push({
                issueCode: 'DUPLICATE_PNR',
                severity: 'CRITICAL',
                entityType: 'BOOKINGS',
                entityId: pnr,
                details: { pnr, conflictingBookingIds: ids },
                message: `Duplicate PNR code ${pnr} detected across booking records: ${ids.join(', ')}.`,
            });
        }
    }

    // 2. Check for Duplicate Seat Allocations on Same Flight Instance
    // Group active tickets by `${flightInstanceId}-${seatNumber}`
    const seatMap = new Map();
    for (const t of store.tickets) {
        if (t.status === 'CANCELLED' || !t.seatNumber) continue;
        const key = `${t.flightInstanceId}-${t.seatNumber.toUpperCase()}`;
        if (seatMap.has(key)) {
            seatMap.get(key).push(t);
        } else {
            seatMap.set(key, [t]);
        }
    }

    for (const [key, tickets] of seatMap.entries()) {
        if (tickets.length > 1) {
            const [flightInstId, seat] = key.split('-');
            const flightInst = store.flightInstances.find(f => f.flightInstanceId === parseInt(flightInstId, 10));
            issues.push({
                issueCode: 'DUPLICATE_SEAT_ASSIGNMENT',
                severity: 'CRITICAL',
                entityType: 'TICKETS',
                entityId: key,
                details: {
                    flightInstanceId: parseInt(flightInstId, 10),
                    flightNumber: flightInst?.flightNumber || 'UNKNOWN',
                    seatNumber: seat,
                    conflictingTicketIds: tickets.map(t => t.ticketId),
                    conflictingTicketNumbers: tickets.map(t => t.ticketNumber),
                },
                message: `Seat collision: Seat ${seat} on Flight instance #${flightInstId} (${flightInst?.flightNumber}) is claimed by ${tickets.length} tickets (${tickets.map(t => t.ticketNumber).join(', ')}).`,
            });
        }
    }

    // 3. Check for Multiple Active Bookings for Same Passenger on Same Flight
    const passengerFlightMap = new Map();
    for (const t of store.tickets) {
        if (t.status === 'CANCELLED' || !t.passengerId) continue;
        const key = `${t.flightInstanceId}-${t.passengerId}`;
        if (passengerFlightMap.has(key)) {
            passengerFlightMap.get(key).push(t.ticketId);
        } else {
            passengerFlightMap.set(key, [t.ticketId]);
        }
    }

    for (const [key, tIds] of passengerFlightMap.entries()) {
        if (tIds.length > 1) {
            const [fId, pId] = key.split('-');
            const passenger = store.passengers.find(p => p.passengerId === parseInt(pId, 10));
            issues.push({
                issueCode: 'DUPLICATE_PASSENGER_FLIGHT',
                severity: 'WARNING',
                entityType: 'PASSENGERS',
                entityId: key,
                details: { flightInstanceId: parseInt(fId, 10), passengerId: parseInt(pId, 10), ticketIds: tIds },
                message: `Passenger #${pId} (${passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler'}) holds ${tIds.length} active tickets for flight instance #${fId}.`,
            });
        }
    }

    // 4. Inconsistent Ticket/Booking Status (Active Ticket under Cancelled Booking)
    for (const t of store.tickets) {
        const booking = store.bookings.find(b => b.bookingId === t.bookingId);
        if (booking && booking.status === 'CANCELLED' && t.status !== 'CANCELLED') {
            issues.push({
                issueCode: 'INCONSISTENT_TICKET_STATUS',
                severity: 'WARNING',
                entityType: 'TICKETS',
                entityId: String(t.ticketId),
                details: { ticketId: t.ticketId, bookingId: t.bookingId },
                message: `Ticket #${t.ticketId} remains active (${t.status}) although parent booking #${t.bookingId} is CANCELLED.`,
            });
        }
    }

    return issues;
}

module.exports = {
    scanDuplicateBookings,
};
