/**
 * Module 4: Booking & Ticket Management Service
 * Implements transaction-safe reservation, duplicate seat prevention,
 * 6-character PNR generation, and cancellation rollback.
 */

const crypto = require('crypto');
const db = require('./database.service');
const store = require('./operations.store');

function generatePNR() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
        pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
}

function generateTicketNumber(airlineCode = '098') {
    const random10 = Math.floor(1000000000 + Math.random() * 9000000000);
    return `${airlineCode}${random10}`;
}

async function getAllBookings(user, filters = {}) {
    let list = store.bookings;

    // Ownership filter: PASSENGER sees only their bookings
    if (user.role === 'PASSENGER') {
        list = list.filter(b => b.userId === user.userId);
    } else if (user.role === 'AIRLINE_STAFF' && user.airlineCode) {
        // Airline staff sees bookings on flights operated by their airline
        list = list.filter(b => {
            const tickets = store.tickets.filter(t => t.bookingId === b.bookingId);
            return tickets.some(t => {
                const flightInst = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
                const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
                return route?.airlineCode === user.airlineCode;
            });
        });
    }

    if (filters.pnr) {
        list = list.filter(b => b.bookingReference.toLowerCase() === filters.pnr.toLowerCase());
    }

    // Attach tickets to each booking
    return list.map(b => {
        const tickets = store.tickets.filter(t => t.bookingId === b.bookingId).map(t => {
            const flightInst = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
            const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
            const passenger = store.passengers.find(p => p.passengerId === t.passengerId);
            return {
                ...t,
                flightNumber: flightInst?.flightNumber,
                flightDate: flightInst?.flightDate,
                origin: route?.originAirport,
                destination: route?.destAirport,
                passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : null,
            };
        });

        return {
            ...b,
            tickets,
        };
    });
}

async function getBookingById(id, user) {
    const numId = parseInt(id, 10);
    const booking = store.bookings.find(b => b.bookingId === numId || b.bookingReference === id);
    if (!booking) return null;

    if (user.role === 'PASSENGER' && booking.userId !== user.userId) {
        const err = new Error('Access denied. You cannot view other passengers’ reservations.');
        err.statusCode = 403;
        throw err;
    }

    const tickets = store.tickets.filter(t => t.bookingId === booking.bookingId).map(t => {
        const flightInst = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
        const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
        const passenger = store.passengers.find(p => p.passengerId === t.passengerId);
        return {
            ...t,
            flight: {
                flightNumber: flightInst?.flightNumber,
                flightDate: flightInst?.flightDate,
                origin: route?.originAirport,
                destination: route?.destAirport,
                departureTime: route?.scheduledDepartureTime,
                arrivalTime: route?.scheduledArrivalTime,
            },
            passenger,
        };
    });

    return {
        ...booking,
        tickets,
    };
}

/**
 * Transaction-Safe Booking Creation
 * Atomically checks capacity, verifies seat uniqueness, issues booking & tickets.
 */
async function createBooking(data, user) {
    const { flightInstanceId, passengerId, cabinClass = 'ECONOMY', seatNumber } = data;

    if (!flightInstanceId) {
        const err = new Error('Flight instance ID is required to create a booking.');
        err.statusCode = 400;
        throw err;
    }

    const flightInst = store.flightInstances.find(f => f.flightInstanceId === parseInt(flightInstanceId, 10));
    if (!flightInst) {
        const err = new Error('Specified flight instance does not exist.');
        err.statusCode = 404;
        throw err;
    }

    if (['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(flightInst.status)) {
        const err = new Error(`Cannot book a flight that is ${flightInst.status}.`);
        err.statusCode = 400;
        throw err;
    }

    const route = store.flights.find(r => r.flightNumber === flightInst.flightNumber) || {};
    const aircraft = store.aircraft.find(a => a.aircraftId === flightInst.aircraftId);

    // Overbooking prevention: Check existing issued tickets for this flight
    const bookedTickets = store.tickets.filter(t => t.flightInstanceId === flightInst.flightInstanceId && t.status !== 'CANCELLED');
    const capacity = aircraft?.totalSeats || 180;
    if (bookedTickets.length >= capacity) {
        const err = new Error(`Flight instance ${flightInst.flightNumber} is fully booked (${capacity}/${capacity} seats).`);
        err.statusCode = 409;
        throw err;
    }

    // Duplicate Seat Prevention: Check if requested seat is already taken on this flight instance
    if (seatNumber) {
        const seatConflict = bookedTickets.find(t => t.seatNumber?.toUpperCase() === seatNumber.toUpperCase());
        if (seatConflict) {
            const err = new Error(`Seat ${seatNumber} has already been allocated on this flight instance.`);
            err.statusCode = 409;
            throw err;
        }
    }

    // Resolve Passenger Record
    let pId = passengerId;
    if (!pId) {
        let passenger = store.passengers.find(p => p.userId === user.userId);
        if (!passenger) {
            passenger = {
                passengerId: store.passengers.length + 1,
                userId: user.userId,
                firstName: data.firstName || 'Traveler',
                lastName: data.lastName || 'Passenger',
                passportNumber: (data.passportNumber || `P${Math.floor(1000000 + Math.random() * 9000000)}`).toUpperCase(),
                phone: data.phone || null,
                email: user.email,
                dateOfBirth: data.dateOfBirth || '1995-01-01',
                gender: data.gender || 'O',
                createdAt: new Date().toISOString(),
            };
            store.passengers.push(passenger);
        }
        pId = passenger.passengerId;
    }

    // Calculate Fare (Base fare * multiplier)
    const multiplier = cabinClass.toUpperCase() === 'BUSINESS' ? 2.5 : (cabinClass.toUpperCase() === 'FIRST' ? 4.0 : 1.0);
    const price = Math.round(route.baseFare * multiplier);

    // Generate unique PNR and Ticket Number
    let pnr = generatePNR();
    while (store.bookings.some(b => b.bookingReference === pnr)) {
        pnr = generatePNR();
    }

    const tNumber = generateTicketNumber(route.airlineCode || '098');

    // Atomic Creation
    const newBooking = {
        bookingId: store.bookings.length + 1,
        bookingReference: pnr,
        userId: user.userId,
        bookingDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        totalAmount: price,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED_SIMULATED',
        createdAt: new Date().toISOString(),
    };

    const newTicket = {
        ticketId: store.tickets.length + 1,
        bookingId: newBooking.bookingId,
        flightInstanceId: flightInst.flightInstanceId,
        passengerId: pId,
        ticketNumber: tNumber,
        seatNumber: seatNumber ? seatNumber.toUpperCase() : null,
        cabinClass: cabinClass.toUpperCase(),
        price,
        status: 'ISSUED',
        createdAt: new Date().toISOString(),
    };

    // Commit to stores
    store.bookings.push(newBooking);
    store.tickets.push(newTicket);

    return {
        booking: newBooking,
        ticket: newTicket,
    };
}

/**
 * Transaction-Safe Booking Cancellation
 */
async function cancelBooking(id, user) {
    const booking = await getBookingById(id, user);
    if (!booking) {
        const err = new Error('Booking not found.');
        err.statusCode = 404;
        throw err;
    }

    if (booking.status === 'CANCELLED') {
        const err = new Error('Booking is already cancelled.');
        err.statusCode = 400;
        throw err;
    }

    booking.status = 'CANCELLED';

    // Release all associated tickets
    store.tickets
        .filter(t => t.bookingId === booking.bookingId)
        .forEach(t => {
            t.status = 'CANCELLED';
            t.seatNumber = null; // Free up the seat
        });

    return booking;
}

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    cancelBooking,
};
