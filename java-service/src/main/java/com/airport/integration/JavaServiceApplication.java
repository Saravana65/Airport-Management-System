package com.airport.integration;

import com.airport.model.CabinClass;
import com.airport.model.Flight;
import com.airport.model.Passenger;
import com.airport.repository.BookingRepository;
import com.airport.repository.InMemoryBookingRepository;
import com.airport.service.BookingService;
import com.airport.service.BookingServiceImpl;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/**
 * Main application bootstrapping the Java OOP Airport Microservice.
 * Listens on port 5050 for Node.js Express integration.
 */
public class JavaServiceApplication {

    private static final int PORT = 5050;

    public static void main(String[] args) throws IOException {
        BookingRepository repository = new InMemoryBookingRepository();
        BookingService bookingService = new BookingServiceImpl(repository);

        // Seed initial sample data for demonstration & viva presentation
        seedInitialData(bookingService);

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        BookingHttpHandler handler = new BookingHttpHandler(bookingService);

        server.createContext("/", handler);
        server.setExecutor(Executors.newFixedThreadPool(10));

        server.start();

        System.out.println("=================================================================");
        System.out.println("  AIRPORT JAVA OOP SERVICE (PHASE 09)");
        System.out.println("  Listening on http://localhost:" + PORT);
        System.out.println("  Health check: http://localhost:" + PORT + "/health");
        System.out.println("  OOP Architecture: Encapsulation, Inheritance, Polymorphism, Abstraction");
        System.out.println("=================================================================");
    }

    private static void seedInitialData(BookingService service) {
        Passenger p1 = new Passenger("PA-101", "Aarav", "Sharma", "aarav@example.com", "Z1234567");
        Flight f1 = new Flight("FL-101", "AI-101", "DEL", "BOM", 180.0, 180);
        service.createCommercialBooking(p1, f1, "14B", CabinClass.ECONOMY, true);

        Passenger p2 = new Passenger("PA-102", "Elena", "Rostova", "elena@diplomat.org", "D9876543");
        Flight f2 = new Flight("FL-102", "BA-1689", "DEL", "LHR", 750.0, 250);
        service.createVipBooking(p2, f2, "1A", CabinClass.FIRST_CLASS, "MAHARAJA-LOUNGE-T3", true);
    }
}
