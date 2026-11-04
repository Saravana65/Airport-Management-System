/**
 * Module 3: Passenger Management Service
 * Enforces ownership restrictions (PASSENGER role only accesses their own profile),
 * checks passport uniqueness, and masks sensitive passport data.
 */

const db = require('./database.service');
const store = require('./operations.store');

function maskPassport(passportNo) {
    if (!passportNo || passportNo.length < 4) return '****';
    return `${passportNo.substring(0, 2)}****${passportNo.substring(passportNo.length - 2)}`;
}

async function getAllPassengers(query = '', user) {
    let list = store.passengers;

    if (query) {
        const q = query.toLowerCase();
        list = list.filter(p =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.passportNumber.toLowerCase().includes(q) ||
            (p.email && p.email.toLowerCase().includes(q))
        );
    }

    // Role-based privacy: PASSENGER can only see themselves
    if (user.role === 'PASSENGER') {
        list = list.filter(p => p.userId === user.userId);
    }

    // Mask sensitive passport numbers for non-admin viewers in list view
    return list.map(p => ({
        ...p,
        passportNumber: user.role === 'ADMIN' ? p.passportNumber : maskPassport(p.passportNumber),
    }));
}

async function getPassengerById(id, user) {
    const numId = parseInt(id, 10);
    const passenger = store.passengers.find(p => p.passengerId === numId);
    if (!passenger) return null;

    // Ownership check
    if (user.role === 'PASSENGER' && passenger.userId !== user.userId) {
        const err = new Error('Access denied. You cannot view other travelers’ personal records.');
        err.statusCode = 403;
        throw err;
    }

    // Retrieve passenger bookings
    const bookings = store.bookings.filter(b => {
        const tickets = store.tickets.filter(t => t.bookingId === b.bookingId && t.passengerId === numId);
        return tickets.length > 0;
    });

    return {
        ...passenger,
        bookings,
    };
}

async function getMyPassengerProfile(userId) {
    let passenger = store.passengers.find(p => p.userId === userId);
    if (!passenger) {
        // Auto-initialize profile linked to authenticated user account
        passenger = {
            passengerId: store.passengers.length + 1,
            userId,
            firstName: 'Registered',
            lastName: 'Passenger',
            passportNumber: `P${Math.floor(1000000 + Math.random() * 9000000)}`,
            phone: '+919876543200',
            email: 'passenger@airport.com',
            dateOfBirth: '1995-01-01',
            gender: 'M',
            createdAt: new Date().toISOString(),
        };
        store.passengers.push(passenger);
    }
    return passenger;
}

async function createPassenger(data, user) {
    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    const passportNumber = (data.passportNumber || '').toUpperCase().trim();

    if (!firstName || !lastName || !passportNumber) {
        const err = new Error('First name, last name, and unique passport number are mandatory.');
        err.statusCode = 400;
        throw err;
    }

    if (store.passengers.some(p => p.passportNumber === passportNumber)) {
        const err = new Error(`Passport number ${passportNumber} is already registered.`);
        err.statusCode = 409;
        throw err;
    }

    const newPassenger = {
        passengerId: store.passengers.length + 1,
        userId: user.role === 'PASSENGER' ? user.userId : (data.userId || null),
        firstName,
        lastName,
        passportNumber,
        phone: data.phone || null,
        email: data.email || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || 'O',
        createdAt: new Date().toISOString(),
    };

    store.passengers.push(newPassenger);
    return newPassenger;
}

async function updatePassenger(id, data, user) {
    const passenger = await getPassengerById(id, user);
    if (!passenger) {
        const err = new Error('Passenger not found.');
        err.statusCode = 404;
        throw err;
    }

    if (data.firstName) passenger.firstName = data.firstName;
    if (data.lastName) passenger.lastName = data.lastName;
    if (data.phone) passenger.phone = data.phone;
    if (data.email) passenger.email = data.email;
    if (data.dateOfBirth) passenger.dateOfBirth = data.dateOfBirth;

    return passenger;
}

module.exports = {
    getAllPassengers,
    getPassengerById,
    getMyPassengerProfile,
    createPassenger,
    updatePassenger,
    maskPassport,
};
