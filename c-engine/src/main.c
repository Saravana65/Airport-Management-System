/**
 * Phase 09: C Airport Engine - Command Line Interface & JSON Output
 * Invoked by Node.js child_process or standalone for testing and viva presentation.
 */

#include "../include/airport_types.h"
#include "../include/gate_allocation.h"
#include "../include/flight_priority_queue.h"
#include "../include/baggage_routing.h"

static void run_demo_gate_allocation(void) {
    Gate gates[4] = {
        { 1, "T1-G01", "T1", AIRCRAFT_WIDE_BODY, true, 0 },
        { 2, "T1-G02", "T1", AIRCRAFT_NARROW_BODY, true, 0 },
        { 3, "T2-G10", "T2", AIRCRAFT_WIDE_BODY, true, 0 },
        { 4, "T2-G11", "T2", AIRCRAFT_NARROW_BODY, false, 0 } // in maintenance
    };

    Flight flights[4] = {
        { 101, "AI2014", AIRCRAFT_WIDE_BODY, 130, 0, 0, false, 0 },     // 02:10 (130 mins)
        { 102, "AI101", AIRCRAFT_NARROW_BODY, 90, 0, 15, false, 0 },     // 01:30 (90 mins)
        { 103, "BA1689", AIRCRAFT_WIDE_BODY, 620, 0, 0, false, 0 },     // 10:20 (620 mins)
        { 104, "EMERG-1", AIRCRAFT_NARROW_BODY, 135, 0, 0, true, 0 }     // Emergency
    };

    GateAllocationResult results[4];
    int allocated = allocate_gates(flights, 4, gates, 4, results);

    printf("{\n");
    printf("  \"algorithm\": \"Greedy Bipartite Gate Allocation\",\n");
    printf("  \"timeComplexity\": \"O(F * G)\",\n");
    printf("  \"totalFlights\": 4,\n");
    printf("  \"allocatedCount\": %d,\n", allocated);
    printf("  \"allocations\": [\n");

    for (int i = 0; i < 4; i++) {
        printf("    {\n");
        printf("      \"flightId\": %d,\n", results[i].flight_id);
        printf("      \"flightNumber\": \"%s\",\n", results[i].flight_number);
        printf("      \"assignedGateId\": %d,\n", results[i].assigned_gate_id);
        printf("      \"gateCode\": \"%s\",\n", results[i].gate_code);
        printf("      \"isAllocated\": %s,\n", results[i].is_allocated ? "true" : "false");
        printf("      \"status\": \"%s\"\n", results[i].status_message);
        printf("    }%s\n", (i == 3) ? "" : ",");
    }

    printf("  ]\n");
    printf("}\n");
}

static void run_demo_priority_queue(void) {
    PriorityQueue pq;
    pq_init(&pq, 10);

    Flight f1 = { 1, "AI101", AIRCRAFT_NARROW_BODY, 540, 0, 0, false, 0 };    // 09:00 normal
    Flight f2 = { 2, "AI2014", AIRCRAFT_WIDE_BODY, 570, 0, 45, false, 0 };   // 09:30 delayed 45m
    Flight f3 = { 3, "MEDEVAC-1", AIRCRAFT_NARROW_BODY, 600, 0, 0, true, 0 }; // 10:00 EMERGENCY
    Flight f4 = { 4, "BA1689", AIRCRAFT_WIDE_BODY, 550, 0, 0, false, 0 };    // 09:10 normal

    pq_insert(&pq, &f1);
    pq_insert(&pq, &f2);
    pq_insert(&pq, &f3);
    pq_insert(&pq, &f4);

    printf("{\n");
    printf("  \"dataStructure\": \"Binary Min-Heap Priority Queue\",\n");
    printf("  \"complexity\": { \"insert\": \"O(log N)\", \"extractMin\": \"O(log N)\", \"peek\": \"O(1)\" },\n");
    printf("  \"queueSize\": %d,\n", pq_size(&pq));
    printf("  \"sequencedTakeoffs\": [\n");

    Flight extracted;
    int rank = 1;
    while (pq_extract_min(&pq, &extracted)) {
        printf("    {\n");
        printf("      \"sequenceRank\": %d,\n", rank++);
        printf("      \"flightNumber\": \"%s\",\n", extracted.flight_number);
        printf("      \"scheduledDepartureMinute\": %d,\n", extracted.scheduled_departure_minute);
        printf("      \"delayMinutes\": %d,\n", extracted.delay_minutes);
        printf("      \"isEmergency\": %s,\n", extracted.is_emergency ? "true" : "false");
        printf("      \"calculatedUrgencyScore\": %d\n", pq_calculate_score(&extracted));
        printf("    }%s\n", (pq_size(&pq) == 0) ? "" : ",");
    }

    printf("  ]\n");
    printf("}\n");
}

static void run_demo_baggage_routing(void) {
    ConveyorGraph graph;
    graph_init(&graph);

    int n_checkin  = graph_add_node(&graph, "Check-in Desk Counter 12", "CHECK_IN");
    int n_xray     = graph_add_node(&graph, "Primary X-Ray Security", "SCANNER");
    int n_sorter   = graph_add_node(&graph, "Automated Conveyor Sorter", "SORTING");
    int n_ramp_t1  = graph_add_node(&graph, "Ramp Loading Station T1", "RAMP");
    int n_ramp_t2  = graph_add_node(&graph, "Ramp Loading Station T2", "RAMP");
    int n_hold     = graph_add_node(&graph, "Aircraft Cargo Hold (Gate G01)", "HOLD");

    // Conveyor edges with weights in seconds
    graph_add_edge(&graph, n_checkin, n_xray, 45);
    graph_add_edge(&graph, n_xray, n_sorter, 60);
    graph_add_edge(&graph, n_sorter, n_ramp_t1, 90);
    graph_add_edge(&graph, n_sorter, n_ramp_t2, 140);
    graph_add_edge(&graph, n_ramp_t1, n_hold, 120);
    graph_add_edge(&graph, n_ramp_t2, n_hold, 80);

    BaggageRouteResult route = find_shortest_baggage_route(&graph, n_checkin, n_hold);

    printf("{\n");
    printf("  \"algorithm\": \"Dijkstra Shortest Path Algorithm\",\n");
    printf("  \"timeComplexity\": \"O(V^2)\",\n");
    printf("  \"sourceNode\": \"%s\",\n", graph.nodes[n_checkin].name);
    printf("  \"targetNode\": \"%s\",\n", graph.nodes[n_hold].name);
    printf("  \"routeFound\": %s,\n", route.route_found ? "true" : "false");
    printf("  \"totalTransitTimeSeconds\": %d,\n", route.total_weight_seconds);
    printf("  \"pathCheckpoints\": [\n");

    for (int i = 0; i < route.path_length; i++) {
        int nid = route.path[i];
        printf("    { \"order\": %d, \"nodeId\": %d, \"name\": \"%s\", \"type\": \"%s\" }%s\n",
            i + 1, nid, graph.nodes[nid].name, graph.nodes[nid].type,
            (i == route.path_length - 1) ? "" : ",");
    }

    printf("  ]\n");
    printf("}\n");
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("Usage: c-engine [--gate-alloc | --priority-queue | --baggage-route]\n");
        return 0;
    }

    if (strcmp(argv[1], "--gate-alloc") == 0) {
        run_demo_gate_allocation();
    } else if (strcmp(argv[1], "--priority-queue") == 0) {
        run_demo_priority_queue();
    } else if (strcmp(argv[1], "--baggage-route") == 0) {
        run_demo_baggage_routing();
    } else {
        fprintf(stderr, "Unknown option: %s\n", argv[1]);
        return 1;
    }

    return 0;
}
