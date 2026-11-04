package com.airport.model;

/**
 * Phase 09 OOP Concepts:
 * Inheritance & Polymorphism: Extends Booking for VIP and diplomatic travelers with concierge services.
 */
public class VipBooking extends Booking {
    private final String dedicatedLoungeId;
    private final boolean fastTrackSecurityEnabled;

    public VipBooking(String bookingId, String bookingReference, Passenger passenger, Flight flight, Ticket ticket,
                      String dedicatedLoungeId, boolean fastTrackSecurityEnabled) {
        super(bookingId, bookingReference, passenger, flight, ticket);
        this.dedicatedLoungeId = (dedicatedLoungeId != null && !dedicatedLoungeId.isEmpty()) ? dedicatedLoungeId : "EXECUTIVE-LOUNGE-A";
        this.fastTrackSecurityEnabled = fastTrackSecurityEnabled;
    }

    @Override
    public double calculateServiceFee() {
        // Flat premium VIP service fee of $120 for dedicated lounge access and tarmac transfer
        return 120.0;
    }

    @Override
    public String getBookingType() {
        return "VIP";
    }

    public String getDedicatedLoungeId() {
        return dedicatedLoungeId;
    }

    public boolean isFastTrackSecurityEnabled() {
        return fastTrackSecurityEnabled;
    }
}
