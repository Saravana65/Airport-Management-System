/**
 * Algorithm B: Flight Priority Queue (Binary Min-Heap)
 * Prioritizes runway takeoff and landing movements based on urgency score.
 * Emergency flights receive maximum priority; delays advance priority.
 *
 * Heap Operations & Time Complexity:
 *   - Insert: O(log N)
 *   - Extract-Min: O(log N)
 *   - Peek-Min: O(1)
 */

#ifndef FLIGHT_PRIORITY_QUEUE_H
#define FLIGHT_PRIORITY_QUEUE_H

#include "airport_types.h"

typedef struct {
    Flight flight;
    int urgency_score; // Lower score = Higher priority (Min-Heap)
} HeapNode;

typedef struct {
    HeapNode elements[MAX_FLIGHTS];
    int size;
    int capacity;
} PriorityQueue;

/**
 * Initializes priority queue with fixed capacity.
 */
void pq_init(PriorityQueue* pq, int capacity);

/**
 * Calculates priority score.
 * Formula: urgency = departure_minute - (is_emergency * 10000) - (delay_minutes * 3)
 */
int pq_calculate_score(const Flight* flight);

/**
 * Inserts flight into Min-Heap.
 * Time Complexity: O(log N)
 */
bool pq_insert(PriorityQueue* pq, const Flight* flight);

/**
 * Extracts highest priority flight (minimum urgency score).
 * Time Complexity: O(log N)
 */
bool pq_extract_min(PriorityQueue* pq, Flight* out_flight);

/**
 * Peeks at highest priority flight without removal.
 * Time Complexity: O(1)
 */
bool pq_peek(const PriorityQueue* pq, Flight* out_flight);

/**
 * Returns current queue size.
 */
int pq_size(const PriorityQueue* pq);

#endif /* FLIGHT_PRIORITY_QUEUE_H */
