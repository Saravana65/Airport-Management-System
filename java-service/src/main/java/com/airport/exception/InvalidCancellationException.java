package com.airport.exception;

import com.airport.model.BookingStatus;

public class InvalidCancellationException extends AirportException {
    public InvalidCancellationException(BookingStatus currentStatus) {
        super("CANCELLATION_DISALLOWED",
                String.format("Cannot cancel a booking that has already progressed to '%s'. Only PENDING or CONFIRMED bookings may be cancelled.", currentStatus));
    }
}
