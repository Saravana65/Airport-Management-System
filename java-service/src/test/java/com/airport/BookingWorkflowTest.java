package com.airport;

import com.airport.exception.InvalidBookingStateException;
import com.airport.exception.InvalidCancellationException;
import com.airport.exception.SeatUnavailableException;
import com.airport.model.Booking;
import com.airport.model.BookingStatus;
import com.airport.model.CabinClass;
import com.airport.model.CommercialBooking;
import com.airport.model.Flight;
import com.airport.model.Passenger;
import com.airport.model.VipBooking;
import com.airport.repository.BookingRepository;
import com.airport.repository.InMemoryBookingRepository;
import com.airport.service.BookingService;
import com.airport.service.BookingServiceImpl;
import com.airport.service.PricingStrategy;
import com.airport.service.StandardPricingStrategy;
import com.airport.service.SurgePricingStrategy;
import com.airport.workflow.BookingLifecycleManager;

/**
 * Phase 09 Java Test Suite: Comprehensive Unit & Workflow Tests.
 * Runnable standalone via pure Java without external test runners.
 */
public class BookingWorkflowTest {

    private static int passed = 0;
    private static int failed = 0;

    private static void assertTrue(boolean condition, String testName) {
        if (condition) {
            System.out.println("  ✔ [PASS] " + testName);
            passed++;
        } else {
            System.err.println("  ✖ [FAIL] " + testName);
            failed++;
        }
    }

    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("   RUNNING PHASE 09 JAVA OOP SERVICES TEST SUITE");
        System.out.println("=================================================================");

        testEncapsulationAndValidation();
        testInheritanceAndPolymorphism();
        testPricingStrategies();
        testLifecycleStateMachine();
        testSeatCapacityHandling();
        testRepositoryOperations();

        System.out.println("\n=================================================================");
        System.out.printf("JAVA TEST RESULTS: %d passed, %d failed (Total %d)%n", passed, failed, passed + failed);
        System.out.println("=================================================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static void testEncapsulationAndValidation() {
        System.out.println("\n--- 1. Encapsulation & Validation ---");

        Passenger p = new Passenger("P-1", "John", "Doe", "john@example.com", "A12345678");
        assertTrue("John Doe".equals(p.getFullName()), "Passenger encapsulation constructs full name correctly");
        assertTrue("P-1".equals(p.getPassengerId()), "Passenger ID encapsulated and retrieved");

        boolean threwValidation = false;
        try {
            new Passenger("P-2", "", "Doe", "test@test.com", "B12345678");
        } catch (IllegalArgumentException e) {
            threwValidation = true;
        }
        assertTrue(threwValidation, "Encapsulation prevents empty passenger first name");
    }

    private static void testInheritanceAndPolymorphism() {
        System.out.println("\n--- 2. Inheritance & Polymorphism ---");

        Passenger p1 = new Passenger("P-10", "Alice", "Smith", "alice@example.com", "X1111111");
        Passenger p2 = new Passenger("P-20", "Sir Bob", "Marley", "bob@vip.org", "V2222222");
        Flight f = new Flight("F-1", "AI-500", "DEL", "BOM", 200.0, 150);

        Booking commercial = new CommercialBooking("B-1", "REF-COMM", p1, f, null, true);
        Booking vip = new VipBooking("B-2", "REF-VIP", p2, f, null, "ROYAL-LOUNGE", true);

        // Polymorphic invocation of calculateServiceFee()
        assertTrue(commercial.calculateServiceFee() == 15.0, "Commercial frequent flyer service fee polymorphic dispatch ($15)");
        assertTrue(vip.calculateServiceFee() == 120.0, "VIP lounge access service fee polymorphic dispatch ($120)");
        assertTrue("COMMERCIAL".equals(commercial.getBookingType()), "Polymorphic booking type discriminates COMMERCIAL");
        assertTrue("VIP".equals(vip.getBookingType()), "Polymorphic booking type discriminates VIP");
    }

    private static void testPricingStrategies() {
        System.out.println("\n--- 3. Pricing Strategy (Polymorphism) ---");

        Flight flight = new Flight("F-2", "BA-100", "DEL", "LHR", 500.0, 100);
        PricingStrategy standard = new StandardPricingStrategy();
        PricingStrategy surge = new SurgePricingStrategy();

        double standardEconomy = standard.calculatePrice(flight, CabinClass.ECONOMY, 20);
        double standardBusiness = standard.calculatePrice(flight, CabinClass.BUSINESS, 20);

        assertTrue(standardEconomy == 500.0, "Standard strategy: Economy base fare matches multiplier 1.0 ($500)");
        assertTrue(standardBusiness == 1100.0, "Standard strategy: Business base fare matches multiplier 2.2 ($1100)");

        // Simulate high capacity load (80 seats booked = 80% load factor)
        for (int i = 0; i < 80; i++) {
            flight.reserveSeat();
        }

        // Surge: 1.3 load multiplier for >=75%, 1.4 for last minute (2 days)
        double surgePrice = surge.calculatePrice(flight, CabinClass.ECONOMY, 1);
        assertTrue(surgePrice > standardEconomy, "Surge pricing activates demand & last-minute urgency multiplier ($" + surgePrice + " > $500)");
    }

    private static void testLifecycleStateMachine() {
        System.out.println("\n--- 4. Lifecycle State Machine ---");

        BookingLifecycleManager lifecycle = new BookingLifecycleManager();
        Passenger p = new Passenger("P-3", "Charlie", "Brown", "charlie@test.com", "C3333333");
        Flight f = new Flight("F-3", "LH-760", "DEL", "FRA", 400.0, 200);
        f.reserveSeat();
        Booking booking = new CommercialBooking("B-3", "REF-STATE", p, f, null, false);

        assertTrue(booking.getStatus() == BookingStatus.PENDING, "Initial booking status is PENDING");

        // Valid forward progression: PENDING -> CONFIRMED -> CHECKED_IN -> BOARDED
        lifecycle.transitionTo(booking, BookingStatus.CONFIRMED);
        assertTrue(booking.getStatus() == BookingStatus.CONFIRMED, "Valid transition: PENDING -> CONFIRMED");

        lifecycle.transitionTo(booking, BookingStatus.CHECKED_IN);
        assertTrue(booking.getStatus() == BookingStatus.CHECKED_IN, "Valid transition: CONFIRMED -> CHECKED_IN");

        lifecycle.transitionTo(booking, BookingStatus.BOARDED);
        assertTrue(booking.getStatus() == BookingStatus.BOARDED, "Valid transition: CHECKED_IN -> BOARDED");

        // Invalid backward progression: BOARDED -> CANCELLED (should fail)
        boolean caughtInvalidCancellation = false;
        try {
            lifecycle.transitionTo(booking, BookingStatus.CANCELLED);
        } catch (InvalidCancellationException e) {
            caughtInvalidCancellation = true;
        }
        assertTrue(caughtInvalidCancellation, "Boarded passenger cannot cancel booking (InvalidCancellationException)");

        // Test illegal skip: PENDING -> BOARDED
        Booking booking2 = new CommercialBooking("B-4", "REF-SKIP", p, f, null, false);
        boolean caughtIllegalSkip = false;
        try {
            lifecycle.transitionTo(booking2, BookingStatus.BOARDED);
        } catch (InvalidBookingStateException e) {
            caughtIllegalSkip = true;
        }
        assertTrue(caughtIllegalSkip, "Illegal state skip rejected: PENDING cannot directly transition to BOARDED");
    }

    private static void testSeatCapacityHandling() {
        System.out.println("\n--- 5. Seat Capacity & Concurrency Control ---");

        Flight smallFlight = new Flight("F-4", "REG-50", "DEL", "JAI", 80.0, 2);
        BookingRepository repo = new InMemoryBookingRepository();
        BookingService service = new BookingServiceImpl(repo);

        Passenger p1 = new Passenger("P-4", "Passenger", "One", "p1@test.com", "D1111");
        Passenger p2 = new Passenger("P-5", "Passenger", "Two", "p2@test.com", "D2222");
        Passenger p3 = new Passenger("P-6", "Passenger", "Three", "p3@test.com", "D3333");

        service.createCommercialBooking(p1, smallFlight, "1A", CabinClass.ECONOMY, false);
        service.createCommercialBooking(p2, smallFlight, "1B", CabinClass.ECONOMY, false);

        assertTrue(smallFlight.getBookedSeats() == 2, "Flight booked seats equals total capacity (2/2)");

        boolean caughtOverbook = false;
        try {
            service.createCommercialBooking(p3, smallFlight, "2A", CabinClass.ECONOMY, false);
        } catch (SeatUnavailableException e) {
            caughtOverbook = true;
        }
        assertTrue(caughtOverbook, "Overbooking prevented when flight reaches capacity (SeatUnavailableException)");
    }

    private static void testRepositoryOperations() {
        System.out.println("\n--- 6. Repository Thread-Safe Operations ---");

        BookingRepository repo = new InMemoryBookingRepository();
        Passenger p = new Passenger("P-7", "David", "Miller", "david@test.com", "E5555");
        Flight f = new Flight("F-5", "AI-800", "DEL", "BLR", 150.0, 180);

        Booking b = new CommercialBooking("BK-999", "REF-999", p, f, null, false);
        repo.save(b);

        assertTrue(repo.count() == 1, "Repository stores booking successfully (count = 1)");
        assertTrue(repo.findById("BK-999").isPresent(), "Repository retrieves booking by ID");
        assertTrue(repo.findByReference("REF-999").isPresent(), "Repository retrieves booking by uppercase reference");
        assertTrue(repo.findByReference("ref-999").isPresent(), "Repository finds booking case-insensitively");
        assertTrue(repo.deleteById("BK-999"), "Repository removes booking by ID");
        assertTrue(repo.count() == 0, "Repository count is 0 after deletion");
    }
}
