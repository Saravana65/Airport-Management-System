/**
 * Module 3: Passenger Management Controller
 */

const passengerService = require('../services/passenger.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getPassengers(req, res, next) {
    try {
        const passengers = await passengerService.getAllPassengers(req.query.q, req.user);
        return successResponse(res, passengers, 'Passenger list retrieved.');
    } catch (error) {
        next(error);
    }
}

async function getMyProfile(req, res, next) {
    try {
        const profile = await passengerService.getMyPassengerProfile(req.user.userId);
        return successResponse(res, profile, 'Passenger profile retrieved.');
    } catch (error) {
        next(error);
    }
}

async function getPassengerById(req, res, next) {
    try {
        const passenger = await passengerService.getPassengerById(req.params.id, req.user);
        if (!passenger) return errorResponse(res, 'Passenger record not found.', 404);
        return successResponse(res, passenger, 'Passenger details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createPassenger(req, res, next) {
    try {
        const passenger = await passengerService.createPassenger(req.body, req.user);
        return successResponse(res, passenger, 'Passenger profile registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updatePassenger(req, res, next) {
    try {
        const passenger = await passengerService.updatePassenger(req.params.id, req.body, req.user);
        return successResponse(res, passenger, 'Passenger profile updated successfully.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPassengers,
    getMyProfile,
    getPassengerById,
    createPassenger,
    updatePassenger,
};
