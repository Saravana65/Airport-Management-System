# Phase 09: Algorithm Complexity Analysis & Mathematical Proofs

**Project:** Airport Management System  
**Audience:** BTech Viva Voce, Algorithm Analysis & Academic Grading  

This document provides rigorous Big-O time and space complexity evaluations for all Phase 09 algorithms and data structures.

---

## 1. Summary of Algorithm Complexities

| Algorithm / Module | Data Structure | Best Case Time | Average Case Time | Worst Case Time | Space Complexity (Auxiliary) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gate Allocation** | Array of Gates & Schedule Slots | $\Omega(F)$ | $\Theta(F \cdot G)$ | $O(F \cdot G)$ | $O(1)$ auxiliary |
| **Runway Takeoff Queue (Insert)** | Binary Min-Heap | $\Omega(1)$ | $\Theta(\log N)$ | $O(\log N)$ | $O(N)$ capacity |
| **Runway Takeoff Queue (Extract-Min)** | Binary Min-Heap | $\Omega(\log N)$ | $\Theta(\log N)$ | $O(\log N)$ | $O(1)$ auxiliary |
| **Runway Takeoff Queue (Peek)** | Binary Min-Heap | $\Omega(1)$ | $\Theta(1)$ | $O(1)$ | $O(1)$ |
| **Baggage Conveyor Shortest Path** | Directed Graph (Adjacency Matrix) | $\Omega(V^2)$ | $\Theta(V^2)$ | $O(V^2)$ | $O(V)$ auxiliary |
| **Java Booking Store (Lookup)** | `ConcurrentHashMap` | $\Omega(1)$ | $\Theta(1)$ | $O(N)$ (hash collision) | $O(N)$ |
| **Java State Transition** | `EnumSet` Transition Guard | $\Omega(1)$ | $\Theta(1)$ | $O(1)$ | $O(1)$ |

---

## 2. In-Depth Complexity Proofs

### 2.1 Gate Allocation Algorithm: $O(F \cdot G)$
- **Variables:** $F = \text{Flight count}$, $G = \text{Gate count}$, $S = \text{Max slots per gate (constant } 16\text{)}$.
- **Proof:**
  1. The outer loop iterates over each flight: $F$ iterations.
  2. For each flight, the algorithm evaluates available gates across two passes (Pass 1: exact category match, Pass 2: fallback match).
  3. For each candidate gate, it verifies temporal separation against up to $S \le 16$ previously scheduled flights:
     $$T(F, G) = \sum_{i=1}^{F} \sum_{j=1}^{G} c \cdot S = c \cdot S \cdot (F \cdot G) = O(F \cdot G)$$
- **Space Complexity:** $O(1)$ auxiliary memory since results are stored directly into pre-allocated output arrays.

---

### 2.2 Runway Priority Queue (Binary Min-Heap): $O(\log N)$
- **Variables:** $N = \text{Number of queued aircraft}$.
- **Heap Invariant:** For every non-root node at index $i$, $\text{Score}(\text{parent}(i)) \le \text{Score}(i)$.
- **Proof of Insertion (`pq_insert`):**
  1. The new flight is placed at the end of the array (leaf position $N$).
  2. It bubbles upward along the tree path toward the root.
  3. The height $h$ of a complete binary tree with $N$ nodes is:
     $$h = \lfloor \log_2 N \rfloor$$
  4. In the worst case (e.g. an Emergency Flight with score $-9,400$), the element traverses from leaf to root, requiring exactly $h$ comparisons and swaps:
     $$T_{\text{insert}}(N) \le c \cdot \log_2 N \implies O(\log N)$$
- **Proof of Extract-Min (`pq_extract_min`):**
  1. The root element (index $0$) is removed in $O(1)$ time.
  2. The last leaf is placed at the root and sifted down by comparing with its smaller child.
  3. The element traverses downward along tree height $h$:
     $$T_{\text{extract}}(N) \le 2c \cdot \log_2 N \implies O(\log N)$$

---

### 2.3 Baggage Conveyor Routing (Dijkstra): $O(V^2)$
- **Variables:** $V = \text{Vertices (checkpoints)}$, $E = \text{Edges (conveyor segments)}$.
- **Proof:**
  1. Initialize distance array `dist[0..V-1] = INF` and `visited[0..V-1] = false`: $O(V)$.
  2. The algorithm executes $V$ vertex selection loops:
     - In each step, finding the unvisited vertex with minimum distance requires scanning all $V$ entries: $O(V)$.
     - Once vertex $u$ is chosen, updating all adjacent neighbors requires scanning row $u$ in the adjacency matrix: $O(V)$.
  3. Total running time:
     $$T(V) = \sum_{i=1}^{V} \left( O(V) + O(V) \right) = V \cdot 2O(V) = O(V^2)$$
- **Why Adjacency Matrix?**  
  In airport conveyor systems, the number of checkpoints per terminal section is small and bounded ($V \le 32$). The adjacency matrix provides $O(1)$ edge existence lookups and zero pointer overhead, offering superior cache locality over adjacency lists.

---

## 3. Edge Case Handling & Robustness

1. **Gate Wingspan Incompatibility:**
   - Wide-body jets (e.g. B777, A380) cannot dock at Narrow-body gates. If no Wide-body gate is free within turnaround buffer, allocation safely fails with `"No compatible stand available"` without system crashes.
2. **Emergency Takeoff Inversion:**
   - Even if scheduled an hour later, an emergency medical flight immediately leaps to the front of the runway queue.
3. **Disconnected Conveyor Checkpoints:**
   - If an isolated conveyor node cannot be reached ($d[u] = \infty$), Dijkstra marks `route_found = false`, returning 0 total weight and zero checkpoints.
4. **Zero Heap Underflow / Overflow:**
   - Heap capacity is bounded by `capacity = 128`. Attempts to insert past capacity or extract from an empty heap return `false` cleanly.
