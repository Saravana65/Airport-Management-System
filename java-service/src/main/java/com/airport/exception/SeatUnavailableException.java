package com.airport.exception;

public class SeatUnavailableException extends AirportException {
    public SeatUnavailableException(String flightNumber) {
        super("SEAT_UNAVAILABLE", "Flight '" + flightNumber + "' has reached full capacity. No seats available.");
    }
}
