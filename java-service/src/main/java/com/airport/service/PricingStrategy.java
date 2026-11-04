package com.airport.service;

import com.airport.model.CabinClass;
import com.airport.model.Flight;

/**
 * Phase 09 OOP Concept: Polymorphism & Strategy Pattern
 * Interface defining pricing calculation algorithm.
 */
public interface PricingStrategy {
    String getStrategyName();
    double calculatePrice(Flight flight, CabinClass cabinClass, int daysBeforeDeparture);
}
