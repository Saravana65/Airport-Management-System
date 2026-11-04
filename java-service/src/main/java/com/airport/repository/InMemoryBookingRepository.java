package com.airport.repository;

import com.airport.model.Booking;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Thread-safe In-Memory implementation of BookingRepository using ConcurrentHashMap.
 */
public class InMemoryBookingRepository implements BookingRepository {

    private final Map<String, Booking> storage = new ConcurrentHashMap<>();

    @Override
    public Booking save(Booking booking) {
        if (booking == null) {
            throw new IllegalArgumentException("Booking to save cannot be null");
        }
        storage.put(booking.getBookingId(), booking);
        return booking;
    }

    @Override
    public Optional<Booking> findById(String bookingId) {
        if (bookingId == null) return Optional.empty();
        return Optional.ofNullable(storage.get(bookingId));
    }

    @Override
    public Optional<Booking> findByReference(String bookingReference) {
        if (bookingReference == null) return Optional.empty();
        return storage.values().stream()
                .filter(b -> b.getBookingReference().equalsIgnoreCase(bookingReference))
                .findFirst();
    }

    @Override
    public List<Booking> findAll() {
        return Collections.unmodifiableList(new ArrayList<>(storage.values()));
    }

    @Override
    public List<Booking> findByFlightNumber(String flightNumber) {
        if (flightNumber == null) return Collections.emptyList();
        return storage.values().stream()
                .filter(b -> b.getFlight().getFlightNumber().equalsIgnoreCase(flightNumber))
                .collect(Collectors.toList());
    }

    @Override
    public boolean deleteById(String bookingId) {
        if (bookingId == null) return false;
        return storage.remove(bookingId) != null;
    }

    @Override
    public int count() {
        return storage.size();
    }
}
