/**
 * Module 5: Check-in Operations Controller
 */

const checkinService = require('../services/checkin.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getEligibleTickets(req, res, next) {
    try {
        const tickets = await checkinService.getEligibleTickets(req.user, req.query);
        return successResponse(res, tickets, 'Eligible tickets for check-in retrieved.');
    } catch (error) {
        next(error);
    }
}

async function getCheckIns(req, res, next) {
    try {
        const checkins = await checkinService.getAllCheckIns(req.user, req.query);
        return successResponse(res, checkins, 'Check-in records retrieved.');
    } catch (error) {
        next(error);
    }
}

async function processCheckIn(req, res, next) {
    try {
        const result = await checkinService.processCheckIn(req.body, req.user);
        return successResponse(res, result, 'Check-in confirmed and boarding pass issued.', 201);
    } catch (error) {
        next(error);
    }
}

async function getStaffCheckInOverview(req, res, next) {
    try {
        const overview = await checkinService.getStaffCheckInOverview(req.user);
        return successResponse(res, overview, 'Staff check-in telemetry retrieved.');
    } catch (error) {
        next(error);
    }
}

async function retrieveBooking(req, res, next) {
    try {
        const pnr = req.query.pnr || req.body.pnr;
        const surname = req.query.surname || req.body.surname;
        const result = await checkinService.retrieveBookingForCheckIn(pnr, surname, req.user);
        return successResponse(res, result, 'Booking retrieved for check-in.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEligibleTickets,
    getCheckIns,
    processCheckIn,
    getStaffCheckInOverview,
    retrieveBooking,
};
