/**
 * Algorithm A: Gate Allocation & Conflict Detection
 * Checks aircraft compatibility, identifies overlapping time windows,
 * and performs optimal gate scheduling.
 * Time Complexity: O(F * G) where F = number of flights, G = number of gates.
 */

#ifndef GATE_ALLOCATION_H
#define GATE_ALLOCATION_H

#include "airport_types.h"

#define TURNAROUND_BUFFER_MINUTES 30

/**
 * Checks if a gate supports an aircraft category.
 * A Wide-body gate supports both Wide-body and Narrow-body aircraft.
 * A Narrow-body gate cannot support Wide-body aircraft.
 */
bool is_gate_compatible(const Gate* gate, AircraftCategory aircraft_category);

/**
 * Checks if two flight time windows overlap at the same gate.
 */
bool is_gate_window_overlapping(int dep_time_1, int dep_time_2, int buffer_minutes);

/**
 * Allocates available gates to a list of flights using greedy bipartite matching.
 * Priority is given to emergency flights and size compatibility.
 */
int allocate_gates(
    const Flight* flights,
    int flight_count,
    Gate* gates,
    int gate_count,
    GateAllocationResult* results
);

#endif /* GATE_ALLOCATION_H */
