-- ============================================================================
-- SCRIPT: master_setup.sql
-- PROJECT: Airport Management System
-- DESCRIPTION: Master installation script. Executes all schema scripts, procedures,
--              triggers, views, and seed data in strict dependency order.
-- USAGE IN SQL*PLUS / SQL DEVELOPER:
--    @master_setup.sql
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

SET ECHO ON;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT ============================================================================
PROMPT STARTING MASTER DEPLOYMENT: AIRPORT MANAGEMENT SYSTEM
PROMPT ============================================================================

PROMPT [1/14] Deploying 01_airport_tables.sql...
@@schema/01_airport_tables.sql

PROMPT [2/14] Deploying 02_airline_tables.sql...
@@schema/02_airline_tables.sql

PROMPT [3/14] Deploying 03_gate_tables.sql...
@@schema/03_gate_tables.sql

PROMPT [4/14] Deploying 04_aircraft_tables.sql...
@@schema/04_aircraft_tables.sql

PROMPT [5/14] Deploying 05_flight_tables.sql...
@@schema/05_flight_tables.sql

PROMPT [6/14] Deploying 06_user_and_passenger_tables.sql...
@@schema/06_user_and_passenger_tables.sql

PROMPT [7/14] Deploying 07_employee_tables.sql...
@@schema/07_employee_tables.sql

PROMPT [8/14] Deploying 08_booking_tables.sql...
@@schema/08_booking_tables.sql

PROMPT [9/14] Deploying 09_baggage_and_checkin_tables.sql...
@@schema/09_baggage_and_checkin_tables.sql

PROMPT [10/14] Deploying 10_operational_tables.sql...
@@schema/10_operational_tables.sql

PROMPT [11/14] Compiling Stored Procedures (flight_procedures.sql & booking_procedures.sql)...
@@procedures/flight_procedures.sql
@@procedures/booking_procedures.sql

PROMPT [12/14] Compiling Database Triggers (flight_triggers.sql & audit_triggers.sql)...
@@triggers/flight_triggers.sql
@@triggers/audit_triggers.sql

PROMPT [13/14] Compiling Analytical Views (airport_views.sql)...
@@views/airport_views.sql

PROMPT [14/14] Ingesting Realistic Sample Data (insert_sample_data.sql)...
@@sample_data/insert_sample_data.sql

PROMPT ============================================================================
PROMPT MASTER DEPLOYMENT COMPLETE! VERIFYING OBJECT COUNTS...
PROMPT ============================================================================

SELECT object_type, count(*) AS total_objects
FROM user_objects
WHERE object_name NOT LIKE 'BIN$%'
GROUP BY object_type
ORDER BY object_type;

PROMPT All tables, views, procedures, and triggers are compiled and ready.
