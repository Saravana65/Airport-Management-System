/**
 * Module 2: Flight Management Service
 * Handles recurring flight route templates, daily flight instances,
 * searching, filtering, and audited status state-machine transitions.
 */

const db = require('./database.service');
const store = require('./operations.store');

const VALID_STATUSES = [
    'SCHEDULED',
    'CHECK_IN',
    'BOARDING',
    'GATE_CLOSED',
    'DEPARTED',
    'IN_AIR',
    'ON_TIME',
    'DELAYED',
    'LANDING_SOON',
    'LANDED',
    'ARRIVED',
    'CANCELLED',
    'DIVERTED'
];

async function getAllFlights(filters = {}, user = null) {
    let list = store.flightInstances.map(inst => {
        const route = store.flights.find(f => f.flightNumber === inst.flightNumber) || {};
        const airline = store.airlines.find(a => a.airlineCode === route.airlineCode) || {};
        const originAirport = store.airports.find(ap => ap.airportCode === route.originAirport) || {};
        const destAirport = store.airports.find(ap => ap.airportCode === route.destAirport) || {};
        const aircraft = store.aircraft.find(a => a.aircraftId === inst.aircraftId) || null;
        const depGate = store.gates.find(g => g.gateId === inst.departureGateId) || null;
        const arrGate = store.gates.find(g => g.gateId === inst.arrivalGateId) || null;

        // Departure Terminal & Gate
        const depTerminal = depGate ? depGate.terminal : (route.originAirport === 'BOM' ? 'T2' : 'T3');
        const depGateNumber = depGate ? depGate.gateNumber : 'G01';
        const departureGateStr = depGate ? `${depGate.terminal}-${depGate.gateNumber}` : `${depTerminal}-${depGateNumber}`;

        // Arrival Terminal & Gate
        const arrTerminal = arrGate ? arrGate.terminal : 'T1';
        const arrGateNumber = arrGate ? arrGate.gateNumber : 'A12';
        const arrivalGateStr = arrGate ? `${arrGate.terminal}-${arrGate.gateNumber}` : `${arrTerminal}-${arrGateNumber}`;

        // Delay & Estimated Times
        let delayMinutes = inst.delayMinutes || 0;
        let estimatedDeparture = inst.estimatedDeparture || null;
        let estimatedArrival = inst.estimatedArrival || null;

        if (inst.status === 'DELAYED') {
            delayMinutes = delayMinutes || 45;
            if (!estimatedDeparture && inst.scheduledDeparture) {
                const schedDepDate = new Date(inst.scheduledDeparture.replace(' ', 'T'));
                if (!isNaN(schedDepDate.getTime())) {
                    const estDate = new Date(schedDepDate.getTime() + delayMinutes * 60000);
                    estimatedDeparture = estDate.toISOString().replace('T', ' ').substring(0, 19);
                }
            }
            if (!estimatedArrival && inst.scheduledArrival) {
                const schedArrDate = new Date(inst.scheduledArrival.replace(' ', 'T'));
                if (!isNaN(schedArrDate.getTime())) {
                    const estDate = new Date(schedArrDate.getTime() + delayMinutes * 60000);
                    estimatedArrival = estDate.toISOString().replace('T', ' ').substring(0, 19);
                }
            }
        } else if (inst.status === 'CANCELLED') {
            estimatedDeparture = null;
            estimatedArrival = null;
        } else {
            // Default to scheduled times for non-delayed/cancelled flights
            if (!estimatedDeparture && inst.scheduledDeparture) estimatedDeparture = inst.scheduledDeparture;
            if (!estimatedArrival && inst.scheduledArrival) estimatedArrival = inst.scheduledArrival;
        }

        // Dynamic Operational Messaging
        const depTimeStr = (inst.scheduledDeparture || '').substring(11, 16) || route.scheduledDepartureTime || '';
        const estDepTimeStr = estimatedDeparture ? estimatedDeparture.substring(11, 16) : '';
        const arrTimeStr = (inst.scheduledArrival || '').substring(11, 16) || route.scheduledArrivalTime || '';
        const actArrTimeStr = inst.actualArrival ? inst.actualArrival.substring(11, 16) : '';

        let operationalMessage = inst.remarks || '';
        switch (inst.status) {
            case 'ON_TIME':
            case 'SCHEDULED':
                operationalMessage = `On Time — Scheduled departure at ${depTimeStr}`;
                break;
            case 'DELAYED':
                operationalMessage = `Delayed — Estimated departure at ${estDepTimeStr || 'TBD'} (+${delayMinutes}m)`;
                break;
            case 'BOARDING':
                operationalMessage = `Boarding — Gate ${departureGateStr}`;
                break;
            case 'GATE_CLOSED':
                operationalMessage = `Gate Closed — Final call closed`;
                break;
            case 'CHECK_IN':
                operationalMessage = `Check-In Open — Terminal ${depTerminal}`;
                break;
            case 'DEPARTED':
                operationalMessage = `Departed — Airborne on flight path`;
                break;
            case 'IN_AIR':
                operationalMessage = `In Flight — En route to ${route.destAirport}`;
                break;
            case 'LANDING_SOON':
                operationalMessage = `Landing in approximately 25m`;
                break;
            case 'LANDED':
            case 'ARRIVED':
                operationalMessage = `Landed — Actual arrival at ${actArrTimeStr || arrTimeStr}`;
                break;
            case 'CANCELLED':
                operationalMessage = `Cancelled — Contact airline customer desk`;
                break;
            case 'DIVERTED':
                operationalMessage = `Diverted — Weather rerouting in progress`;
                break;
            default:
                operationalMessage = inst.remarks || 'Standard operations';
        }

        return {
            ...inst,
            airlineCode: route.airlineCode,
            airlineName: airline.airlineName || route.airlineCode,
            airlineCountry: airline.country || '',
            originAirport: route.originAirport,
            originAirportName: originAirport.airportName || route.originAirport,
            originCity: originAirport.city || '',
            originCountry: originAirport.country || '',
            originTimezone: originAirport.timezone || 'UTC',
            destAirport: route.destAirport,
            destAirportName: destAirport.airportName || route.destAirport,
            destCity: destAirport.city || '',
            destCountry: destAirport.country || '',
            destTimezone: destAirport.timezone || 'UTC',
            flightType: route.flightType,
            baseFare: route.baseFare,
            scheduledDepartureTime: route.scheduledDepartureTime,
            scheduledArrivalTime: route.scheduledArrivalTime,
            departureTerminal: depTerminal,
            departureGateNumber: depGateNumber,
            departureGate: departureGateStr,
            arrivalTerminal: arrTerminal,
            arrivalGateNumber: arrGateNumber,
            arrivalGate: arrivalGateStr,
            terminal: depTerminal,
            gate: depGateNumber,
            estimatedDeparture,
            estimatedArrival,
            delayMinutes,
            operationalMessage,
            aircraftModel: aircraft?.model || null,
            aircraftReg: aircraft?.registrationNo || null,
        };
    });

    // 1. Text Search across key fields
    if (filters.search || filters.q) {
        const query = (filters.search || filters.q).toLowerCase().trim();
        list = list.filter(f =>
            (f.flightNumber && f.flightNumber.toLowerCase().includes(query)) ||
            (f.airlineName && f.airlineName.toLowerCase().includes(query)) ||
            (f.airlineCode && f.airlineCode.toLowerCase().includes(query)) ||
            (f.originAirport && f.originAirport.toLowerCase().includes(query)) ||
            (f.originCity && f.originCity.toLowerCase().includes(query)) ||
            (f.destAirport && f.destAirport.toLowerCase().includes(query)) ||
            (f.destCity && f.destCity.toLowerCase().includes(query)) ||
            (f.status && f.status.toLowerCase().includes(query)) ||
            (f.departureGate && f.departureGate.toLowerCase().includes(query))
        );
    }

    // 2. Specific Route / Airport Filters
    if (filters.origin) {
        list = list.filter(f => f.originAirport === filters.origin.toUpperCase());
    }
    if (filters.destination) {
        list = list.filter(f => f.destAirport === filters.destination.toUpperCase());
    }
    if (filters.airport) {
        const ap = filters.airport.toUpperCase();
        list = list.filter(f => f.originAirport === ap || f.destAirport === ap);
    }

    // 3. Airline Filter
    if (filters.airline) {
        list = list.filter(f => f.airlineCode === filters.airline.toUpperCase());
    }

    // 4. Status Filter
    if (filters.status && filters.status !== 'ALL') {
        const targetStatus = filters.status.toUpperCase();
        if (targetStatus === 'ON_TIME') {
            list = list.filter(f => f.status === 'ON_TIME' || f.status === 'SCHEDULED');
        } else if (targetStatus === 'LANDED') {
            list = list.filter(f => f.status === 'LANDED' || f.status === 'ARRIVED');
        } else {
            list = list.filter(f => f.status === targetStatus);
        }
    }

    // 5. Date Filter
    if (filters.date) {
        list = list.filter(f => f.flightDate === filters.date);
    }

    // 6. Role-Based Airline Staff Filtering (when explicitly requesting airline scope)
    if (user && user.role === 'AIRLINE_STAFF' && user.airlineCode && filters.scope === 'carrier_only') {
        list = list.filter(f => f.airlineCode === user.airlineCode);
    }

    return list;
}

async function getFlightById(id) {
    const numId = parseInt(id, 10);
    const inst = store.flightInstances.find(f => f.flightInstanceId === numId);
    if (!inst) return null;

    const route = store.flights.find(f => f.flightNumber === inst.flightNumber) || {};
    const airline = store.airlines.find(a => a.airlineCode === route.airlineCode) || {};
    const originAirport = store.airports.find(ap => ap.airportCode === route.originAirport) || {};
    const destAirport = store.airports.find(ap => ap.airportCode === route.destAirport) || {};
    const aircraft = store.aircraft.find(a => a.aircraftId === inst.aircraftId) || null;
    const depGate = store.gates.find(g => g.gateId === inst.departureGateId) || null;
    const arrGate = store.gates.find(g => g.gateId === inst.arrivalGateId) || null;

    const depTerminal = depGate ? depGate.terminal : 'T2';
    const depGateNumber = depGate ? depGate.gateNumber : 'G01';
    const arrTerminal = arrGate ? arrGate.terminal : 'T1';
    const arrGateNumber = arrGate ? arrGate.gateNumber : 'A12';

    let delayMinutes = inst.delayMinutes || 0;
    let estimatedDeparture = inst.estimatedDeparture || inst.scheduledDeparture;
    let estimatedArrival = inst.estimatedArrival || inst.scheduledArrival;

    if (inst.status === 'DELAYED' && !inst.estimatedDeparture && inst.scheduledDeparture) {
        delayMinutes = delayMinutes || 45;
        const schedDepDate = new Date(inst.scheduledDeparture.replace(' ', 'T'));
        if (!isNaN(schedDepDate.getTime())) {
            const estDate = new Date(schedDepDate.getTime() + delayMinutes * 60000);
            estimatedDeparture = estDate.toISOString().replace('T', ' ').substring(0, 19);
        }
    }

    return {
        ...inst,
        airlineCode: route.airlineCode,
        airlineName: airline.airlineName || route.airlineCode,
        airlineCountry: airline.country || '',
        originAirport: route.originAirport,
        originAirportName: originAirport.airportName || route.originAirport,
        originCity: originAirport.city || '',
        originTimezone: originAirport.timezone || 'UTC',
        destAirport: route.destAirport,
        destAirportName: destAirport.airportName || route.destAirport,
        destCity: destAirport.city || '',
        destTimezone: destAirport.timezone || 'UTC',
        flightType: route.flightType,
        baseFare: route.baseFare,
        scheduledDepartureTime: route.scheduledDepartureTime,
        scheduledArrivalTime: route.scheduledArrivalTime,
        departureGate: depGate ? `${depGate.terminal}-${depGate.gateNumber}` : `${depTerminal}-${depGateNumber}`,
        arrivalGate: arrGate ? `${arrGate.terminal}-${arrGate.gateNumber}` : `${arrTerminal}-${arrGateNumber}`,
        terminal: depTerminal,
        gate: depGateNumber,
        estimatedDeparture,
        estimatedArrival,
        delayMinutes,
        aircraft,
        departureGateObj: depGate,
        arrivalGateObj: arrGate,
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
