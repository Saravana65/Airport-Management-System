/**
 * Module 6: Baggage Management Service
 * Directly integrated with MySQL 8.0 `airport_management_db` BAGGAGE table.
 * Generates unique baggage tag references, enforces weight boundaries (0.1 - 60.0 kg),
 * tracks conveyor and claim carousel routing, and enforces lifecycle status transitions.
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
    'DELIVERED',
    'COLLECTED',
    'DELAYED',
];

const VALID_TRANSITIONS = {
    'REGISTERED': ['CHECKED_IN', 'SECURITY_CLEARED', 'DELAYED', 'CANCELLED'],
    'CHECKED_IN': ['SECURITY_CLEARED', 'IN_TRANSIT', 'LOADED', 'DELAYED'],
    'SECURITY_CLEARED': ['IN_TRANSIT', 'LOADED', 'DELAYED'],
    'IN_TRANSIT': ['LOADED', 'ARRIVED', 'DELAYED'],
    'LOADED': ['IN_TRANSIT', 'ARRIVED', 'CLAIM_READY', 'DELAYED'],
    'ARRIVED': ['CLAIM_READY', 'DELIVERED', 'COLLECTED', 'DELAYED'],
    'CLAIM_READY': ['DELIVERED', 'COLLECTED', 'DELAYED'],
    'DELAYED': ['CHECKED_IN', 'SECURITY_CLEARED', 'IN_TRANSIT', 'LOADED', 'ARRIVED', 'CLAIM_READY', 'DELIVERED', 'COLLECTED'],
    'DELIVERED': [], // Terminal state
    'COLLECTED': [], // Terminal state
    'CANCELLED': [], // Terminal state
};

function generateBagTag(carrier = 'AMS') {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `BAG-${carrier}-${random}`;
}

/**
 * Retrieves all baggage records with relational joins to tickets, bookings, flights, and passengers.
 * If user is a passenger, strictly filters to records belonging to their user account.
 */
async function getAllBaggage(user, filters = {}) {
    let sql = `
        SELECT 
            bg.BAGGAGE_ID as baggageId,
            bg.TICKET_ID as ticketId,
            bg.TAG_NUMBER as tagNumber,
            CAST(bg.WEIGHT_KG AS DECIMAL(5,2)) as weightKg,
            bg.STATUS as status,
            bg.CAROUSEL_NUMBER as carouselNumber,
            DATE_FORMAT(bg.CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            p.PASSENGER_ID as passengerId,
            CONCAT(p.FIRST_NAME, ' ', p.LAST_NAME) as passengerName,
            p.EMAIL as passengerEmail,
            fi.FLIGHT_INSTANCE_ID as flightInstanceId,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            f.ORIGIN_AIRPORT as originAirport,
            f.DEST_AIRPORT as destAirport,
            f.AIRLINE_CODE as airlineCode,
            al.AIRLINE_NAME as airlineName
        FROM BAGGAGE bg
        JOIN TICKETS t ON bg.TICKET_ID = t.TICKET_ID
        JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        WHERE 1=1
    `;
    const params = [];

    // Passenger Privacy Isolation: only own baggage records
    if (user && user.role === 'PASSENGER') {
        sql += ` AND b.USER_ID = ?`;
        params.push(user.userId);
    } else if (user && user.role === 'AIRLINE_STAFF' && user.airlineCode) {
        sql += ` AND f.AIRLINE_CODE = ?`;
        params.push(user.airlineCode);
    }

    if (filters.tagNumber) {
        const cleanTag = filters.tagNumber.trim();
        sql += ` AND (bg.TAG_NUMBER LIKE ? OR bg.TAG_NUMBER = ?)`;
        params.push(`%${cleanTag}%`, cleanTag);
    }

    if (filters.pnr || filters.bookingReference) {
        const pnrVal = (filters.pnr || filters.bookingReference).trim();
        sql += ` AND (b.BOOKING_REFERENCE LIKE ? OR b.BOOKING_REFERENCE = ?)`;
        params.push(`%${pnrVal}%`, pnrVal);
    }

    if (filters.flightNumber) {
        const fltVal = filters.flightNumber.trim();
        sql += ` AND (fi.FLIGHT_NUMBER LIKE ? OR fi.FLIGHT_NUMBER = ?)`;
        params.push(`%${fltVal}%`, fltVal);
    }

    if (filters.passengerName) {
        const nameVal = filters.passengerName.trim();
        sql += ` AND (CONCAT(p.FIRST_NAME, ' ', p.LAST_NAME) LIKE ? OR p.FIRST_NAME LIKE ? OR p.LAST_NAME LIKE ?)`;
        params.push(`%${nameVal}%`, `%${nameVal}%`, `%${nameVal}%`);
    }

    if (filters.status) {
        sql += ` AND bg.STATUS = ?`;
        params.push(filters.status.toUpperCase().trim());
    }

    if (filters.pendingOnly === 'true' || filters.pendingOnly === true) {
        sql += ` AND bg.STATUS IN ('REGISTERED', 'CHECKED_IN', 'SECURITY_CLEARED', 'IN_TRANSIT', 'LOADED')`;
    }

    sql += ` ORDER BY bg.BAGGAGE_ID DESC`;

    const res = await db.execute(sql, params);
    const rows = res.rows || [];

    return rows.map(r => ({
        ...r,
        weightKg: parseFloat(r.weightKg) || 0,
    }));
}

/**
 * Retrieves a single baggage record by unique barcode tag number.
 * Enforces passenger ownership check to prevent foreign record inspection.
 */
async function getBaggageByTag(tagNumber, user) {
    if (!tagNumber) return null;
    const cleanTag = tagNumber.trim().toUpperCase();

    const sql = `
        SELECT 
            bg.BAGGAGE_ID as baggageId,
            bg.TICKET_ID as ticketId,
            bg.TAG_NUMBER as tagNumber,
            CAST(bg.WEIGHT_KG AS DECIMAL(5,2)) as weightKg,
            bg.STATUS as status,
            bg.CAROUSEL_NUMBER as carouselNumber,
            DATE_FORMAT(bg.CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt,
            t.TICKET_NUMBER as ticketNumber,
            t.SEAT_NUMBER as seatNumber,
            t.CABIN_CLASS as cabinClass,
            b.BOOKING_ID as bookingId,
            b.BOOKING_REFERENCE as bookingReference,
            b.USER_ID as userId,
            p.PASSENGER_ID as passengerId,
            CONCAT(p.FIRST_NAME, ' ', p.LAST_NAME) as passengerName,
            p.EMAIL as passengerEmail,
            fi.FLIGHT_INSTANCE_ID as flightInstanceId,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            fi.STATUS as flightStatus,
            f.ORIGIN_AIRPORT as originAirport,
            f.DEST_AIRPORT as destAirport,
            f.AIRLINE_CODE as airlineCode,
            al.AIRLINE_NAME as airlineName
        FROM BAGGAGE bg
        JOIN TICKETS t ON bg.TICKET_ID = t.TICKET_ID
        JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
        LEFT JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
        LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
        LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        WHERE UPPER(bg.TAG_NUMBER) = ?
        LIMIT 1
    `;
    const res = await db.execute(sql, [cleanTag]);
    if (!res.rows || res.rows.length === 0) {
        return null;
    }

    const bag = res.rows[0];

    // Privacy guard: If caller is a passenger, verify the ticket belongs to them
    if (user && user.role === 'PASSENGER') {
        if (bag.userId !== user.userId) {
            const err = new Error('Access denied. You cannot inspect other travelers’ baggage records.');
            err.statusCode = 403;
            throw err;
        }
    }

    return {
        ...bag,
        weightKg: parseFloat(bag.weightKg) || 0,
        ticket: {
            ticketId: bag.ticketId,
            ticketNumber: bag.ticketNumber,
            seatNumber: bag.seatNumber,
            cabinClass: bag.cabinClass,
            bookingReference: bag.bookingReference,
        },
    };
}

/**
 * Registers new baggage against a valid booking or ticket.
 * Enforces weight bounds (0.1 - 60.0 kg), ticket status checks, and passenger ownership.
 */
async function registerBaggage(data, user) {
    const { ticketId, bookingReference, pnr, weightKg, carouselNumber, tagNumber, baggageType, description } = data;

    // Validate weight
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0 || weight > 60) {
        const err = new Error('Baggage weight must be between 0.1 kg and 60.0 kg.');
        err.statusCode = 400;
        throw err;
    }

    // Resolve Ticket from MySQL
    let ticket = null;
    if (ticketId) {
        const tRes = await db.execute(
            `SELECT t.*, b.USER_ID as userId, b.STATUS as bookingStatus, b.BOOKING_REFERENCE as bookingReference,
                    fi.FLIGHT_NUMBER as flightNumber, f.AIRLINE_CODE as airlineCode
             FROM TICKETS t
             JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
             LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
             LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
             WHERE t.TICKET_ID = ?`,
            [parseInt(ticketId, 10)]
        );
        if (tRes.rows && tRes.rows.length > 0) {
            ticket = tRes.rows[0];
        }
    } else if (bookingReference || pnr) {
        const refVal = (bookingReference || pnr).trim();
        const tRes = await db.execute(
            `SELECT t.*, b.USER_ID as userId, b.STATUS as bookingStatus, b.BOOKING_REFERENCE as bookingReference,
                    fi.FLIGHT_NUMBER as flightNumber, f.AIRLINE_CODE as airlineCode
             FROM TICKETS t
             JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
             LEFT JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
             LEFT JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
             WHERE b.BOOKING_REFERENCE = ? AND t.STATUS != 'CANCELLED'
             LIMIT 1`,
            [refVal]
        );
        if (tRes.rows && tRes.rows.length > 0) {
            ticket = tRes.rows[0];
        }
    }

    if (!ticket) {
        const err = new Error('Associated ticket not found for provided reference.');
        err.statusCode = 404;
        throw err;
    }

    // Reject registration for cancelled bookings or tickets
    if (ticket.bookingStatus === 'CANCELLED' || ticket.STATUS === 'CANCELLED') {
        const err = new Error('Cannot register baggage for a cancelled booking or ticket.');
        err.statusCode = 400;
        throw err;
    }

    // Passenger Ownership Verification
    if (user && user.role === 'PASSENGER') {
        if (ticket.userId !== user.userId) {
            const err = new Error('Access denied. You can only register baggage for your own bookings.');
            err.statusCode = 403;
            throw err;
        }
    }

    // Handle Tag Number and Uniqueness
    let finalTag = tagNumber ? tagNumber.trim().toUpperCase() : null;
    if (finalTag) {
        const dupCheck = await db.execute(
            `SELECT BAGGAGE_ID FROM BAGGAGE WHERE UPPER(TAG_NUMBER) = ? LIMIT 1`,
            [finalTag]
        );
        if (dupCheck.rows && dupCheck.rows.length > 0) {
            const err = new Error(`Duplicate baggage tag number '${finalTag}' already exists.`);
            err.statusCode = 409;
            throw err;
        }
    } else {
        // Generate unique tag
        const carrier = ticket.airlineCode || 'AMS';
        for (let attempt = 0; attempt < 5; attempt++) {
            const candidate = generateBagTag(carrier);
            const dupCheck = await db.execute(
                `SELECT BAGGAGE_ID FROM BAGGAGE WHERE TAG_NUMBER = ? LIMIT 1`,
                [candidate]
            );
            if (!dupCheck.rows || dupCheck.rows.length === 0) {
                finalTag = candidate;
                break;
            }
        }
        if (!finalTag) {
            finalTag = generateBagTag(carrier);
        }
    }

    const assignedCarousel = carouselNumber || 'C01';

    // Insert into MySQL BAGGAGE table
    const insRes = await db.execute(
        `INSERT INTO BAGGAGE (TICKET_ID, TAG_NUMBER, WEIGHT_KG, STATUS, CAROUSEL_NUMBER)
         VALUES (?, ?, ?, 'CHECKED_IN', ?)`,
        [ticket.TICKET_ID, finalTag, weight, assignedCarousel]
    );

    const baggageId = insRes.insertId;

    const newBag = {
        baggageId,
        ticketId: ticket.TICKET_ID,
        tagNumber: finalTag,
        weightKg: weight,
        status: 'CHECKED_IN',
        carouselNumber: assignedCarousel,
        baggageType: baggageType || 'CHECKED_LUGGAGE',
        description: description || null,
        flightNumber: ticket.flightNumber,
        bookingReference: ticket.bookingReference,
        createdAt: new Date().toISOString(),
    };

    // Synchronize in-memory store for any legacy consumers
    if (store.baggage) {
        store.baggage.push(newBag);
    }

    return newBag;
}

/**
 * Updates baggage handling status with lifecycle transition validation.
 * Rejects illegal status regressions (e.g. DELIVERED -> CHECKED_IN).
 */
async function updateBaggageStatus(id, newStatus, carouselNumber) {
    if (!id) {
        const err = new Error('Baggage ID or tag number is required.');
        err.statusCode = 400;
        throw err;
    }

    // Look up in MySQL by BAGGAGE_ID or TAG_NUMBER
    const numId = parseInt(id, 10);
    const isNumeric = !isNaN(numId) && String(numId) === String(id);

    const sqlLookup = isNumeric
        ? `SELECT * FROM BAGGAGE WHERE BAGGAGE_ID = ? LIMIT 1`
        : `SELECT * FROM BAGGAGE WHERE TAG_NUMBER = ? LIMIT 1`;
    const paramLookup = isNumeric ? [numId] : [String(id)];

    const res = await db.execute(sqlLookup, paramLookup);
    if (!res.rows || res.rows.length === 0) {
        const err = new Error('Baggage record not found.');
        err.statusCode = 404;
        throw err;
    }

    const bag = res.rows[0];
    const currentStatus = bag.STATUS;

    const normalizedStatus = (newStatus || '').toUpperCase().trim();
    if (!VALID_BAGGAGE_STATUSES.includes(normalizedStatus)) {
        const err = new Error(`Invalid status. Permitted: ${VALID_BAGGAGE_STATUSES.join(', ')}`);
        err.statusCode = 400;
        throw err;
    }

    // Validate Status Transitions
    if (normalizedStatus !== currentStatus) {
        const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowedNext.includes(normalizedStatus)) {
            const err = new Error(`Invalid baggage status transition from ${currentStatus} to ${normalizedStatus}.`);
            err.statusCode = 400;
            throw err;
        }
    }

    const finalCarousel = carouselNumber ? carouselNumber.trim() : bag.CAROUSEL_NUMBER;

    // Update MySQL
    await db.execute(
        `UPDATE BAGGAGE SET STATUS = ?, CAROUSEL_NUMBER = ? WHERE BAGGAGE_ID = ?`,
        [normalizedStatus, finalCarousel, bag.BAGGAGE_ID]
    );

    // Update in-memory store if present
    const inMem = store.baggage.find(b => b.baggageId === bag.BAGGAGE_ID || b.tagNumber === bag.TAG_NUMBER);
    if (inMem) {
        inMem.status = normalizedStatus;
        if (finalCarousel) inMem.carouselNumber = finalCarousel;
    }

    return {
        baggageId: bag.BAGGAGE_ID,
        ticketId: bag.TICKET_ID,
        tagNumber: bag.TAG_NUMBER,
        weightKg: parseFloat(bag.WEIGHT_KG) || 0,
        status: normalizedStatus,
        carouselNumber: finalCarousel,
    };
}

/**
 * Generates an aggregated baggage telemetry report for authorized staff.
 */
async function getStaffBaggageOverview(user) {
    const summaryRes = await db.execute(`
        SELECT 
            COUNT(*) as totalBaggage,
            COUNT(CASE WHEN STATUS = 'REGISTERED' THEN 1 END) as registeredCount,
            COUNT(CASE WHEN STATUS = 'CHECKED_IN' THEN 1 END) as checkedInCount,
            COUNT(CASE WHEN STATUS = 'SECURITY_CLEARED' THEN 1 END) as securityClearedCount,
            COUNT(CASE WHEN STATUS = 'IN_TRANSIT' THEN 1 END) as inTransitCount,
            COUNT(CASE WHEN STATUS = 'LOADED' THEN 1 END) as loadedCount,
            COUNT(CASE WHEN STATUS = 'ARRIVED' THEN 1 END) as arrivedCount,
            COUNT(CASE WHEN STATUS = 'CLAIM_READY' THEN 1 END) as claimReadyCount,
            COUNT(CASE WHEN STATUS = 'DELIVERED' THEN 1 END) as deliveredCount,
            COUNT(CASE WHEN STATUS = 'COLLECTED' THEN 1 END) as collectedCount,
            COUNT(CASE WHEN STATUS = 'DELAYED' THEN 1 END) as delayedCount,
            COUNT(CASE WHEN STATUS IN ('REGISTERED', 'CHECKED_IN', 'SECURITY_CLEARED', 'IN_TRANSIT', 'LOADED') THEN 1 END) as pendingCount,
            COALESCE(SUM(WEIGHT_KG), 0) as totalWeightKg
        FROM BAGGAGE
    `);

    const summary = summaryRes.rows[0] || {};

    const flightRes = await db.execute(`
        SELECT 
            fi.FLIGHT_INSTANCE_ID as flightInstanceId,
            fi.FLIGHT_NUMBER as flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') as flightDate,
            f.ORIGIN_AIRPORT as originAirport,
            f.DEST_AIRPORT as destAirport,
            COUNT(bg.BAGGAGE_ID) as bagCount,
            COALESCE(SUM(bg.WEIGHT_KG), 0) as totalWeightKg,
            COUNT(CASE WHEN bg.STATUS IN ('REGISTERED', 'CHECKED_IN', 'SECURITY_CLEARED', 'IN_TRANSIT', 'LOADED') THEN 1 END) as pendingCount,
            COUNT(CASE WHEN bg.STATUS IN ('ARRIVED', 'CLAIM_READY', 'DELIVERED', 'COLLECTED') THEN 1 END) as completedCount
        FROM FLIGHT_INSTANCES fi
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
        LEFT JOIN BAGGAGE bg ON t.TICKET_ID = bg.TICKET_ID
        GROUP BY fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER, fi.FLIGHT_DATE, f.ORIGIN_AIRPORT, f.DEST_AIRPORT
        ORDER BY fi.FLIGHT_DATE DESC, fi.FLIGHT_NUMBER ASC
    `);

    return {
        summary: {
            totalBaggage: parseInt(summary.totalBaggage, 10) || 0,
            pendingCount: parseInt(summary.pendingCount, 10) || 0,
            checkedInCount: parseInt(summary.checkedInCount, 10) || 0,
            loadedCount: parseInt(summary.loadedCount, 10) || 0,
            inTransitCount: parseInt(summary.inTransitCount, 10) || 0,
            arrivedCount: parseInt(summary.arrivedCount, 10) || 0,
            deliveredCount: (parseInt(summary.deliveredCount, 10) || 0) + (parseInt(summary.collectedCount, 10) || 0),
            totalWeightKg: parseFloat(summary.totalWeightKg) || 0,
        },
        flights: flightRes.rows || [],
    };
}

module.exports = {
    getAllBaggage,
    getBaggageByTag,
    registerBaggage,
    updateBaggageStatus,
    getStaffBaggageOverview,
};
