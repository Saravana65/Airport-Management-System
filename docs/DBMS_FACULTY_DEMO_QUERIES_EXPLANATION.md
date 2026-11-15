# DBMS Faculty Demonstration Queries Explanation Guide

**Project**: Airport Management System  
**Evaluation**: College DBMS Project Review & Faculty Viva Defense  
**Auditor**: Senior Oracle DBA & DBMS Faculty Mentor  
**Script**: [`database/DBMS_FACULTY_DEMO_QUERIES.sql`](../../database/DBMS_FACULTY_DEMO_QUERIES.sql)  

---

## 1. Selected Main Demonstration Query: Flight Information Display System (FIDS)

When your faculty says:
> *"Show me a meaningful SQL query that demonstrates your project's database relationships and explain what it does."*

Execute **Query 7** from [`database/DBMS_FACULTY_DEMO_QUERIES.sql`](../../database/DBMS_FACULTY_DEMO_QUERIES.sql):

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

## 2. Expected Output Table

| FLIGHT_NUMBER | AIRLINE_NAME | ORIGIN | DESTINATION | DEPARTURE_TIME | GATE | AIRCRAFT_MODEL | STATUS |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `AI101` | Air India Limited | Delhi (DEL) | New York (JFK) | 01:30 | T3-G10 | Boeing 777-300ER | `DELAYED` |
| `AI2014` | Air India Limited | Mumbai (BOM) | Dallas (DFW) | 02:10 | T2-G01 | Boeing 777-300ER | `ON_TIME` |
| `AI680` | Air India Limited | Mumbai (BOM) | Delhi (DEL) | 06:00 | T2-G02 | Airbus A320neo | `BOARDING` |
| `BA1689` | British Airways | London (LHR) | Delhi (DEL) | 10:20 | T5-A01 | Boeing 787-10 | `SCHEDULED` |

---

## 3. Comprehensive Breakdown for Viva Defense

### Q1: What does this query do in the context of your Airport Management System?
> *"Sir/Madam, this query generates the central **Flight Information Display System (FIDS)** board that passengers and airport ground controllers see on terminal monitors. For every scheduled flight occurrence, it combines the operating airline's legal name, origin city, destination city, departure gate, aircraft model, scheduled time, and real-time flight status into a unified operational view."*

---

### Q2: Why are multiple tables needed? Why not store everything in one big table?
> *"Storing this data in a single table would cause severe data redundancy, insertion anomalies, deletion anomalies, and update anomalies. By decomposing the domain into normalized 3NF relations:*
> 1. *Airport details (`CITY`, `COUNTRY`, `TIMEZONE`) are stored once in `AIRPORTS`.*
> 2. *Airline details (`AIRLINE_NAME`, `THREE_DIGIT_CODE`) are stored once in `AIRLINES`.*
> 3. *Route timetables are stored in `FLIGHTS`.*
> 4. *Daily flight occurrences are stored in `FLIGHT_INSTANCES`.*
> 5. *Gate allocations reside in `GATES`.*
> 6. *Fleet details reside in `AIRCRAFT`.*
>
> *Because data is properly normalized, SQL **JOINs** are required at query time to reconstruct the composite operational record without any storage duplication."*

---

### Q3: How are the tables related? What are the Join conditions?
Explain the join paths:
1. **`FLIGHT_INSTANCES` $\rightarrow$ `FLIGHTS`**:
   - `JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER`
   - Relates the daily physical flight to its master route template via foreign key `FLIGHT_NUMBER`.
2. **`FLIGHTS` $\rightarrow$ `AIRLINES`**:
   - `JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE`
   - Retrieves the full commercial carrier name using the foreign key `AIRLINE_CODE`.
3. **`FLIGHTS` $\rightarrow$ `AIRPORTS` (Twice - Dual Role)**:
   - `JOIN AIRPORTS orig ON f.ORIGIN_AIRPORT = orig.AIRPORT_CODE`
   - `JOIN AIRPORTS dest ON f.DEST_AIRPORT = dest.AIRPORT_CODE`
   - Demonstrates **Role-Playing Dimensions** in SQL where the same table (`AIRPORTS`) is joined twice with distinct aliases (`orig` and `dest`) to resolve both the departure airport and destination airport independently.
4. **`FLIGHT_INSTANCES` $\rightarrow$ `GATES` (LEFT OUTER JOIN)**:
   - `LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID`
   - Uses an **Outer Join** because newly scheduled flights may not have been assigned an aerobridge gate yet (`DEPARTURE_GATE_ID IS NULL`). An inner join would incorrectly hide unassigned flights; a LEFT JOIN ensures they still display with `'UNASSIGNED'`.
5. **`FLIGHT_INSTANCES` $\rightarrow$ `AIRCRAFT` (LEFT OUTER JOIN)**:
   - `LEFT JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID`
   - Resolves aircraft tail number and model if assigned.

---

### Q4: Which Core DBMS Concepts are Demonstrated in this Query?

1. **Relational Algebra Projections & Selections**: Projecting specific calculated columns (`TO_CHAR`, string concatenations `||`) while pruning internal surrogate keys.
2. **Inner Joins (Equi-Joins)**: Matching primary key $\rightarrow$ foreign key pairs between parent and child tables.
3. **Left Outer Joins**: Handling optional foreign keys without record loss.
4. **Table Aliasing (`AS orig`, `AS dest`)**: Resolving self-referential or multi-role entity relationships.
5. **Oracle Built-in Functions**:
   - `NVL(expression, default_value)`: Null-value substitution function.
   - `TO_CHAR(timestamp, format)`: Data type conversion formatting timestamps into readable `'HH24:MI'`.
   - `||`: String concatenation operator.
6. **Query Optimization & Indexes**:
   - The query leverages B-tree indexes defined in DDL (`idx_flights_route`, `idx_instances_date`, `idx_instances_depgate`) to execute index range scans rather than full table scans.
7. **Sorting (`ORDER BY`)**: Ascending chronological sequencing on `SCHEDULED_DEPARTURE`.

---

## 4. Secondary Demonstration Queries (For In-Depth Follow-Ups)

### Secondary Query A: Group By & Aggregate Functions (Revenue by Carrier)
```sql
SELECT 
    al.AIRLINE_CODE,
    al.AIRLINE_NAME,
    COUNT(t.TICKET_ID) AS TICKETS_SOLD,
    SUM(t.PRICE) AS TOTAL_REVENUE,
    ROUND(AVG(t.PRICE), 2) AS AVG_TICKET_PRICE
FROM AIRLINES al
JOIN FLIGHTS f ON al.AIRLINE_CODE = f.AIRLINE_CODE
JOIN FLIGHT_INSTANCES fi ON f.FLIGHT_NUMBER = fi.FLIGHT_NUMBER
JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
WHERE t.STATUS != 'CANCELLED'
GROUP BY al.AIRLINE_CODE, al.AIRLINE_NAME
ORDER BY TOTAL_REVENUE DESC;
```
- **DBMS Concept**: Grouping non-aggregated columns (`GROUP BY`), computing multi-row aggregate metrics (`COUNT`, `SUM`, `AVG`), filtering uncommitted or cancelled rows prior to grouping (`WHERE`).

### Secondary Query B: Uncorrelated Scalar Subquery (Above-Average Fares)
```sql
SELECT FLIGHT_NUMBER, AIRLINE_CODE, ORIGIN_AIRPORT, DEST_AIRPORT, BASE_FARE
FROM FLIGHTS
WHERE BASE_FARE > (SELECT AVG(BASE_FARE) FROM FLIGHTS)
ORDER BY BASE_FARE DESC;
```
- **DBMS Concept**: Two-pass query execution where the inner subquery `(SELECT AVG(BASE_FARE) FROM FLIGHTS)` computes the scalar system-wide average fare, and the outer query filters flights whose individual fare exceeds that dynamic threshold.
