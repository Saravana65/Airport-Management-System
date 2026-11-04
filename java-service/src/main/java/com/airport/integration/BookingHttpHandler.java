package com.airport.integration;

import com.airport.exception.AirportException;
import com.airport.model.Booking;
import com.airport.model.BookingStatus;
import com.airport.model.CabinClass;
import com.airport.model.Flight;
import com.airport.model.Passenger;
import com.airport.service.BookingService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Embedded HTTP Request Handler connecting Node.js Express to Java OOP Service.
 */
public class BookingHttpHandler implements HttpHandler {

    private final BookingService bookingService;

    public BookingHttpHandler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Enable CORS
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            if ("/health".equalsIgnoreCase(path) && "GET".equalsIgnoreCase(method)) {
                handleHealth(exchange);
            } else if ("/api/bookings".equalsIgnoreCase(path)) {
                if ("GET".equalsIgnoreCase(method)) {
                    handleGetAllBookings(exchange);
                } else if ("POST".equalsIgnoreCase(method)) {
                    handleCreateBooking(exchange);
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } else if (path.startsWith("/api/bookings/") && path.endsWith("/transition") && "POST".equalsIgnoreCase(method)) {
                handleStateTransition(exchange, path);
            } else if (path.startsWith("/api/bookings/") && "GET".equalsIgnoreCase(method)) {
                handleGetBookingById(exchange, path);
            } else if ("/api/pricing/calculate".equalsIgnoreCase(path) && "POST".equalsIgnoreCase(method)) {
                handlePricingCalculate(exchange);
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Endpoint not found\"}");
            }
        } catch (AirportException ae) {
            String err = JsonHelper.errorJson(ae.getErrorCode(), ae.getMessage());
            sendResponse(exchange, 400, err);
        } catch (Exception e) {
            String err = JsonHelper.errorJson("INTERNAL_SERVER_ERROR", e.getMessage());
            sendResponse(exchange, 500, err);
        }
    }

    private void handleHealth(HttpExchange exchange) throws IOException {
        String response = "{"
                + "\"status\":\"UP\","
                + "\"service\":\"airport-java-service\","
                + "\"version\":\"1.0.0\","
                + "\"port\":5050,"
                + "\"oopFeatures\":[\"Encapsulation\",\"Inheritance\",\"Polymorphism\",\"Abstraction\",\"LifecycleStateMachine\"]"
                + "}";
        sendResponse(exchange, 200, response);
    }

    private void handleGetAllBookings(HttpExchange exchange) throws IOException {
        List<Booking> list = bookingService.getAllBookings();
        String json = "{\"success\":true,\"count\":" + list.size() + ",\"bookings\":" + JsonHelper.bookingListToJson(list) + "}";
        sendResponse(exchange, 200, json);
    }

    private void handleGetBookingById(HttpExchange exchange, String path) throws IOException {
        String id = path.substring("/api/bookings/".length());
        Booking booking = bookingService.getBookingById(id);
        String json = "{\"success\":true,\"booking\":" + JsonHelper.bookingToJson(booking) + "}";
        sendResponse(exchange, 200, json);
    }

    private void handleStateTransition(HttpExchange exchange, String path) throws IOException {
        String sub = path.substring("/api/bookings/".length());
        String id = sub.substring(0, sub.indexOf("/transition"));

        String body = readRequestBody(exchange);
        String targetStatusStr = JsonHelper.extractJsonField(body, "targetStatus");
        if (targetStatusStr == null) {
            targetStatusStr = JsonHelper.extractJsonField(body, "status");
        }

        if (targetStatusStr == null) {
            sendResponse(exchange, 400, JsonHelper.errorJson("MISSING_STATUS", "Field targetStatus is required."));
            return;
        }

        BookingStatus targetStatus = BookingStatus.valueOf(targetStatusStr.toUpperCase());
        Booking updated = bookingService.updateStatus(id, targetStatus);
        String json = "{\"success\":true,\"message\":\"State transitioned successfully\",\"booking\":" + JsonHelper.bookingToJson(updated) + "}";
        sendResponse(exchange, 200, json);
    }

    private void handleCreateBooking(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);

        String firstName = JsonHelper.extractJsonField(body, "firstName");
        String lastName = JsonHelper.extractJsonField(body, "lastName");
        String email = JsonHelper.extractJsonField(body, "email");
        String passport = JsonHelper.extractJsonField(body, "passport");
        String flightNum = JsonHelper.extractJsonField(body, "flightNumber");
        String origin = JsonHelper.extractJsonField(body, "origin");
        String dest = JsonHelper.extractJsonField(body, "destination");
        String fareStr = JsonHelper.extractJsonField(body, "baseFare");
        String capacityStr = JsonHelper.extractJsonField(body, "totalCapacity");
        String seatNum = JsonHelper.extractJsonField(body, "seatNumber");
        String cabinClassStr = JsonHelper.extractJsonField(body, "cabinClass");
        String bookingType = JsonHelper.extractJsonField(body, "bookingType");

        firstName = (firstName != null) ? firstName : "Guest";
        lastName = (lastName != null) ? lastName : "Passenger";
        flightNum = (flightNum != null) ? flightNum : "AI-202";
        origin = (origin != null) ? origin : "DEL";
        dest = (dest != null) ? dest : "BOM";
        double baseFare = (fareStr != null) ? Double.parseDouble(fareStr) : 250.0;
        int capacity = (capacityStr != null) ? Integer.parseInt(capacityStr) : 180;
        seatNum = (seatNum != null) ? seatNum : "12A";

        CabinClass cc = CabinClass.ECONOMY;
        if (cabinClassStr != null) {
            try { cc = CabinClass.valueOf(cabinClassStr.toUpperCase()); } catch (Exception ignored) {}
        }

        Passenger passenger = new Passenger(null, firstName, lastName, email, passport);
        Flight flight = new Flight(null, flightNum, origin, dest, baseFare, capacity);

        Booking created;
        if ("VIP".equalsIgnoreCase(bookingType)) {
            String lounge = JsonHelper.extractJsonField(body, "loungeId");
            String fastTrackStr = JsonHelper.extractJsonField(body, "fastTrack");
            boolean fastTrack = "true".equalsIgnoreCase(fastTrackStr);
            created = bookingService.createVipBooking(passenger, flight, seatNum, cc, lounge, fastTrack);
        } else {
            String ffStr = JsonHelper.extractJsonField(body, "frequentFlyer");
            boolean ff = "true".equalsIgnoreCase(ffStr);
            created = bookingService.createCommercialBooking(passenger, flight, seatNum, cc, ff);
        }

        String json = "{\"success\":true,\"message\":\"Booking created successfully in Java Service\",\"booking\":" + JsonHelper.bookingToJson(created) + "}";
        sendResponse(exchange, 201, json);
    }

    private void handlePricingCalculate(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        String flightNum = JsonHelper.extractJsonField(body, "flightNumber");
        String fareStr = JsonHelper.extractJsonField(body, "baseFare");
        String capacityStr = JsonHelper.extractJsonField(body, "totalCapacity");
        String bookedSeatsStr = JsonHelper.extractJsonField(body, "bookedSeats");
        String daysStr = JsonHelper.extractJsonField(body, "daysBeforeDeparture");
        String cabinClassStr = JsonHelper.extractJsonField(body, "cabinClass");
        String surgeStr = JsonHelper.extractJsonField(body, "useSurge");

        double baseFare = (fareStr != null) ? Double.parseDouble(fareStr) : 200.0;
        int capacity = (capacityStr != null) ? Integer.parseInt(capacityStr) : 180;
        int booked = (bookedSeatsStr != null) ? Integer.parseInt(bookedSeatsStr) : 140;
        int days = (daysStr != null) ? Integer.parseInt(daysStr) : 5;
        boolean useSurge = "true".equalsIgnoreCase(surgeStr);

        CabinClass cc = CabinClass.ECONOMY;
        if (cabinClassStr != null) {
            try { cc = CabinClass.valueOf(cabinClassStr.toUpperCase()); } catch (Exception ignored) {}
        }

        Flight flight = new Flight(null, flightNum != null ? flightNum : "AI-300", "DEL", "BOM", baseFare, capacity);
        for (int i = 0; i < booked; i++) {
            flight.reserveSeat();
        }

        double price = bookingService.calculateDynamicPrice(flight, cc, days, useSurge);

        String json = String.format("{\"success\":true,\"flightNumber\":\"%s\",\"baseFare\":%.2f,\"cabinClass\":\"%s\",\"bookedSeats\":%d,\"totalCapacity\":%d,\"loadFactor\":%.2f,\"daysBeforeDeparture\":%d,\"strategy\":\"%s\",\"calculatedPrice\":%.2f}",
                flight.getFlightNumber(), baseFare, cc.name(), flight.getBookedSeats(), flight.getTotalCapacity(), flight.getLoadFactor(), days,
                useSurge ? "DYNAMIC_SURGE" : "STANDARD", price);

        sendResponse(exchange, 200, json);
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        byte[] bytes = is.readAllBytes();
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
