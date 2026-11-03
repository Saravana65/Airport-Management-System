-- ============================================================================
-- SCRIPT: airport_views.sql
-- MODULE: Reporting & Analytical Database Views
-- DESCRIPTION: High-level relational views for FIDS flight boards, manifests, and revenue KPIs.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- 1. View: Flight Information Display System (FIDS Master Board)
CREATE OR REPLACE VIEW vw_flight_board AS
SELECT 
    fi.FLIGHT_INSTANCE_ID,
    fi.FLIGHT_NUMBER,
    al.AIRLINE_NAME,
    al.AIRLINE_CODE,
    orig.CITY AS ORIGIN_CITY,
    orig.AIRPORT_CODE AS ORIGIN_CODE,
    dest.CITY AS DEST_CITY,
    dest.AIRPORT_CODE AS DEST_CODE,
    TO_CHAR(fi.SCHEDULED_DEPARTURE, 'YYYY-MM-DD HH24:MI') AS SCHED_DEP_TIME,
    TO_CHAR(fi.ACTUAL_DEPARTURE, 'YYYY-MM-DD HH24:MI') AS ACTUAL_DEP_TIME,
    TO_CHAR(fi.SCHEDULED_ARRIVAL, 'YYYY-MM-DD HH24:MI') AS SCHED_ARR_TIME,
    g.TERMINAL,
    g.GATE_NUMBER,
    fi.STATUS,
    fi.REMARKS
FROM FLIGHT_INSTANCES fi
JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
JOIN AIRPORTS orig ON f.ORIGIN_AIRPORT = orig.AIRPORT_CODE
JOIN AIRPORTS dest ON f.DEST_AIRPORT = dest.AIRPORT_CODE
LEFT JOIN GATES g ON fi.DEPARTURE_GATE_ID = g.GATE_ID;

-- 2. View: Passenger Manifest Detail
CREATE OR REPLACE VIEW vw_passenger_manifest AS
SELECT 
    fi.FLIGHT_INSTANCE_ID,
    fi.FLIGHT_NUMBER,
    fi.FLIGHT_DATE,
    t.TICKET_NUMBER,
    b.BOOKING_REFERENCE AS PNR,
    p.FIRST_NAME || ' ' || p.LAST_NAME AS PASSENGER_NAME,
    p.PASSPORT_NUMBER,
    p.GENDER,
    t.SEAT_NUMBER,
    t.CABIN_CLASS,
    t.PRICE AS TICKET_PRICE,
    t.STATUS AS TICKET_STATUS,
    ci.BOARDING_PASS_CODE,
    ci.STATUS AS CHECKIN_STATUS
FROM TICKETS t
JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID
JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
LEFT JOIN CHECK_IN ci ON t.TICKET_ID = ci.TICKET_ID;

-- 3. View: Gate Utilization & Status Overview
CREATE OR REPLACE VIEW vw_gate_utilization AS
SELECT 
    g.GATE_ID,
    g.AIRPORT_CODE,
    g.TERMINAL,
    g.GATE_NUMBER,
    g.STATUS AS GATE_STATUS,
    fi.FLIGHT_INSTANCE_ID,
    fi.FLIGHT_NUMBER,
    fi.SCHEDULED_DEPARTURE,
    fi.STATUS AS FLIGHT_STATUS
FROM GATES g
LEFT JOIN FLIGHT_INSTANCES fi 
    ON g.GATE_ID = fi.DEPARTURE_GATE_ID 
   AND fi.STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED');

-- 4. View: Commercial Revenue & Booking Summary
CREATE OR REPLACE VIEW vw_revenue_summary AS
SELECT 
    al.AIRLINE_NAME,
    t.CABIN_CLASS,
    COUNT(t.TICKET_ID) AS TICKETS_SOLD,
    SUM(CASE WHEN t.STATUS != 'CANCELLED' THEN t.PRICE ELSE 0 END) AS NET_REVENUE,
    ROUND(AVG(CASE WHEN t.STATUS != 'CANCELLED' THEN t.PRICE ELSE NULL END), 2) AS AVG_TICKET_PRICE,
    SUM(CASE WHEN t.STATUS = 'CANCELLED' THEN 1 ELSE 0 END) AS TOTAL_CANCELLATIONS
FROM TICKETS t
JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID
JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
JOIN AIRLINES al ON f.AIRLINE_CODE = al.AIRLINE_CODE
GROUP BY al.AIRLINE_NAME, t.CABIN_CLASS;

COMMENT ON VIEW vw_flight_board IS 'Consolidated flight schedule and gate information display.';
COMMENT ON VIEW vw_passenger_manifest IS 'Passenger manifest details with seat assignments and check-in codes.';
COMMENT ON VIEW vw_revenue_summary IS 'Financial revenue aggregates grouped by airline and cabin class.';
