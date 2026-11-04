# Autonomous Airport Data Engine (AADE): Monitoring Rules & Invariants

## Overview

AADE continuously evaluates operational invariants across five categories:
1. Database Connectivity & Pool Health
2. Relational Foreign Key Integrity
3. Ticketing Invariants & Duplicate Bookings
4. Airside Scheduling & Gate Conflict Rules
5. Resource Velocity & Baggage Logistics Bottlenecks

---

## 1. Rule Catalog

### Rule AADE-01: Overlapping Gate Allocation Conflict
- **Category:** Airside Scheduling
- **Condition:** Two active flight instances $F_1$ and $F_2$ are assigned to the same `departureGateId` (or `arrivalGateId`) where:
  $$|\text{ScheduledTime}(F_1) - \text{ScheduledTime}(F_2)| < 30\text{ minutes}$$
- **Severity:** `CRITICAL`
- **Why It Matters:** Two wide-body or narrow-body aircraft cannot occupy the same physical aerobridge or remote stand concurrently. A conflict leads to tarmac gridlock and safety hazards.
- **Engine Action:**
  1. Generates `AADE_ALERT` (hash-deduplicated).
  2. Queries `GATES` for an unoccupied stand in the same airport/terminal.
  3. Formulates a recommendation: *"Reassign Flight $F_2$ to Gate [Target]"*.
  4. Enqueues proposal into Human Approval Queue.

---

### Rule AADE-02: Stand in Maintenance Allocation
- **Category:** Facility Management
- **Condition:** An active flight instance is assigned to a gate whose status is `'MAINTENANCE'` or `'CLOSED'`.
- **Severity:** `CRITICAL`
- **Why It Matters:** Passengers cannot board and jet bridges cannot deploy when stands are undergoing civil maintenance or electrical repairs.
- **Engine Action:**
  1. Issues `CRITICAL` alert.
  2. Identifies open alternative gate.
  3. Recommends immediate stand reallocation.

---

### Rule AADE-03: Duplicate Seat Allocation Collision
- **Category:** Ticketing Invariants
- **Condition:** Multiple active (status $\neq$ `'CANCELLED'`) tickets on the same `flightInstanceId` claim the identical `seatNumber` (e.g. two tickets for Seat `14A` on Flight `AI-2014`).
- **Severity:** `CRITICAL`
- **Why It Matters:** Dual passenger seat allocations cause boarding denial and customer disputes at the aircraft door.
- **Engine Action:**
  1. Flags dual ticket collision.
  2. Identifies unallocated seat in the same cabin class.
  3. Recommends reassigning secondary ticket to candidate seat.

---

### Rule AADE-04: Duplicate PNR Reference Collision
- **Category:** Reservation Invariants
- **Condition:** The same 6-character alphanumeric booking reference (`bookingReference`) exists across more than one `BOOKINGS` record.
- **Severity:** `CRITICAL`
- **Why It Matters:** PNRs must be globally unique per airline industry IATA reservation standards.
- **Engine Action:**
  1. Emits `CRITICAL` alert for operator investigation.

---

### Rule AADE-05: Orphaned Ticket Invariant
- **Category:** Relational Integrity
- **Condition:** A `TICKETS` row holds a `bookingId` that does not exist in `BOOKINGS`.
- **Severity:** `CRITICAL`
- **Why It Matters:** Violates 3NF referential integrity and produces unbilled passenger journeys.
- **Engine Action:**
  1. Emits relational integrity alert.
  2. Non-destructive: Does not auto-delete records; flags for database administrator reconciliation.

---

### Rule AADE-06: Orphaned Baggage Barcode Tag
- **Category:** Relational Integrity
- **Condition:** A `BAGGAGE` row holds a `ticketId` that does not exist in `TICKETS`.
- **Severity:** `CRITICAL`
- **Why It Matters:** Unclaimed or unlinked luggage represents a critical aviation security risk.
- **Engine Action:**
  1. Emits security integrity alert for baggage supervisor.

---

### Rule AADE-07: Unrecorded Operational Flight Delay
- **Category:** Airside Operations
- **Condition:** A flight instance status remains `'SCHEDULED'`, but current wall-clock time exceeds scheduled departure time by $>45\text{ minutes}$.
- **Severity:** `WARNING`
- **Why It Matters:** Keeping an overdue flight as `SCHEDULED` misleads passengers and distorts terminal gate availability.
- **Engine Action:**
  1. Emits operational warning.
  2. Proposes status update to `'DELAYED'` with passenger notifications.

---

### Rule AADE-08: Baggage Screening Stalled Bottleneck
- **Category:** Logistics Velocity
- **Condition:** Checked baggage units remain in `'CHECKED_IN'` state without advancing to `'SECURITY_CLEARED'` for $>45\text{ minutes}$ prior to scheduled flight departure.
- **Severity:** `WARNING`
- **Why It Matters:** Lingering bags cause flight departure delays or offloaded luggage claims.
- **Engine Action:**
  1. Flags conveyor bottleneck for ramp personnel.

---

## 2. Alert Deduplication Engine

To eliminate repeated notifications for unresolved issues during scheduled sweeps, AADE computes a deterministic composite hash:

$$\text{hashKey} = \text{MD5}(\text{alertType} + \text{":"} + \text{entityType} + \text{":"} + \text{entityId})$$

- If an alert with this `hashKey` has status `'ACTIVE'`, AADE updates `occurrenceCount = occurrenceCount + 1` and `lastDetectedAt = NOW()`.
- No duplicate alert records are created.
- When an operator clicks **Resolve** or executes an approved recommendation, the alert transitions to `'RESOLVED'`.
