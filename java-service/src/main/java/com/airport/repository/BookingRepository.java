package com.airport.repository;

import com.airport.model.Booking;

import java.util.List;
import java.util.Optional;

/**
 * Phase 09 OOP Concepts:
 * Abstraction & Data Access Interface.
 */
public interface BookingRepository {
    Booking save(Booking booking);
    Optional<Booking> findById(String bookingId);
    Optional<Booking> findByReference(String bookingReference);
    List<Booking> findAll();
    List<Booking> findByFlightNumber(String flightNumber);
    boolean deleteById(String bookingId);
    int count();
}
