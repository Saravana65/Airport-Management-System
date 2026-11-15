-- ============================================================================
-- SCRIPT: DBMS_FACULTY_DEMO_QUERIES.sql
-- PROJECT: Airport Management System
-- TARGET: Oracle Database 18c / 19c / 21c / XE / Oracle SQL Developer / SQL*Plus
-- AUTHOR: Saravana (BTech Student Project)
-- AUDIENCE: College DBMS Faculty Evaluation & Viva Defense
-- DESCRIPTION: Read-only demonstrative SQL queries showing DDL metadata,
--              integrity constraints, multi-table JOINs, aggregations, and subqueries.
-- ============================================================================

SET PAGESIZE 100;
SET LINESIZE 200;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT ============================================================================
PROMPT   AIRPORT MANAGEMENT SYSTEM — DBMS FACULTY DEMONSTRATION SUITE
PROMPT ============================================================================

-- ============================================================================
-- SECTION 1: DATABASE INFORMATION & CURRENT SESSION
-- ============================================================================
PROMPT [1] Querying Database Engine & Active User Schema...

SELECT 
    USER AS CURRENT_SCHEMA,
    SYS_CONTEXT('USERENV', 'DB_NAME') AS DATABASE_NAME,
    SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME,
    TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS SERVER_TIMESTAMP
FROM DUAL;


-- ============================================================================
-- SECTION 2: LIST ALL USER TABLES IN THE PROJECT
-- ============================================================================
PROMPT [2] Displaying all tables belonging to the project schema...

SELECT 
    table_name,
    tablespace_name,
    status
FROM user_tables
ORDER BY table_name;


-- ============================================================================
-- SECTION 3: TABLE STRUCTURE & COLUMN DEFINITIONS
-- ============================================================================
PROMPT [3] Describing structure of core operational tables...

DESCRIBE AIRPORTS;
DESCRIBE FLIGHTS;
DESCRIBE FLIGHT_INSTANCES;
DESCRIBE TICKETS;

-- Alternatively using Oracle Data Dictionary:
SELECT 
    column_name,
    data_type,
    data_length,
    data_precision,
    data_scale,
    nullable,
    data_default
FROM user_tab_columns
WHERE table_name = 'FLIGHT_INSTANCES'
ORDER BY column_id;


-- ============================================================================
-- SECTION 4: PRIMARY KEYS, FOREIGN KEYS & CONSTRAINTS
-- ============================================================================
PROMPT [4] Displaying Primary Keys and Foreign Key Relationships...

SELECT 
    uc.table_name AS TABLE_NAME,
    uc.constraint_name AS CONSTRAINT_NAME,
    CASE uc.constraint_type
        WHEN 'P' THEN 'PRIMARY KEY'
        WHEN 'R' THEN 'FOREIGN KEY'
        WHEN 'U' THEN 'UNIQUE KEY'
        WHEN 'C' THEN 'CHECK CONSTRAINT'
    END AS CONSTRAINT_TYPE,
    ucc.column_name AS COLUMN_NAME,
    r_uc.table_name AS REFERENCES_TABLE
FROM user_constraints uc
JOIN user_cons_columns ucc 
    ON uc.constraint_name = ucc.constraint_name
LEFT JOIN user_constraints r_uc 
    ON uc.r_constraint_name = r_uc.constraint_name
WHERE uc.constraint_type IN ('P', 'R', 'U')
ORDER BY uc.table_name, uc.constraint_type;


-- ============================================================================
-- SECTION 5: RECORD COUNTS IN ALL CORE TABLES
-- ============================================================================
PROMPT [5] Counting records across all operational tables...

SELECT 'AIRPORTS' AS TABLE_NAME, COUNT(*) AS TOTAL_ROWS FROM AIRPORTS
UNION ALL
SELECT 'AIRLINES', COUNT(*) FROM AIRLINES
UNION ALL
SELECT 'GATES', COUNT(*) FROM GATES
UNION ALL
SELECT 'AIRCRAFT', COUNT(*) FROM AIRCRAFT
UNION ALL
SELECT 'FLIGHTS', COUNT(*) FROM FLIGHTS
UNION ALL
SELECT 'FLIGHT_INSTANCES', COUNT(*) FROM FLIGHT_INSTANCES
UNION ALL
SELECT 'USERS', COUNT(*) FROM USERS
UNION ALL
SELECT 'PASSENGERS', COUNT(*) FROM PASSENGERS
UNION ALL
SELECT 'EMPLOYEES', COUNT(*) FROM EMPLOYEES
UNION ALL
SELECT 'BOOKINGS', COUNT(*) FROM BOOKINGS
UNION ALL
SELECT 'TICKETS', COUNT(*) FROM TICKETS
UNION ALL
SELECT 'CHECK_IN', COUNT(*) FROM CHECK_IN
UNION ALL
SELECT 'BAGGAGE', COUNT(*) FROM BAGGAGE
UNION ALL
SELECT 'OPERATIONAL_LOGS', COUNT(*) FROM OPERATIONAL_LOGS;


-- ============================================================================
-- SECTION 6: DISPLAY ACTUAL RECORDS (SAMPLE DATA AUDIT)
-- ============================================================================
PROMPT [6] Displaying verified sample records from core tables...

-- 6.1 Master Airports
SELECT AIRPORT_CODE, AIRPORT_NAME, CITY, COUNTRY, TIMEZONE FROM AIRPORTS;

-- 6.2 Registered Airlines
SELECT AIRLINE_CODE, AIRLINE_NAME, THREE_DIGIT_CODE, COUNTRY FROM AIRLINES;

-- 6.3 Commercial Flight Timetable
SELECT FLIGHT_NUMBER, AIRLINE_CODE, ORIGIN_AIRPORT, DEST_AIRPORT, BASE_FARE FROM FLIGHTS;


-- ============================================================================
-- SECTION 7: MAIN DEMONSTRATION QUERY — LIVE FLIGHT STATUS DISPLAY (FIDS)
-- *** SELECT THIS QUERY FOR YOUR 1-MINUTE LIVE FACULTY DEMONSTRATION ***
-- ============================================================================
PROMPT [7] EXECUTING MAIN LIVE FLIGHT INFORMATION DISPLAY (FIDS) QUERY...

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


-- ============================================================================
-- SECTION 8: 3-TABLE JOIN — PASSENGER RESERVATION & TICKET DETAILS
-- ============================================================================
PROMPT [8] Executing 3-Table Join: Bookings + Tickets + Passengers...

SELECT 
    b.BOOKING_REFERENCE AS PNR,
    p.FIRST_NAME || ' ' || p.LAST_NAME AS PASSENGER_NAME,
    p.PASSPORT_NUMBER,
    t.TICKET_NUMBER,
    t.SEAT_NUMBER,
    t.CABIN_CLASS,
    t.PRICE,
    t.STATUS AS TICKET_STATUS
FROM BOOKINGS b
JOIN TICKETS t ON b.BOOKING_ID = t.BOOKING_ID
JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
ORDER BY b.BOOKING_REFERENCE, t.SEAT_NUMBER;


-- ============================================================================
-- SECTION 9: GROUP BY & AGGREGATE FUNCTIONS — AIRLINE REVENUE SUMMARY
-- ============================================================================
PROMPT [9] Executing GROUP BY with SUM, AVG, and COUNT aggregates...

SELECT 
    al.AIRLINE_CODE,
    al.AIRLINE_NAME,
    COUNT(t.TICKET_ID) AS TICKETS_SOLD,
    SUM(t.PRICE) AS TOTAL_REVENUE,
    ROUND(AVG(t.PRICE), 2) AS AVG_TICKET_PRICE,
    MIN(t.PRICE) AS LOWEST_FARE,
    MAX(t.PRICE) AS HIGHEST_FARE
FROM AIRLINES al
JOIN FLIGHTS f ON al.AIRLINE_CODE = f.AIRLINE_CODE
JOIN FLIGHT_INSTANCES fi ON f.FLIGHT_NUMBER = fi.FLIGHT_NUMBER
JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
WHERE t.STATUS != 'CANCELLED'
GROUP BY al.AIRLINE_CODE, al.AIRLINE_NAME
ORDER BY TOTAL_REVENUE DESC;


-- ============================================================================
-- SECTION 10: SUBQUERY — FLIGHTS WITH ABOVE-AVERAGE BASE FARE
-- ============================================================================
PROMPT [10] Executing Scalar Subquery in WHERE Clause...

SELECT 
    FLIGHT_NUMBER,
    AIRLINE_CODE,
    ORIGIN_AIRPORT,
    DEST_AIRPORT,
    BASE_FARE
FROM FLIGHTS
WHERE BASE_FARE > (SELECT AVG(BASE_FARE) FROM FLIGHTS)
ORDER BY BASE_FARE DESC;

PROMPT ============================================================================
PROMPT   DEMONSTRATION QUERY EXECUTION COMPLETE!
PROMPT ============================================================================
