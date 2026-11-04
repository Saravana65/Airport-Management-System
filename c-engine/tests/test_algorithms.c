/**
 * Phase 09: C Airport Engine - Comprehensive Algorithm Test Suite
 * Tests Gate Allocation, Priority Queue Min-Heap, and Dijkstra Conveyor Routing.
 */

#include <stdio.h>
#include <assert.h>
#include "../include/airport_types.h"
#include "../include/gate_allocation.h"
#include "../include/flight_priority_queue.h"
#include "../include/baggage_routing.h"

static int passed_tests = 0;
static int total_tests = 0;

#define TEST_ASSERT(cond, msg) do { \
    total_tests++; \
    if (cond) { \
        passed_tests++; \
        printf("  ✔ [PASS] %s\n", msg); \
    } else { \
        printf("  ✖ [FAIL] %s (Line %d)\n", msg, __LINE__); \
    } \
} while(0)

static void test_gate_compatibility(void) {
    printf("\n--- Test Suite 1: Gate Compatibility ---\n");
    Gate narrow_gate = { 1, "G01", "T1", AIRCRAFT_NARROW_BODY, true, 0 };
    Gate wide_gate   = { 2, "G02", "T1", AIRCRAFT_WIDE_BODY, true, 0 };

    TEST_ASSERT(is_gate_compatible(&narrow_gate, AIRCRAFT_NARROW_BODY) == true,
        "Narrow-body gate accepts Narrow-body aircraft");
    TEST_ASSERT(is_gate_compatible(&narrow_gate, AIRCRAFT_WIDE_BODY) == false,
        "Narrow-body gate rejects Wide-body aircraft (physical wing clearance)");
    TEST_ASSERT(is_gate_compatible(&wide_gate, AIRCRAFT_WIDE_BODY) == true,
        "Wide-body gate accepts Wide-body aircraft");
    TEST_ASSERT(is_gate_compatible(&wide_gate, AIRCRAFT_NARROW_BODY) == true,
        "Wide-body gate supports Narrow-body aircraft (backward compatible)");
}

static void test_gate_overlap_detection(void) {
    printf("\n--- Test Suite 2: Gate Overlap Detection ---\n");
    // Flight 1 departs at 02:00 (120 min), Flight 2 at 02:15 (135 min) -> 15 min difference < 30 min buffer
    TEST_ASSERT(is_gate_window_overlapping(120, 135, 30) == true,
        "Overlapping departures (15 min difference) detected as collision");
    // Flight 1 at 02:00 (120 min), Flight 3 at 03:00 (180 min) -> 60 min difference >= 30 min buffer
    TEST_ASSERT(is_gate_window_overlapping(120, 180, 30) == false,
        "Separated departures (60 min difference) detected as conflict-free");
}

static void test_priority_queue(void) {
    printf("\n--- Test Suite 3: Flight Priority Queue (Binary Min-Heap) ---\n");
    PriorityQueue pq;
    pq_init(&pq, 10);

    TEST_ASSERT(pq_size(&pq) == 0, "Initial priority queue size is 0");

    Flight f_normal    = { 1, "AI-101", AIRCRAFT_NARROW_BODY, 600, 0, 0, false, 0 };     // 10:00 normal
    Flight f_delayed   = { 2, "AI-2014", AIRCRAFT_WIDE_BODY, 610, 0, 50, false, 0 };     // 10:10 delayed 50m
    Flight f_emergency = { 3, "MEDEVAC", AIRCRAFT_NARROW_BODY, 620, 0, 0, true, 0 };      // 10:20 EMERGENCY

    pq_insert(&pq, &f_normal);
    pq_insert(&pq, &f_delayed);
    pq_insert(&pq, &f_emergency);

    TEST_ASSERT(pq_size(&pq) == 3, "Queue size equals 3 after 3 insertions");

    Flight first_out;
    bool ext1 = pq_extract_min(&pq, &first_out);
    TEST_ASSERT(ext1 && strcmp(first_out.flight_number, "MEDEVAC") == 0,
        "Emergency flight extracted FIRST regardless of later departure time");

    Flight second_out;
    bool ext2 = pq_extract_min(&pq, &second_out);
    TEST_ASSERT(ext2 && strcmp(second_out.flight_number, "AI-2014") == 0,
        "Delayed flight extracted SECOND due to delay urgency boost");

    Flight third_out;
    bool ext3 = pq_extract_min(&pq, &third_out);
    TEST_ASSERT(ext3 && strcmp(third_out.flight_number, "AI-101") == 0,
        "Normal flight extracted THIRD");

    TEST_ASSERT(pq_size(&pq) == 0, "Queue empty after extracting all elements");
}

static void test_baggage_routing(void) {
    printf("\n--- Test Suite 4: Baggage Conveyor Routing (Dijkstra) ---\n");
    ConveyorGraph graph;
    graph_init(&graph);

    int n0 = graph_add_node(&graph, "Checkin-Desk-01", "CHECKIN");
    int n1 = graph_add_node(&graph, "Security-Scanner", "SCANNER");
    int n2 = graph_add_node(&graph, "Sorting-Hub", "SORTER");
    int n3 = graph_add_node(&graph, "Ramp-Loading", "RAMP");
    int n4 = graph_add_node(&graph, "Disconnected-Carousel", "ISOLATED");

    graph_add_edge(&graph, n0, n1, 30); // 30 sec
    graph_add_edge(&graph, n1, n2, 40); // 40 sec
    graph_add_edge(&graph, n2, n3, 50); // 50 sec

    // Shortest path n0 -> n3: 30 + 40 + 50 = 120 sec
    BaggageRouteResult route = find_shortest_baggage_route(&graph, n0, n3);
    TEST_ASSERT(route.route_found == true, "Shortest path found between connected conveyor points");
    TEST_ASSERT(route.total_weight_seconds == 120, "Total conveyor transit time equals 120 seconds");
    TEST_ASSERT(route.path_length == 4, "Path traversal consists of 4 checkpoint nodes");
    TEST_ASSERT(route.path[0] == n0 && route.path[3] == n3, "Path begins at checkin and terminates at ramp");

    // Disconnected graph handling
    BaggageRouteResult bad_route = find_shortest_baggage_route(&graph, n0, n4);
    TEST_ASSERT(bad_route.route_found == false, "Gracefully handles disconnected conveyor checkpoint (route_found = false)");
}

int main(void) {
    printf("================================================================\n");
    printf("   RUNNING PHASE 09 C ALGORITHM ENGINE TEST SUITE\n");
    printf("================================================================\n");

    test_gate_compatibility();
    test_gate_overlap_detection();
    test_priority_queue();
    test_baggage_routing();

    printf("\n================================================================\n");
    printf("C ALGORITHM TEST RESULTS: %d passed, %d failed (Total %d)\n",
        passed_tests, total_tests - passed_tests, total_tests);
    printf("================================================================\n");

    return (passed_tests == total_tests) ? 0 : 1;
}
