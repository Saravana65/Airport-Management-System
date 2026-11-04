# Airport Operations Modules Specification (Phase 07)

## Overview

The Airport Management System (AMS) is designed as a modular, 3-tier full-stack application connecting a **React.js + Vite** single-page application frontend, an **Express.js / Node.js** REST API backend, and an **Oracle SQL (16-table 3NF schema)** relational database engine.

Phase 07 realizes the operational core of the system across eight dedicated business modules, enforcing role-based permissions, transaction safety, data integrity, and privacy standards.

---

## 1. Module 1: Airport, Airline & Aircraft Management

### Purpose
Provides comprehensive authority management for international airport facilities, commercial airline partners, and aircraft fleet inventories.

### Database Tables
- `AIRPORTS`: `AIRPORT_CODE` (PK, CHAR(3)), `AIRPORT_NAME`, `CITY`, `COUNTRY`, `TIMEZONE`
- `AIRLINES`: `AIRLINE_ID` (PK), `AIRLINE_CODE` (UNIQUE, CHAR(2)), `AIRLINE_NAME`, `THREE_DIGIT_CODE`, `COUNTRY`, `CONTACT_EMAIL`
- `AIRCRAFTS`: `AIRCRAFT_ID` (PK), `REGISTRATION_NO` (UNIQUE), `MODEL`, `AIRLINE_ID` (FK), `TOTAL_SEATS`, `ECONOMY_SEATS`, `BUSINESS_SEATS`, `FIRST_SEATS`, `STATUS`

### Business Logic & Validations
- IATA 3-character uppercase airport codes (e.g. `BOM`, `DEL`, `JFK`, `LHR`).
- Airline 2-character IATA codes (e.g. `AI`, `AA`, `BA`, `EK`).
- Aircraft fleet seating validation: `totalSeats` must strictly equal `economySeats + businessSeats + firstSeats`.
- Aircraft registration uniqueness validation.

### API Endpoints
- `GET /api/airports` (Authenticated) — List all operational airport hubs.
- `POST /api/airports` (`ADMIN`) — Register new international airport.
- `GET /api/airlines` (Authenticated) — List commercial partner airlines.
- `POST /api/airlines` (`ADMIN`) — Register certified airline partner.
- `GET /api/aircraft` (Authenticated) — List fleet aircraft records.
- `POST /api/aircraft` (`ADMIN`, `AIRLINE_STAFF`) — Register jet airliner with seating tier breakdown.

---

## 2. Module 2: Flight Schedule & Status Management

### Purpose
Governs master flight routes, scheduled daily flight movement instances, real-time dispatch state transitions, and audit telemetry.

### Database Tables
- `FLIGHTS`: Master routes (`FLIGHT_NUMBER` PK, `AIRLINE_ID` FK, `ORIGIN_AIRPORT_ID` FK, `DEST_AIRPORT_ID` FK, `SCHEDULED_DEPARTURE_TIME`, `SCHEDULED_ARRIVAL_TIME`, `BASE_FARE`)
- `FLIGHT_INSTANCES`: Daily operational rotations (`FLIGHT_INSTANCE_ID` PK, `FLIGHT_ID` FK, `FLIGHT_DATE`, `AIRCRAFT_ID` FK, `STATUS`, `GATE_ID` FK)
- `FLIGHT_STATUS_HISTORY`: Audit log (`HISTORY_ID` PK, `FLIGHT_INSTANCE_ID` FK, `PREVIOUS_STATUS`, `NEW_STATUS`, `CHANGED_AT`, `REMARKS`)

### Business Logic & Validations
- Route validation: `originAirport` and `destAirport` cannot be identical (400 Bad Request).
- State Transition Machine:
  - Allowed transitions: `SCHEDULED` -> `BOARDING` -> `DEPARTED` -> `ARRIVED`.
  - Disruption transitions: Any active flight may transition to `DELAYED` or `CANCELLED`.
- Status history logging: Every transition writes to `FLIGHT_STATUS_HISTORY` with timestamp, previous state, new state, and dispatcher remarks.

### API Endpoints
- `GET /api/flights` (Authenticated) — Search/filter flight movements by origin, destination, and date.
- `GET /api/flights/:id` (Authenticated) — Retrieve detailed flight instance with route and aircraft specs.
- `POST /api/flights` (`ADMIN`, `AIRLINE_STAFF`) — Schedule new commercial route.
- `PATCH /api/flights/:id/status` (`ADMIN`, `AIRLINE_STAFF`, `AIRPORT_STAFF`) — Update dispatch status with reason.

---

## 3. Module 3: Passenger Profile & Privacy Management

### Purpose
Maintains traveler identification records, passport verification, contact data, and regulatory privacy compliance.

### Database Tables
- `PASSENGERS`: `PASSENGER_ID` (PK), `USER_ID` (FK, UNIQUE), `FIRST_NAME`, `LAST_NAME`, `PASSPORT_NUMBER` (UNIQUE), `PHONE`, `EMAIL`, `DATE_OF_BIRTH`, `GENDER`, `CREATED_AT`

### Business Logic & Validations
- Passport uniqueness: No two traveler profiles can share the same passport number.
- Data privacy masking: All non-admin endpoints mask passport identifiers (e.g. `K9812401` -> `K9****01`) to protect PII according to aviation data privacy guidelines.
- Passenger ownership: Normal passenger users can only access their own profile (`/api/passengers/me`).

### API Endpoints
- `GET /api/passengers` (`ADMIN`, `AIRLINE_STAFF`) — List passenger manifests with masked passport numbers.
- `GET /api/passengers/me` (`PASSENGER`) — Retrieve personal passenger profile.
- `POST /api/passengers` (Authenticated) — Register or link passenger traveler profile.

---

## 4. Module 4: Booking & Ticket Management

### Purpose
Executes transaction-safe flight reservations, unique 6-character PNR generation, duplicate seat prevention, payment simulation, and cancellation rollback.

### Database Tables
- `BOOKINGS`: `BOOKING_ID` (PK), `BOOKING_REFERENCE` (UNIQUE, VARCHAR2(6)), `USER_ID` (FK), `BOOKING_DATE`, `TOTAL_AMOUNT`, `STATUS`, `PAYMENT_STATUS`
- `TICKETS`: `TICKET_ID` (PK), `TICKET_NUMBER` (UNIQUE, VARCHAR2(13)), `BOOKING_ID` (FK), `PASSENGER_ID` (FK), `FLIGHT_INSTANCE_ID` (FK), `CABIN_CLASS`, `SEAT_NUMBER`, `PRICE`, `STATUS`

### Business Logic & Validations
- PNR Generation: Cryptographically randomized 6-character alphanumeric code excluding ambiguous characters (e.g. `AI984X`).
- Duplicate Seat Prevention: Queries active tickets for `flightInstanceId` and `seatNumber`. Rejects collisions with `409 Conflict`.
- Overbooking Prevention: Verifies total booked tickets against aircraft seating capacity.
- Fare Multipliers: Automatically computes total ticket price based on cabin class (Economy = 1.0x, Business = 2.5x, First = 4.0x).
- Reservation Cancellation: Releases allocated seat (`ticket.status = 'CANCELLED'`) and updates booking status to `CANCELLED`.
- Passenger Ownership Protection: Travelers cannot inspect or cancel other passengers' reservations (403 Forbidden).

### API Endpoints
- `GET /api/bookings` (Authenticated) — Retrieve bookings (filtered to caller's ownership or carrier scope).
- `GET /api/bookings/:id` (Authenticated) — Get detailed booking with ticket and passenger breakdown.
- `POST /api/bookings` (Authenticated) — Atomically reserve flight, allocate seat, and issue e-ticket.
- `PATCH /api/bookings/:id/cancel` (Authenticated) — Cancel booking and rollback seat allocation.

---

## 5. Module 5: Check-in Operations & Boarding Passes

### Purpose
Performs online and desk check-in verification, generates official boarding passes with alphanumeric codes, and updates ticket status.

### Database Tables
- `CHECK_IN`: `CHECK_IN_ID` (PK), `TICKET_ID` (FK, UNIQUE), `CHECK_IN_TIME`, `BOARDING_PASS_NUMBER` (UNIQUE), `BAGGAGE_COUNT`, `SEAT_NUMBER`, `GATE_ID` (FK)

### Business Logic & Validations
- Eligibility: Only tickets with status `ISSUED` and confirmed bookings may be checked in.
- Duplicate Check-in Prevention: If ticket already possesses a check-in record, returns `409 Conflict`.
- Boarding Pass Generation: Emits unique code format `BP-{FLIGHT}-{SEAT}-{RANDOM}` (e.g. `BP-AI2014-12A-5661`).
- Lifecycle sync: Updates ticket status from `ISSUED` to `CHECKED_IN`.

### API Endpoints
- `GET /api/checkin/eligible` (Authenticated) — Retrieve tickets awaiting check-in for the caller.
- `GET /api/checkin` (`ADMIN`, `AIRPORT_STAFF`, `AIRLINE_STAFF`) — Overview of all issued check-ins.
- `POST /api/checkin` (Authenticated) — Process passenger check-in and issue boarding pass.

---

## 6. Module 6: Baggage Management & Conveyance Tracking

### Purpose
Administers checked luggage intake, unique barcode generation, weight limit enforcement, security clearance progression, and claim carousel routing.

### Database Tables
- `BAGGAGE`: `BAGGAGE_ID` (PK), `TICKET_ID` (FK), `TAG_NUMBER` (UNIQUE, VARCHAR2(20)), `WEIGHT_KG`, `STATUS`, `CLAIM_CAROUSEL`, `CREATED_AT`

### Business Logic & Validations
- Barcode Format: Formats unique tracking tag `BAG-{CARRIER}-{RANDOM5}` (e.g. `BAG-AI-48192`).
- Weight Boundary Enforcement: Validates baggage weight between `0.1 kg` and `60.0 kg`. Rejects values exceeding `60.0 kg` with `400 Bad Request`.
- Status Pipeline:
  - `REGISTERED` -> `CHECKED_IN` -> `SECURITY_CLEARED` -> `LOADED` -> `IN_TRANSIT` -> `CLAIM_READY` -> `COLLECTED`.
- Ground Staff Progression: Airport staff can advance status along conveyor belt stages.

### API Endpoints
- `GET /api/baggage` (Authenticated) — List baggage units (filtered to passenger or all for staff).
- `GET /api/baggage/:tagNumber` (Authenticated) — Track specific bag by barcode tag.
- `POST /api/baggage` (`ADMIN`, `AIRPORT_STAFF`, `AIRLINE_STAFF`) — Register and tag luggage unit.
- `PATCH /api/baggage/:id/status` (`ADMIN`, `AIRPORT_STAFF`) — Update logistics routing status.

---

## 7. Module 7: Gate Management & Conflict Detection

### Purpose
Coordinates airport aerobridges, remote apron stands, and flight parking allocations while preventing overlapping gate occupancy conflicts.

### Database Tables
- `GATES`: `GATE_ID` (PK), `AIRPORT_ID` (FK), `TERMINAL`, `GATE_NUMBER`, `STATUS` (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`)
- `FLIGHT_INSTANCES`: Linked via `GATE_ID` foreign key.

### Business Logic & Validations
- Occupancy Conflict Engine: Checks whether the gate is currently assigned to another active flight whose departure/arrival interval overlaps.
- Rejects conflict with `409 Conflict: Gate is already allocated to flight [FLIGHT_NO]`.
- Frees gate when flight departs or arrives at destination.

### API Endpoints
- `GET /api/gates` (Authenticated) — Retrieve terminal gates with live occupancy telemetry.
- `POST /api/gates` (`ADMIN`, `AIRPORT_STAFF`) — Register new terminal gate or aerobridge stand.
- `POST /api/gates/assign` (`ADMIN`, `AIRPORT_STAFF`) — Assign gate to scheduled flight instance.

---

## 8. Module 8: Employee & Workforce Management

### Purpose
Maintains airport authority and airline operational workforce records, establishing a clear separation between login user roles and job titles.

### Database Tables
- `EMPLOYEES`: `EMPLOYEE_ID` (PK), `USER_ID` (FK, UNIQUE), `AIRPORT_ID` (FK), `AIRLINE_ID` (FK, NULLABLE), `JOB_TITLE`, `DEPARTMENT`, `SHIFT`, `FIRST_NAME`, `LAST_NAME`, `CONTACT_PHONE`, `HIRE_DATE`

### Business Logic & Validations
- Role vs Job Title Distinction:
  - System login roles: `ADMIN`, `AIRLINE_STAFF`, `AIRPORT_STAFF`, `PASSENGER`.
  - Operational job titles: `Air Traffic Dispatcher`, `Gate Operations Lead`, `Baggage Logistics Supervisor`, `Terminal Manager`, `Fleet Maintenance Engineer`.
- Airport or Airline Affiliation: Validates foreign key linkage to `AIRPORTS` or `AIRLINES`.
- Admin-Only Access: Employee workforce CRUD is strictly guarded by the `ADMIN` authorization gate.

### API Endpoints
- `GET /api/employees` (`ADMIN`) — List on-duty airport and airline workforce.
- `GET /api/employees/:id` (`ADMIN`) — Retrieve specific employee operational profile.
- `POST /api/employees` (`ADMIN`) — Register new operational staff member.
