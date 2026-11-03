# Database Implementation Suite: Airport Management System

> **Directory**: `database/`  
> **Target Database**: Oracle SQL / PL/SQL (12c, 19c, 21c, XE)  
> **Author**: Saravana (BTech Student Capstone Project)

---

## 1. Directory Structure

```
database/
├── master_setup.sql             # Single-command master deployment script
├── README.md                    # This guide
│
├── schema/                      # DDL scripts in strict dependency order
│   ├── 01_airport_tables.sql
│   ├── 02_airline_tables.sql
│   ├── 03_gate_tables.sql
│   ├── 04_aircraft_tables.sql
│   ├── 05_flight_tables.sql
│   ├── 06_user_and_passenger_tables.sql
│   ├── 07_employee_tables.sql
│   ├── 08_booking_tables.sql
│   ├── 09_baggage_and_checkin_tables.sql
│   └── 10_operational_tables.sql
│
├── procedures/                  # PL/SQL Stored Procedures
│   ├── flight_procedures.sql    # Route registration, instance scheduling, gate allocation
│   └── booking_procedures.sql   # Transaction-safe booking, cancellation, check-in, baggage
│
├── triggers/                    # Database Triggers & Conflict Sentinels
│   ├── flight_triggers.sql      # Flight delay audit & gate conflict prevention
│   └── audit_triggers.sql       # Ticket cancellation & user registration auditing
│
├── views/                       # Relational Reporting Views
│   └── airport_views.sql        # FIDS flight board, passenger manifest, revenue summary
│
├── sample_data/                 # Verified Test Seed Data
│   └── insert_sample_data.sql   # 6 airports, 5 airlines, 8 aircraft, flights, bookings, baggage
│
└── queries/                     # Demonstrative Queries for Viva Defense
    └── common_queries.sql       # JOINs, GROUP BY, HAVING, subqueries, and conflict checks
```

---

## 2. How to Run in Oracle Database

### Method A: Single Command via SQL*Plus or SQLcl
1. Open terminal and navigate to the `database` folder:
   ```bash
   cd "Airport Management system/Airport-Management-System/database"
   ```
2. Connect to your Oracle database instance:
   ```bash
   sqlplus username/password@localhost:1521/XEPDB1
   ```
3. Execute the master script:
   ```sql
   @master_setup.sql
   ```

### Method B: In Oracle SQL Developer
1. Open Oracle SQL Developer and connect to your database connection.
2. Open `database/master_setup.sql` in the SQL Worksheet.
3. Click **Run Script** (`F5`).
4. All 14 scripts will execute in exact order with feedback messages.

### Method C: Running Individual Scripts
If running file-by-file, execute in this exact sequence:
1. `schema/01_airport_tables.sql`
2. `schema/02_airline_tables.sql`
3. `schema/03_gate_tables.sql`
4. `schema/04_aircraft_tables.sql`
5. `schema/05_flight_tables.sql`
6. `schema/06_user_and_passenger_tables.sql`
7. `schema/07_employee_tables.sql`
8. `schema/08_booking_tables.sql`
9. `schema/09_baggage_and_checkin_tables.sql`
10. `schema/10_operational_tables.sql`
11. `procedures/flight_procedures.sql`
12. `procedures/booking_procedures.sql`
13. `triggers/flight_triggers.sql`
14. `triggers/audit_triggers.sql`
15. `views/airport_views.sql`
16. `sample_data/insert_sample_data.sql`
