# DBMS Faculty Demonstration & Viva Defense Guide

**Project**: Airport Management System  
**Presentation Time**: 5 to 7 Minutes  
**Candidate**: BTech Computer Science / Information Technology Student  
**Target RDBMS**: Oracle Database 18c / 19c / 21c / XE  

---

## Part 1: Step-by-Step 5–7 Minute Presentation Sequence

Follow this sequence when presenting to your faculty mentor:

```
[0:00 - 0:45] Step 1: Project Overview & Database Problem Statement
[0:45 - 1:15] Step 2: Database Technology & Connection Architecture
[1:15 - 1:45] Step 3: Display All Database Tables
[1:45 - 2:45] Step 4: Explain 5 Core Tables (Entity Responsibilities)
[2:45 - 3:30] Step 5: Primary Keys, Foreign Keys & Constraint Verification
[3:30 - 4:15] Step 6: ER Diagram & Normalization (3NF Defense)
[4:15 - 4:45] Step 7: Record Counts & Data Verification
[4:45 - 5:45] Step 8: Execute Main Demonstration Query (FIDS Multi-Table Join)
[5:45 - 6:30] Step 9: Explain Query Output & DBMS Concepts Demonstrated
[6:30 - 7:00] Step 10: Conclusion & Transition to Viva Questions
```

---

## Part 2: Speaking Script (Student-Friendly English)

### Step 1: Project Overview (0:00 - 0:45)
> *"Good morning, Respected Faculty and Evaluators. My name is [Your Name], and today I am demonstrating the database architecture of my project: the **Airport Management System**.*
>
> *Modern commercial airports are complex, data-intensive environments. A single flight movement requires coordination across international airport facilities, commercial airlines, aircraft fleets, aerobridge gates, passenger manifests, ticketing, check-in, and baggage tracking.*
>
> *The primary objective of my database design is to provide an ACID-compliant, Third Normal Form (3NF) relational schema that completely eliminates data redundancy while maintaining sub-second query performance for airport operations."*

---

### Step 2: Database Technology (0:45 - 1:15)
> *"For our backend persistence tier, we selected **Oracle Database** (Oracle XE). Oracle was chosen for its enterprise-grade concurrency controls, strict relational constraint enforcement, and robust PL/SQL programmability.*
>
> *Our full-stack application connects to Oracle through the official Node.js `oracledb` driver operating in default Thin Mode. Thin Mode communicates directly over TCP/IP on port 1521 to the Pluggable Database `XEPDB1`, without requiring heavy native client binaries.*
>
> *I have compiled our master schema using our deployment script `master_setup.sql` under the dedicated `airport_admin` schema."*

---

### Step 3: Show All Database Tables (1:15 - 1:45)
*(Action: Open Oracle SQL Developer or terminal and execute Section 2)*
```sql
SELECT table_name, num_rows, status FROM user_tables ORDER BY table_name;
```
> *"As you can see on screen, our schema consists of **15 core operational tables**:*
> - *Facility and Fleet tables: `AIRPORTS`, `AIRLINES`, `GATES`, `AIRCRAFT`.*
> - *Schedule and Operations tables: `FLIGHTS`, `FLIGHT_INSTANCES`.*
> - *Identity and Staffing: `USERS`, `PASSENGERS`, `EMPLOYEES`.*
> - *Commercial Reservations: `BOOKINGS`, `TICKETS`, `CHECK_IN`, `BAGGAGE`.*
> - *Auditing: `FLIGHT_STATUS_HISTORY`, `OPERATIONAL_LOGS`.*
>
> *All 15 tables are currently compiled with VALID status in Oracle's data dictionary."*

---

### Step 4: Explain 5 Core Tables (1:45 - 2:45)
> *"Let me highlight 5 critical tables that form the backbone of the system:*
>
> 1. *`AIRPORTS`: Stores airport facilities identified by their official 3-character IATA primary key, such as `BOM` for Mumbai and `JFK` for New York, along with timezone metadata.*
> 2. *`FLIGHTS`: Serves as our recurring timetable template. It links an airline to an origin and destination airport, and enforces that origin and destination cannot be identical.*
> 3. *`FLIGHT_INSTANCES`: While `FLIGHTS` represents the schedule, `FLIGHT_INSTANCES` represents the physical aircraft movement on a specific calendar date with its assigned aerobridge gate and live delay status.*
> 4. *`TICKETS`: Represents an individual seat allocated to a passenger on a specific flight instance. It carries a composite unique constraint on `(FLIGHT_INSTANCE_ID, SEAT_NUMBER)` which prevents duplicate seat bookings at the database engine level.*
> 5. *`CHECK_IN`: Generates digital boarding passes and links issued tickets directly to airport gates for physical aerobridge boarding."*

---

### Step 5: Primary Keys & Foreign Keys (2:45 - 3:30)
*(Action: Run Section 4 query in SQL Developer)*
```sql
SELECT uc.table_name, uc.constraint_name, ucc.column_name, r_uc.table_name AS references_table
FROM user_constraints uc
JOIN user_cons_columns ucc ON uc.constraint_name = ucc.constraint_name
LEFT JOIN user_constraints r_uc ON uc.r_constraint_name = r_uc.constraint_name
WHERE uc.constraint_type IN ('P', 'R')
ORDER BY uc.table_name;
```
> *"Every table has a designated Primary Key. For entity tables with natural standards, we use natural keys like `AIRPORT_CODE` and `FLIGHT_NUMBER`. For high-volume transactional entities like `TICKETS`, `BOOKINGS`, and `GATES`, we use surrogate keys generated by Oracle's native `IDENTITY` column feature.*
>
> *Referential integrity is maintained through foreign keys. We carefully configured cascading behaviors: deleting a booking cascades to its child tickets, while unassigning an aircraft or gate sets the foreign key to NULL without deleting the flight instance."*

---

### Step 6: ER Diagram & Normalization (3:30 - 4:15)
*(Action: Present the Mermaid ER Diagram in `docs/DBMS_ER_DIAGRAM.md`)*
> *"Our entire schema is normalized to **Third Normal Form (3NF)**:*
> - *First Normal Form is satisfied because all attributes are atomic—we do not store multi-valued arrays or concatenated seat lists in any column.*
> - *Second Normal Form is satisfied because in all tables with composite candidate keys, every non-key column depends on the whole key.*
> - *Third Normal Form is satisfied because there are zero transitive functional dependencies. For example, aircraft capacities are stored in `AIRCRAFT`, not duplicated across tickets. Airport city and country belong in `AIRPORTS`, preventing update anomalies across routes.*
>
> *Many-to-Many relationships, such as passengers traveling on multiple flights and flights carrying multiple passengers, are cleanly resolved via associative bridge entities like `TICKETS`."*

---

### Step 7: Display Record Counts & Sample Data (4:15 - 4:45)
*(Action: Run Section 5 query)*
```sql
SELECT 'AIRPORTS' AS TABLE_NAME, COUNT(*) AS TOTAL_ROWS FROM AIRPORTS
UNION ALL
SELECT 'FLIGHTS', COUNT(*) FROM FLIGHTS
UNION ALL
SELECT 'FLIGHT_INSTANCES', COUNT(*) FROM FLIGHT_INSTANCES
UNION ALL
SELECT 'TICKETS', COUNT(*) FROM TICKETS;
```
> *"Our database is pre-seeded with realistic aviation data: 6 international airport hubs, 5 major commercial airlines, 11 terminal gates, 6 aircraft, 8 scheduled routes, and active passenger bookings with zero orphan records."*

---

### Step 8: Execute Main Demonstration Query (4:45 - 5:45)
*(Action: Run Section 7 query)*
```sql
SELECT 
    fi.FLIGHT_NUMBER,
    al.AIRLINE_NAME,
    orig.CITY || ' (' || orig.AIRPORT_CODE || ')' AS ORIGIN,
    dest.CITY || ' (' || dest.AIRPORT_CODE || ')' AS DESTINATION,
    TO_CHAR(fi.SCHEDULED_DEPARTURE, 'HH24:MI') AS DEPARTURE_TIME,
    NVL(g.TERMINAL || '-' || g.GATE_NUMBER, 'UNASSIGNED') AS GATE,
    NVL(ac.MODEL, 'TBD') AS AIRCRAFT_MODEL,
    fi.STATUS
FROM FLIGHT_INSTANCES fi
JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
JOIN AIRPORTS orig ON f.ORIGIN_AIRPORT = orig.AIRPORT_CODE
JOIN AIRPORTS dest ON f.DEST_AIRPORT = dest.AIRPORT_CODE
LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID
LEFT JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID
ORDER BY fi.SCHEDULED_DEPARTURE ASC;
```

---

### Step 9: Explain Output & Concepts Demonstrated (5:45 - 6:30)
> *"Sir/Madam, this query powers the **Flight Information Display System (FIDS)** monitor board. Notice several advanced DBMS concepts demonstrated here:*
> 1. *It performs **INNER JOINs** across 4 tables: `FLIGHT_INSTANCES`, `FLIGHTS`, `AIRLINES`, and `AIRPORTS`.*
> 2. *It demonstrates **Role-Playing Dimensions**: we join `AIRPORTS` twice with distinct aliases—`orig` for the departure city and `dest` for the arrival city.*
> 3. *It uses **LEFT OUTER JOINs** for `GATES` and `AIRCRAFT`. If a flight has been newly scheduled and does not yet have an assigned gate, an inner join would exclude it; the left join keeps the flight visible on the departure board and uses the `NVL()` function to display `'UNASSIGNED'`.*
> 4. *It formats timestamps into clean departure hours using `TO_CHAR()` and orders the entire schedule chronologically.*
>
> *This single query proves that our normalized relations combine seamlessly to generate mission-critical airport operations data in real time."*

---

### Step 10: Conclusion (6:30 - 7:00)
> *"In conclusion, this database design combines theoretical relational rigor with practical full-stack software engineering. It enforces business rules through check constraints and foreign keys, supports complex multi-table queries, and integrates seamlessly with our Node.js API and React frontend.*
>
> *I am now ready to answer any questions regarding our schema, constraints, normalization, or PL/SQL procedures. Thank you."*

---

## Part 3: College DBMS Faculty Viva Questions & Answers

### 1. Fundamentals of DBMS & Oracle
**Q: What is the difference between a DBMS and an RDBMS?**  
**A:** A DBMS manages file-based data without enforcing relational constraints. An RDBMS stores data in mathematical relations (tables) with rows and columns, enforces Codd's Relational Rules, ensures referential integrity through foreign keys, and provides ACID transaction guarantees.

**Q: Why choose Oracle Database over SQLite or MongoDB for this system?**  
**A:** Airport operations require multi-user concurrent transactions, row-level locking, strict schema validation, complex multi-table analytical joins, and automated trigger sentinels. Oracle XE provides enterprise-grade ACID transactions, Pluggable Database (PDB) multi-tenancy, and high-performance PL/SQL execution.

---

### 2. Keys & Integrity Constraints
**Q: What is the difference between a Primary Key and a Unique Key?**  
**A:** 
- A **Primary Key** uniquely identifies each row in a table, enforces `UNIQUE + NOT NULL`, and automatically creates a unique clustered/B-tree index. A table can have only one Primary Key.
- A **Unique Key** also prevents duplicates but permits `NULL` values (in Oracle, multiple nulls are allowed unless marked NOT NULL). A table can have multiple unique constraints (e.g., `AIRLINES` has PK `AIRLINE_CODE` and Unique `THREE_DIGIT_CODE`).

**Q: What is a Composite Key? Give an example from your project.**  
**A:** A Composite Key consists of two or more columns that together guarantee uniqueness. In our `GATES` table, the combination `(AIRPORT_CODE, TERMINAL, GATE_NUMBER)` is a composite unique key because Gate `G01` exists in Terminal `T2` at `BOM` and can also exist in Terminal `T3` at `DEL`.

**Q: What is a Foreign Key, and what happens when a referenced parent record is deleted?**  
**A:** A Foreign Key is a referential constraint enforcing that values in a child column must match existing primary key values in the parent table. In our schema:
- `ON DELETE CASCADE`: Deleting a `BOOKING` automatically deletes its associated child `TICKETS`.
- `ON DELETE SET NULL`: Retiring an `AIRCRAFT` sets `FLIGHT_INSTANCES.AIRCRAFT_ID` to `NULL` so historical flight records are preserved.

---

### 3. Normalization (1NF, 2NF, 3NF, BCNF)
**Q: What are the three normal forms, and why is your schema in 3NF?**  
**A:**
1. **1NF (First Normal Form)**: Eliminate repeating groups and ensure all attribute values are atomic. (e.g., storing one seat per ticket row, never comma-separated lists).
2. **2NF (Second Normal Form)**: Must be in 1NF and have NO partial dependencies—every non-prime attribute must depend on the whole candidate key.
3. **3NF (Third Normal Form)**: Must be in 2NF and have NO transitive dependencies—non-prime attributes must depend ONLY on the primary key ($X \rightarrow Y$ where $Y$ is non-prime $\implies X$ is a superkey). For example, employee job salary is not duplicated in `EMPLOYEES`; it depends on `JOBTYPE`.

**Q: Did you have to decompose any tables for normalization?**  
**A:** Yes. In our academic design, storing passenger personal details directly inside a flight booking would cause passenger address and phone to be repeated for every flight booked. Decomposing into `PASSENGERS` (demographics) and `TICKETS` (transactional seat instance) achieved 3NF.

---

### 4. SQL Joins, Aggregations & Subqueries
**Q: Explain the difference between INNER JOIN, LEFT OUTER JOIN, and FULL OUTER JOIN.**  
**A:**
- **INNER JOIN**: Returns only rows where the join condition evaluates to TRUE in both tables.
- **LEFT OUTER JOIN**: Returns all rows from the left table, plus matched rows from the right table (with `NULL`s for unmatched right columns).
- **FULL OUTER JOIN**: Returns all rows from both tables, filling `NULL`s on either side when no match exists.

**Q: What is the difference between WHERE and HAVING?**  
**A:** 
- `WHERE` filters individual rows **before** any grouping or aggregation takes place.
- `HAVING` filters aggregated group records **after** `GROUP BY` has evaluated aggregate functions like `COUNT(*) >= 2` or `SUM(PRICE) > 50000`.

**Q: What is a Correlated Subquery?**  
**A:** A correlated subquery depends on values from the outer query for its evaluation and executes once for each candidate row processed by the outer query. In our `common_queries.sql`, we calculate flight seat occupancy percentage by evaluating `COUNT(TICKETS)` correlated to `fi.FLIGHT_INSTANCE_ID`.

---

### 5. Transactions & ACID Properties
**Q: What are ACID properties, and how does your project implement them?**  
**A:**
- **Atomicity**: In `database.service.js`, the `executeTransaction()` wrapper guarantees "all-or-nothing" execution. If booking creation succeeds but ticket seat allocation fails, the entire transaction calls `ROLLBACK`.
- **Consistency**: Oracle database constraints (`chk_seat_sum`, `fk_tickets_booking`, `chk_baggage_weight`) prevent invalid states from ever committing.
- **Isolation**: Oracle's default Read Committed isolation level prevents dirty reads and ensures concurrent transactions do not observe intermediate states.
- **Durability**: Once a transaction is committed, Oracle's Redo Log Writer (`LGWR`) ensures data persists on disk even in the event of an abrupt system power loss.

---

### 6. PL/SQL: Triggers & Stored Procedures
**Q: What is the difference between a Stored Procedure and a Trigger?**  
**A:**
- A **Stored Procedure** is a compiled PL/SQL program explicitly called by application code (e.g., `sp_schedule_flight_instance()`), which can take input/output parameters and return values.
- A **Trigger** is a procedural block that fires **automatically** in response to a DDL or DML event (`BEFORE` or `AFTER` `INSERT`, `UPDATE`, `DELETE`). For example, our trigger `trg_prevent_gate_conflict` automatically aborts any flight schedule that creates an overlapping gate collision within 30 minutes.
