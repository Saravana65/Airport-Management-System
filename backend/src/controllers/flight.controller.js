/**
 * Module 2: Flight Management Controller
 */

const flightService = require('../services/flight.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getFlights(req, res, next) {
    try {
        const { origin, destination, date, flightDate, from, to } = req.query;
        // If structured search parameters are provided, utilize searchFlights with validation
        if (origin || destination || date || flightDate || from || to) {
            return searchFlights(req, res, next);
        }
        const flights = await flightService.getAllFlights(req.query, req.user);
        return successResponse(res, flights, 'Flights retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function searchFlights(req, res, next) {
    try {
        const { origin, destination, date, flightDate, from, to } = req.query;
        const searchOrigin = origin || from;
        const searchDest = destination || to;
        const searchDate = date || flightDate;

        // Validation: departure and destination cannot be identical
        if (searchOrigin && searchDest && searchOrigin.trim().toUpperCase() === searchDest.trim().toUpperCase()) {
            return errorResponse(res, 'Departure and arrival airports cannot be identical.', 400);
        }

        // Validation: date format YYYY-MM-DD
        if (searchDate) {
            const dateStr = searchDate.trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(Date.parse(dateStr))) {
                return errorResponse(res, 'Invalid travel date format. Please use YYYY-MM-DD.', 400);
            }
        }

        const results = await flightService.searchFlights({
            origin: searchOrigin,
            destination: searchDest,
            date: searchDate,
        });

        return successResponse(res, results, `Found ${results.length} flight(s) matching search criteria.`);
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

async function getFlightSeats(req, res, next) {
    try {
        const seats = await flightService.getFlightSeats(req.params.id);
        if (!seats) return errorResponse(res, 'Flight instance not found.', 404);
        return successResponse(res, seats, 'Flight seat availability retrieved.');
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
        const { status, reason, estimatedDeparture, estimatedArrival, delayMinutes } = req.body;
        const result = await flightService.updateFlightStatus(
            req.params.id,
            status,
            reason,
            req.user.userId,
            { estimatedDeparture, estimatedArrival, delayMinutes }
        );
        const targetStatus = status || result.instance?.status;
        return successResponse(res, result, `Flight status successfully updated to ${targetStatus}.`);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getFlights,
    searchFlights,
    getFlightById,
    getFlightSeats,
    createFlight,
    updateFlightStatus,
};
