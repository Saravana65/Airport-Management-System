package com.airport.model;

import java.time.LocalDateTime;

/**
 * Phase 09 OOP Concepts:
 * 1. Abstraction - Abstract base class defining common contract for all bookings
 * 2. Encapsulation - Private fields with controlled mutations and accessors
 */
public abstract class Booking {
    private final String bookingId;
    private final String bookingReference;
    private final Passenger passenger;
    private final Flight flight;
    private Ticket ticket;
    private BookingStatus status;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Booking(String bookingId, String bookingReference, Passenger passenger, Flight flight, Ticket ticket) {
        if (bookingReference == null || bookingReference.trim().isEmpty()) {
            throw new IllegalArgumentException("Booking reference cannot be empty");
        }
        if (passenger == null) {
            throw new IllegalArgumentException("Passenger cannot be null");
        }
        if (flight == null) {
            throw new IllegalArgumentException("Flight cannot be null");
        }
        this.bookingId = bookingId != null ? bookingId : "BK-" + System.currentTimeMillis();
        this.bookingReference = bookingReference.trim().toUpperCase();
        this.passenger = passenger;
        this.flight = flight;
        this.ticket = ticket;
        this.status = BookingStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /**
     * Polymorphic method implemented by specialized booking subclasses.
     * @return Service fee based on booking tier.
     */
    public abstract double calculateServiceFee();

    /**
     * Discriminator for booking subclass.
     */
    public abstract String getBookingType();

    public String getBookingId() {
        return bookingId;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public Passenger getPassenger() {
        return passenger;
    }

    public Flight getFlight() {
        return flight;
    }

    public Ticket getTicket() {
        return ticket;
    }

    public void setTicket(Ticket ticket) {
        this.ticket = ticket;
        this.updatedAt = LocalDateTime.now();
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public double getTotalAmount() {
        double ticketFare = (ticket != null) ? ticket.getPrice() : flight.getBaseFare();
        return ticketFare + calculateServiceFee();
    }
}
