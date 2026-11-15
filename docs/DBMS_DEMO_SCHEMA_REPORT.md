# DBMS Demonstration Schema Report

**Project**: Airport Management System  
**Evaluation**: College DBMS Project Review & Faculty Viva Defense  
**Auditor**: Senior Oracle DBA & DBMS Faculty Mentor  
**Schema Owner**: `airport_admin`  
**Target Engine**: Oracle Database 18c / 19c / 21c / XE  

---

## 1. Schema Inventory Overview

The production Airport Management System database schema contains **15 core operational relations**, **5 autonomous monitoring tables**, **4 analytical views**, **8 stored procedures**, and **5 database triggers**.

### Master Table Inventory

| # | Table Name | Category | Primary Key | Total Columns | Core Purpose |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **1** | `AIRPORTS` | Facility | `AIRPORT_CODE` (IATA) | 8 | International/domestic airport locations & timezones |
| **2** | `AIRLINES` | Fleet/Carrier | `AIRLINE_CODE` | 7 | Commercial air carriers & 3-digit accounting codes |
| **3** | `GATES` | Facility | `GATE_ID` (Identity) | 7 | Terminal boarding gates & aerobridge facilities |
| **4** | `AIRCRAFT` | Fleet | `AIRCRAFT_ID` (Identity) | 10 | Commercial aircraft tail registrations & seat maps |
| **5** | `FLIGHTS` | Timetable | `FLIGHT_NUMBER` | 10 | Master recurring flight routes & scheduled times |
| **6** | `FLIGHT_INSTANCES`| Operations | `FLIGHT_INSTANCE_ID` | 13 | Daily flight occurrences, real-time status & gates |
| **7** | `USERS` | Identity/Auth | `USER_ID` (Identity) | 6 | System login credentials & RBAC security roles |
| **8** | `PASSENGERS` | Demographics | `PASSENGER_ID` (Identity) | 10 | Traveler profiles & unique passport documentation |
| **9** | `EMPLOYEES` | Workforce | `EMPLOYEE_ID` (Identity) | 11 | Airport operations staff & airline personnel duties |
| **10**| `BOOKINGS` | Commercial | `BOOKING_ID` (Identity) | 7 | Passenger reservation records & 6-character PNRs |
| **11**| `TICKETS` | Commercial | `TICKET_ID` (Identity) | 10 | Individual e-tickets, seat numbers & cabin class |
| **12**| `CHECK_IN` | Passenger Ops | `CHECKIN_ID` (Identity) | 7 | Airport/web check-in, issued boarding passes |
| **13**| `BAGGAGE` | Ground Ops | `BAGGAGE_ID` (Identity) | 8 | Checked luggage RFID tracking & reclaim carousels |
| **14**| `FLIGHT_STATUS_HISTORY` | Audit | `HISTORY_ID` (Identity) | 7 | Chronological audit log of flight delay transitions |
| **15**| `OPERATIONAL_LOGS` | Engine Audit | `LOG_ID` (Identity) | 8 | Autonomous data engine events & operator actions |

---

## 2. Detailed Technical Breakdown of Important Tables

---

### 1. `AIRPORTS`
- **Purpose**: Defines master airport facilities worldwide. Identified by the internationally recognized 3-character IATA airport code.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `AIRPORT_CODE` | `VARCHAR2(3)` | **NO** | — | **PRIMARY KEY** (`pk_airports`), must be 3 uppercase letters |
  | `AIRPORT_NAME` | `VARCHAR2(100)`| **NO** | — | Official facility name (e.g., 'Chhatrapati Shivaji Maharaj') |
  | `CITY` | `VARCHAR2(50)` | **NO** | — | City location (e.g., 'Mumbai') |
  | `STATE` | `VARCHAR2(50)` | YES | NULL | State or province (e.g., 'Maharashtra') |
  | `COUNTRY` | `VARCHAR2(50)` | **NO** | — | Sovereign nation (e.g., 'India') |
  | `TIMEZONE` | `VARCHAR2(50)` | **NO** | `'UTC'` | IANA timezone string for ETA/ETD calculations |
  | `IS_ACTIVE` | `CHAR(1)` | **NO** | `'Y'` | CHECK constraint (`'Y'`, `'N'`) |
  | `CREATED_AT` | `TIMESTAMP` | **NO** | `SYSTIMESTAMP`| Audit creation timestamp |
- **Constraints**:
  - `pk_airports`: `PRIMARY KEY (AIRPORT_CODE)`
  - `chk_airport_code_format`: `CHECK (LENGTH(AIRPORT_CODE) = 3 AND AIRPORT_CODE = UPPER(AIRPORT_CODE))`
  - `chk_airports_active`: `CHECK (IS_ACTIVE IN ('Y', 'N'))`
- **Relationships**:
  - Referenced by `GATES.AIRPORT_CODE` (1:N)
  - Referenced by `FLIGHTS.ORIGIN_AIRPORT` (1:N)
  - Referenced by `FLIGHTS.DEST_AIRPORT` (1:N)
  - Referenced by `EMPLOYEES.AIRPORT_CODE` (1:N)
- **Sample Record**:
  `('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'Maharashtra', 'India', 'Asia/Kolkata', 'Y')`

---

### 2. `AIRLINES`
- **Purpose**: Catalogs commercial air carriers authorized to operate routes and dock aircraft.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `AIRLINE_CODE` | `VARCHAR2(3)` | **NO** | — | **PRIMARY KEY** (`pk_airlines`), 2–3 char IATA/ICAO code |
  | `AIRLINE_NAME` | `VARCHAR2(100)`| **NO** | — | Registered carrier name (e.g., 'Air India Limited') |
  | `THREE_DIGIT_CODE` | `VARCHAR2(3)` | YES | NULL | **UNIQUE** (`uq_airline_3digit`), numeric code (e.g., '098') |
  | `COUNTRY` | `VARCHAR2(50)` | **NO** | — | Country of airline incorporation |
  | `CONTACT_EMAIL`| `VARCHAR2(100)`| YES | NULL | Airline operations contact email |
  | `IS_ACTIVE` | `CHAR(1)` | **NO** | `'Y'` | CHECK constraint (`'Y'`, `'N'`) |
  | `CREATED_AT` | `TIMESTAMP` | **NO** | `SYSTIMESTAMP`| Audit creation timestamp |
- **Constraints**:
  - `pk_airlines`: `PRIMARY KEY (AIRLINE_CODE)`
  - `uq_airline_3digit`: `UNIQUE (THREE_DIGIT_CODE)`
- **Relationships**:
  - Referenced by `AIRCRAFT.AIRLINE_CODE` (1:N)
  - Referenced by `FLIGHTS.AIRLINE_CODE` (1:N)
  - Referenced by `EMPLOYEES.AIRLINE_CODE` (1:N)
- **Sample Record**:
  `('AI', 'Air India Limited', '098', 'India', 'support@airindia.in', 'Y')`

---

### 3. `GATES`
- **Purpose**: Represents physical terminal aerobridge gates at airports where aircraft dock for passenger boarding.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `GATE_ID` | `NUMBER` | **NO** | IDENTITY | **PRIMARY KEY** (`pk_gates`), auto-generated surrogate key |
  | `AIRPORT_CODE` | `VARCHAR2(3)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `AIRPORTS(AIRPORT_CODE)` |
  | `TERMINAL` | `VARCHAR2(10)` | **NO** | — | Terminal designation (e.g., 'T2', 'T3') |
  | `GATE_NUMBER` | `VARCHAR2(10)` | **NO** | — | Gate number within terminal (e.g., 'G01', 'A12') |
  | `STATUS` | `VARCHAR2(20)` | **NO** | `'AVAILABLE'`| CHECK: `'AVAILABLE'`, `'OCCUPIED'`, `'MAINTENANCE'` |
  | `IS_ACTIVE` | `CHAR(1)` | **NO** | `'Y'` | Operational flag |
  | `CREATED_AT` | `TIMESTAMP` | **NO** | `SYSTIMESTAMP`| Creation timestamp |
- **Constraints & Indexes**:
  - `uq_gate_location`: `UNIQUE (AIRPORT_CODE, TERMINAL, GATE_NUMBER)`
  - `fk_gates_airport`: `FOREIGN KEY (AIRPORT_CODE) REFERENCES AIRPORTS(AIRPORT_CODE) ON DELETE CASCADE`
  - `idx_gates_airport`: B-tree index on `(AIRPORT_CODE)`
- **Relationships**:
  - Referenced by `FLIGHT_INSTANCES.DEPARTURE_GATE_ID` (1:N)
  - Referenced by `FLIGHT_INSTANCES.ARRIVAL_GATE_ID` (1:N)
  - Referenced by `CHECK_IN.GATE_ID` (1:N)

---

### 4. `AIRCRAFT`
- **Purpose**: Stores individual aircraft in carrier fleets, tracking tail registration numbers and cabin seating capacities.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `AIRCRAFT_ID` | `NUMBER` | **NO** | IDENTITY | **PRIMARY KEY** (`pk_aircraft`) |
  | `REGISTRATION_NO`| `VARCHAR2(20)` | **NO** | — | **UNIQUE** (`uq_aircraft_reg`), tail code (e.g., 'VT-ANX') |
  | `MODEL` | `VARCHAR2(50)` | **NO** | — | Aircraft model (e.g., 'Boeing 777-300ER') |
  | `AIRLINE_CODE` | `VARCHAR2(3)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `AIRLINES(AIRLINE_CODE)` |
  | `TOTAL_SEATS` | `NUMBER` | **NO** | — | Total passenger capacity |
  | `ECONOMY_SEATS`| `NUMBER` | **NO** | `0` | Certified economy seats |
  | `BUSINESS_SEATS`| `NUMBER` | **NO** | `0` | Certified business seats |
  | `FIRST_SEATS` | `NUMBER` | **NO** | `0` | Certified first-class suites |
  | `STATUS` | `VARCHAR2(20)` | **NO** | `'ACTIVE'` | CHECK: `'ACTIVE'`, `'MAINTENANCE'`, `'RETIRED'` |
- **Critical Table Invariant Check Constraint**:
  - `chk_seat_sum`: `CHECK (TOTAL_SEATS = (ECONOMY_SEATS + BUSINESS_SEATS + FIRST_SEATS))`
  *(Enforces mathematical consistency across cabin classes at the database engine level)*

---

### 5. `FLIGHTS`
- **Purpose**: Stores master recurring flight schedules (timetable templates) operating between two distinct airports.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `FLIGHT_NUMBER` | `VARCHAR2(10)` | **NO** | — | **PRIMARY KEY** (`pk_flights`), e.g., 'AI2014' |
  | `AIRLINE_CODE` | `VARCHAR2(3)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `AIRLINES(AIRLINE_CODE)` |
  | `ORIGIN_AIRPORT`| `VARCHAR2(3)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `AIRPORTS(AIRPORT_CODE)` |
  | `DEST_AIRPORT` | `VARCHAR2(3)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `AIRPORTS(AIRPORT_CODE)` |
  | `SCHEDULED_DEPARTURE_TIME`| `VARCHAR2(5)`| **NO** | — | Scheduled departure time (`'HH24:MI'`) |
  | `SCHEDULED_ARRIVAL_TIME`| `VARCHAR2(5)`| **NO** | — | Scheduled arrival time (`'HH24:MI'`) |
  | `FLIGHT_TYPE` | `VARCHAR2(20)` | **NO** | `'DIRECT'` | CHECK: `'DIRECT'`, `'NON-STOP'`, `'CONNECTING'` |
  | `BASE_FARE` | `NUMBER(10,2)` | **NO** | `5000.00` | Baseline economy fare in currency |
- **Check Constraints**:
  - `chk_flight_diff_airports`: `CHECK (ORIGIN_AIRPORT != DEST_AIRPORT)` *(Prevents circular flights)*
- **Index**:
  - `idx_flights_route`: Composite index on `(ORIGIN_AIRPORT, DEST_AIRPORT)`

---

### 6. `FLIGHT_INSTANCES`
- **Purpose**: Physical flight movements occurring on specific calendar dates, capturing real-time operational status, delays, and gate assignments.
- **DDL Definition**:
  | Column Name | Data Type | Nullable | Default | Constraints / Description |
  | :--- | :--- | :---: | :---: | :--- |
  | `FLIGHT_INSTANCE_ID`| `NUMBER` | **NO** | IDENTITY | **PRIMARY KEY** (`pk_flight_instances`) |
  | `FLIGHT_NUMBER` | `VARCHAR2(10)` | **NO** | — | **FOREIGN KEY** $\rightarrow$ `FLIGHTS(FLIGHT_NUMBER)` |
  | `FLIGHT_DATE` | `DATE` | **NO** | — | Calendar flight operating date |
  | `AIRCRAFT_ID` | `NUMBER` | YES | NULL | **FOREIGN KEY** $\rightarrow$ `AIRCRAFT(AIRCRAFT_ID)` |
  | `DEPARTURE_GATE_ID`| `NUMBER` | YES | NULL | **FOREIGN KEY** $\rightarrow$ `GATES(GATE_ID)` |
  | `ARRIVAL_GATE_ID` | `NUMBER` | YES | NULL | **FOREIGN KEY** $\rightarrow$ `GATES(GATE_ID)` |
  | `SCHEDULED_DEPARTURE`| `TIMESTAMP`| **NO** | — | Departure timestamp |
  | `ACTUAL_DEPARTURE` | `TIMESTAMP`| YES | NULL | Actual wheel-off timestamp |
  | `SCHEDULED_ARRIVAL` | `TIMESTAMP`| **NO** | — | Arrival timestamp |
  | `ACTUAL_ARRIVAL` | `TIMESTAMP`| YES | NULL | Actual touchdown timestamp |
  | `STATUS` | `VARCHAR2(20)` | **NO** | `'SCHEDULED'`| CHECK: `'SCHEDULED'`, `'BOARDING'`, `'DEPARTED'`, `'ON_TIME'`, `'DELAYED'`, `'CANCELLED'`, `'ARRIVED'` |
- **Unique Constraint**:
  - `uq_flight_date`: `UNIQUE (FLIGHT_NUMBER, FLIGHT_DATE)` *(Ensures a flight operates at most once per calendar date)*

---

### 7. `BOOKINGS` & `TICKETS`
- **`BOOKINGS`**:
  - **PK**: `BOOKING_ID`
  - **Key Attributes**: `BOOKING_REFERENCE` (6-char alphanumeric PNR e.g. `'PNR8391'`), `USER_ID`, `TOTAL_AMOUNT`, `STATUS`.
  - **Foreign Key**: References `USERS(USER_ID)`.
- **`TICKETS`**:
  - **PK**: `TICKET_ID`
  - **Key Attributes**: `TICKET_NUMBER` (13-digit e-ticket code), `SEAT_NUMBER` (e.g., `'14A'`), `CABIN_CLASS` (`'ECONOMY'`, `'BUSINESS'`, `'FIRST'`), `PRICE`, `STATUS`.
  - **Foreign Keys**:
    - `fk_tickets_booking`: $\rightarrow$ `BOOKINGS(BOOKING_ID)`
    - `fk_tickets_instance`: $\rightarrow$ `FLIGHT_INSTANCES(FLIGHT_INSTANCE_ID)`
    - `fk_tickets_passenger`: $\rightarrow$ `PASSENGERS(PASSENGER_ID)`
  - **Unique Seat Allocation Constraint**:
    - `uq_flight_seat`: `UNIQUE (FLIGHT_INSTANCE_ID, SEAT_NUMBER)`
    *(Prevents two passengers from booking the same seat on the same flight)*

---

### 8. `CHECK_IN` & `BAGGAGE`
- **`CHECK_IN`**:
  - **PK**: `CHECKIN_ID`
  - **Key Attributes**: `TICKET_ID` (FK to `TICKETS`), `BOARDING_PASS_CODE` (e.g., `'BP-567001-14A'`), `GATE_ID` (FK to `GATES`), `STATUS` (`'COMPLETED'`, `'CANCELLED'`).
  - **Unique Constraint**: `uq_checkin_ticket UNIQUE (TICKET_ID)` *(Enforces that each ticket can generate only one boarding pass)*
- **`BAGGAGE`**:
  - **PK**: `BAGGAGE_ID`
  - **Key Attributes**: `TICKET_ID` (FK to `TICKETS`), `TAG_NUMBER` (Unique RFID tag e.g., `'BAG-7001-01'`), `WEIGHT_KG`, `STATUS` (`'CHECKED_IN'`, `'SECURITY_CLEARED'`, `'LOADED'`, `'TRANSIT'`, `'CLAIM_READY'`, `'COLLECTED'`), `CAROUSEL_NUMBER`.
  - **Check Constraint**: `chk_baggage_weight CHECK (WEIGHT_KG >= 0.0 AND WEIGHT_KG <= 60.0)`

---

## 3. Data Dictionary Inspection Queries

During your faculty viva, you can run these Oracle standard queries to prove that all schema objects exist:

### Query: Show All Tables in Current Schema
```sql
SELECT table_name, num_rows, tablespace_name 
FROM user_tables 
ORDER BY table_name;
```

### Query: Show Primary & Foreign Keys with Referenced Tables
```sql
SELECT 
    uc.table_name,
    uc.constraint_name,
    uc.constraint_type, -- P = Primary Key, R = Foreign Key, U = Unique, C = Check
    ucc.column_name,
    r_uc.table_name AS referenced_table
FROM user_constraints uc
JOIN user_cons_columns ucc 
    ON uc.constraint_name = ucc.constraint_name
LEFT JOIN user_constraints r_uc 
    ON uc.r_constraint_name = r_uc.constraint_name
WHERE uc.constraint_type IN ('P', 'R')
ORDER BY uc.table_name, uc.constraint_type DESC;
```

### Query: Show Compiled PL/SQL Procedures & Triggers
```sql
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type IN ('PROCEDURE', 'TRIGGER', 'VIEW')
ORDER BY object_type, object_name;
```
