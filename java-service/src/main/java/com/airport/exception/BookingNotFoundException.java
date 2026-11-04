package com.airport.exception;

public class BookingNotFoundException extends AirportException {
    public BookingNotFoundException(String bookingId) {
        super("BOOKING_NOT_FOUND", "Booking with identifier '" + bookingId + "' does not exist.");
    }
}
