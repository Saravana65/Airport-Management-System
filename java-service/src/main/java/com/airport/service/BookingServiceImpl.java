package com.airport.service;

import com.airport.exception.BookingNotFoundException;
import com.airport.exception.SeatUnavailableException;
import com.airport.model.Booking;
import com.airport.model.BookingStatus;
import com.airport.model.CabinClass;
import com.airport.model.CommercialBooking;
import com.airport.model.Flight;
import com.airport.model.Passenger;
import com.airport.model.Ticket;
import com.airport.model.VipBooking;
import com.airport.repository.BookingRepository;
import com.airport.workflow.BookingLifecycleManager;

import java.util.List;
import java.util.UUID;

/**
 * Concrete implementation of BookingService.
 * Coordinates Domain Models, Pricing Strategies, Workflow Lifecycle, and Thread-Safe Storage.
 */
public class BookingServiceImpl implements BookingService {

    private final BookingRepository repository;
    private final BookingLifecycleManager lifecycleManager;
    private final PricingStrategy standardPricing;
    private final PricingStrategy surgePricing;

    public BookingServiceImpl(BookingRepository repository) {
        this.repository = repository;
        this.lifecycleManager = new BookingLifecycleManager();
        this.standardPricing = new StandardPricingStrategy();
        this.surgePricing = new SurgePricingStrategy();
    }

    @Override
    public Booking createCommercialBooking(Passenger passenger, Flight flight, String seatNumber, CabinClass cabinClass, boolean frequentFlyer) {
        if (!flight.reserveSeat()) {
            throw new SeatUnavailableException(flight.getFlightNumber());
        }

        double price = standardPricing.calculatePrice(flight, cabinClass, 14);
        String ticketNum = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Ticket ticket = new Ticket(ticketNum, seatNumber, cabinClass, price);

        String bookingRef = "CB" + (1000 + (int)(Math.random() * 9000));
        String bookingId = "BK-" + UUID.randomUUID().toString().substring(0, 8);

        CommercialBooking booking = new CommercialBooking(bookingId, bookingRef, passenger, flight, ticket, frequentFlyer);
        return repository.save(booking);
    }

    @Override
    public Booking createVipBooking(Passenger passenger, Flight flight, String seatNumber, CabinClass cabinClass, String loungeId, boolean fastTrack) {
        if (!flight.reserveSeat()) {
            throw new SeatUnavailableException(flight.getFlightNumber());
        }

        // VIP bookings use surge/premium pricing baseline
        double price = surgePricing.calculatePrice(flight, cabinClass != null ? cabinClass : CabinClass.FIRST_CLASS, 7);
        String ticketNum = "TK-VIP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Ticket ticket = new Ticket(ticketNum, seatNumber, cabinClass != null ? cabinClass : CabinClass.FIRST_CLASS, price);

        String bookingRef = "VIP" + (1000 + (int)(Math.random() * 9000));
        String bookingId = "BK-VIP-" + UUID.randomUUID().toString().substring(0, 8);

        VipBooking booking = new VipBooking(bookingId, bookingRef, passenger, flight, ticket, loungeId, fastTrack);
        return repository.save(booking);
    }

    @Override
    public Booking getBookingById(String bookingId) {
        return repository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));
    }

    @Override
    public Booking getBookingByReference(String reference) {
        return repository.findByReference(reference)
                .orElseThrow(() -> new BookingNotFoundException(reference));
    }

    @Override
    public List<Booking> getAllBookings() {
        return repository.findAll();
    }

    @Override
    public Booking updateStatus(String bookingId, BookingStatus newStatus) {
        Booking booking = getBookingById(bookingId);
        lifecycleManager.transitionTo(booking, newStatus);
        return repository.save(booking);
    }

    @Override
    public Booking cancelBooking(String bookingId) {
        return updateStatus(bookingId, BookingStatus.CANCELLED);
    }

    @Override
    public double calculateDynamicPrice(Flight flight, CabinClass cabinClass, int daysBeforeDeparture, boolean useSurge) {
        PricingStrategy strategy = useSurge ? surgePricing : standardPricing;
        return strategy.calculatePrice(flight, cabinClass, daysBeforeDeparture);
    }
}
