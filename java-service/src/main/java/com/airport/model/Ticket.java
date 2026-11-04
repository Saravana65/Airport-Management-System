package com.airport.model;

import java.time.LocalDateTime;

/**
 * Ticket entity representing issued boarding credential.
 */
public class Ticket {
    private final String ticketNumber;
    private final String seatNumber;
    private final CabinClass cabinClass;
    private final double price;
    private final LocalDateTime issuedAt;

    public Ticket(String ticketNumber, String seatNumber, CabinClass cabinClass, double price) {
        this.ticketNumber = ticketNumber;
        this.seatNumber = seatNumber;
        this.cabinClass = cabinClass != null ? cabinClass : CabinClass.ECONOMY;
        this.price = price;
        this.issuedAt = LocalDateTime.now();
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public CabinClass getCabinClass() {
        return cabinClass;
    }

    public double getPrice() {
        return price;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }
}
