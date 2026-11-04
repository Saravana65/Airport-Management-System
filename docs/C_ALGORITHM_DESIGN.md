# Phase 09: C Algorithm Engine Design & Implementation

**Module:** High-Performance Airport Operations Engine  
**Language:** ANSI C (C99/C11 Standard)  
**Binary Output:** `c-engine.exe` / `test_algorithms.exe`  
**Target Environment:** Academic Evaluation & Production Subprocess Integration  

---

## 1. Engine Purpose and Philosophy

The **C Algorithm Engine** tackles computation-heavy and latency-sensitive airport logistics problems using fundamental data structures and algorithmic paradigms.

Instead of running heavy relational queries or recursive scripts in JavaScript, critical operational decisions—such as **aircraft gate allocation**, **runway takeoff sequencing**, and **baggage routing**—are implemented in compiled C, yielding microsecond-level execution times.

```mermaid
graph TD
    NodeJS["Node.js Backend (cEngine.service.js)"] -->|child_process.execFile| C_CLI["c-engine.exe (CLI Interface)"]
    
    subgraph "Native C Engine Modules"
        C_CLI -->|--gate-alloc| GateModule["gate_allocation.c<br/>Greedy Bipartite Matcher"]
        C_CLI -->|--priority-queue| HeapModule["flight_priority_queue.c<br/>Binary Min-Heap"]
        C_CLI -->|--baggage-route| GraphModule["baggage_routing.c<br/>Dijkstra Conveyor Graph"]
    end
    
    C_CLI -->|stdout (Formatted JSON)| NodeJS
```

---

## 2. Algorithm A: Greedy Bipartite Gate Allocation

### Objective
Assign arriving and departing aircraft to suitable airport terminal gates (stands) while satisfying physical wingspan constraints and turnaround safety buffers.

### Constraints & Invariants
1. **Physical Compatibility:**
   - `AIRCRAFT_NARROW_BODY` (e.g. A320, B737) can dock at Narrow-body or Wide-body gates.
   - `AIRCRAFT_WIDE_BODY` (e.g. B777, A380) **strictly requires** a Wide-body gate due to wing clearance.
2. **Turnaround Separation Buffer:**
   - Consecutive flights assigned to the same gate must have at least **30 minutes** separation between movements ($|\Delta t| \ge 30$).
3. **Stand Availability:**
   - Gates undergoing maintenance (`is_available = false`) are rejected.

### Algorithmic Strategy
- **Pass 1 (Best-Fit):** Attempts to match Narrow-body aircraft with Narrow-body gates to preserve larger stands for Wide-body aircraft.
- **Pass 2 (Fallback):** If no Narrow-body stand is available, allocates an available Wide-body stand.
- **Time Complexity:** $O(F \cdot G)$, where $F$ is number of flights and $G$ is number of gates.

---

## 3. Algorithm B: Runway Takeoff Priority Queue (Binary Min-Heap)

### Objective
Sequence departing aircraft on the runway queue to minimize passenger delays while guaranteeing instantaneous pre-emption for medical emergencies or mechanical distress.

### Data Structure: Array-Backed Binary Min-Heap
- Root index is $0$.
- For element at index $i$:
  - Left child: $2i + 1$
  - Right child: $2i + 2$
  - Parent: $(i - 1) / 2$

### Urgency Scoring Function
$$\text{Score} = \text{DepartureMinute} - (2 \times \text{DelayMinutes}) - (\text{isEmergency} \ ? \ 10000 : 0)$$

1. **Emergency Flight:** Subtracting $10,000$ points gives the emergency flight a negative score (e.g., $-9,400$), causing it to bubble immediately to the root of the Min-Heap.
2. **Delayed Flights:** Every minute of delay reduces the score by 2 points, elevating delayed flights ahead of on-time flights.

### Algorithmic Operations
- **Heapify-Up (`pq_insert`):** Inserts flight at bottom and bubbles up ($O(\log N)$).
- **Heapify-Down (`pq_extract_min`):** Extracts top flight, moves last element to root, and sifts down ($O(\log N)$).
- **Peek (`pq_peek`):** Returns highest priority flight without removing ($O(1)$).

---

## 4. Algorithm C: Baggage Conveyor Routing (Dijkstra)

### Objective
Route luggage from check-in counters through automated sorters and scanners to the aircraft cargo hold in the shortest transit time.

### Graph Representation: Adjacency Matrix
- Directed Weighted Graph $G = (V, E)$ where vertices $V \le 32$ represent checkpoints:
  - `CHECK_IN`: Counter desks
  - `SCANNER`: X-Ray security screening
  - `SORTING`: Automated conveyor distribution hubs
  - `RAMP`: Ground crew loading stations
  - `HOLD`: Aircraft cargo hold
- Matrix cell `adj_matrix[u][v]` holds transit duration in seconds (or $\infty = 999999$ if no direct conveyor connects $u \to v$).

### Path Reconstruction
An array `parent[V]` tracks the shortest-path predecessor for each node. When destination $t$ is reached, the path is reconstructed by following predecessors backward and reversing the order.

### Disconnected Graph Handling
If a baggage carousel or terminal section is offline or disconnected, the algorithm detects that the destination distance remains $\infty$, returning `route_found = false` without buffer overflows.

---

## 5. Memory Management and Safety

1. **Stack & Pre-Allocated Arrays:** Dynamic heap allocations (`malloc`/`free`) are strictly avoided or minimized with fixed-size structural buffers to prevent memory leaks in embedded environments.
2. **String Safety:** `strncpy` and `snprintf` are used throughout, ensuring zero buffer overruns.
3. **ANSI C Standard:** Code strictly conforms to C99/C11 standards, compiling cleanly on MSVC, GCC, and Clang.

---

## 6. Compilation & Command Line Usage

### Compilation
```cmd
cd c-engine
build.bat
```

### CLI Invocations
```cmd
# 1. Gate Allocation Output
c-engine.exe --gate-alloc

# 2. Runway Min-Heap Priority Output
c-engine.exe --priority-queue

# 3. Baggage Conveyor Shortest Path Output
c-engine.exe --baggage-route
```
*(All commands output valid structured JSON to `stdout` for Node.js consumption)*
