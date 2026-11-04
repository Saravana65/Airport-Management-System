package com.airport.workflow;

import com.airport.exception.InvalidBookingStateException;
import com.airport.exception.InvalidCancellationException;
import com.airport.model.Booking;
import com.airport.model.BookingStatus;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Phase 09: State Pattern / Lifecycle Workflow
 * Manages deterministic valid state progressions for airport bookings.
 * 
 * Valid Transitions:
 *  PENDING     -> CONFIRMED | CANCELLED
 *  CONFIRMED   -> CHECKED_IN | CANCELLED
 *  CHECKED_IN  -> BOARDED
 *  BOARDED     -> (Terminal state)
 *  CANCELLED   -> (Terminal state)
 */
public class BookingLifecycleManager {

    private static final Map<BookingStatus, Set<BookingStatus>> VALID_TRANSITIONS = Map.of(
            BookingStatus.PENDING, EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
            BookingStatus.CONFIRMED, EnumSet.of(BookingStatus.CHECKED_IN, BookingStatus.CANCELLED),
            BookingStatus.CHECKED_IN, EnumSet.of(BookingStatus.BOARDED),
            BookingStatus.BOARDED, EnumSet.noneOf(BookingStatus.class),
            BookingStatus.CANCELLED, EnumSet.noneOf(BookingStatus.class)
    );

    public boolean canTransition(BookingStatus current, BookingStatus target) {
        if (current == null || target == null) return false;
        Set<BookingStatus> allowed = VALID_TRANSITIONS.get(current);
        return allowed != null && allowed.contains(target);
    }

    public synchronized void transitionTo(Booking booking, BookingStatus targetStatus) {
        if (booking == null) {
            throw new IllegalArgumentException("Booking cannot be null");
        }

        BookingStatus current = booking.getStatus();

        if (targetStatus == BookingStatus.CANCELLED) {
            if (current != BookingStatus.PENDING && current != BookingStatus.CONFIRMED) {
                throw new InvalidCancellationException(current);
            }
        }

        if (!canTransition(current, targetStatus)) {
            throw new InvalidBookingStateException(current, targetStatus);
        }

        // If cancelling, release the reserved seat on the flight
        if (targetStatus == BookingStatus.CANCELLED) {
            booking.getFlight().releaseSeat();
        }

        booking.setStatus(targetStatus);
    }
}
