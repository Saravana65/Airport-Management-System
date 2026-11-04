/**
 * Module 7: Gate & Terminal Management Service
 * Manages physical terminal gates and prevents conflicting/overlapping assignments.
 */

const db = require('./database.service');
const store = require('./operations.store');

async function getAllGates(filters = {}) {
    let list = store.gates;

    if (filters.airport) {
        list = list.filter(g => g.airportCode === filters.airport.toUpperCase());
    }
    if (filters.terminal) {
        list = list.filter(g => g.terminal.toUpperCase() === filters.terminal.toUpperCase());
    }
    if (filters.status) {
        list = list.filter(g => g.status === filters.status.toUpperCase());
    }

    return list.map(g => {
        // Find flight currently using this gate as departure or arrival
        const activeFlight = store.flightInstances.find(f =>
            (f.departureGateId === g.gateId || f.arrivalGateId === g.gateId) &&
            !['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(f.status)
        );

        return {
            ...g,
            activeFlightNumber: activeFlight?.flightNumber || null,
            activeFlightStatus: activeFlight?.status || null,
        };
    });
}

async function getGateById(id) {
    const numId = parseInt(id, 10);
    return store.gates.find(g => g.gateId === numId) || null;
}

async function createGate(data) {
    const airportCode = (data.airportCode || '').toUpperCase().trim();
    const terminal = (data.terminal || '').toUpperCase().trim();
    const gateNumber = (data.gateNumber || '').toUpperCase().trim();

    if (!airportCode || !terminal || !gateNumber) {
        const err = new Error('Airport code, terminal, and gate number are required.');
        err.statusCode = 400;
        throw err;
    }

    const conflict = store.gates.find(g =>
        g.airportCode === airportCode &&
        g.terminal === terminal &&
        g.gateNumber === gateNumber
    );

    if (conflict) {
        const err = new Error(`Gate ${terminal}-${gateNumber} already exists at airport ${airportCode}.`);
        err.statusCode = 409;
        throw err;
    }

    const newGate = {
        gateId: store.gates.length + 1,
        airportCode,
        terminal,
        gateNumber,
        status: data.status || 'AVAILABLE',
        isActive: 'Y',
        createdAt: new Date().toISOString(),
    };

    store.gates.push(newGate);
    return newGate;
}

async function updateGate(id, data) {
    const gate = await getGateById(id);
    if (!gate) {
        const err = new Error('Gate not found.');
        err.statusCode = 404;
        throw err;
    }

    if (data.status) gate.status = data.status.toUpperCase();
    if (data.isActive !== undefined) gate.isActive = data.isActive;

    return gate;
}

/**
 * Assign Gate to Flight Instance
 * Validates availability and prevents overlapping gate assignments.
 */
async function assignGateToFlight(data) {
    const { flightInstanceId, gateId, gateType = 'departure' } = data;

    const flightInst = store.flightInstances.find(f => f.flightInstanceId === parseInt(flightInstanceId, 10));
    if (!flightInst) {
        const err = new Error('Flight instance not found.');
        err.statusCode = 404;
        throw err;
    }

    const gate = store.gates.find(g => g.gateId === parseInt(gateId, 10));
    if (!gate) {
        const err = new Error('Specified gate not found.');
        err.statusCode = 404;
        throw err;
    }

    if (gate.status === 'MAINTENANCE') {
        const err = new Error(`Gate ${gate.terminal}-${gate.gateNumber} is currently under MAINTENANCE.`);
        err.statusCode = 400;
        throw err;
    }

    // Overlapping Conflict Detection:
    // Check if another active flight on the same date is using this gate
    const overlappingFlight = store.flightInstances.find(f =>
        f.flightInstanceId !== flightInst.flightInstanceId &&
        f.flightDate === flightInst.flightDate &&
        (f.departureGateId === gate.gateId || f.arrivalGateId === gate.gateId) &&
        !['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(f.status)
    );

    if (overlappingFlight) {
        const err = new Error(
            `Gate Conflict: Gate ${gate.terminal}-${gate.gateNumber} is already allocated to flight ${overlappingFlight.flightNumber} on ${flightInst.flightDate}.`
        );
        err.statusCode = 409;
        throw err;
    }

    if (gateType === 'departure') {
        flightInst.departureGateId = gate.gateId;
    } else {
        flightInst.arrivalGateId = gate.gateId;
    }

    gate.status = 'OCCUPIED';

    return {
        flightInstance: flightInst,
        gate,
    };
}

module.exports = {
    getAllGates,
    getGateById,
    createGate,
    updateGate,
    assignGateToFlight,
};
