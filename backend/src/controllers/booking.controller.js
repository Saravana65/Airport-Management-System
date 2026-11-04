/**
 * Module 4: Booking & Ticket Management Controller
 */

const bookingService = require('../services/booking.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getBookings(req, res, next) {
    try {
        const bookings = await bookingService.getAllBookings(req.user, req.query);
        return successResponse(res, bookings, 'Bookings retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getBookingById(req, res, next) {
    try {
        const booking = await bookingService.getBookingById(req.params.id, req.user);
        if (!booking) return errorResponse(res, 'Booking reservation not found.', 404);
        return successResponse(res, booking, 'Booking details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createBooking(req, res, next) {
    try {
        const result = await bookingService.createBooking(req.body, req.user);
        return successResponse(res, result, 'Flight booking confirmed and e-ticket issued.', 201);
    } catch (error) {
        next(error);
    }
}

async function cancelBooking(req, res, next) {
    try {
        const booking = await bookingService.cancelBooking(req.params.id, req.user);
        return successResponse(res, booking, 'Booking cancelled and seats released.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getBookings,
    getBookingById,
    createBooking,
    cancelBooking,
};
