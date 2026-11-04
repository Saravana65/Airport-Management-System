/**
 * Algorithm C: Baggage Conveyor Routing (Dijkstra's Shortest Path)
 * Models conveyor checkpoints as a directed weighted graph.
 * Calculates shortest travel time and handles disconnected nodes.
 *
 * Time Complexity: O(V^2) where V is the number of conveyor checkpoints.
 */

#ifndef BAGGAGE_ROUTING_H
#define BAGGAGE_ROUTING_H

#include "airport_types.h"

typedef struct {
    ConveyorNode nodes[MAX_GRAPH_NODES];
    int adjacency_matrix[MAX_GRAPH_NODES][MAX_GRAPH_NODES]; // Weights in seconds
    int node_count;
} ConveyorGraph;

/**
 * Initializes conveyor graph.
 */
void graph_init(ConveyorGraph* graph);

/**
 * Adds checkpoint node to graph.
 */
int graph_add_node(ConveyorGraph* graph, const char* name, const char* type);

/**
 * Adds directed conveyor belt edge between nodes with transit time in seconds.
 */
void graph_add_edge(ConveyorGraph* graph, int from_id, int to_id, int weight_seconds);

/**
 * Computes shortest path from source node to destination node using Dijkstra's Algorithm.
 * Returns route with ordered node IDs and total transit time.
 */
BaggageRouteResult find_shortest_baggage_route(
    const ConveyorGraph* graph,
    int source_node_id,
    int dest_node_id
);

#endif /* BAGGAGE_ROUTING_H */
