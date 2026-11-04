package com.airport.model;

import java.util.Objects;

/**
 * Flight entity demonstrating Encapsulation.
 */
public class Flight {
    private final String flightId;
    private final String flightNumber;
    private final String origin;
    private final String destination;
    private final double baseFare;
    private final int totalCapacity;
    private int bookedSeats;

    public Flight(String flightId, String flightNumber, String origin, String destination, double baseFare, int totalCapacity) {
        if (flightNumber == null || flightNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Flight number cannot be null or empty");
        }
        if (totalCapacity <= 0) {
            throw new IllegalArgumentException("Total capacity must be positive");
        }
        this.flightId = flightId != null ? flightId : "FL-" + flightNumber;
        this.flightNumber = flightNumber.trim().toUpperCase();
        this.origin = origin != null ? origin.trim().toUpperCase() : "DEL";
        this.destination = destination != null ? destination.trim().toUpperCase() : "BOM";
        this.baseFare = Math.max(baseFare, 50.0);
        this.totalCapacity = totalCapacity;
        this.bookedSeats = 0;
    }

    public String getFlightId() {
        return flightId;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public String getOrigin() {
        return origin;
    }

    public String getDestination() {
        return destination;
    }

    public double getBaseFare() {
        return baseFare;
    }

    public int getTotalCapacity() {
        return totalCapacity;
    }

    public synchronized int getBookedSeats() {
        return bookedSeats;
    }

    public synchronized boolean hasAvailableSeats() {
        return bookedSeats < totalCapacity;
    }

    public synchronized boolean reserveSeat() {
        if (bookedSeats < totalCapacity) {
            bookedSeats++;
            return true;
        }
        return false;
    }

    public synchronized boolean releaseSeat() {
        if (bookedSeats > 0) {
            bookedSeats--;
            return true;
        }
        return false;
    }

    public synchronized double getLoadFactor() {
        return (double) bookedSeats / (double) totalCapacity;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Flight flight)) return false;
        return Objects.equals(flightNumber, flight.flightNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(flightNumber);
    }
}
