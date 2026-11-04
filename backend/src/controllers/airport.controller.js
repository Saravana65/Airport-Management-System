/**
 * Module 1: Airport, Airline & Aircraft Management Controller
 */

const airportService = require('../services/airport.service');
const { successResponse, errorResponse } = require('../utils/response.util');

// --- AIRPORTS ---

async function getAirports(req, res, next) {
    try {
        const airports = await airportService.getAllAirports();
        return successResponse(res, airports, 'Airports retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getAirportByCode(req, res, next) {
    try {
        const airport = await airportService.getAirportByCode(req.params.code);
        if (!airport) return errorResponse(res, 'Airport not found.', 404);
        return successResponse(res, airport, 'Airport details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createAirport(req, res, next) {
    try {
        const airport = await airportService.createAirport(req.body);
        return successResponse(res, airport, 'Airport registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateAirport(req, res, next) {
    try {
        const airport = await airportService.updateAirport(req.params.code, req.body);
        return successResponse(res, airport, 'Airport updated successfully.');
    } catch (error) {
        next(error);
    }
}

// --- AIRLINES ---

async function getAirlines(req, res, next) {
    try {
        const airlines = await airportService.getAllAirlines();
        return successResponse(res, airlines, 'Airlines retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getAirlineByCode(req, res, next) {
    try {
        const airline = await airportService.getAirlineByCode(req.params.code);
        if (!airline) return errorResponse(res, 'Airline not found.', 404);
        return successResponse(res, airline, 'Airline details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createAirline(req, res, next) {
    try {
        const airline = await airportService.createAirline(req.body);
        return successResponse(res, airline, 'Airline registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateAirline(req, res, next) {
    try {
        const airline = await airportService.updateAirline(req.params.code, req.body);
        return successResponse(res, airline, 'Airline updated successfully.');
    } catch (error) {
        next(error);
    }
}

// --- AIRCRAFT ---

async function getAircraft(req, res, next) {
    try {
        const fleet = await airportService.getAllAircraft();
        return successResponse(res, fleet, 'Aircraft fleet retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getAircraftById(req, res, next) {
    try {
        const aircraft = await airportService.getAircraftById(req.params.id);
        if (!aircraft) return errorResponse(res, 'Aircraft not found.', 404);
        return successResponse(res, aircraft, 'Aircraft details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createAircraft(req, res, next) {
    try {
        const aircraft = await airportService.createAircraft(req.body);
        return successResponse(res, aircraft, 'Aircraft registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateAircraft(req, res, next) {
    try {
        const aircraft = await airportService.updateAircraft(req.params.id, req.body);
        return successResponse(res, aircraft, 'Aircraft updated successfully.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAirports,
    getAirportByCode,
    createAirport,
    updateAirport,
    getAirlines,
    getAirlineByCode,
    createAirline,
    updateAirline,
    getAircraft,
    getAircraftById,
    createAircraft,
    updateAircraft,
};
