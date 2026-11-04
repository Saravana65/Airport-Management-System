/**
 * Module 1: Airport, Airline & Aircraft Management Service
 * Supports Oracle SQL queries with offline-resilient operations.
 */

const db = require('./database.service');
const store = require('./operations.store');

// --- AIRPORTS ---

async function getAllAirports() {
    try {
        const result = await db.execute('SELECT * FROM AIRPORTS ORDER BY AIRPORT_CODE ASC');
        if (result && result.rows) return result.rows;
    } catch (err) {
        // Fallback to operational store
    }
    return store.airports;
}

async function getAirportByCode(code) {
    const upperCode = code.toUpperCase();
    try {
        const result = await db.execute('SELECT * FROM AIRPORTS WHERE AIRPORT_CODE = :code', { code: upperCode });
        if (result && result.rows && result.rows[0]) return result.rows[0];
    } catch (err) {}
    return store.airports.find(a => a.airportCode === upperCode) || null;
}

async function createAirport(data) {
    const airportCode = (data.airportCode || '').toUpperCase().trim();
    if (!airportCode || airportCode.length !== 3) {
        const err = new Error('Airport code must be exactly 3 uppercase letters.');
        err.statusCode = 400;
        throw err;
    }

    if (store.airports.some(a => a.airportCode === airportCode)) {
        const err = new Error(`Airport code ${airportCode} already exists.`);
        err.statusCode = 409;
        throw err;
    }

    const newAirport = {
        airportCode,
        airportName: data.airportName || '',
        city: data.city || '',
        state: data.state || null,
        country: data.country || '',
        timezone: data.timezone || 'UTC',
        isActive: 'Y',
        createdAt: new Date().toISOString(),
    };

    try {
        await db.execute(
            `INSERT INTO AIRPORTS (AIRPORT_CODE, AIRPORT_NAME, CITY, STATE, COUNTRY, TIMEZONE, IS_ACTIVE)
             VALUES (:airportCode, :airportName, :city, :state, :country, :timezone, 'Y')`,
            newAirport,
            { autoCommit: true }
        );
    } catch (err) {}

    store.airports.push(newAirport);
    return newAirport;
}

async function updateAirport(code, data) {
    const airport = await getAirportByCode(code);
    if (!airport) {
        const err = new Error(`Airport with code ${code} not found.`);
        err.statusCode = 404;
        throw err;
    }

    airport.airportName = data.airportName !== undefined ? data.airportName : airport.airportName;
    airport.city = data.city !== undefined ? data.city : airport.city;
    airport.state = data.state !== undefined ? data.state : airport.state;
    airport.country = data.country !== undefined ? data.country : airport.country;
    airport.timezone = data.timezone !== undefined ? data.timezone : airport.timezone;
    if (data.isActive !== undefined) airport.isActive = data.isActive;

    try {
        await db.execute(
            `UPDATE AIRPORTS 
             SET AIRPORT_NAME = :airportName, CITY = :city, STATE = :state, COUNTRY = :country, TIMEZONE = :timezone, IS_ACTIVE = :isActive
             WHERE AIRPORT_CODE = :airportCode`,
            { ...airport, airportCode: airport.airportCode },
            { autoCommit: true }
        );
    } catch (err) {}

    return airport;
}

// --- AIRLINES ---

async function getAllAirlines() {
    try {
        const result = await db.execute('SELECT * FROM AIRLINES ORDER BY AIRLINE_CODE ASC');
        if (result && result.rows) return result.rows;
    } catch (err) {}
    return store.airlines;
}

async function getAirlineByCode(code) {
    const upperCode = code.toUpperCase();
    try {
        const result = await db.execute('SELECT * FROM AIRLINES WHERE AIRLINE_CODE = :code', { code: upperCode });
        if (result && result.rows && result.rows[0]) return result.rows[0];
    } catch (err) {}
    return store.airlines.find(a => a.airlineCode === upperCode) || null;
}

async function createAirline(data) {
    const airlineCode = (data.airlineCode || '').toUpperCase().trim();
    if (!airlineCode || airlineCode.length < 2 || airlineCode.length > 3) {
        const err = new Error('Airline code must be 2 to 3 characters.');
        err.statusCode = 400;
        throw err;
    }

    if (store.airlines.some(a => a.airlineCode === airlineCode)) {
        const err = new Error(`Airline code ${airlineCode} already registered.`);
        err.statusCode = 409;
        throw err;
    }

    const newAirline = {
        airlineCode,
        airlineName: data.airlineName || '',
        threeDigitCode: data.threeDigitCode || null,
        country: data.country || '',
        contactEmail: data.contactEmail || null,
        isActive: 'Y',
        createdAt: new Date().toISOString(),
    };

    try {
        await db.execute(
            `INSERT INTO AIRLINES (AIRLINE_CODE, AIRLINE_NAME, THREE_DIGIT_CODE, COUNTRY, CONTACT_EMAIL, IS_ACTIVE)
             VALUES (:airlineCode, :airlineName, :threeDigitCode, :country, :contactEmail, 'Y')`,
            newAirline,
            { autoCommit: true }
        );
    } catch (err) {}

    store.airlines.push(newAirline);
    return newAirline;
}

async function updateAirline(code, data) {
    const airline = await getAirlineByCode(code);
    if (!airline) {
        const err = new Error(`Airline with code ${code} not found.`);
        err.statusCode = 404;
        throw err;
    }

    airline.airlineName = data.airlineName !== undefined ? data.airlineName : airline.airlineName;
    airline.threeDigitCode = data.threeDigitCode !== undefined ? data.threeDigitCode : airline.threeDigitCode;
    airline.country = data.country !== undefined ? data.country : airline.country;
    airline.contactEmail = data.contactEmail !== undefined ? data.contactEmail : airline.contactEmail;
    if (data.isActive !== undefined) airline.isActive = data.isActive;

    try {
        await db.execute(
            `UPDATE AIRLINES 
             SET AIRLINE_NAME = :airlineName, THREE_DIGIT_CODE = :threeDigitCode, COUNTRY = :country, CONTACT_EMAIL = :contactEmail, IS_ACTIVE = :isActive
             WHERE AIRLINE_CODE = :airlineCode`,
            { ...airline, airlineCode: airline.airlineCode },
            { autoCommit: true }
        );
    } catch (err) {}

    return airline;
}

// --- AIRCRAFT ---

async function getAllAircraft() {
    try {
        const result = await db.execute('SELECT * FROM AIRCRAFT ORDER BY AIRCRAFT_ID ASC');
        if (result && result.rows) return result.rows;
    } catch (err) {}
    return store.aircraft;
}

async function getAircraftById(id) {
    const numId = parseInt(id, 10);
    try {
        const result = await db.execute('SELECT * FROM AIRCRAFT WHERE AIRCRAFT_ID = :id', { id: numId });
        if (result && result.rows && result.rows[0]) return result.rows[0];
    } catch (err) {}
    return store.aircraft.find(a => a.aircraftId === numId) || null;
}

async function createAircraft(data) {
    const regNo = (data.registrationNo || '').toUpperCase().trim();
    if (!regNo) {
        const err = new Error('Registration number is required.');
        err.statusCode = 400;
        throw err;
    }

    if (store.aircraft.some(a => a.registrationNo === regNo)) {
        const err = new Error(`Aircraft with tail number ${regNo} already registered.`);
        err.statusCode = 409;
        throw err;
    }

    const economySeats = parseInt(data.economySeats, 10) || 0;
    const businessSeats = parseInt(data.businessSeats, 10) || 0;
    const firstSeats = parseInt(data.firstSeats, 10) || 0;
    const totalSeats = parseInt(data.totalSeats, 10) || (economySeats + businessSeats + firstSeats);

    if (totalSeats <= 0) {
        const err = new Error('Total aircraft seating capacity must be greater than zero.');
        err.statusCode = 400;
        throw err;
    }

    const newAircraft = {
        aircraftId: store.aircraft.length + 1,
        registrationNo: regNo,
        model: data.model || 'Commercial Aircraft',
        airlineCode: (data.airlineCode || '').toUpperCase().trim(),
        totalSeats,
        economySeats,
        businessSeats,
        firstSeats,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
    };

    try {
        await db.execute(
            `INSERT INTO AIRCRAFT (REGISTRATION_NO, MODEL, AIRLINE_CODE, TOTAL_SEATS, ECONOMY_SEATS, BUSINESS_SEATS, FIRST_SEATS, STATUS)
             VALUES (:registrationNo, :model, :airlineCode, :totalSeats, :economySeats, :businessSeats, :firstSeats, :status)`,
            newAircraft,
            { autoCommit: true }
        );
    } catch (err) {}

    store.aircraft.push(newAircraft);
    return newAircraft;
}

async function updateAircraft(id, data) {
    const aircraft = await getAircraftById(id);
    if (!aircraft) {
        const err = new Error(`Aircraft with ID ${id} not found.`);
        err.statusCode = 404;
        throw err;
    }

    if (data.model !== undefined) aircraft.model = data.model;
    if (data.airlineCode !== undefined) aircraft.airlineCode = data.airlineCode.toUpperCase();
    if (data.status !== undefined) aircraft.status = data.status;
    if (data.totalSeats !== undefined) aircraft.totalSeats = parseInt(data.totalSeats, 10);

    try {
        await db.execute(
            `UPDATE AIRCRAFT 
             SET MODEL = :model, AIRLINE_CODE = :airlineCode, STATUS = :status, TOTAL_SEATS = :totalSeats
             WHERE AIRCRAFT_ID = :aircraftId`,
            aircraft,
            { autoCommit: true }
        );
    } catch (err) {}

    return aircraft;
}

module.exports = {
    getAllAirports,
    getAirportByCode,
    createAirport,
    updateAirport,
    getAllAirlines,
    getAirlineByCode,
    createAirline,
    updateAirline,
    getAllAircraft,
    getAircraftById,
    createAircraft,
    updateAircraft,
};
