package com.airport.model;

/**
 * Phase 09 OOP Concepts:
 * Inheritance & Polymorphism: Extends Booking for standard commercial travelers.
 */
public class CommercialBooking extends Booking {
    private final boolean frequentFlyerMember;

    public CommercialBooking(String bookingId, String bookingReference, Passenger passenger, Flight flight, Ticket ticket, boolean frequentFlyerMember) {
        super(bookingId, bookingReference, passenger, flight, ticket);
        this.frequentFlyerMember = frequentFlyerMember;
    }

    @Override
    public double calculateServiceFee() {
        // Members get discounted service fee of $15, non-members pay $25
        return frequentFlyerMember ? 15.0 : 25.0;
    }

    @Override
    public String getBookingType() {
        return "COMMERCIAL";
    }

    public boolean isFrequentFlyerMember() {
        return frequentFlyerMember;
    }
}
