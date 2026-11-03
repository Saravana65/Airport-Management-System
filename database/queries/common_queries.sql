-- ============================================================================
-- SCRIPT: common_queries.sql
-- MODULE: Common Operational Queries & Demonstrative SQL
-- DESCRIPTION: Queries demonstrating JOINs, Subqueries, GROUP BY, HAVING, Window Functions, and Transactions.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- ============================================================================
-- 1. BASIC & MULTI-TABLE JOINS
-- ============================================================================

-- Query 1.1: Live Flight Information Display (FIDS) with Origin, Destination, Gate, and Aircraft
-- Concept: Multi-table INNER JOIN and LEFT JOIN (when gate or aircraft is yet unassigned)
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


-- Query 1.2: Complete Passenger Manifest with Checked Baggage Count & Weight
-- Concept: Multi-table JOIN with LEFT OUTER JOIN and aggregate counting
SELECT 
    fi.FLIGHT_NUMBER,
    p.FIRST_NAME || ' ' || p.LAST_NAME AS PASSENGER_NAME,
    p.PASSPORT_NUMBER,
    t.SEAT_NUMBER,
    t.CABIN_CLASS,
    t.STATUS AS TICKET_STATUS,
    COUNT(b.BAGGAGE_ID) AS BAGS_CHECKED,
    NVL(SUM(b.WEIGHT_KG), 0) AS TOTAL_BAGGAGE_WEIGHT_KG
FROM TICKETS t
JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
LEFT JOIN BAGGAGE b ON t.TICKET_ID = b.TICKET_ID
WHERE fi.FLIGHT_NUMBER = 'AI2014'
GROUP BY 
    fi.FLIGHT_NUMBER, p.FIRST_NAME, p.LAST_NAME, p.PASSPORT_NUMBER,
    t.SEAT_NUMBER, t.CABIN_CLASS, t.STATUS;


-- ============================================================================
-- 2. AGGREGATIONS: GROUP BY & HAVING CLAUSES
-- ============================================================================

-- Query 2.1: Revenue and Passenger Volume per Airline
-- Concept: GROUP BY with SUM, AVG, and COUNT
SELECT 
    al.AIRLINE_CODE,
    al.AIRLINE_NAME,
    COUNT(t.TICKET_ID) AS TOTAL_TICKETS_SOLD,
    SUM(t.PRICE) AS GROSS_REVENUE,
    ROUND(AVG(t.PRICE), 2) AS AVERAGE_TICKET_FARE
FROM AIRLINES al
JOIN FLIGHTS f ON al.AIRLINE_CODE = f.AIRLINE_CODE
JOIN FLIGHT_INSTANCES fi ON f.FLIGHT_NUMBER = fi.FLIGHT_NUMBER
JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
WHERE t.STATUS != 'CANCELLED'
GROUP BY al.AIRLINE_CODE, al.AIRLINE_NAME
ORDER BY GROSS_REVENUE DESC;


-- Query 2.2: Identify Busy Routes (Routes with more than 1 flight scheduled)
-- Concept: GROUP BY with HAVING clause filtering aggregated results
SELECT 
    f.ORIGIN_AIRPORT,
    f.DEST_AIRPORT,
    COUNT(fi.FLIGHT_INSTANCE_ID) AS SCHEDULED_FLIGHT_COUNT
FROM FLIGHTS f
JOIN FLIGHT_INSTANCES fi ON f.FLIGHT_NUMBER = fi.FLIGHT_NUMBER
GROUP BY f.ORIGIN_AIRPORT, f.DEST_AIRPORT
HAVING COUNT(fi.FLIGHT_INSTANCE_ID) >= 1;


-- ============================================================================
-- 3. SUBQUERIES: SCALAR, CORRELATED & IN / NOT IN
-- ============================================================================

-- Query 3.1: Find Flights with Higher-than-Average Base Fare
-- Concept: Uncorrelated Scalar Subquery in WHERE clause
SELECT 
    FLIGHT_NUMBER,
    ORIGIN_AIRPORT,
    DEST_AIRPORT,
    BASE_FARE
FROM FLIGHTS
WHERE BASE_FARE > (SELECT AVG(BASE_FARE) FROM FLIGHTS)
ORDER BY BASE_FARE DESC;


-- Query 3.2: Find Available Boarding Gates Currently NOT Assigned to Any Active Flight
-- Concept: Subquery with NOT IN / NOT EXISTS
SELECT 
    g.GATE_ID,
    g.AIRPORT_CODE,
    g.TERMINAL,
    g.GATE_NUMBER,
    g.STATUS
FROM GATES g
WHERE g.STATUS = 'AVAILABLE'
  AND g.GATE_ID NOT IN (
      SELECT NVL(DEPARTURE_GATE_ID, -1)
      FROM FLIGHT_INSTANCES
      WHERE STATUS IN ('BOARDING', 'SCHEDULED', 'ON_TIME')
  );


-- Query 3.3: Calculate Flight Seat Occupancy Percentage
-- Concept: Correlated subquery computing ratio against AIRCRAFT capacity
SELECT 
    fi.FLIGHT_INSTANCE_ID,
    fi.FLIGHT_NUMBER,
    ac.REGISTRATION_NO,
    ac.TOTAL_SEATS,
    (
        SELECT COUNT(*)
        FROM TICKETS t
        WHERE t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
          AND t.STATUS != 'CANCELLED'
    ) AS BOOKED_SEATS,
    ROUND(
        (
            SELECT COUNT(*)
            FROM TICKETS t
            WHERE t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
              AND t.STATUS != 'CANCELLED'
        ) * 100.0 / ac.TOTAL_SEATS, 
        2
    ) AS OCCUPANCY_PERCENTAGE
FROM FLIGHT_INSTANCES fi
JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID;


-- ============================================================================
-- 4. AUTONOMOUS AUDITING & SENTINEL QUERIES
-- ============================================================================

-- Query 4.1: Inspect Recent Operational Anomalies and Delays
-- Concept: Querying the Autonomous Data Engine audit table
SELECT 
    LOG_ID,
    EVENT_CATEGORY,
    SEVERITY,
    DETAILS,
    ACTION_TAKEN,
    REQUIRES_ADMIN_APPROVAL,
    TO_CHAR(LOGGED_AT, 'YYYY-MM-DD HH24:MI:SS') AS EVENT_TIMESTAMP
FROM OPERATIONAL_LOGS
ORDER BY LOGGED_AT DESC;


-- Query 4.2: Detect Any Overlapping Gate Assignments (Conflict Detection Query)
-- Concept: Self-join on FLIGHT_INSTANCES checking time-window collision
SELECT 
    f1.DEPARTURE_GATE_ID AS GATE_ID,
    f1.FLIGHT_NUMBER AS FLIGHT_1,
    f1.SCHEDULED_DEPARTURE AS FLIGHT_1_DEP,
    f2.FLIGHT_NUMBER AS FLIGHT_2,
    f2.SCHEDULED_DEPARTURE AS FLIGHT_2_DEP
FROM FLIGHT_INSTANCES f1
JOIN FLIGHT_INSTANCES f2 
    ON f1.DEPARTURE_GATE_ID = f2.DEPARTURE_GATE_ID
   AND f1.FLIGHT_INSTANCE_ID < f2.FLIGHT_INSTANCE_ID
WHERE f1.STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED')
  AND f2.STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED')
  AND (
      f2.SCHEDULED_DEPARTURE BETWEEN (f1.SCHEDULED_DEPARTURE - INTERVAL '30' MINUTE) 
                                 AND (f1.SCHEDULED_DEPARTURE + INTERVAL '30' MINUTE)
  );
