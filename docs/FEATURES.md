# Feature Specifications: Airport Management System

## Table of Contents
- [1. Feature Status Legend](#1-feature-status-legend)
- [2. System Feature Matrix](#2-system-feature-matrix)
- [3. Detailed Module Specifications](#3-detailed-module-specifications)
  - [3.1 Flight Operations Management](#31-flight-operations-management)
  - [3.2 Passenger Management](#32-passenger-management)
  - [3.3 Ticket Booking & Check-in](#33-ticket-booking--check-in)
  - [3.4 Baggage Management](#34-baggage-management)
  - [3.5 Airport Resource & Gate Management](#35-airport-resource--gate-management)
  - [3.6 Employee & Shift Management](#36-employee--shift-management)
  - [3.7 Notification & Event Management](#37-notification--event-management)
  - [3.8 Autonomous Airport Data Engine](#38-autonomous-airport-data-engine)
  - [3.9 Analytics & Reporting](#39-analytics--reporting)
- [4. Verification of Implemented Functionality](#4-verification-of-implemented-functionality)

---

## 1. Feature Status Legend

To ensure complete clarity regarding project maturity, every feature is assigned an explicit status:

- 🟢 **Implemented**: Fully written, defined, and verified in the existing codebase ([`AIRPORT_MANAGEMENT_SYSTEM(FINAL).sql`](../AIRPORT_MANAGEMENT_SYSTEM(FINAL).sql)).
- 🟡 **Partially Implemented / Foundational**: Underlying schema, triggers, or primitives exist in SQL, but application-tier orchestration or frontend integration is planned.
- ⚪ **Planned**: Documented in architectural specifications and slated for implementation in future roadmap phases.

---

## 2. System Feature Matrix

| Functional Module | Capability | Implementation Status | Technical Foundation |
| :--- | :--- | :--- | :--- |
| **Flight Operations** | Flight timetable definition & status tracking | 🟢 **Implemented** | `FLIGHT` table, status columns (`On-time`, `Delayed`) |
| **Flight Operations** | Dynamic flight filtering by operational status | 🟢 **Implemented** | `FLIGHTSBYSTATUS` stored procedure |
| **Flight Operations** | Live flight radar & real-time board UI | ⚪ **Planned** | React.js flight board & WebSocket stream |
| **Passenger Management** | 3NF Decomposed passenger manifest storage | 🟢 **Implemented** | `PASSENGER1`, `PASSENGER2`, `PASSENGER3` tables |
| **Passenger Management** | Passport verification and demographic profiling | 🟢 **Implemented** | `PASSENGER2` table |
| **Passenger Management** | Passenger mobile check-in app | ⚪ **Planned** | React.js / mobile responsive portal |
| **Ticketing & Booking** | Multi-class ticket reservations (Economy, Business, First) | 🟢 **Implemented** | `TICKET1`, `TICKET2` tables |
| **Ticketing & Booking** | Dynamic fare lookup by route, date, and cabin class | 🟢 **Implemented** | `TICKET2` composite primary key table |
| **Ticketing & Booking** | Cancellation penalty calculation | 🟢 **Implemented** | `TICKET3` surcharge table |
| **Ticketing & Booking** | Historical fare modification auditing | 🟢 **Implemented** | `TICKET_PRICE_HISTORY` table & trigger |
| **Ticketing & Booking** | Concurrency-safe interactive seat selection | ⚪ **Planned** | Java transaction manager & React seat canvas |
| **Baggage Management** | Baggage tag generation & weight tracking | ⚪ **Planned** | Planned `BAGGAGE` relational table |
| **Baggage Management** | Automated DAG conveyor routing algorithms | ⚪ **Planned** | C algorithm engine |
| **Resource Management** | Airport facility & carrier relationship tracking | 🟢 **Implemented** | `AIRPORT`, `AIRLINE`, `CONTAINS` tables |
| **Resource Management** | Graph-based gate allocation & runway queue scheduling | ⚪ **Planned** | C bipartite graph algorithm |
| **Employee Management** | Multi-discipline staff rosters (Support, Engineers, Monitors, Authority) | 🟢 **Implemented** | `EMPLOYEE1`, `EMPLOYEE2` tables |
| **Employee Management** | Shift assignment (Day / Night) & airport allocation | 🟢 **Implemented** | `EMPLOYEE1` table (`SHIFT`, `AP_NAME`) |
| **Employee Management** | Staff-to-passenger service assignment | 🟢 **Implemented** | `SERVES` relation |
| **Employee Management** | Automated role-based salary increment calculations | 🟢 **Implemented** | `UPDATEDSalary` trigger |
| **Event Management** | Automatic logging of delayed flights with timestamps | 🟢 **Implemented** | `DELAYEDFLIGHTS` trigger & `DELAYED_FLIGHTS` audit table |
| **Event Management** | Push notification alerts to passenger devices | ⚪ **Planned** | Node.js push event service |
| **Autonomous Engine** | Database invariant & referential integrity enforcement | 🟢 **Implemented** | Oracle foreign keys with cascading delete rules |
| **Autonomous Engine** | Flight delay anomaly capture | 🟢 **Implemented** | `DELAYEDFLIGHTS` trigger |
| **Autonomous Engine** | Real-time conflict detection daemon (Gate / Runway) | ⚪ **Planned** | Autonomous Airport Data Engine background daemon |
| **Autonomous Engine** | Approval-based automated operational intervention | ⚪ **Planned** | Autonomous Airport Data Engine resolution queue |
| **Analytics & Reporting** | Specific route manifest queries (e.g. DFW Economy) | 🟢 **Implemented** | `DFWECONOMYPASSENGERS` stored procedure |
| **Analytics & Reporting** | Visual KPI charts (On-time performance, revenue) | ⚪ **Planned** | React dashboard charting library |

---

## 3. Detailed Module Specifications

### 3.1 Flight Operations Management
- **Implemented Components**:
  - Relational modeling of flights (`FLIGHT` table) capturing origin, destination, arrival, departure, stops, layovers, duration, flight type, and carrier ID.
  - Stored procedure `FLIGHTSBYSTATUS(IN_STATUS)` allowing operators to execute dynamic cursor queries filtering flights by current status.
- **Planned Components**:
  - Live flight control radar dashboard rendered via React.
  - WebSockets integration for instantaneous push notifications of departure delays.

### 3.2 Passenger Management
- **Implemented Components**:
  - Normalized 3NF decomposition separating identity mappings (`PASSENGER1`), demographic attributes (`PASSENGER2`), and flight itineraries (`PASSENGER3`).
  - Strict data constraints ensuring no traveler can be booked on non-existent flights.
- **Planned Components**:
  - Self-service passenger check-in interface with passport scanner validation and digital boarding pass generation.

### 3.3 Ticket Booking & Check-in
- **Implemented Components**:
  - Complete multi-class seat modeling across Economy, Business, and First-Class.
  - Route- and date-specific dynamic pricing stored in `TICKET2`.
  - Cancellation surcharge schedule stored in `TICKET3`.
  - Trigger-driven financial audit logging: when ticket fares in `TICKET2` are modified, the preceding price is automatically preserved in `TICKET_PRICE_HISTORY`.
- **Planned Components**:
  - Interactive seat selector component in React.js.
  - Concurrency management in Java ensuring no double-booking occurs during simultaneous reservation requests.

### 3.4 Baggage Management
- **Implemented Components**: None (Domain currently not represented in existing SQL files).
- **Planned Components**:
  - Planned schema: `BAGGAGE(BAG_ID, PID, FLIGHT_CODE, WEIGHT, STATUS, CAROUSEL_NO)`.
  - Algorithmic luggage routing utilizing C-based shortest path algorithms to minimize transfer times between connecting flights.

### 3.5 Airport Resource & Gate Management
- **Implemented Components**:
  - Relational mapping connecting airlines to authorized airport terminals via the `CONTAINS` table.
- **Planned Components**:
  - Terminal gate and runway scheduling engine written in C to compute collision-free gate assignments.
  - Interactive visual gate management board in React.

### 3.6 Employee & Shift Management
- **Implemented Components**:
  - Staff modeling via `EMPLOYEE1` covering job titles, shift timings (`DAY`/`NIGHT`), and airport facility locations.
  - Role-to-salary mapping in `EMPLOYEE2`.
  - Cross-functional passenger service tracking via `SERVES`.
  - Database trigger `UPDATEDSalary` applying automated salary adjustments based on job classification.
- **Planned Components**:
  - Employee shift scheduling portal with clock-in/clock-out tracking and overtime payroll calculation.

### 3.7 Notification & Event Management
- **Implemented Components**:
  - Database trigger `DELAYEDFLIGHTS` autonomously intercepting flight delay updates and persisting them with timestamps in `DELAYED_FLIGHTS`.
- **Planned Components**:
  - Real-time notification broadcaster using Redis Pub/Sub and WebSockets to alert gate agents and travelers.

### 3.8 Autonomous Airport Data Engine
- **Implemented Components**:
  - Database-native automated triggers capturing flight delays and ticket fare changes.
  - Relational cascading deletes (`ON DELETE CASCADE`) preventing orphan records across all operational tables.
- **Planned Components**:
  - Autonomous background daemon inspecting table state continuously.
  - Anomaly detection algorithms flagging double-bookings or gate allocation overlaps.
  - Semi-autonomous operator workflow recommending corrective actions for user approval.

### 3.9 Analytics & Reporting
- **Implemented Components**:
  - Stored procedure `DFWECONOMYPASSENGERS` generating consolidated manifest reports for specific flights and destinations.
- **Planned Components**:
  - On-Time Performance (OTP) analytics dashboard.
  - Route profitability and cancellation revenue reporting.

---

## 4. Verification of Implemented Functionality

To independently verify the implemented database features, execute the following commands in an Oracle SQL environment connected to the database:

```sql
-- 1. Test Stored Procedure: Economy Passengers to DFW
SET SERVEROUTPUT ON;
EXEC DFWECONOMYPASSENGERS();

-- 2. Test Stored Procedure: Filter Flights by Status
SET SERVEROUTPUT ON;
EXEC FLIGHTSBYSTATUS('Delayed');
EXEC FLIGHTSBYSTATUS('On-time');

-- 3. Verify Autonomous Price History Trigger
UPDATE TICKET2
SET PRICE = 150000
WHERE DATE_OF_BOOKING = '11-NOV-16' AND SOURCE = 'BOM' AND DESTINATION = 'DFW' AND CLASS = 'ECONOMY';

-- Query the audit table to confirm the old price was logged
SELECT * FROM TICKET_PRICE_HISTORY;

-- 4. Verify Delayed Flight Trigger
INSERT INTO FLIGHT (FLIGHT_CODE, SOURCE, DESTINATION, ARRIVAL, DEPARTURE, STATUS, DURATION, FLIGHTTYPE, LAYOVER_TIME, NO_OF_STOPS, AIRLINEID)
VALUES ('AI127', 'BOM', 'DFW', '02:10', '03:15', 'Delayed', '24hr', 'Connecting', 3, 1, 'AI');

-- Query the delayed flights audit table
SELECT * FROM DELAYED_FLIGHTS;
```
