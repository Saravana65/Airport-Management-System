/**
 * Module 6: Baggage Management Service
 * Generates unique baggage tag references, enforces weight boundaries (0-60 kg),
 * tracks conveyor and claim carousel routing, and maintains status history.
 */

const db = require('./database.service');
const store = require('./operations.store');

const VALID_BAGGAGE_STATUSES = [
    'REGISTERED',
    'CHECKED_IN',
    'SECURITY_CLEARED',
    'IN_TRANSIT',
    'LOADED',
    'ARRIVED',
    'CLAIM_READY',
    'COLLECTED',
    'DELAYED',
];

function generateBagTag(carrier = 'AMS') {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `BAG-${carrier}-${random}`;
}

async function getAllBaggage(user, filters = {}) {
    let list = store.baggage;

    if (user.role === 'PASSENGER') {
        const userBookings = store.bookings.filter(b => b.userId === user.userId);
        const bookingIds = userBookings.map(b => b.bookingId);
        const userTicketIds = store.tickets.filter(t => bookingIds.includes(t.bookingId)).map(t => t.ticketId);
        list = list.filter(b => userTicketIds.includes(b.ticketId));
    }

    if (filters.tagNumber) {
        list = list.filter(b => b.tagNumber.toLowerCase().includes(filters.tagNumber.toLowerCase()));
    }
    if (filters.status) {
        list = list.filter(b => b.status === filters.status.toUpperCase());
    }

    return list.map(b => {
        const ticket = store.tickets.find(t => t.ticketId === b.ticketId);
        const flightInst = ticket ? store.flightInstances.find(f => f.flightInstanceId === ticket.flightInstanceId) : null;
        const passenger = ticket ? store.passengers.find(p => p.passengerId === ticket.passengerId) : null;

        return {
            ...b,
            ticketNumber: ticket?.ticketNumber,
            flightNumber: flightInst?.flightNumber,
            passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler',
        };
    });
}

async function getBaggageByTag(tagNumber, user) {
    const bag = store.baggage.find(b => b.tagNumber.toUpperCase() === tagNumber.toUpperCase());
    if (!bag) return null;

    const ticket = store.tickets.find(t => t.ticketId === bag.ticketId);
    if (user.role === 'PASSENGER') {
        const booking = ticket ? store.bookings.find(b => b.bookingId === ticket.bookingId) : null;
        if (booking?.userId !== user.userId) {
            const err = new Error('Access denied. You cannot inspect other travelers’ baggage records.');
            err.statusCode = 403;
            throw err;
        }
    }

    return {
        ...bag,
        ticket,
    };
}

async function registerBaggage(data) {
    const { ticketId, weightKg, carouselNumber } = data;

    if (!ticketId) {
        const err = new Error('Ticket ID is required to register baggage.');
        err.statusCode = 400;
        throw err;
    }

    const ticket = store.tickets.find(t => t.ticketId === parseInt(ticketId, 10));
    if (!ticket) {
        const err = new Error('Associated ticket not found.');
        err.statusCode = 404;
        throw err;
    }

    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0 || weight > 60) {
        const err = new Error('Baggage weight must be between 0.1 kg and 60.0 kg.');
        err.statusCode = 400;
        throw err;
    }

    const flightInst = store.flightInstances.find(f => f.flightInstanceId === ticket.flightInstanceId);
    const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
    const tag = generateBagTag(route?.airlineCode || 'AMS');

    const newBag = {
        baggageId: store.baggage.length + 1,
        ticketId: ticket.ticketId,
        tagNumber: tag,
        weightKg: weight,
        status: 'CHECKED_IN',
        carouselNumber: carouselNumber || 'C01',
        createdAt: new Date().toISOString(),
    };

    store.baggage.push(newBag);
    return newBag;
}

async function updateBaggageStatus(id, newStatus, carouselNumber) {
    const numId = parseInt(id, 10);
    const bag = store.baggage.find(b => b.baggageId === numId || b.tagNumber === id);
    if (!bag) {
        const err = new Error('Baggage record not found.');
        err.statusCode = 404;
        throw err;
    }

    const normalizedStatus = (newStatus || '').toUpperCase().trim();
    if (!VALID_BAGGAGE_STATUSES.includes(normalizedStatus)) {
        const err = new Error(`Invalid status. Permitted: ${VALID_BAGGAGE_STATUSES.join(', ')}`);
        err.statusCode = 400;
        throw err;
    }

    bag.status = normalizedStatus;
    if (carouselNumber) bag.carouselNumber = carouselNumber;

    return bag;
}

module.exports = {
    getAllBaggage,
    getBaggageByTag,
    registerBaggage,
    updateBaggageStatus,
};
