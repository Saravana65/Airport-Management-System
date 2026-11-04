/**
 * Phase 09: C Airport Engine - Core Data Structures & Types
 * ANSI C (C99/C11 Compatible)
 */

#ifndef AIRPORT_TYPES_H
#define AIRPORT_TYPES_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_FLIGHT_CODE_LEN 16
#define MAX_GATE_CODE_LEN 16
#define MAX_NAME_LEN 64
#define MAX_GATES 64
#define MAX_FLIGHTS 128
#define MAX_GRAPH_NODES 32
#define INF_WEIGHT 999999

/* Aircraft Size Category */
typedef enum {
    AIRCRAFT_NARROW_BODY = 1, // e.g. A320, B737
    AIRCRAFT_WIDE_BODY   = 2  // e.g. B777, A380, B787
} AircraftCategory;

/* Gate Definition */
typedef struct {
    int gate_id;
    char gate_code[MAX_GATE_CODE_LEN];
    char terminal[16];
    AircraftCategory max_supported_category;
    bool is_available;
    int occupied_until_minute;
    int scheduled_flights_count;
    int scheduled_minutes[16];
} Gate;

/* Flight Movement */
typedef struct {
    int flight_id;
    char flight_number[MAX_FLIGHT_CODE_LEN];
    AircraftCategory category;
    int scheduled_departure_minute; // Minutes from 00:00 (0 - 1439)
    int scheduled_arrival_minute;
    int delay_minutes;
    bool is_emergency;
    int assigned_gate_id;
} Flight;

/* Gate Assignment Result */
typedef struct {
    int flight_id;
    char flight_number[MAX_FLIGHT_CODE_LEN];
    int assigned_gate_id;
    char gate_code[MAX_GATE_CODE_LEN];
    bool is_allocated;
    char status_message[MAX_NAME_LEN];
} GateAllocationResult;

/* Conveyor Graph Node */
typedef struct {
    int node_id;
    char name[MAX_NAME_LEN];
    char type[32]; // CHECK_IN, SCANNER, SORTING, RAMP, HOLD, RECLAIM
} ConveyorNode;

/* Baggage Routing Path */
typedef struct {
    int path[MAX_GRAPH_NODES];
    int path_length;
    int total_weight_seconds;
    bool route_found;
} BaggageRouteResult;

#endif /* AIRPORT_TYPES_H */
