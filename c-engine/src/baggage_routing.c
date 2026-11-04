/**
 * Baggage Conveyor Routing Implementation (Dijkstra's Algorithm)
 */

#include "../include/baggage_routing.h"

void graph_init(ConveyorGraph* graph) {
    if (!graph) return;
    graph->node_count = 0;
    for (int i = 0; i < MAX_GRAPH_NODES; i++) {
        for (int j = 0; j < MAX_GRAPH_NODES; j++) {
            graph->adjacency_matrix[i][j] = (i == j) ? 0 : INF_WEIGHT;
        }
    }
}

int graph_add_node(ConveyorGraph* graph, const char* name, const char* type) {
    if (!graph || graph->node_count >= MAX_GRAPH_NODES) return -1;
    int id = graph->node_count++;
    graph->nodes[id].node_id = id;
    strncpy(graph->nodes[id].name, name ? name : "Point", MAX_NAME_LEN - 1);
    strncpy(graph->nodes[id].type, type ? type : "GENERIC", 31);
    return id;
}

void graph_add_edge(ConveyorGraph* graph, int from_id, int to_id, int weight_seconds) {
    if (!graph) return;
    if (from_id >= 0 && from_id < graph->node_count &&
        to_id >= 0 && to_id < graph->node_count) {
        graph->adjacency_matrix[from_id][to_id] = weight_seconds;
    }
}

BaggageRouteResult find_shortest_baggage_route(
    const ConveyorGraph* graph,
    int source_node_id,
    int dest_node_id
) {
    BaggageRouteResult result;
    result.path_length = 0;
    result.total_weight_seconds = 0;
    result.route_found = false;

    if (!graph || graph->node_count == 0) return result;
    if (source_node_id < 0 || source_node_id >= graph->node_count ||
        dest_node_id < 0 || dest_node_id >= graph->node_count) {
        return result;
    }

    int n = graph->node_count;
    int dist[MAX_GRAPH_NODES];
    bool visited[MAX_GRAPH_NODES];
    int parent[MAX_GRAPH_NODES];

    for (int i = 0; i < n; i++) {
        dist[i] = INF_WEIGHT;
        visited[i] = false;
        parent[i] = -1;
    }

    dist[source_node_id] = 0;

    for (int count = 0; count < n - 1; count++) {
        int min_dist = INF_WEIGHT;
        int u = -1;

        for (int v = 0; v < n; v++) {
            if (!visited[v] && dist[v] < min_dist) {
                min_dist = dist[v];
                u = v;
            }
        }

        if (u == -1 || u == dest_node_id) break;
        visited[u] = true;

        for (int v = 0; v < n; v++) {
            int weight = graph->adjacency_matrix[u][v];
            if (!visited[v] && weight > 0 && weight < INF_WEIGHT && dist[u] != INF_WEIGHT) {
                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    parent[v] = u;
                }
            }
        }
    }

    // Check if destination is reachable
    if (dist[dest_node_id] == INF_WEIGHT) {
        result.route_found = false;
        return result;
    }

    // Reconstruct path backwards
    int temp_path[MAX_GRAPH_NODES];
    int length = 0;
    int curr = dest_node_id;

    while (curr != -1) {
        temp_path[length++] = curr;
        curr = parent[curr];
    }

    // Reverse path into result
    result.path_length = length;
    result.total_weight_seconds = dist[dest_node_id];
    result.route_found = true;

    for (int i = 0; i < length; i++) {
        result.path[i] = temp_path[length - 1 - i];
    }

    return result;
}
