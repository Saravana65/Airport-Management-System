/**
 * Module 2: Flight Management Controller
 */

const flightService = require('../services/flight.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getFlights(req, res, next) {
    try {
        const flights = await flightService.getAllFlights(req.query);
        return successResponse(res, flights, 'Flights retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getFlightById(req, res, next) {
    try {
        const flight = await flightService.getFlightById(req.params.id);
        if (!flight) return errorResponse(res, 'Flight not found.', 404);
        return successResponse(res, flight, 'Flight details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createFlight(req, res, next) {
    try {
        const flight = await flightService.createFlight(req.body, req.user);
        return successResponse(res, flight, 'Flight scheduled successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateFlightStatus(req, res, next) {
    try {
        const { status, reason } = req.body;
        const result = await flightService.updateFlightStatus(req.params.id, status, reason, req.user.userId);
        return successResponse(res, result, `Flight status successfully updated to ${status}.`);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getFlights,
    getFlightById,
    createFlight,
    updateFlightStatus,
};
