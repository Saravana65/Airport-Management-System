package com.airport.model;

/**
 * Cabin Class enumeration with base multiplier for dynamic pricing calculations.
 */
public enum CabinClass {
    ECONOMY(1.0, 15),
    PREMIUM_ECONOMY(1.3, 25),
    BUSINESS(2.2, 35),
    FIRST_CLASS(3.5, 45);

    private final double baseMultiplier;
    private final int baggageAllowanceKg;

    CabinClass(double baseMultiplier, int baggageAllowanceKg) {
        this.baseMultiplier = baseMultiplier;
        this.baggageAllowanceKg = baggageAllowanceKg;
    }

    public double getBaseMultiplier() {
        return baseMultiplier;
    }

    public int getBaggageAllowanceKg() {
        return baggageAllowanceKg;
    }
}
