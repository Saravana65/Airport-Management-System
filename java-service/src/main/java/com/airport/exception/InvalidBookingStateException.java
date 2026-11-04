package com.airport.exception;

import com.airport.model.BookingStatus;

public class InvalidBookingStateException extends AirportException {
    public InvalidBookingStateException(BookingStatus currentStatus, BookingStatus targetStatus) {
        super("INVALID_STATE_TRANSITION",
                String.format("Illegal booking state transition from '%s' to '%s'.", currentStatus, targetStatus));
    }
}
