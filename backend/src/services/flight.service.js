/**
 * Module 2: Flight Management Service
 * Handles recurring flight route templates, daily flight instances,
 * searching, filtering, and audited status state-machine transitions.
 */

const db = require('./database.service');
const store = require('./operations.store');

const VALID_STATUSES = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'ARRIVED'];

async function getAllFlights(filters = {}) {
    let list = store.flightInstances.map(inst => {
        const route = store.flights.find(f => f.flightNumber === inst.flightNumber) || {};
        const aircraft = store.aircraft.find(a => a.aircraftId === inst.aircraftId) || null;
        const depGate = store.gates.find(g => g.gateId === inst.departureGateId) || null;
        const arrGate = store.gates.find(g => g.gateId === inst.arrivalGateId) || null;

        return {
            ...inst,
            airlineCode: route.airlineCode,
            originAirport: route.originAirport,
            destAirport: route.destAirport,
            flightType: route.flightType,
            baseFare: route.baseFare,
            aircraftModel: aircraft?.model || null,
            aircraftReg: aircraft?.registrationNo || null,
            departureGate: depGate ? `${depGate.terminal}-${depGate.gateNumber}` : null,
            arrivalGate: arrGate ? `${arrGate.terminal}-${arrGate.gateNumber}` : null,
        };
    });

    if (filters.origin) {
        list = list.filter(f => f.originAirport === filters.origin.toUpperCase());
    }
    if (filters.destination) {
        list = list.filter(f => f.destAirport === filters.destination.toUpperCase());
    }
    if (filters.airline) {
        list = list.filter(f => f.airlineCode === filters.airline.toUpperCase());
    }
    if (filters.status) {
        list = list.filter(f => f.status === filters.status.toUpperCase());
    }
    if (filters.date) {
        list = list.filter(f => f.flightDate === filters.date);
    }

    return list;
}

async function getFlightById(id) {
    const numId = parseInt(id, 10);
    const inst = store.flightInstances.find(f => f.flightInstanceId === numId);
    if (!inst) return null;

    const route = store.flights.find(f => f.flightNumber === inst.flightNumber) || {};
    const aircraft = store.aircraft.find(a => a.aircraftId === inst.aircraftId) || null;
    const depGate = store.gates.find(g => g.gateId === inst.departureGateId) || null;
    const arrGate = store.gates.find(g => g.gateId === inst.arrivalGateId) || null;

    return {
        ...inst,
        airlineCode: route.airlineCode,
        originAirport: route.originAirport,
        destAirport: route.destAirport,
        flightType: route.flightType,
        baseFare: route.baseFare,
        aircraft,
        departureGate: depGate,
        arrivalGate: arrGate,
    };
}

async function createFlight(data, user) {
    const flightNumber = (data.flightNumber || '').toUpperCase().trim();
    const origin = (data.originAirport || '').toUpperCase().trim();
    const dest = (data.destAirport || '').toUpperCase().trim();
    const airline = (data.airlineCode || '').toUpperCase().trim();

    if (!flightNumber || !origin || !dest || !airline) {
        const err = new Error('Flight number, airline, origin, and destination are required.');
        err.statusCode = 400;
        throw err;
    }

    if (origin === dest) {
        const err = new Error('Origin airport and destination airport cannot be identical.');
        err.statusCode = 400;
        throw err;
    }

    // Role ownership check: Airline staff can only create flights for their assigned carrier
    if (user.role === 'AIRLINE_STAFF' && user.airlineCode && user.airlineCode !== airline) {
        const err = new Error(`Unauthorized. You can only create flights for your designated airline (${user.airlineCode}).`);
        err.statusCode = 403;
        throw err;
    }

    // 1. Create or update flight route template
    let route = store.flights.find(f => f.flightNumber === flightNumber);
    if (!route) {
        route = {
            flightNumber,
            airlineCode: airline,
            originAirport: origin,
            destAirport: dest,
            scheduledDepartureTime: data.scheduledDepartureTime || '08:00',
            scheduledArrivalTime: data.scheduledArrivalTime || '11:00',
            flightType: data.flightType || 'NON-STOP',
            baseFare: parseFloat(data.baseFare) || 5000.00,
            isActive: 'Y',
            createdAt: new Date().toISOString(),
        };
        store.flights.push(route);
    }

    // 2. Create Flight Instance
    const flightDate = data.flightDate || new Date().toISOString().substring(0, 10);
    const existingInstance = store.flightInstances.find(i => i.flightNumber === flightNumber && i.flightDate === flightDate);
    if (existingInstance) {
        const err = new Error(`Flight instance ${flightNumber} on date ${flightDate} already exists.`);
        err.statusCode = 409;
        throw err;
    }

    const newInstance = {
        flightInstanceId: store.flightInstances.length + 1,
        flightNumber,
        flightDate,
        aircraftId: data.aircraftId ? parseInt(data.aircraftId, 10) : null,
        departureGateId: data.departureGateId ? parseInt(data.departureGateId, 10) : null,
        arrivalGateId: data.arrivalGateId ? parseInt(data.arrivalGateId, 10) : null,
        scheduledDeparture: `${flightDate} ${route.scheduledDepartureTime}:00`,
        scheduledArrival: `${flightDate} ${route.scheduledArrivalTime}:00`,
        actualDeparture: null,
        actualArrival: null,
        status: data.status ? data.status.toUpperCase() : 'SCHEDULED',
        remarks: data.remarks || 'Scheduled operations',
        createdAt: new Date().toISOString(),
    };

    store.flightInstances.push(newInstance);
    return newInstance;
}

async function updateFlightStatus(id, newStatus, reason, userId) {
    const numId = parseInt(id, 10);
    const instance = store.flightInstances.find(i => i.flightInstanceId === numId);
    if (!instance) {
        const err = new Error(`Flight instance ID ${id} not found.`);
        err.statusCode = 404;
        throw err;
    }

    const normalizedStatus = (newStatus || '').toUpperCase().trim();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
        const err = new Error(`Invalid flight status. Permitted: ${VALID_STATUSES.join(', ')}`);
        err.statusCode = 400;
        throw err;
    }

    const oldStatus = instance.status;
    instance.status = normalizedStatus;
    if (reason) instance.remarks = reason;

    if (normalizedStatus === 'DEPARTED' && !instance.actualDeparture) {
        instance.actualDeparture = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    if (normalizedStatus === 'ARRIVED' && !instance.actualArrival) {
        instance.actualArrival = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    // Log to FLIGHT_STATUS_HISTORY
    const historyEntry = {
        historyId: store.flightStatusHistory.length + 1,
        flightInstanceId: numId,
        oldStatus,
        newStatus: normalizedStatus,
        reason: reason || 'Operational status update',
        changedAt: new Date().toISOString(),
        changedByUserId: userId || null,
    };
    store.flightStatusHistory.push(historyEntry);

    return {
        instance,
        history: historyEntry,
    };
}

module.exports = {
    getAllFlights,
    getFlightById,
    createFlight,
    updateFlightStatus,
};
