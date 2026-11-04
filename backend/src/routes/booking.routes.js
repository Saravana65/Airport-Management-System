/**
 * Module 4: Booking & Ticket Management Routes
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/', bookingController.createBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
