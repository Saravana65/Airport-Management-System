/**
 * Module 4: Booking & Ticket Management Service
 * Implements transaction-safe reservation, duplicate seat prevention,
 * 6-character PNR generation, ACID transaction execution, and cancellation rollback.
 */

const crypto = require('crypto');
const db = require('./database.service');
const store = require('./operations.store');
const notificationService = require('./notification.service');

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

/**
 * Retrieves all bookings with full ticket and flight details.
 * Passengers can only view their own bookings.
 */
async function getAllBookings(user, filters = {}) {
    let sql = `
        SELECT 
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            DATE_FORMAT(b.BOOKING_DATE, '%Y-%m-%d %H:%i:%s') as bookingDate,
            b.TOTAL_AMOUNT as totalAmount,
            b.STATUS as status,
            t.TICKET_ID as ticketId,
            t.FLIGHT_INSTANCE_ID as flightInstanceId,
            t.PASSENGER_ID as passengerId,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            t.PRICE as price,
            t.STATUS as ticketStatus,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') as scheduledDeparture,
            DATE_FORMAT(fi.SCHEDULED_ARRIVAL, '%Y-%m-%d %H:%i:%s') as scheduledArrival,
            f.ORIGIN_AIRPORT as origin,
            f.DEST_AIRPORT as destination,
            f.AIRLINE_CODE as airlineCode,
            al.AIRLINE_NAME as airlineName,
            p.FIRST_NAME as firstName,
            p.LAST_NAME as lastName,
            p.EMAIL as passengerEmail,
            p.PHONE as passengerPhone
        FROM BOOKINGS b
        LEFT JOIN TICKETS t ON b.BOOKING_ID = t.BOOKING_ID
        LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        WHERE 1=1
    `;
    const params = [];

    // Ownership filter: PASSENGER sees only their bookings
    if (user.role === 'PASSENGER') {
        sql += ` AND b.USER_ID = ?`;
        params.push(user.userId);
    } else if (user.role === 'AIRLINE_STAFF' && user.airlineCode) {
        sql += ` AND f.AIRLINE_CODE = ?`;
        params.push(user.airlineCode);
    }

    if (filters.pnr) {
        sql += ` AND LOWER(b.BOOKING_REFERENCE) = LOWER(?)`;
        params.push(filters.pnr.trim());
    }

    sql += ` ORDER BY b.BOOKING_ID DESC`;

    try {
        const res = await db.execute(sql, params);
        const bookingMap = new Map();

        for (const row of res.rows) {
            if (!bookingMap.has(row.bookingId)) {
                bookingMap.set(row.bookingId, {
                    bookingId: row.bookingId,
                    bookingReference: row.bookingReference,
                    userId: row.userId,
                    bookingDate: row.bookingDate,
                    totalAmount: parseFloat(row.totalAmount) || 0,
                    status: row.status,
                    tickets: [],
                });
            }

            if (row.ticketId) {
                bookingMap.get(row.bookingId).tickets.push({
                    ticketId: row.ticketId,
                    bookingId: row.bookingId,
                    flightInstanceId: row.flightInstanceId,
                    passengerId: row.passengerId,
                    ticketNumber: row.ticketNumber,
                    seatNumber: row.seatNumber,
                    cabinClass: row.cabinClass,
                    price: parseFloat(row.price) || 0,
                    status: row.ticketStatus,
                    flightNumber: row.flightNumber,
                    flightDate: row.flightDate,
                    origin: row.origin,
                    destination: row.destination,
                    airlineCode: row.airlineCode,
                    airlineName: row.airlineName,
                    passengerName: row.firstName ? `${row.firstName} ${row.lastName}`.trim() : null,
                    passengerEmail: row.passengerEmail,
                    passengerPhone: row.passengerPhone,
                });
            }
        }

        return Array.from(bookingMap.values());
    } catch (err) {
        console.warn('[Booking Service] MySQL getAllBookings fallback to store:', err.message);

        // Fallback to store
        let list = store.bookings;
        if (user.role === 'PASSENGER') {
            list = list.filter(b => b.userId === user.userId);
        } else if (user.role === 'AIRLINE_STAFF' && user.airlineCode) {
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
}

/**
 * Retrieves single booking by ID or PNR with strict passenger ownership check.
 */
async function getBookingById(id, user) {
    const numId = parseInt(id, 10);
    const sql = `
        SELECT 
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            DATE_FORMAT(b.BOOKING_DATE, '%Y-%m-%d %H:%i:%s') as bookingDate,
            b.TOTAL_AMOUNT as totalAmount,
            b.STATUS as status,
            t.TICKET_ID as ticketId,
            t.FLIGHT_INSTANCE_ID as flightInstanceId,
            t.PASSENGER_ID as passengerId,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            t.PRICE as price,
            t.STATUS as ticketStatus,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') as scheduledDeparture,
            DATE_FORMAT(fi.SCHEDULED_ARRIVAL, '%Y-%m-%d %H:%i:%s') as scheduledArrival,
            f.ORIGIN_AIRPORT as origin,
            f.DEST_AIRPORT as destination,
            f.AIRLINE_CODE as airlineCode,
            f.SCHEDULED_DEPARTURE_TIME as scheduledDepartureTime,
            f.SCHEDULED_ARRIVAL_TIME as scheduledArrivalTime,
            al.AIRLINE_NAME as airlineName,
            p.FIRST_NAME as firstName,
            p.LAST_NAME as lastName,
            p.EMAIL as passengerEmail,
            p.PHONE as passengerPhone,
            p.PASSPORT_NUMBER as passportNumber,
            DATE_FORMAT(p.DATE_OF_BIRTH, '%Y-%m-%d') as dateOfBirth,
            p.GENDER as gender
        FROM BOOKINGS b
        LEFT JOIN TICKETS t ON b.BOOKING_ID = t.BOOKING_ID
        LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        WHERE b.BOOKING_ID = ? OR b.BOOKING_REFERENCE = ?
    `;

    try {
        const res = await db.execute(sql, [isNaN(numId) ? 0 : numId, String(id)]);
        if (!res.rows.length) return null;

        const firstRow = res.rows[0];

        // Ownership enforcement: PASSENGER cannot view other passengers' reservations
        if (user.role === 'PASSENGER' && firstRow.userId !== user.userId) {
            const err = new Error('Access denied. You cannot view other passengers’ reservations.');
            err.statusCode = 403;
            throw err;
        }

        const booking = {
            bookingId: firstRow.bookingId,
            bookingReference: firstRow.bookingReference,
            userId: firstRow.userId,
            bookingDate: firstRow.bookingDate,
            totalAmount: parseFloat(firstRow.totalAmount) || 0,
            status: firstRow.status,
            tickets: [],
        };

        for (const row of res.rows) {
            if (row.ticketId) {
                booking.tickets.push({
                    ticketId: row.ticketId,
                    bookingId: row.bookingId,
                    flightInstanceId: row.flightInstanceId,
                    passengerId: row.passengerId,
                    ticketNumber: row.ticketNumber,
                    seatNumber: row.seatNumber,
                    cabinClass: row.cabinClass,
                    price: parseFloat(row.price) || 0,
                    status: row.ticketStatus,
                    flight: {
                        flightNumber: row.flightNumber,
                        flightDate: row.flightDate,
                        origin: row.origin,
                        destination: row.destination,
                        departureTime: row.scheduledDepartureTime || row.scheduledDeparture,
                        arrivalTime: row.scheduledArrivalTime || row.scheduledArrival,
                        airlineName: row.airlineName,
                    },
                    passenger: {
                        passengerId: row.passengerId,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        email: row.passengerEmail,
                        phone: row.passengerPhone,
                        passportNumber: row.passportNumber,
                        dateOfBirth: row.dateOfBirth,
                        gender: row.gender,
                    },
                });
            }
        }

        return booking;
    } catch (err) {
        if (err.statusCode) throw err;
        console.warn('[Booking Service] MySQL getBookingById fallback:', err.message);

        // Fallback to store
        const booking = store.bookings.find(b => b.bookingId === numId || b.bookingReference === id);
        if (!booking) return null;

        if (user.role === 'PASSENGER' && booking.userId !== user.userId) {
            const error = new Error('Access denied. You cannot view other passengers’ reservations.');
            error.statusCode = 403;
            throw error;
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
}

/**
 * Transaction-Safe Booking Creation
 * Atomically checks capacity, verifies seat uniqueness, issues booking & tickets using an ACID transaction.
 */
async function createBooking(data, user) {
    const { flightInstanceId, cabinClass = 'ECONOMY', seatNumber } = data;

    // Validate flight instance
    if (!flightInstanceId) {
        const err = new Error('Flight instance ID is required to create a booking.');
        err.statusCode = 400;
        throw err;
    }

    const numFlightInstId = parseInt(flightInstanceId, 10);
    if (isNaN(numFlightInstId)) {
        const err = new Error('Invalid flight instance ID format.');
        err.statusCode = 400;
        throw err;
    }

    // Validate seat selection
    if (!seatNumber || typeof seatNumber !== 'string' || !seatNumber.trim()) {
        const err = new Error('Seat number is required for booking reservation.');
        err.statusCode = 400;
        throw err;
    }
    const normSeat = seatNumber.trim().toUpperCase();

    // Validate passenger details if provided, or default cleanly
    if (data.firstName !== undefined && (!data.firstName || !data.firstName.trim())) {
        const err = new Error('Passenger first name cannot be empty.');
        err.statusCode = 400;
        throw err;
    }
    if (data.lastName !== undefined && (!data.lastName || !data.lastName.trim())) {
        const err = new Error('Passenger last name cannot be empty.');
        err.statusCode = 400;
        throw err;
    }
    if (data.email !== undefined && (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))) {
        const err = new Error('A valid passenger email address is required.');
        err.statusCode = 400;
        throw err;
    }
    if (data.phone !== undefined && (!data.phone || !/^\+?[0-9\s\-]{7,15}$/.test(data.phone.trim()))) {
        const err = new Error('A valid phone number (at least 7 digits) is required.');
        err.statusCode = 400;
        throw err;
    }
    if (data.dateOfBirth !== undefined) {
        const dobStr = String(data.dateOfBirth).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dobStr) || isNaN(Date.parse(dobStr))) {
            const err = new Error('Invalid date of birth format. Use YYYY-MM-DD.');
            err.statusCode = 400;
            throw err;
        }
    }

    const passengerFirstName = (data.firstName || user.name?.split(' ')[0] || 'Traveler').trim();
    const passengerLastName = (data.lastName || user.name?.split(' ').slice(1).join(' ') || 'Passenger').trim();
    const passengerEmail = (data.email || user.email || 'passenger@airport.com').trim();
    const passengerPhone = (data.phone || '9876543210').trim();
    const passengerDob = data.dateOfBirth || '1995-01-01';
    const passengerGender = (data.gender || 'O').toUpperCase();
    const normClass = (cabinClass || 'ECONOMY').toUpperCase();

    try {
        const result = await db.executeTransaction(async (trx) => {
            // 1. Lock flight instance row and check status
            const fiRes = await trx.execute(
                `SELECT fi.FLIGHT_INSTANCE_ID as flightInstanceId, fi.FLIGHT_NUMBER as flightNumber, fi.STATUS as status,
                        fi.AIRCRAFT_ID as aircraftId, f.BASE_FARE as baseFare, f.AIRLINE_CODE as airlineCode,
                        f.ORIGIN_AIRPORT as originAirport, f.DEST_AIRPORT as destAirport,
                        a.TOTAL_SEATS as totalSeats
                 FROM FLIGHT_INSTANCES fi
                 JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
                 LEFT JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID
                 WHERE fi.FLIGHT_INSTANCE_ID = ? FOR UPDATE`,
                [numFlightInstId]
            );

            if (!fiRes.rows.length) {
                const err = new Error('Specified flight instance does not exist.');
                err.statusCode = 404;
                throw err;
            }

            const flightInst = fiRes.rows[0];

            if (['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(flightInst.status)) {
                const err = new Error(`Cannot book a flight that is ${flightInst.status}.`);
                err.statusCode = 400;
                throw err;
            }

            // 2. Lock tickets for capacity check
            const capRes = await trx.execute(
                `SELECT COUNT(*) as bookedSeats
                 FROM TICKETS
                 WHERE FLIGHT_INSTANCE_ID = ? AND STATUS != 'CANCELLED' FOR UPDATE`,
                [flightInst.flightInstanceId]
            );

            const bookedCount = capRes.rows[0]?.bookedSeats || 0;
            const capacity = flightInst.totalSeats != null ? Number(flightInst.totalSeats) : null;
            if (capacity !== null && bookedCount >= capacity) {
                const err = new Error(`Flight instance ${flightInst.flightNumber} is fully booked (${capacity}/${capacity} seats).`);
                err.statusCode = 409;
                throw err;
            }

            // 3. Lock requested seat and verify uniqueness
            const seatRes = await trx.execute(
                `SELECT TICKET_ID as ticketId
                 FROM TICKETS
                 WHERE FLIGHT_INSTANCE_ID = ? AND UPPER(SEAT_NUMBER) = ? AND STATUS != 'CANCELLED' FOR UPDATE`,
                [flightInst.flightInstanceId, normSeat]
            );

            if (seatRes.rows.length > 0) {
                const err = new Error(`Seat ${normSeat} has already been allocated on this flight instance.`);
                err.statusCode = 409;
                throw err;
            }

            // 4. Resolve or create passenger record in MySQL
            let pId = data.passengerId;
            if (!pId) {
                const pFind = await trx.execute(
                    `SELECT PASSENGER_ID as passengerId FROM PASSENGERS WHERE USER_ID = ? OR EMAIL = ? LIMIT 1`,
                    [user.userId || 0, passengerEmail]
                );

                if (pFind.rows.length > 0) {
                    pId = pFind.rows[0].passengerId;
                    await trx.execute(
                        `UPDATE PASSENGERS 
                         SET FIRST_NAME = ?, LAST_NAME = ?, PHONE = ?, DATE_OF_BIRTH = ?, GENDER = ?
                         WHERE PASSENGER_ID = ?`,
                        [passengerFirstName, passengerLastName, passengerPhone, passengerDob, passengerGender, pId]
                    );
                } else {
                    const passport = (data.passportNumber || `P${Math.floor(1000000 + Math.random() * 9000000)}`).toUpperCase();
                    const pInsert = await trx.execute(
                        `INSERT INTO PASSENGERS (USER_ID, FIRST_NAME, LAST_NAME, PASSPORT_NUMBER, PHONE, EMAIL, DATE_OF_BIRTH, GENDER)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [user.userId || null, passengerFirstName, passengerLastName, passport, passengerPhone, passengerEmail, passengerDob, passengerGender]
                    );
                    pId = pInsert.insertId;
                }
            }

            // 5. Calculate Fare with class multiplier
            const multiplier = normClass === 'BUSINESS' ? 2.5 : (normClass === 'FIRST' ? 4.0 : 1.0);
            const baseFare = Number(flightInst.baseFare) || 5000;
            const price = Math.round(baseFare * multiplier);

            // 6. Generate Unique PNR (6 chars)
            let pnr = generatePNR();
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                attempts++;
                const pnrCheck = await trx.execute(
                    `SELECT BOOKING_ID FROM BOOKINGS WHERE BOOKING_REFERENCE = ?`,
                    [pnr]
                );
                if (pnrCheck.rows.length === 0) {
                    isUnique = true;
                } else {
                    pnr = generatePNR();
                }
            }

            // 7. Generate Ticket Number
            const tNumber = generateTicketNumber(flightInst.airlineCode || '098');

            // 8. Insert into BOOKINGS
            const bRes = await trx.execute(
                `INSERT INTO BOOKINGS (BOOKING_REFERENCE, USER_ID, BOOKING_DATE, TOTAL_AMOUNT, STATUS)
                 VALUES (?, ?, NOW(), ?, 'CONFIRMED')`,
                [pnr, user.userId, price]
            );
            const bookingId = bRes.insertId;

            // 9. Insert into TICKETS
            const tRes = await trx.execute(
                `INSERT INTO TICKETS (BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, TICKET_NUMBER, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'ISSUED')`,
                [bookingId, flightInst.flightInstanceId, pId, tNumber, normSeat, normClass, price]
            );
            const ticketId = tRes.insertId;

            const newBooking = {
                bookingId,
                bookingReference: pnr,
                userId: user.userId,
                bookingDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
                totalAmount: price,
                status: 'CONFIRMED',
                paymentStatus: 'COMPLETED_SIMULATED',
                createdAt: new Date().toISOString(),
            };

            const newTicket = {
                ticketId,
                bookingId,
                flightInstanceId: flightInst.flightInstanceId,
                passengerId: pId,
                ticketNumber: tNumber,
                seatNumber: normSeat,
                cabinClass: normClass,
                price,
                status: 'ISSUED',
                createdAt: new Date().toISOString(),
            };

            return {
                booking: newBooking,
                ticket: newTicket,
                passenger: {
                    passengerId: pId,
                    firstName: passengerFirstName,
                    lastName: passengerLastName,
                    email: passengerEmail,
                    phone: passengerPhone,
                },
                flight: {
                    flightNumber: flightInst.flightNumber,
                    originAirport: flightInst.originAirport,
                    destAirport: flightInst.destAirport,
                    airlineCode: flightInst.airlineCode,
                }
            };
        });

        // Sync with in-memory store
        store.bookings.push(result.booking);
        store.tickets.push(result.ticket);

        // Emit in-app notification in MySQL
        if (user.userId) {
            await notificationService.createNotification({
                userId: user.userId,
                title: `Booking Confirmed: ${result.booking.bookingReference}`,
                message: `Your booking for flight ${result.flight?.flightNumber || ''} is confirmed. Allocated seat: ${result.ticket?.seatNumber || normSeat}.`,
                type: 'BOOKING'
            }).catch(err => console.warn('[Booking] Notification note:', err.message));
        }

        return {
            booking: result.booking,
            ticket: result.ticket,
            passenger: result.passenger,
            flight: result.flight,
        };
    } catch (err) {
        // Handle duplicate key error at database engine level
        if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('uq_flight_seat'))) {
            const conflictErr = new Error(`Seat ${normSeat} has already been allocated on this flight instance.`);
            conflictErr.statusCode = 409;
            throw conflictErr;
        }
        throw err;
    }
}

/**
 * Transaction-Safe Booking Cancellation
 * Releases allocated seat and marks records CANCELLED in MySQL.
 */
async function cancelBooking(id, user) {
    const booking = await getBookingById(id, user);
    if (!booking) {
        const err = new Error('Booking not found.');
        err.statusCode = 404;
        throw err;
    }

    if (user.role === 'PASSENGER' && booking.userId !== user.userId) {
        const err = new Error('Access denied. You cannot cancel other passengers’ reservations.');
        err.statusCode = 403;
        throw err;
    }

    if (booking.status === 'CANCELLED') {
        const err = new Error('Booking is already cancelled.');
        err.statusCode = 400;
        throw err;
    }

    await db.executeTransaction(async (trx) => {
        await trx.execute('UPDATE BOOKINGS SET STATUS = ? WHERE BOOKING_ID = ?', ['CANCELLED', booking.bookingId]);
        await trx.execute('UPDATE TICKETS SET STATUS = ?, SEAT_NUMBER = NULL WHERE BOOKING_ID = ?', ['CANCELLED', booking.bookingId]);
    });

    booking.status = 'CANCELLED';
    if (booking.tickets) {
        booking.tickets.forEach(t => {
            t.status = 'CANCELLED';
            t.seatNumber = null;
        });
    }

    // Synchronize in-memory store
    const storeBooking = store.bookings.find(b => b.bookingId === booking.bookingId);
    if (storeBooking) storeBooking.status = 'CANCELLED';

    store.tickets
        .filter(t => t.bookingId === booking.bookingId)
        .forEach(t => {
            t.status = 'CANCELLED';
            t.seatNumber = null;
        });

    // Emit in-app notification in MySQL
    if (booking.userId) {
        await notificationService.createNotification({
            userId: booking.userId,
            title: `Booking Cancelled: ${booking.bookingReference}`,
            message: `Reservation ${booking.bookingReference} has been cancelled and seat ${booking.tickets?.[0]?.seatNumber || ''} has been released.`,
            type: 'CANCELLATION'
        }).catch(err => console.warn('[CancelBooking] Notification note:', err.message));
    }

    return booking;
}

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    cancelBooking,
};
