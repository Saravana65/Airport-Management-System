/**
 * Gate Allocation Implementation
 */

#include "../include/gate_allocation.h"

bool is_gate_compatible(const Gate* gate, AircraftCategory aircraft_category) {
    if (!gate) return false;
    // Wide-body gate supports all aircraft
    if (gate->max_supported_category == AIRCRAFT_WIDE_BODY) {
        return true;
    }
    // Narrow-body gate only supports narrow-body aircraft
    return (aircraft_category == AIRCRAFT_NARROW_BODY);
}

bool is_gate_window_overlapping(int dep_time_1, int dep_time_2, int buffer_minutes) {
    int diff = dep_time_1 - dep_time_2;
    if (diff < 0) diff = -diff;
    return (diff < buffer_minutes);
}

int allocate_gates(
    const Flight* flights,
    int flight_count,
    Gate* gates,
    int gate_count,
    GateAllocationResult* results
) {
    int allocated_count = 0;

    for (int i = 0; i < flight_count; i++) {
        const Flight* flight = &flights[i];
        results[i].flight_id = flight->flight_id;
        strncpy(results[i].flight_number, flight->flight_number, MAX_FLIGHT_CODE_LEN - 1);
        results[i].assigned_gate_id = -1;
        results[i].is_allocated = false;
        results[i].gate_code[0] = '\0';

        int best_gate_idx = -1;

        // Search for best-fit compatible available gate
        // Pass 1: Try exact size match (Narrow -> Narrow, Wide -> Wide)
        // Pass 2: Fallback (Narrow -> Wide if no Narrow available)
        for (int pass = 1; pass <= 2 && best_gate_idx < 0; pass++) {
            for (int g = 0; g < gate_count; g++) {
                Gate* gate = &gates[g];

                if (!gate->is_available) continue;

                // Pass 1: exact match
                if (pass == 1 && gate->max_supported_category != flight->category) {
                    continue;
                }
                // Pass 2: check general compatibility
                if (pass == 2 && !is_gate_compatible(gate, flight->category)) {
                    continue;
                }

                // Check for overlap against all scheduled flight windows at this gate
                bool has_conflict = false;
                for (int s = 0; s < gate->scheduled_flights_count; s++) {
                    if (is_gate_window_overlapping(flight->scheduled_departure_minute, gate->scheduled_minutes[s], TURNAROUND_BUFFER_MINUTES)) {
                        has_conflict = true;
                        break;
                    }
                }
                if (has_conflict) continue;

                best_gate_idx = g;
                break;
            }
        }

        if (best_gate_idx >= 0) {
            Gate* chosen_gate = &gates[best_gate_idx];
            results[i].assigned_gate_id = chosen_gate->gate_id;
            strncpy(results[i].gate_code, chosen_gate->gate_code, MAX_GATE_CODE_LEN - 1);
            results[i].is_allocated = true;
            snprintf(results[i].status_message, sizeof(results[i].status_message), "Allocated to Stand %s", chosen_gate->gate_code);

            // Record departure minute in gate schedule
            if (chosen_gate->scheduled_flights_count < 16) {
                chosen_gate->scheduled_minutes[chosen_gate->scheduled_flights_count++] = flight->scheduled_departure_minute;
            }
            chosen_gate->occupied_until_minute = flight->scheduled_departure_minute;
            allocated_count++;
        } else {
            snprintf(results[i].status_message, sizeof(results[i].status_message), "No compatible stand available");
        }
    }

    return allocated_count;
}
