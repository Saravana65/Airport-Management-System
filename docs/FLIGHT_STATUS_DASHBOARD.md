# Live Flight Status & Tracking Dashboard

## Overview
The **Live Flight Status & Tracking Dashboard** is a high-performance, real-time aviation monitoring interface integrated into the Airport Management System. Adapted from the professional `ultra-quality-data-table` architectural pattern, it provides airport administrators, airline dispatchers, ground operations crew, and passengers with searchable, sortable, paginated, and live-updating flight schedule telemetry.

The dashboard integrates directly with the Node.js backend RESTful API (`GET /api/flights`), which streams enriched flight instances backed by Oracle SQL/PLSQL relational tables with transparent in-memory operational persistence.

---

## Architecture & Visual System

- **Design Theme**: Modern White & Blue Aviation Theme (`#F5F8FC` slate background, `#FFFFFF` high-contrast card/table containers, `#163A70` navy blue headers, `#2563EB` royal blue interactive accents, and `#E2E8F0` borders).
- **Typography**: Inter Sans-serif font stack with weights (400 regular, 500 metadata, 600 section subheaders, 700 titles).
- **Zero Heavy External UI Dependencies**: Engineered cleanly without installing Tailwind CSS or shadcn/ui overhead, adhering strictly to the existing React 18 + CSS Variables architecture.
- **Component Path**: `frontend/src/components/ui/ultra-quality-data-table.tsx` (with re-export at `UltraQualityDataTable.jsx` and styling at `UltraQualityDataTable.css`).

---

## Key Features

### 1. Telemetry Bar & Live Auto-Refresh
- **Radar Pulse Heartbeat**: Visual pulsing indicator confirming live telemetry connection.
- **Auto-Refresh Dropdown**: Configurable polling intervals (`15s`, `30s`, `60s`, or `Off`).
- **Manual Refresh Trigger**: Instant re-sync with spinning loader feedback.
- **Last Synced Timestamp**: Explicit timestamp showing exact client-server synchronization time.

### 2. Multi-Dimensional Search & Filtering
- **Fuzzy Global Search**: Instant filtering across flight numbers (`AI2014`), airline names (`Emirates`), IATA airport codes (`BOM`, `DFW`), destination cities (`London`, `Tokyo`), and terminals/gates (`T2-G01`).
- **Operational Status Filter**: Quick filtering by status:
  - `ALL`
  - `ON_TIME`
  - `DELAYED`
  - `BOARDING`
  - `IN_AIR`
  - `LANDED`
  - `CANCELLED`
  - `DIVERTED`
- **Airline Filter**: Dropdown dynamically populated from active carriers (e.g., Air India, Emirates, Lufthansa, British Airways, Delta).
- **Airport Hub Filter**: Filter by primary departure/arrival stations (`BOM`, `DEL`, `JFK`, `LHR`, `DFW`, `SFO`).
- **Movement Quick Pills**: One-click pills for `All Flights`, `Departures Only`, `Arrivals Only`, `Delayed Movements` (with dynamic counter badge), and `Boarding Active`.
- **Role Scoping ("My Airline Only")**: Available for `AIRLINE_STAFF` to quickly isolate their carrier's fleet.

### 3. Server & Client Sorting & Pagination
- **Multi-Column Sorting**: Bi-directional sort on Flight Number, Airline, Origin, Destination, Scheduled Departure, Estimated Departure, Scheduled Arrival, Estimated Arrival, and Status.
- **Configurable Pagination**: Page sizes of `5`, `10`, `20`, and `50` records with full pagination controls (First, Previous, Page Index, Next, Last) and current record range indicator.

### 4. Dynamic Flight Countdowns & Operational Advisories
- **Dynamic Countdowns**: Real-time minute-by-minute calculations (`In ~25 mins`, `In ~2h 15m`, `Just departed / arrived`).
- **Dynamic Operational Messages**:
  - `ON_TIME` &rarr; *"On schedule — Gate open for check-in"*
  - `DELAYED` &rarr; *"Delayed by +X mins — Revised departure at HH:MM"*
  - `BOARDING` &rarr; *"Active Boarding — Final call at Gate G0X"*
  - `GATE_CLOSED` &rarr; *"Gate closed — Aircraft pushback imminent"*
  - `IN_AIR` &rarr; *"Cruising en route — Approaching destination"*
  - `LANDED` &rarr; *"Touchdown confirmed — Taxiing to gate"*
  - `CANCELLED` &rarr; *"Flight cancelled — Contact airline support desk"*

### 5. Interactive Flight Telemetry Modal
- **Visual Corridor**: Non-stop transit corridor visual between origin and destination IATA nodes.
- **4-Quadrant Timing Grid**: Side-by-side comparison of Scheduled Departure, Estimated/Actual Departure, Scheduled Arrival, and Estimated/Actual Arrival with timezone annotations.
- **Logistics & Aircraft Metadata**: Aerobridge Gate, Aircraft Equipment Model (e.g., Boeing 777-300ER, Airbus A350-900), Registration Tail Number (e.g., VT-ANX), and Arrival Baggage Reclaim Carousel.
- **Role-Based Action**: Direct ticket reservation button (`Reserve Flight`) for passenger sessions.

---

## Role-Based Integration Summary

| Station Role | Integration Location | Primary Use Case |
|---|---|---|
| **ADMIN** | `/admin/flights` tab | Complete airport-wide flight oversight, delay monitoring, and terminal logistics. |
| **AIRLINE_STAFF** | `/airline/flights` tab | Fleet dispatch, turnaround monitoring, airline scoping, and schedule status updates. |
| **AIRPORT_STAFF** | `/airport/flights` tab | Gate assignments, runway queues, baggage intake coordination, and ground turnaround. |
| **PASSENGER** | `/passenger/search` tab | Flight search, live delay tracking, terminal gate directions, and one-click flight booking. |
