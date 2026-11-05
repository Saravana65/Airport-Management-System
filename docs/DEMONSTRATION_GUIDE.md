# Faculty Demonstration & Viva Presentation Guide

**Project:** Airport Management System  
**Presentation Target:** Faculty Evaluation Committee & External Viva Examiner  
**Author:** Saravana (BTech Student Project)  
**Live URL (Local):** `http://localhost:5173` (Dev) or `http://localhost` (Production/Docker)  
**Backend API:** `http://localhost:5000`

---

## 1. Quick-Start Instructions for Evaluation

### Step 1: Start Backend Gateway & Polyglot Engines
```bash
# Terminal 1: Node.js Express Gateway
cd backend
npm install
npm run dev
```

*(Optional: Start Java Microservice if running standalone)*
```bash
# Terminal 2: Java 17 OOP Microservice
cd java-service
./run.bat   # Windows: runs embedded HttpServer on port 5050
```

### Step 2: Start Frontend Presentation App
```bash
# Terminal 3: React.js Vite Frontend
cd frontend
npm install
npm run dev
# Browser opens automatically at http://localhost:5173
```

---

## 2. Pre-Configured Demonstration Accounts

| Role Station | Email Address | Password | Demonstration Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@airport.com` | `Admin@12345` | Global command center, users, AADE approvals & audit logs |
| **AIRLINE_STAFF** | `staff@airline.com` | `Airline@12345` | Carrier dispatch, flight status updates, passenger manifests |
| **AIRPORT_STAFF** | `ops@airport.com` | `Airport@12345` | Ground operations, aerobridge gate assignments, baggage intake |
| **PASSENGER** | `passenger@gmail.com` | `Pass@12345` | Flight search, booking reservation, web check-in, baggage status |

*Tip: On the login screen, click any of the 4 quick-fill role pills to instantly populate credentials without typing.*

---

## 3. Step-by-Step Viva Demonstration Workflow

### Step 1: Administrator Session & Security Clearance
* **Action:** Click the **ADMIN** pill on the login screen and click **Initialize Station Session**.
* **What Happens:** The Node.js gateway validates credentials using `bcrypt.compare`, issues an HMAC SHA-256 signed JWT inside an `HttpOnly` cookie, and redirects to `/admin/dashboard`.
* **Viva Explanation:** Explain that JWT tokens are never stored in `localStorage` to eliminate XSS vulnerability; server-side RBAC middleware enforces station access.

### Step 2: Airport Infrastructure & Telemetry Review
* **Action:** On the Administrator Dashboard, review the live counters: Operational Airports (3), Registered Carriers (2), Active Fleet Aircraft (2), and Scheduled Flights (2). Click on the **Airports** and **Fleet** tabs.
* **Viva Explanation:** Show that data is structured in Third Normal Form (3NF) relational tables (`AIRPORTS`, `AIRLINES`, `AIRCRAFT`) linked by foreign keys.

### Step 3: Airline Flight Dispatch & Status Modification
* **Action:** Log out, select the **AIRLINE_STAFF** pill, and log in. Navigate to the **Flight Management** tab. Click **Update Status** on flight `AI-2014` and change status from `ON_TIME` to `BOARDING`.
* **Viva Explanation:** The state update triggers operational state tracking in Node.js and broadcasts the updated status across passenger displays.

### Step 4: Passenger Flight Search & Booking
* **Action:** Log out, select the **PASSENGER** pill, and log in. Navigate to the **Search Flights** tab. Search for flights from `BOM` to `DEL`. Select flight `AI-2014`, choose seat `28A`, and click **Confirm Flight Booking**.
* **What Happens:** The system issues a unique 6-character PNR code and generates an e-ticket.
* **Viva Explanation:** Highlight that composite unique constraint `uq_flight_seat (FLIGHT_INSTANCE_ID, SEAT_NUMBER)` strictly prevents two passengers from booking the same seat.

### Step 5: Web Check-in & Digital Boarding Pass
* **Action:** Navigate to the **Web Check-in** tab on the Passenger Portal. Select the confirmed flight ticket, confirm seat `28A`, and click **Complete Check-in & Issue Pass**.
* **What Happens:** The digital boarding pass is rendered with boarding time, terminal gate, and unique barcode code (`BP-AI2014-28A-XXXX`).
* **Viva Explanation:** Show that re-submitting check-in for the same ticket is rejected with HTTP 409 (Duplicate Check-in Prevention).

### Step 6: Ground Operations, Gate Allocation & Baggage Intake
* **Action:** Log out, select the **AIRPORT_STAFF** pill, and log in. Navigate to **Gate Management**. Assign Gate `T3-G14` to flight `AI-2014`. Next, navigate to **Baggage Tracking** and record a 18.5 kg checked bag.
* **Viva Explanation:** Explain that gate allocation verifies physical gate clearance (Narrow-body vs Wide-body) and detects schedule overlaps.

### Step 7: AADE Anomaly & Operational Conflict Detection
* **Action:** Navigate to the **Autonomous Data Engine (AADE)** console (`/airport/aade`).
* **What Happens:** The engine displays real-time telemetry: Active Alerts, Integrity Scans, and Detected Conflicts (e.g., Gate overlap within 30-minute buffer or Dual seat collision).
* **Viva Explanation:** Explain that AADE runs scheduled background sweeps to identify inconsistencies before passengers arrive at the gate. Alert duplication is prevented via cryptographic SHA-256 hash keys.

### Step 8: Human-in-the-Loop Operator Approval Workflow
* **Action:** Log out, log back in as **ADMIN**, and navigate to **Autonomous Data Engine $\to$ Approval Requests**.
* **Action:** Select a pending proposal (e.g. *Reassign conflicting flight AI-2014 from Gate G12 to Gate G15*), enter operational remarks, and click **Approve Action**.
* **Viva Explanation:** Emphasize that the system enforces **Human-in-the-Loop Governance**: AI and background engines propose optimizations, but critical airside changes require an authorized human controller's explicit approval.

### Step 9: Immutable Execution Audit History
* **Action:** On the AADE console, click the **Audit History** tab.
* **What Happens:** Review the newly created append-only audit entry showing the exact timestamp, approver user ID, action type, and before/after states.
* **Viva Explanation:** Emphasize compliance with aviation safety regulations requiring non-repudiation and immutable change logs.

### Step 10: Multi-Language Algorithmic Core Laboratory
* **Action:** Navigate to **C & Java Algorithms** (`/admin/algorithms`).
* **What Happens:**
  1. *C Gate Allocator:* Displays greedy interval matching allocating flights to gates in sub-millisecond time.
  2. *C Runway Queue:* Demonstrates min-heap prioritizing emergency landings over delayed flights.
  3. *C Baggage Routing:* Visualizes Dijkstra's shortest-path finding optimal transit across conveyor checkpoints.
  4. *Java Strategy Fare Engine:* Interactive simulator demonstrating polymorphic pricing strategies (`StandardPricingStrategy` vs `SurgePricingStrategy`).
* **Viva Explanation:** Explain why C was chosen for speed-critical computation, Java for strict OOP domain encapsulation, and Node.js for asynchronous web coordination.
