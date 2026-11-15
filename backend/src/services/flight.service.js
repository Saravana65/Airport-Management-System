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

        // When estimated departure is set, derive delay duration relative to scheduled departure
        if (estimatedDeparture && inst.scheduledDeparture) {
            const schedTime = new Date(inst.scheduledDeparture.replace(' ', 'T')).getTime();
            const estTime = new Date(estimatedDeparture.replace(' ', 'T')).getTime();
            if (!isNaN(schedTime) && !isNaN(estTime) && estTime > schedTime) {
                delayMinutes = Math.round((estTime - schedTime) / 60000);
            }
        }

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

        // Available seats calculation (null if aircraft capacity is unassigned)
        const bookedSeats = store.tickets
            ? store.tickets.filter(t => t.flightInstanceId === inst.flightInstanceId && t.status !== 'CANCELLED').length
            : 0;
        const totalSeats = (aircraft && aircraft.totalSeats != null) ? Number(aircraft.totalSeats) : null;
        const availableSeats = totalSeats !== null ? Math.max(0, totalSeats - bookedSeats) : null;

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
            totalSeats,
            bookedSeats,
            availableSeats,
            price: route.baseFare != null ? parseFloat(route.baseFare) : null,
            baseFare: route.baseFare != null ? parseFloat(route.baseFare) : null,
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

    if (inst.estimatedDeparture && inst.scheduledDeparture) {
        const schedTime = new Date(inst.scheduledDeparture.replace(' ', 'T')).getTime();
        const estTime = new Date(inst.estimatedDeparture.replace(' ', 'T')).getTime();
        if (!isNaN(schedTime) && !isNaN(estTime) && estTime > schedTime) {
            delayMinutes = Math.round((estTime - schedTime) / 60000);
        }
    } else if (inst.status === 'DELAYED' && !inst.estimatedDeparture && inst.scheduledDeparture) {
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

    // Persist to MySQL
    try {
        await db.execute(
            `INSERT INTO FLIGHTS (FLIGHT_NUMBER, AIRLINE_CODE, ORIGIN_AIRPORT, DEST_AIRPORT, SCHEDULED_DEPARTURE_TIME, SCHEDULED_ARRIVAL_TIME, FLIGHT_TYPE, BASE_FARE, IS_ACTIVE)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y')
             ON DUPLICATE KEY UPDATE BASE_FARE = VALUES(BASE_FARE)`,
            [route.flightNumber, route.airlineCode, route.originAirport, route.destAirport, route.scheduledDepartureTime, route.scheduledArrivalTime, route.flightType, route.baseFare]
        );

        const instRes = await db.execute(
            `INSERT INTO FLIGHT_INSTANCES (FLIGHT_NUMBER, FLIGHT_DATE, AIRCRAFT_ID, DEPARTURE_GATE_ID, ARRIVAL_GATE_ID, SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL, STATUS, REMARKS)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newInstance.flightNumber, newInstance.flightDate, newInstance.aircraftId, newInstance.departureGateId, newInstance.arrivalGateId, newInstance.scheduledDeparture, newInstance.scheduledArrival, newInstance.status, newInstance.remarks]
        );
        if (instRes.insertId) newInstance.flightInstanceId = instRes.insertId;
    } catch (dbErr) {
        console.warn('[Flight Service] MySQL flight insert note:', dbErr.message);
    }

    store.flightInstances.push(newInstance);
    return newInstance;
}

async function updateFlightStatus(id, newStatus, reason, userId, extraFields = {}) {
    const numId = parseInt(id, 10);
    const instance = store.flightInstances.find(i => i.flightInstanceId === numId);
    if (!instance) {
        const err = new Error(`Flight instance ID ${id} not found.`);
        err.statusCode = 404;
        throw err;
    }

    let normalizedStatus = instance.status;
    if (newStatus) {
        normalizedStatus = (newStatus || '').toUpperCase().trim();
        if (!VALID_STATUSES.includes(normalizedStatus)) {
            const err = new Error(`Invalid flight status. Permitted: ${VALID_STATUSES.join(', ')}`);
            err.statusCode = 400;
            throw err;
        }
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

    // Helper to format ISO or datetime-local string to 'YYYY-MM-DD HH:MM:SS'
    const normalizeDateTime = (dt) => {
        if (!dt) return null;
        const s = String(dt).trim().replace('T', ' ');
        if (s.length === 16) return s + ':00'; // handles 'YYYY-MM-DD HH:MM' from datetime-local
        if (s.length >= 19) return s.substring(0, 19);
        return s;
    };

    const timeChangeNotes = [];

    // Manual Estimated Departure
    if (extraFields.estimatedDeparture !== undefined) {
        const formattedEstDep = normalizeDateTime(extraFields.estimatedDeparture);
        instance.estimatedDeparture = formattedEstDep;
        if (formattedEstDep) {
            timeChangeNotes.push(`Est Dep: ${formattedEstDep}`);
            if (instance.scheduledDeparture) {
                const schedTime = new Date(instance.scheduledDeparture.replace(' ', 'T')).getTime();
                const estTime = new Date(formattedEstDep.replace(' ', 'T')).getTime();
                if (!isNaN(schedTime) && !isNaN(estTime)) {
                    const diff = Math.round((estTime - schedTime) / 60000);
                    if (diff > 0) instance.delayMinutes = diff;
                }
            }
        }
    }

    // Manual Estimated Arrival
    if (extraFields.estimatedArrival !== undefined) {
        const formattedEstArr = normalizeDateTime(extraFields.estimatedArrival);
        instance.estimatedArrival = formattedEstArr;
        if (formattedEstArr) {
            timeChangeNotes.push(`Est Arr: ${formattedEstArr}`);
        }
    }

    // Delay Minutes override if explicitly provided
    if (extraFields.delayMinutes !== undefined && extraFields.delayMinutes !== null && extraFields.delayMinutes !== '') {
        instance.delayMinutes = parseInt(extraFields.delayMinutes, 10) || 0;
    }

    // Formulate Audit Reason
    let auditReason = reason || '';
    if (timeChangeNotes.length > 0) {
        auditReason = auditReason
            ? `${auditReason} [Manual timings: ${timeChangeNotes.join(', ')}]`
            : `Manual estimated timings updated [${timeChangeNotes.join(', ')}]`;
    }
    if (!auditReason) {
        auditReason = oldStatus !== normalizedStatus
            ? `Status transitioned from ${oldStatus} to ${normalizedStatus}`
            : 'Operational status update';
    }

    // Log to FLIGHT_STATUS_HISTORY
    const historyEntry = {
        historyId: store.flightStatusHistory.length + 1,
        flightInstanceId: numId,
        oldStatus,
        newStatus: normalizedStatus,
        reason: auditReason,
        changedAt: new Date().toISOString(),
        changedByUserId: userId || null,
    };

    // Persist to MySQL FLIGHT_INSTANCES and FLIGHT_STATUS_HISTORY
    try {
        await db.execute(
            `UPDATE FLIGHT_INSTANCES 
             SET STATUS = ?, REMARKS = ?, ACTUAL_DEPARTURE = ?, ACTUAL_ARRIVAL = ?, 
                 ESTIMATED_DEPARTURE = ?, ESTIMATED_ARRIVAL = ? 
             WHERE FLIGHT_INSTANCE_ID = ?`,
            [
                instance.status,
                instance.remarks,
                instance.actualDeparture,
                instance.actualArrival,
                instance.estimatedDeparture || null,
                instance.estimatedArrival || null,
                numId
            ]
        );

        const histRes = await db.execute(
            `INSERT INTO FLIGHT_STATUS_HISTORY (FLIGHT_INSTANCE_ID, OLD_STATUS, NEW_STATUS, REASON, CHANGED_BY_USER_ID)
             VALUES (?, ?, ?, ?, ?)`,
            [numId, oldStatus, normalizedStatus, auditReason, userId || null]
        );
        if (histRes.insertId) historyEntry.historyId = histRes.insertId;
    } catch (dbErr) {
        console.warn('[Flight Service] MySQL status update note:', dbErr.message);
    }

    store.flightStatusHistory.push(historyEntry);

    return {
        instance,
        history: historyEntry,
    };
}

/**
 * Task 3: Comprehensive Flight Search directly queried from MySQL database
 * Validates search criteria, calculates live available seats, formatting, and operational delay messaging.
 */
async function searchFlights({ origin, destination, date }) {
    const cleanOrigin = origin ? origin.trim() : null;
    const cleanDest = destination ? destination.trim() : null;
    const cleanDate = date ? date.trim() : null;

    // Validation 1: Origin and destination cannot be identical
    if (cleanOrigin && cleanDest && cleanOrigin.toUpperCase() === cleanDest.toUpperCase()) {
        const err = new Error('Departure and arrival airports cannot be identical.');
        err.statusCode = 400;
        throw err;
    }

    // Validation 2: Validate date format YYYY-MM-DD if provided
    if (cleanDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || isNaN(Date.parse(cleanDate))) {
            const err = new Error('Invalid travel date format. Please use YYYY-MM-DD.');
            err.statusCode = 400;
            throw err;
        }
    }

    let sql = `
        SELECT 
            fi.FLIGHT_INSTANCE_ID AS flightInstanceId,
            fi.FLIGHT_NUMBER AS flightNumber,
            DATE_FORMAT(fi.FLIGHT_DATE, '%Y-%m-%d') AS flightDate,
            fi.STATUS AS status,
            fi.REMARKS AS remarks,
            DATE_FORMAT(fi.SCHEDULED_DEPARTURE, '%Y-%m-%d %H:%i:%s') AS scheduledDeparture,
            DATE_FORMAT(fi.ESTIMATED_DEPARTURE, '%Y-%m-%d %H:%i:%s') AS estimatedDeparture,
            DATE_FORMAT(fi.ACTUAL_DEPARTURE, '%Y-%m-%d %H:%i:%s') AS actualDeparture,
            DATE_FORMAT(fi.SCHEDULED_ARRIVAL, '%Y-%m-%d %H:%i:%s') AS scheduledArrival,
            DATE_FORMAT(fi.ESTIMATED_ARRIVAL, '%Y-%m-%d %H:%i:%s') AS estimatedArrival,
            DATE_FORMAT(fi.ACTUAL_ARRIVAL, '%Y-%m-%d %H:%i:%s') AS actualArrival,
            
            al.AIRLINE_CODE AS airlineCode,
            al.AIRLINE_NAME AS airlineName,
            al.COUNTRY AS airlineCountry,
            
            f.ORIGIN_AIRPORT AS originAirport,
            orig.AIRPORT_NAME AS originAirportName,
            orig.CITY AS originCity,
            orig.COUNTRY AS originCountry,
            orig.TIMEZONE AS originTimezone,
            
            f.DEST_AIRPORT AS destAirport,
            dest.AIRPORT_NAME AS destAirportName,
            dest.CITY AS destCity,
            dest.COUNTRY AS destCountry,
            dest.TIMEZONE AS destTimezone,
            
            f.FLIGHT_TYPE AS flightType,
            CAST(f.BASE_FARE AS DECIMAL(10,2)) AS baseFare,
            f.SCHEDULED_DEPARTURE_TIME AS scheduledDepartureTime,
            f.SCHEDULED_ARRIVAL_TIME AS scheduledArrivalTime,
            
            depGate.TERMINAL AS departureTerminal,
            depGate.GATE_NUMBER AS departureGateNumber,
            CONCAT(COALESCE(depGate.TERMINAL, 'T2'), '-', COALESCE(depGate.GATE_NUMBER, 'G01')) AS departureGate,
            
            arrGate.TERMINAL AS arrivalTerminal,
            arrGate.GATE_NUMBER AS arrivalGateNumber,
            CONCAT(COALESCE(arrGate.TERMINAL, 'T1'), '-', COALESCE(arrGate.GATE_NUMBER, 'A01')) AS arrivalGate,
            
            ac.AIRCRAFT_ID AS aircraftId,
            ac.MODEL AS aircraftModel,
            ac.REGISTRATION_NO AS aircraftRegistration,
            ac.TOTAL_SEATS AS totalSeats,
            ac.ECONOMY_SEATS AS economySeats,
            ac.BUSINESS_SEATS AS businessSeats,
            
            COUNT(CASE WHEN t.STATUS != 'CANCELLED' THEN 1 END) AS bookedSeats,
            CASE 
                WHEN ac.TOTAL_SEATS IS NOT NULL THEN (ac.TOTAL_SEATS - COUNT(CASE WHEN t.STATUS != 'CANCELLED' THEN 1 END))
                ELSE NULL 
            END AS availableSeats

        FROM FLIGHT_INSTANCES fi
        JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
        JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
        JOIN AIRPORTS orig ON f.ORIGIN_AIRPORT = orig.AIRPORT_CODE
        JOIN AIRPORTS dest ON f.DEST_AIRPORT = dest.AIRPORT_CODE
        LEFT JOIN GATES depGate ON fi.DEPARTURE_GATE_ID = depGate.GATE_ID
        LEFT JOIN GATES arrGate ON fi.ARRIVAL_GATE_ID = arrGate.GATE_ID
        LEFT JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID
        LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
        WHERE 1=1
    `;

    const params = [];

    if (cleanOrigin) {
        sql += ` AND (f.ORIGIN_AIRPORT = ? OR UPPER(orig.CITY) = ? OR UPPER(orig.AIRPORT_NAME) LIKE ?)`;
        const upperOrig = cleanOrigin.toUpperCase();
        params.push(upperOrig, upperOrig, `%${upperOrig}%`);
    }

    if (cleanDest) {
        sql += ` AND (f.DEST_AIRPORT = ? OR UPPER(dest.CITY) = ? OR UPPER(dest.AIRPORT_NAME) LIKE ?)`;
        const upperDest = cleanDest.toUpperCase();
        params.push(upperDest, upperDest, `%${upperDest}%`);
    }

    if (cleanDate) {
        sql += ` AND DATE(fi.FLIGHT_DATE) = ?`;
        params.push(cleanDate);
    }

    sql += `
        GROUP BY 
            fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER, fi.FLIGHT_DATE, fi.STATUS, fi.REMARKS, 
            fi.SCHEDULED_DEPARTURE, fi.ESTIMATED_DEPARTURE, fi.ACTUAL_DEPARTURE, 
            fi.SCHEDULED_ARRIVAL, fi.ESTIMATED_ARRIVAL, fi.ACTUAL_ARRIVAL, 
            al.AIRLINE_CODE, al.AIRLINE_NAME, al.COUNTRY, 
            f.ORIGIN_AIRPORT, orig.AIRPORT_NAME, orig.CITY, orig.COUNTRY, orig.TIMEZONE, 
            f.DEST_AIRPORT, dest.AIRPORT_NAME, dest.CITY, dest.COUNTRY, dest.TIMEZONE, 
            f.FLIGHT_TYPE, f.BASE_FARE, f.SCHEDULED_DEPARTURE_TIME, f.SCHEDULED_ARRIVAL_TIME, 
            depGate.TERMINAL, depGate.GATE_NUMBER, arrGate.TERMINAL, arrGate.GATE_NUMBER, 
            ac.AIRCRAFT_ID, ac.MODEL, ac.REGISTRATION_NO, ac.TOTAL_SEATS, ac.ECONOMY_SEATS, ac.BUSINESS_SEATS
        ORDER BY fi.SCHEDULED_DEPARTURE ASC
    `;

    const dbResult = await db.execute(sql, params);
    const rows = dbResult.rows || [];

    return rows.map(row => {
        let delayMinutes = 0;
        let estimatedDeparture = row.estimatedDeparture;
        let estimatedArrival = row.estimatedArrival;

        // When estimated departure is set, derive delay duration relative to scheduled departure
        if (estimatedDeparture && row.scheduledDeparture) {
            const schedTime = new Date(row.scheduledDeparture.replace(' ', 'T')).getTime();
            const estTime = new Date(estimatedDeparture.replace(' ', 'T')).getTime();
            if (!isNaN(schedTime) && !isNaN(estTime) && estTime > schedTime) {
                delayMinutes = Math.round((estTime - schedTime) / 60000);
            }
        }

        // Automatic delay calculation when status is DELAYED without manual estimated time
        if (row.status === 'DELAYED') {
            delayMinutes = delayMinutes || 45;
            if (!estimatedDeparture && row.scheduledDeparture) {
                const schedDepDate = new Date(row.scheduledDeparture.replace(' ', 'T'));
                if (!isNaN(schedDepDate.getTime())) {
                    const estDate = new Date(schedDepDate.getTime() + delayMinutes * 60000);
                    estimatedDeparture = estDate.toISOString().replace('T', ' ').substring(0, 19);
                }
            }
            if (!estimatedArrival && row.scheduledArrival) {
                const schedArrDate = new Date(row.scheduledArrival.replace(' ', 'T'));
                if (!isNaN(schedArrDate.getTime())) {
                    const estDate = new Date(schedArrDate.getTime() + delayMinutes * 60000);
                    estimatedArrival = estDate.toISOString().replace('T', ' ').substring(0, 19);
                }
            }
        } else if (row.status === 'CANCELLED') {
            estimatedDeparture = null;
            estimatedArrival = null;
        } else {
            if (!estimatedDeparture && row.scheduledDeparture) estimatedDeparture = row.scheduledDeparture;
            if (!estimatedArrival && row.scheduledArrival) estimatedArrival = row.scheduledArrival;
        }

        const depTimeStr = (row.scheduledDeparture || '').substring(11, 16) || row.scheduledDepartureTime || '';
        const estDepTimeStr = estimatedDeparture ? estimatedDeparture.substring(11, 16) : '';
        const arrTimeStr = (row.scheduledArrival || '').substring(11, 16) || row.scheduledArrivalTime || '';
        const actArrTimeStr = row.actualArrival ? row.actualArrival.substring(11, 16) : '';

        let operationalMessage = row.remarks || '';
        switch (row.status) {
            case 'ON_TIME':
            case 'SCHEDULED':
                operationalMessage = `On Time — Scheduled departure at ${depTimeStr}`;
                break;
            case 'DELAYED':
                operationalMessage = `Delayed — Estimated departure at ${estDepTimeStr || 'TBD'} (+${delayMinutes}m)`;
                break;
            case 'BOARDING':
                operationalMessage = `Boarding — Gate ${row.departureGate}`;
                break;
            case 'GATE_CLOSED':
                operationalMessage = `Gate Closed — Final call closed`;
                break;
            case 'CHECK_IN':
                operationalMessage = `Check-In Open — Terminal ${row.departureTerminal}`;
                break;
            case 'DEPARTED':
                operationalMessage = `Departed — Airborne on flight path`;
                break;
            case 'IN_AIR':
                operationalMessage = `In Flight — En route to ${row.destAirport}`;
                break;
            case 'LANDED':
            case 'ARRIVED':
                operationalMessage = `Landed — Actual arrival at ${actArrTimeStr || arrTimeStr}`;
                break;
            case 'CANCELLED':
                operationalMessage = `Cancelled — Contact airline customer desk`;
                break;
            default:
                operationalMessage = row.remarks || 'Standard operations';
        }

        return {
            ...row,
            baseFare: parseFloat(row.baseFare),
            price: parseFloat(row.baseFare),
            totalSeats: parseInt(row.totalSeats, 10),
            bookedSeats: parseInt(row.bookedSeats, 10),
            availableSeats: Math.max(0, parseInt(row.availableSeats, 10)),
            delayMinutes,
            estimatedDeparture,
            estimatedArrival,
            operationalMessage,
            terminal: row.departureTerminal,
            gate: row.departureGateNumber,
        };
    });
}

/**
 * Retrieves occupied seat numbers and remaining capacity for a flight instance.
 */
async function getFlightSeats(id) {
    const numId = parseInt(id, 10);
    try {
        const fiRes = await db.execute(
            `SELECT fi.FLIGHT_INSTANCE_ID as flightInstanceId, fi.FLIGHT_NUMBER as flightNumber, fi.STATUS as status,
                    fi.AIRCRAFT_ID as aircraftId, a.TOTAL_SEATS as totalSeats, a.MODEL as aircraftModel,
                    f.BASE_FARE as baseFare, f.ORIGIN_AIRPORT as originAirport, f.DEST_AIRPORT as destAirport
             FROM FLIGHT_INSTANCES fi
             JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
             LEFT JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID
             WHERE fi.FLIGHT_INSTANCE_ID = ? OR fi.FLIGHT_NUMBER = ?
             LIMIT 1`,
            [isNaN(numId) ? 0 : numId, String(id)]
        );

        if (!fiRes.rows.length) return null;
        const fi = fiRes.rows[0];

        const tRes = await db.execute(
            `SELECT UPPER(SEAT_NUMBER) as seatNumber, CABIN_CLASS as cabinClass, STATUS as status
             FROM TICKETS
             WHERE FLIGHT_INSTANCE_ID = ? AND STATUS != 'CANCELLED' AND SEAT_NUMBER IS NOT NULL`,
            [fi.flightInstanceId]
        );

        const occupiedSeats = tRes.rows.map(r => r.seatNumber);
        const totalSeats = fi.totalSeats != null ? Number(fi.totalSeats) : null;
        const availableSeats = totalSeats !== null ? Math.max(0, totalSeats - occupiedSeats.length) : null;

        return {
            flightInstanceId: fi.flightInstanceId,
            flightNumber: fi.flightNumber,
            status: fi.status,
            originAirport: fi.originAirport,
            destAirport: fi.destAirport,
            baseFare: Number(fi.baseFare),
            aircraftModel: fi.aircraftModel,
            totalSeats,
            occupiedSeats,
            availableSeats,
        };
    } catch (err) {
        console.warn('[Flight Service] getFlightSeats error:', err.message);
        // Fallback to store
        const inst = store.flightInstances.find(f => f.flightInstanceId === numId || f.flightNumber === id);
        if (!inst) return null;
        const aircraft = store.aircraft.find(a => a.aircraftId === inst.aircraftId);
        const occupiedSeats = store.tickets
            .filter(t => t.flightInstanceId === inst.flightInstanceId && t.status !== 'CANCELLED' && t.seatNumber)
            .map(t => t.seatNumber.toUpperCase());
        const totalSeats = aircraft && aircraft.totalSeats != null ? Number(aircraft.totalSeats) : null;
        return {
            flightInstanceId: inst.flightInstanceId,
            flightNumber: inst.flightNumber,
            status: inst.status,
            totalSeats,
            occupiedSeats,
            availableSeats: totalSeats !== null ? Math.max(0, totalSeats - occupiedSeats.length) : null,
        };
    }
}

module.exports = {
    getAllFlights,
    searchFlights,
    getFlightById,
    getFlightSeats,
    createFlight,
    updateFlightStatus,
};
