package com.airport.service;

import com.airport.model.Booking;
import com.airport.model.BookingStatus;
import com.airport.model.CabinClass;
import com.airport.model.Flight;
import com.airport.model.Passenger;

import java.util.List;

/**
 * Phase 09 OOP Concepts:
 * Service Abstraction for Airport Operations.
 */
public interface BookingService {
    Booking createCommercialBooking(Passenger passenger, Flight flight, String seatNumber, CabinClass cabinClass, boolean frequentFlyer);
    Booking createVipBooking(Passenger passenger, Flight flight, String seatNumber, CabinClass cabinClass, String loungeId, boolean fastTrack);
    Booking getBookingById(String bookingId);
    Booking getBookingByReference(String reference);
    List<Booking> getAllBookings();
    Booking updateStatus(String bookingId, BookingStatus newStatus);
    Booking cancelBooking(String bookingId);
    double calculateDynamicPrice(Flight flight, CabinClass cabinClass, int daysBeforeDeparture, boolean useSurge);
}
