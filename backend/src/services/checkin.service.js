/**
 * Module 5: Check-in Operations Service
 * Validates ticket eligibility, prevents duplicate check-ins,
 * assigns seats, and issues unique digital boarding passes.
 */

const db = require('./database.service');
const store = require('./operations.store');

async function getEligibleTickets(user) {
    let tickets = store.tickets.filter(t => t.status === 'ISSUED');

    if (user.role === 'PASSENGER') {
        const userBookings = store.bookings.filter(b => b.userId === user.userId && b.status === 'CONFIRMED');
        const bookingIds = userBookings.map(b => b.bookingId);
        tickets = tickets.filter(t => bookingIds.includes(t.bookingId));
    }

    return tickets.map(t => {
        const flightInst = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
        const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
        const passenger = store.passengers.find(p => p.passengerId === t.passengerId);

        return {
            ...t,
            flightNumber: flightInst?.flightNumber,
            flightDate: flightInst?.flightDate,
            origin: route?.originAirport,
            destination: route?.destAirport,
            passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler',
        };
    });
}

async function getAllCheckIns(user) {
    let list = store.checkin;

    if (user.role === 'PASSENGER') {
        const userBookings = store.bookings.filter(b => b.userId === user.userId);
        const bookingIds = userBookings.map(b => b.bookingId);
        const userTicketIds = store.tickets.filter(t => bookingIds.includes(t.bookingId)).map(t => t.ticketId);
        list = list.filter(c => userTicketIds.includes(c.ticketId));
    }

    return list.map(c => {
        const ticket = store.tickets.find(t => t.ticketId === c.ticketId);
        const flightInst = ticket ? store.flightInstances.find(f => f.flightInstanceId === ticket.flightInstanceId) : null;
        const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
        const passenger = ticket ? store.passengers.find(p => p.passengerId === ticket.passengerId) : null;
        const gate = c.gateId ? store.gates.find(g => g.gateId === c.gateId) : null;

        return {
            ...c,
            ticketNumber: ticket?.ticketNumber,
            seatNumber: ticket?.seatNumber,
            cabinClass: ticket?.cabinClass,
            flightNumber: flightInst?.flightNumber,
            flightDate: flightInst?.flightDate,
            origin: route?.originAirport,
            destination: route?.destAirport,
            gate: gate ? `${gate.terminal}-${gate.gateNumber}` : 'TBA',
            passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler',
        };
    });
}

async function processCheckIn(data, user) {
    const { ticketId, seatNumber } = data;

    if (!ticketId) {
        const err = new Error('Ticket ID is required for check-in.');
        err.statusCode = 400;
        throw err;
    }

    const ticket = store.tickets.find(t => t.ticketId === parseInt(ticketId, 10));
    if (!ticket) {
        const err = new Error('Ticket not found.');
        err.statusCode = 404;
        throw err;
    }

    if (ticket.status === 'CANCELLED') {
        const err = new Error('Cannot check in for a cancelled booking/ticket.');
        err.statusCode = 400;
        throw err;
    }

    // Duplicate Check-in Prevention
    const existingCheckIn = store.checkin.find(c => c.ticketId === ticket.ticketId);
    if (existingCheckIn) {
        const err = new Error(`Ticket ${ticket.ticketNumber} is already checked in (Boarding Pass: ${existingCheckIn.boardingPassCode}).`);
        err.statusCode = 409;
        throw err;
    }

    const flightInst = store.flightInstances.find(f => f.flightInstanceId === ticket.flightInstanceId);

    // Duplicate Seat Prevention on check-in seat selection
    const finalSeat = seatNumber ? seatNumber.toUpperCase() : (ticket.seatNumber || '14B');
    const existingOccupant = store.tickets.find(
        t => t.flightInstanceId === ticket.flightInstanceId &&
             t.ticketId !== ticket.ticketId &&
             t.seatNumber?.toUpperCase() === finalSeat.toUpperCase() &&
             t.status !== 'CANCELLED'
    );

    if (existingOccupant) {
        const err = new Error(`Seat ${finalSeat} is already occupied on this flight instance.`);
        err.statusCode = 409;
        throw err;
    }

    ticket.seatNumber = finalSeat;
    ticket.status = 'CHECKED_IN';

    // Generate unique Boarding Pass
    const bpCode = `BP-${flightInst?.flightNumber || 'FL'}-${finalSeat}-${Math.floor(1000 + Math.random() * 9000)}`;

    const checkInRecord = {
        checkInId: store.checkin.length + 1,
        ticketId: ticket.ticketId,
        checkInTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        boardingPassCode: bpCode,
        boardingTime: flightInst ? `${flightInst.flightDate} 00:00:00` : null,
        gateId: flightInst?.departureGateId || null,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
    };

    store.checkin.push(checkInRecord);

    return {
        checkIn: checkInRecord,
        ticket,
    };
}

module.exports = {
    getEligibleTickets,
    getAllCheckIns,
    processCheckIn,
};
