package com.airport.service;

import com.airport.model.CabinClass;
import com.airport.model.Flight;

/**
 * Standard fixed rate pricing strategy based purely on base fare and cabin class tier.
 */
public class StandardPricingStrategy implements PricingStrategy {

    @Override
    public String getStrategyName() {
        return "STANDARD";
    }

    @Override
    public double calculatePrice(Flight flight, CabinClass cabinClass, int daysBeforeDeparture) {
        if (flight == null) return 0.0;
        CabinClass cc = (cabinClass != null) ? cabinClass : CabinClass.ECONOMY;
        return Math.round((flight.getBaseFare() * cc.getBaseMultiplier()) * 100.0) / 100.0;
    }
}
