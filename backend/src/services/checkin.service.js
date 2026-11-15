/**
 * Module 5: Check-in Operations Service
 * Validates ticket and flight eligibility, enforces user ownership,
 * executes ACID transactions with FOR UPDATE row locks, prevents duplicate check-ins,
 * assigns seats, and generates digital demo boarding-pass previews.
 */

const db = require('./database.service');
const store = require('./operations.store');

/**
 * Retrieves tickets eligible for online web check-in.
 * Excludes cancelled bookings, cancelled/departed/arrived flights, and already checked-in tickets.
 * Passengers see only tickets belonging to their own bookings.
 */
async function getEligibleTickets(user, filters = {}) {
    let sql = `
        SELECT 
            t.TICKET_ID as ticketId,
            t.BOOKING_ID as bookingId,
            t.FLIGHT_INSTANCE_ID as flightInstanceId,
            t.PASSENGER_ID as passengerId,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            t.PRICE as price,
            t.STATUS as ticketStatus,
            b.BOOKING_REFERENCE as bookingReference,
            b.STATUS as bookingStatus,
            b.USER_ID as userId,
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
            g.TERMINAL as terminal,
            g.GATE_NUMBER as gateNumber
        FROM TICKETS t
        JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
        JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID
        LEFT JOIN CHECK_IN c ON t.TICKET_ID = c.TICKET_ID
        WHERE t.STATUS = 'ISSUED'
          AND b.STATUS = 'CONFIRMED'
          AND fi.STATUS NOT IN ('CANCELLED', 'DEPARTED', 'ARRIVED')
          AND c.CHECK_IN_ID IS NULL
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

    if (filters.flightNumber) {
        sql += ` AND (LOWER(fi.FLIGHT_NUMBER) = LOWER(?) OR LOWER(REPLACE(fi.FLIGHT_NUMBER, '-', '')) = LOWER(REPLACE(?, '-', '')))`;
        params.push(filters.flightNumber.trim(), filters.flightNumber.trim());
    }

    sql += ` ORDER BY fi.SCHEDULED_DEPARTURE ASC, t.TICKET_ID ASC`;

    try {
        const res = await db.execute(sql, params);
        return res.rows.map(row => ({
            ticketId: row.ticketId,
            bookingId: row.bookingId,
            flightInstanceId: row.flightInstanceId,
            passengerId: row.passengerId,
            ticketNumber: row.ticketNumber,
            seatNumber: row.seatNumber,
            cabinClass: row.cabinClass,
            bookingReference: row.bookingReference,
            bookingStatus: row.bookingStatus,
            flightNumber: row.flightNumber,
            flightDate: row.flightDate,
            flightStatus: row.flightStatus,
            origin: row.origin,
            destination: row.destination,
            departureTime: row.scheduledDepartureTime || (row.scheduledDeparture ? row.scheduledDeparture.substring(11, 16) : null),
            arrivalTime: row.scheduledArrivalTime || (row.scheduledArrival ? row.scheduledArrival.substring(11, 16) : null),
            scheduledDeparture: row.scheduledDeparture,
            scheduledArrival: row.scheduledArrival,
            airlineName: row.airlineName || 'Commercial Airlines',
            airlineCode: row.airlineCode,
            passengerName: row.firstName ? `${row.firstName} ${row.lastName}`.trim() : 'Traveler',
            passengerEmail: row.passengerEmail,
            passengerPhone: row.passengerPhone,
            terminal: row.terminal || null,
            gate: row.gateNumber ? (row.terminal ? `${row.terminal}-${row.gateNumber}` : row.gateNumber) : null,
            checkInOpen: true,
        }));
    } catch (err) {
        console.warn('[Checkin Service] MySQL getEligibleTickets fallback to store:', err.message);

        // Fallback to in-memory store
        let tickets = store.tickets.filter(t => t.status === 'ISSUED');

        if (user.role === 'PASSENGER') {
            const userBookings = store.bookings.filter(b => b.userId === user.userId && b.status === 'CONFIRMED');
            const bookingIds = userBookings.map(b => b.bookingId);
            tickets = tickets.filter(t => bookingIds.includes(t.bookingId));
        }

        // Exclude checked in tickets
        const checkedInTicketIds = store.checkin.map(c => c.ticketId);
        tickets = tickets.filter(t => !checkedInTicketIds.includes(t.ticketId));

        return tickets.map(t => {
            const flightInst = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
            const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
            const passenger = store.passengers.find(p => p.passengerId === t.passengerId);
            const booking = store.bookings.find(b => b.bookingId === t.bookingId);

            return {
                ...t,
                bookingReference: booking?.bookingReference || 'CONFIRMED',
                flightNumber: flightInst?.flightNumber,
                flightDate: flightInst?.flightDate,
                origin: route?.originAirport,
                destination: route?.destAirport,
                passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler',
            };
        }).filter(t => {
            const fi = store.flightInstances.find(f => f.flightInstanceId === t.flightInstanceId);
            return fi && !['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(fi.status);
        });
    }
}

/**
 * Retrieves check-in records.
 * Passengers see only their own check-ins.
 * Staff/Admin can view all records and filter by flightNumber or PNR.
 */
async function getAllCheckIns(user, filters = {}) {
    let sql = `
        SELECT 
            c.CHECK_IN_ID as checkinId,
            c.CHECK_IN_ID as checkInId,
            c.TICKET_ID as ticketId,
            DATE_FORMAT(c.CHECK_IN_TIME, '%Y-%m-%d %H:%i:%s') as checkInTime,
            c.BOARDING_PASS_CODE as boardingPassCode,
            DATE_FORMAT(c.BOARDING_TIME, '%Y-%m-%d %H:%i:%s') as boardingTime,
            c.GATE_ID as gateId,
            c.STATUS as status,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            t.PRICE as price,
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            fi.FLIGHT_INSTANCE_ID as flightInstanceId,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') as scheduledDeparture,
            f.ORIGIN_AIRPORT as origin,
            f.DEST_AIRPORT as destination,
            f.AIRLINE_CODE as airlineCode,
            al.AIRLINE_NAME as airlineName,
            p.FIRST_NAME as firstName,
            p.LAST_NAME as lastName,
            g.TERMINAL as terminal,
            g.GATE_NUMBER as gateNumber
        FROM CHECK_IN c
        JOIN TICKETS t ON c.TICKET_ID = t.TICKET_ID
        JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
        JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        LEFT JOIN GATES g ON c.GATE_ID = g.GATE_ID
        WHERE 1=1
    `;
    const params = [];

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

    if (filters.flightNumber) {
        sql += ` AND (LOWER(fi.FLIGHT_NUMBER) = LOWER(?) OR LOWER(REPLACE(fi.FLIGHT_NUMBER, '-', '')) = LOWER(REPLACE(?, '-', '')))`;
        params.push(filters.flightNumber.trim(), filters.flightNumber.trim());
    }

    sql += ` ORDER BY c.CHECK_IN_TIME DESC, c.CHECK_IN_ID DESC`;

    try {
        const res = await db.execute(sql, params);
        return res.rows.map(row => ({
            checkinId: row.checkInId,
            checkInId: row.checkInId,
            ticketId: row.ticketId,
            ticketNumber: row.ticketNumber,
            seatNumber: row.seatNumber,
            cabinClass: row.cabinClass,
            bookingReference: row.bookingReference,
            flightNumber: row.flightNumber,
            flightDate: row.flightDate,
            origin: row.origin,
            destination: row.destination,
            airlineName: row.airlineName || 'Commercial Airlines',
            passengerName: row.firstName ? `${row.firstName} ${row.lastName}`.trim() : 'Traveler',
            boardingPassCode: row.boardingPassCode,
            boardingTime: row.boardingTime,
            gateId: row.gateId,
            gate: row.gateNumber ? (row.terminal ? `${row.terminal}-${row.gateNumber}` : row.gateNumber) : (row.terminal ? `Terminal ${row.terminal}` : 'Not assigned yet'),
            terminal: row.terminal || 'Not assigned yet',
            status: row.status,
            checkInTime: row.checkInTime,
        }));
    } catch (err) {
        console.warn('[Checkin Service] MySQL getAllCheckIns fallback to store:', err.message);

        let list = store.checkin;
        if (user.role === 'PASSENGER') {
            const userBookings = store.bookings.filter(b => b.userId === user.userId);
            const bookingIds = userBookings.map(b => b.bookingId);
            const userTicketIds = store.tickets.filter(t => bookingIds.includes(t.bookingId)).map(t => t.ticketId);
            list = list.filter(c => userTicketIds.includes(c.ticketId));
        }

        return list.map(c => {
            const ticket = store.tickets.find(t => t.ticketId === c.ticketId);
            const booking = ticket ? store.bookings.find(b => b.bookingId === ticket.bookingId) : null;
            const flightInst = ticket ? store.flightInstances.find(f => f.flightInstanceId === ticket.flightInstanceId) : null;
            const route = flightInst ? store.flights.find(r => r.flightNumber === flightInst.flightNumber) : null;
            const passenger = ticket ? store.passengers.find(p => p.passengerId === ticket.passengerId) : null;
            const gate = c.gateId ? store.gates.find(g => g.gateId === c.gateId) : null;

            return {
                ...c,
                checkinId: c.checkInId,
                bookingReference: booking?.bookingReference || 'CONFIRMED',
                ticketNumber: ticket?.ticketNumber,
                seatNumber: ticket?.seatNumber,
                cabinClass: ticket?.cabinClass,
                flightNumber: flightInst?.flightNumber,
                flightDate: flightInst?.flightDate,
                origin: route?.originAirport,
                destination: route?.destAirport,
                gate: gate ? `${gate.terminal}-${gate.gateNumber}` : 'Not assigned yet',
                terminal: gate?.terminal || 'Not assigned yet',
                passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Traveler',
            };
        });
    }
}

/**
 * Retrieves flight-level check-in summary statistics for staff monitoring.
 * Accessible only by ADMIN, AIRLINE_STAFF, AIRPORT_STAFF.
 */
async function getStaffCheckInOverview(user) {
    let sql = `
        SELECT 
            fi.FLIGHT_INSTANCE_ID as flightInstanceId,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') as scheduledDeparture,
            f.ORIGIN_AIRPORT as origin,
            f.DEST_AIRPORT as destination,
            f.AIRLINE_CODE as airlineCode,
            al.AIRLINE_NAME as airlineName,
            g.TERMINAL as terminal,
            g.GATE_NUMBER as gateNumber,
            COUNT(DISTINCT CASE WHEN t.STATUS != 'CANCELLED' THEN t.TICKET_ID END) as totalBookedPassengers,
            COUNT(DISTINCT c.CHECK_IN_ID) as checkedInCount
        FROM FLIGHT_INSTANCES fi
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID
        LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
        LEFT JOIN CHECK_IN c ON t.TICKET_ID = c.TICKET_ID
        WHERE 1=1
    `;
    const params = [];

    if (user.role === 'AIRLINE_STAFF' && user.airlineCode) {
        sql += ` AND f.AIRLINE_CODE = ?`;
        params.push(user.airlineCode);
    }

    sql += ` GROUP BY fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER, fi.FLIGHT_DATE, fi.STATUS, fi.SCHEDULED_DEPARTURE, f.ORIGIN_AIRPORT, f.DEST_AIRPORT, f.AIRLINE_CODE, al.AIRLINE_NAME, g.TERMINAL, g.GATE_NUMBER
             ORDER BY fi.SCHEDULED_DEPARTURE ASC`;

    const res = await db.execute(sql, params);

    const flightsOverview = res.rows.map(row => {
        const total = parseInt(row.totalBookedPassengers, 10) || 0;
        const checkedIn = parseInt(row.checkedInCount, 10) || 0;
        const pending = Math.max(0, total - checkedIn);
        const completionRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

        return {
            flightInstanceId: row.flightInstanceId,
            flightNumber: row.flightNumber,
            flightDate: row.flightDate,
            flightStatus: row.flightStatus,
            scheduledDeparture: row.scheduledDeparture,
            origin: row.origin,
            destination: row.destination,
            airlineCode: row.airlineCode,
            airlineName: row.airlineName,
            terminal: row.terminal || 'Not assigned yet',
            gate: row.gateNumber ? (row.terminal ? `${row.terminal}-${row.gateNumber}` : row.gateNumber) : 'Not assigned yet',
            totalBookedPassengers: total,
            checkedInCount: checkedIn,
            pendingCheckInCount: pending,
            completionRatePercent: completionRate,
        };
    });

    const totalPassengers = flightsOverview.reduce((sum, f) => sum + f.totalBookedPassengers, 0);
    const totalCheckedIn = flightsOverview.reduce((sum, f) => sum + f.checkedInCount, 0);

    return {
        summary: {
            totalFlights: flightsOverview.length,
            totalBookedPassengers: totalPassengers,
            totalCheckedInPassengers: totalCheckedIn,
            overallCheckInRatePercent: totalPassengers > 0 ? Math.round((totalCheckedIn / totalPassengers) * 100) : 0,
        },
        flights: flightsOverview,
    };
}

/**
 * Securely retrieves a booking for check-in by PNR & surname.
 * Enforces authentication and prevents exposing other passengers' data.
 */
async function retrieveBookingForCheckIn(pnr, surname, user) {
    if (!pnr || typeof pnr !== 'string' || !pnr.trim()) {
        const err = new Error('Booking reference (PNR) is required.');
        err.statusCode = 400;
        throw err;
    }

    const normPnr = pnr.trim();
    const normSurname = surname ? surname.trim().toLowerCase() : null;

    const sql = `
        SELECT 
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            b.STATUS as bookingStatus,
            t.TICKET_ID as ticketId,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            t.STATUS as ticketStatus,
            p.FIRST_NAME as firstName,
            p.LAST_NAME as lastName,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') as scheduledDeparture,
            f.ORIGIN_AIRPORT as origin,
            f.DEST_AIRPORT as destination
        FROM BOOKINGS b
        JOIN TICKETS t ON b.BOOKING_ID = t.BOOKING_ID
        JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        WHERE LOWER(b.BOOKING_REFERENCE) = LOWER(?)
    `;

    const res = await db.execute(sql, [normPnr]);
    if (!res.rows.length) {
        const err = new Error('Booking reservation not found for the provided PNR.');
        err.statusCode = 404;
        throw err;
    }

    const first = res.rows[0];

    // Privacy & ownership enforcement
    if (user.role === 'PASSENGER' && first.userId !== user.userId) {
        const err = new Error('Access denied. You can only access your own reservations.');
        err.statusCode = 403;
        throw err;
    }

    if (normSurname && first.lastName && first.lastName.toLowerCase() !== normSurname) {
        const err = new Error('Passenger surname does not match the reservation record.');
        err.statusCode = 403;
        throw err;
    }

    return {
        bookingReference: first.bookingReference,
        bookingStatus: first.bookingStatus,
        tickets: res.rows.map(r => ({
            ticketId: r.ticketId,
            ticketNumber: r.ticketNumber,
            passengerName: `${r.firstName} ${r.lastName}`.trim(),
            flightNumber: r.flightNumber,
            flightDate: r.flightDate,
            origin: r.origin,
            destination: r.destination,
            seatNumber: r.seatNumber,
            cabinClass: r.cabinClass,
            ticketStatus: r.ticketStatus,
            eligibleForCheckIn: r.ticketStatus === 'ISSUED' && r.bookingStatus === 'CONFIRMED' && !['CANCELLED', 'DEPARTED', 'ARRIVED'].includes(r.flightStatus),
        })),
    };
}

/**
 * Transaction-Safe Online Web Check-In Processing
 * Atomically verifies ownership, booking & flight status, duplicate prevention,
 * updates seat allocation and issues an authenticated electronic boarding pass.
 */
async function processCheckIn(data, user) {
    const { ticketId, seatNumber } = data;

    if (!ticketId) {
        const err = new Error('Ticket ID is required for check-in.');
        err.statusCode = 400;
        throw err;
    }

    const numTicketId = parseInt(ticketId, 10);
    if (isNaN(numTicketId)) {
        const err = new Error('Invalid ticket ID format.');
        err.statusCode = 400;
        throw err;
    }

    try {
        const result = await db.executeTransaction(async (trx) => {
            // 1. Lock ticket row and join with booking, flight instance, route, and passenger
            const tRes = await trx.execute(
                `SELECT 
                    t.TICKET_ID as ticketId,
                    t.BOOKING_ID as bookingId,
                    t.FLIGHT_INSTANCE_ID as flightInstanceId,
                    t.PASSENGER_ID as passengerId,
                    t.TICKET_NUMBER as ticketNumber,
                    t.SEAT_NUMBER as seatNumber,
                    t.CABIN_CLASS as cabinClass,
                    t.STATUS as ticketStatus,
                    b.BOOKING_REFERENCE as bookingReference,
                    b.STATUS as bookingStatus,
                    b.USER_ID as userId,
                    fi.FLIGHT_NUMBER as flightNumber,
                    DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
                    fi.STATUS as flightStatus,
                    fi.DEPARTURE_GATE_ID as departureGateId,
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
                    g.TERMINAL as terminal,
                    g.GATE_NUMBER as gateNumber
                 FROM TICKETS t
                 JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
                 JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
                 JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
                 LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
                 LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
                 LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID
                 WHERE t.TICKET_ID = ? FOR UPDATE`,
                [numTicketId]
            );

            if (!tRes.rows.length) {
                const err = new Error('Ticket not found.');
                err.statusCode = 404;
                throw err;
            }

            const ticket = tRes.rows[0];

            // 2. Ownership verification: PASSENGER can only check in for their own bookings
            if (user.role === 'PASSENGER' && ticket.userId !== user.userId) {
                const err = new Error('Access denied. You can only check in for your own reservations.');
                err.statusCode = 403;
                throw err;
            }

            // 3. Booking status validation
            if (ticket.bookingStatus === 'CANCELLED') {
                const err = new Error('Cannot check in for a cancelled booking.');
                err.statusCode = 400;
                throw err;
            }

            // 4. Ticket status validation
            if (ticket.ticketStatus === 'CANCELLED') {
                const err = new Error('Cannot check in for a cancelled ticket.');
                err.statusCode = 400;
                throw err;
            }

            // 5. Flight status validation
            if (ticket.flightStatus === 'CANCELLED') {
                const err = new Error('Cannot check in for a flight that is CANCELLED.');
                err.statusCode = 400;
                throw err;
            }
            if (ticket.flightStatus === 'DEPARTED') {
                const err = new Error('Cannot check in for a flight that has already DEPARTED.');
                err.statusCode = 400;
                throw err;
            }
            if (ticket.flightStatus === 'ARRIVED') {
                const err = new Error('Cannot check in for a flight that has already ARRIVED.');
                err.statusCode = 400;
                throw err;
            }

            // 6. Duplicate check-in prevention (FOR UPDATE lock on CHECK_IN table)
            const chkRes = await trx.execute(
                `SELECT CHECK_IN_ID, BOARDING_PASS_CODE, STATUS 
                 FROM CHECK_IN 
                 WHERE TICKET_ID = ? FOR UPDATE`,
                [ticket.ticketId]
            );

            if (chkRes.rows.length > 0 || ticket.ticketStatus === 'CHECKED_IN') {
                const existingBp = chkRes.rows[0]?.BOARDING_PASS_CODE || 'BP-ISSUED';
                const err = new Error(`Ticket ${ticket.ticketNumber} is already checked in (Boarding Pass: ${existingBp}).`);
                err.statusCode = 409;
                throw err;
            }

            // 7. Seat resolution and duplicate seat check
            const finalSeat = (seatNumber || ticket.seatNumber || '14B').trim().toUpperCase();

            if (finalSeat !== ticket.seatNumber) {
                const seatConflict = await trx.execute(
                    `SELECT TICKET_ID 
                     FROM TICKETS 
                     WHERE FLIGHT_INSTANCE_ID = ? 
                       AND UPPER(SEAT_NUMBER) = ? 
                       AND TICKET_ID != ? 
                       AND STATUS != 'CANCELLED' FOR UPDATE`,
                    [ticket.flightInstanceId, finalSeat, ticket.ticketId]
                );

                if (seatConflict.rows.length > 0) {
                    const err = new Error(`Seat ${finalSeat} is already occupied on this flight instance.`);
                    err.statusCode = 409;
                    throw err;
                }
            }

            // 8. Generate unique Boarding Pass code
            const bpCode = `BP-${ticket.flightNumber}-${finalSeat}-${Math.floor(1000 + Math.random() * 9000)}`;

            // 9. Boarding time computation (defaults to 45 mins prior to departure, or scheduled departure)
            let boardingTime = ticket.scheduledDeparture;
            if (ticket.scheduledDeparture) {
                const schedDate = new Date(ticket.scheduledDeparture.replace(' ', 'T'));
                if (!isNaN(schedDate.getTime())) {
                    const bTime = new Date(schedDate.getTime() - 45 * 60000);
                    boardingTime = bTime.toISOString().replace('T', ' ').substring(0, 19);
                }
            }

            // 10. Persist check-in and update ticket in MySQL within the same ACID transaction
            await trx.execute(
                `UPDATE TICKETS 
                 SET SEAT_NUMBER = ?, STATUS = 'CHECKED_IN' 
                 WHERE TICKET_ID = ?`,
                [finalSeat, ticket.ticketId]
            );

            const insRes = await trx.execute(
                `INSERT INTO CHECK_IN (TICKET_ID, BOARDING_PASS_CODE, BOARDING_TIME, GATE_ID, STATUS)
                 VALUES (?, ?, ?, ?, 'COMPLETED')`,
                [ticket.ticketId, bpCode, boardingTime, ticket.departureGateId || null]
            );
            const checkInId = insRes.insertId;

            const checkInRecord = {
                checkInId,
                ticketId: ticket.ticketId,
                checkInTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
                boardingPassCode: bpCode,
                boardingTime,
                gateId: ticket.departureGateId || null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
            };

            const passengerName = ticket.firstName ? `${ticket.firstName} ${ticket.lastName}`.trim() : 'Verified Traveler';
            const terminalStr = ticket.terminal || 'Not assigned yet';
            const gateStr = ticket.gateNumber
                ? (ticket.terminal ? `${ticket.terminal}-${ticket.gateNumber}` : ticket.gateNumber)
                : 'Not assigned yet';

            const boardingPass = {
                checkInId,
                boardingPassNumber: bpCode,
                boardingPassCode: bpCode,
                passengerName,
                pnr: ticket.bookingReference,
                ticketNumber: ticket.ticketNumber,
                airlineName: ticket.airlineName || 'Commercial Airlines',
                airlineCode: ticket.airlineCode,
                flightNumber: ticket.flightNumber,
                flightDate: ticket.flightDate,
                origin: ticket.origin,
                destination: ticket.destination,
                departureDate: ticket.flightDate,
                departureTime: ticket.scheduledDepartureTime || (ticket.scheduledDeparture ? ticket.scheduledDeparture.substring(11, 16) : null),
                scheduledDeparture: ticket.scheduledDeparture,
                terminal: terminalStr,
                gate: gateStr,
                gateNumber: gateStr,
                seatNumber: finalSeat,
                cabinClass: ticket.cabinClass,
                boardingTime: '45 mins prior to departure',
                checkInStatus: 'CHECKED_IN',
                demoNotice: 'DIGITAL DEMO BOARDING-PASS PREVIEW — For demonstration and simulation purposes only. Not an official airline or airport travel document.',
                isDemoNotice: 'DIGITAL DEMO BOARDING-PASS PREVIEW — For demonstration and simulation purposes only. Not an official airline or airport travel document.',
            };

            const updatedTicket = {
                ...ticket,
                seatNumber: finalSeat,
                status: 'CHECKED_IN',
            };

            return {
                checkIn: checkInRecord,
                boardingPass,
                ticket: updatedTicket,
            };
        });

        // Sync with in-memory store
        const storeTicket = store.tickets.find(t => t.ticketId === result.ticket.ticketId);
        if (storeTicket) {
            storeTicket.seatNumber = result.ticket.seatNumber;
            storeTicket.status = 'CHECKED_IN';
        }
        store.checkin.push(result.checkIn);

        return {
            checkIn: result.checkIn,
            boardingPass: result.boardingPass,
            ticket: result.ticket,
        };
    } catch (err) {
        // Handle database engine level unique constraint violation
        if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('uq_checkin_ticket'))) {
            const conflictErr = new Error(`Ticket ${ticketId} is already checked in.`);
            conflictErr.statusCode = 409;
            throw conflictErr;
        }
        throw err;
    }
}

module.exports = {
    getEligibleTickets,
    getAllCheckIns,
    getStaffCheckInOverview,
    retrieveBookingForCheckIn,
    processCheckIn,
};
