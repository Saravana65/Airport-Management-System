/**
 * Flight Priority Queue Implementation (Binary Min-Heap)
 */

#include "../include/flight_priority_queue.h"

void pq_init(PriorityQueue* pq, int capacity) {
    if (!pq) return;
    pq->size = 0;
    pq->capacity = (capacity > MAX_FLIGHTS) ? MAX_FLIGHTS : capacity;
}

int pq_calculate_score(const Flight* flight) {
    if (!flight) return INF_WEIGHT;
    // Lower score = higher priority
    // Emergency flights receive -10000 boost
    // Each minute of delay reduces score by 3 (advancing queue position)
    int score = flight->scheduled_departure_minute;
    if (flight->is_emergency) {
        score -= 10000;
    }
    score -= (flight->delay_minutes * 3);
    return score;
}

static void swap_nodes(HeapNode* a, HeapNode* b) {
    HeapNode temp = *a;
    *a = *b;
    *b = temp;
}

static void heapify_up(PriorityQueue* pq, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (pq->elements[index].urgency_score < pq->elements[parent].urgency_score) {
            swap_nodes(&pq->elements[index], &pq->elements[parent]);
            index = parent;
        } else {
            break;
        }
    }
}

static void heapify_down(PriorityQueue* pq, int index) {
    int size = pq->size;
    while (index < size) {
        int left = 2 * index + 1;
        int right = 2 * index + 2;
        int smallest = index;

        if (left < size && pq->elements[left].urgency_score < pq->elements[smallest].urgency_score) {
            smallest = left;
        }
        if (right < size && pq->elements[right].urgency_score < pq->elements[smallest].urgency_score) {
            smallest = right;
        }

        if (smallest != index) {
            swap_nodes(&pq->elements[index], &pq->elements[smallest]);
            index = smallest;
        } else {
            break;
        }
    }
}

bool pq_insert(PriorityQueue* pq, const Flight* flight) {
    if (!pq || !flight || pq->size >= pq->capacity) return false;

    int idx = pq->size;
    pq->elements[idx].flight = *flight;
    pq->elements[idx].urgency_score = pq_calculate_score(flight);
    pq->size++;

    heapify_up(pq, idx);
    return true;
}

bool pq_extract_min(PriorityQueue* pq, Flight* out_flight) {
    if (!pq || pq->size == 0) return false;

    if (out_flight) {
        *out_flight = pq->elements[0].flight;
    }

    pq->elements[0] = pq->elements[pq->size - 1];
    pq->size--;

    if (pq->size > 0) {
        heapify_down(pq, 0);
    }

    return true;
}

bool pq_peek(const PriorityQueue* pq, Flight* out_flight) {
    if (!pq || pq->size == 0) return false;
    if (out_flight) {
        *out_flight = pq->elements[0].flight;
    }
    return true;
}

int pq_size(const PriorityQueue* pq) {
    return pq ? pq->size : 0;
}
