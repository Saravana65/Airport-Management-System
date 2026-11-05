# Relational Database Schema & Transaction Validation Report

**Project:** Airport Management System  
**Phase:** Phase 11 — Database Validation  
**Database Engine:** Oracle Database XE (PDB: `XEPDB1`)  
**Schema Architecture:** 16 Relational Tables in Third Normal Form (3NF)  
**Schema DDL Files:** `database/schema/01_airport_tables.sql` through `11_aade_tables.sql`

---

## 1. Relational Integrity & Schema Normalization

The database architecture is designed in strict **Third Normal Form (3NF)** to eliminate data redundancy, prevent update anomalies, and enforce atomic transaction integrity.

### 1.1 Normalized Relational Entities (16 Tables)

```
[ AIRPORTS ] ◄──────────┐ (fk_flights_origin, fk_flights_dest)
   ▲                    │
   │ (fk_gates_airport) │
[ GATES ]               │
   ▲                    │
   │ (fk_instance_gate) │
   │                    ▼
[ FLIGHT_INSTANCES ] ◄──[ FLIGHTS ] ◄── [ AIRLINES ]
   ▲        ▲                              ▲
   │        │                              │ (fk_aircraft_airline)
   │        │                              ▼
   │        │                         [ AIRCRAFT ]
   │        │                              ▲
   │        │ (fk_instance_aircraft)       │
   │        └──────────────────────────────┘
   ▼
[ TICKETS ] ◄── [ BOOKINGS ] ◄── [ USERS ]
   ▲                                 ▲
   │ (fk_tickets_passenger)          │ (fk_passengers_user)
   ▼                                 ▼
[ PASSENGERS ]                 [ EMPLOYEES ]
   ▲
   │ (fk_checkin_ticket)
   ▼
[ CHECK_IN ] & [ BAGGAGE ]
```

---

## 2. Integrity Constraint Matrix

| Constraint Name | Target Table | Type | Enforcement Description |
| :--- | :--- | :---: | :--- |
| `pk_airports` | `AIRPORTS` | Primary Key | Enforces 3-letter uppercase IATA code uniqueness (e.g. `DEL`, `BOM`). |
| `pk_airlines` | `AIRLINES` | Primary Key | Enforces 2-letter carrier code uniqueness (e.g. `AI`, `BA`, `EK`). |
| `pk_bookings` | `BOOKINGS` | Primary Key | Unique numeric sequence identifier for each commercial reservation. |
| `uq_booking_ref` | `BOOKINGS` | Unique Key | Enforces global uniqueness of 6-character alphanumeric PNR codes. |
| `uq_ticket_number`| `TICKETS` | Unique Key | Enforces standard 13-digit e-ticket number uniqueness. |
| **`uq_flight_seat`** | `TICKETS` | **Composite Unique Key** | **Guarantees no two active tickets on the same `FLIGHT_INSTANCE_ID` can hold the same `SEAT_NUMBER`.** |
| `uq_aade_alert_hash`| `AADE_ALERTS` | Unique Key | Cryptographic SHA-256 hash key preventing duplicate alert generation across monitoring cycles. |
| `fk_tickets_booking`| `TICKETS` | Foreign Key | Links ticket to parent booking with `ON DELETE CASCADE`. |
| `fk_tickets_instance`| `TICKETS` | Foreign Key | Links ticket to scheduled flight instance with `ON DELETE CASCADE`. |
| `fk_tickets_passenger`| `TICKETS` | Foreign Key | Links ticket to traveler profile with `ON DELETE CASCADE`. |
| `chk_booking_status`| `BOOKINGS` | Check Constraint| Validates status in `('CONFIRMED', 'CANCELLED', 'REFUNDED')`. |
| `chk_ticket_class` | `TICKETS` | Check Constraint| Validates cabin class in `('ECONOMY', 'BUSINESS', 'FIRST')`. |
| `chk_ticket_status`| `TICKETS` | Check Constraint| Validates ticket status in `('ISSUED', 'CHECKED_IN', 'BOARDED', 'CANCELLED')`. |
| `chk_gate_status` | `GATES` | Check Constraint| Validates status in `('AVAILABLE', 'OCCUPIED', 'MAINTENANCE')`. |

---

## 3. Transaction ACID Validation

1. **Atomic Booking Creation:**
   - Evaluated via `POST /api/bookings`.
   - Checks aircraft seat capacity $\to$ checks duplicate seat conflict on target flight instance $\to$ generates unique PNR $\to$ issues tickets.
   - If a seat conflict or capacity limit is detected, the operation aborts atomically and returns HTTP 409 without creating orphan records.
2. **Transaction-Safe Booking Cancellation:**
   - Evaluated via `PATCH /api/bookings/:id/cancel`.
   - Transitions booking status to `CANCELLED` and atomically frees up all associated seats (`seatNumber = null`, `status = 'CANCELLED'`).
3. **Transaction Rollback on Error:**
   - In `database.service.js`, `executeTransaction` automatically issues `await connection.rollback()` whenever an error is encountered during multi-statement operations, ensuring consistent database state.
