package com.airport.service;

import com.airport.model.CabinClass;
import com.airport.model.Flight;

/**
 * Dynamic surge pricing strategy:
 * Adjusts price according to aircraft capacity load factor and days remaining until departure.
 */
public class SurgePricingStrategy implements PricingStrategy {

    @Override
    public String getStrategyName() {
        return "DYNAMIC_SURGE";
    }

    @Override
    public double calculatePrice(Flight flight, CabinClass cabinClass, int daysBeforeDeparture) {
        if (flight == null) return 0.0;
        CabinClass cc = (cabinClass != null) ? cabinClass : CabinClass.ECONOMY;
        double base = flight.getBaseFare() * cc.getBaseMultiplier();

        double loadMultiplier = 1.0;
        double loadFactor = flight.getLoadFactor();
        if (loadFactor >= 0.90) {
            loadMultiplier = 1.60; // 60% surge for high demand
        } else if (loadFactor >= 0.75) {
            loadMultiplier = 1.30; // 30% surge for moderate demand
        } else if (loadFactor <= 0.30) {
            loadMultiplier = 0.85; // 15% discount for early empty seats
        }

        double timeMultiplier = 1.0;
        if (daysBeforeDeparture <= 2) {
            timeMultiplier = 1.40; // Last-minute surge
        } else if (daysBeforeDeparture <= 7) {
            timeMultiplier = 1.15;
        }

        double finalPrice = base * loadMultiplier * timeMultiplier;
        return Math.round(finalPrice * 100.0) / 100.0;
    }
}
