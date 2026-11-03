-- ============================================================================
-- SCRIPT: flight_procedures.sql
-- MODULE: Flight Management Procedures
-- DESCRIPTION: PL/SQL procedures for scheduling flights, assigning gates, and updating status.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- 1. Procedure to Register a Master Flight Route
CREATE OR REPLACE PROCEDURE sp_register_flight_route (
    p_flight_number             IN VARCHAR2,
    p_airline_code              IN VARCHAR2,
    p_origin_airport            IN VARCHAR2,
    p_dest_airport              IN VARCHAR2,
    p_departure_time            IN VARCHAR2,
    p_arrival_time              IN VARCHAR2,
    p_flight_type               IN VARCHAR2 DEFAULT 'DIRECT',
    p_base_fare                 IN NUMBER DEFAULT 5000.00
) AS
BEGIN
    INSERT INTO FLIGHTS (
        FLIGHT_NUMBER, AIRLINE_CODE, ORIGIN_AIRPORT, DEST_AIRPORT,
        SCHEDULED_DEPARTURE_TIME, SCHEDULED_ARRIVAL_TIME, FLIGHT_TYPE, BASE_FARE
    ) VALUES (
        UPPER(p_flight_number), UPPER(p_airline_code), UPPER(p_origin_airport), UPPER(p_dest_airport),
        p_departure_time, p_arrival_time, UPPER(p_flight_type), p_base_fare
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Flight route ' || UPPER(p_flight_number) || ' successfully registered.');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Error: Flight route ' || p_flight_number || ' already exists.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Error registering flight: ' || SQLERRM);
END sp_register_flight_route;
/

-- 2. Procedure to Schedule a Daily Flight Instance
CREATE OR REPLACE PROCEDURE sp_schedule_flight_instance (
    p_flight_number         IN VARCHAR2,
    p_flight_date           IN DATE,
    p_aircraft_id           IN NUMBER DEFAULT NULL,
    p_departure_gate_id     IN NUMBER DEFAULT NULL,
    p_scheduled_departure   IN TIMESTAMP,
    p_scheduled_arrival     IN TIMESTAMP,
    o_instance_id           OUT NUMBER
) AS
    v_count NUMBER;
BEGIN
    -- Verify master flight exists
    SELECT COUNT(*) INTO v_count FROM FLIGHTS WHERE FLIGHT_NUMBER = UPPER(p_flight_number);
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Master flight ' || p_flight_number || ' does not exist.');
    END IF;

    -- Verify times
    IF p_scheduled_arrival <= p_scheduled_departure THEN
        RAISE_APPLICATION_ERROR(-20004, 'Arrival time must be after departure time.');
    END IF;

    INSERT INTO FLIGHT_INSTANCES (
        FLIGHT_NUMBER, FLIGHT_DATE, AIRCRAFT_ID, DEPARTURE_GATE_ID,
        SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL, STATUS
    ) VALUES (
        UPPER(p_flight_number), TRUNC(p_flight_date), p_aircraft_id, p_departure_gate_id,
        p_scheduled_departure, p_scheduled_arrival, 'SCHEDULED'
    ) RETURNING FLIGHT_INSTANCE_ID INTO o_instance_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Flight instance scheduled successfully. Instance ID: ' || o_instance_id);
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20005, 'Flight ' || p_flight_number || ' is already scheduled on date ' || TO_CHAR(p_flight_date, 'YYYY-MM-DD'));
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20006, 'Error scheduling flight instance: ' || SQLERRM);
END sp_schedule_flight_instance;
/

-- 3. Procedure to Assign a Gate with Conflict Detection
CREATE OR REPLACE PROCEDURE sp_assign_gate (
    p_flight_instance_id    IN NUMBER,
    p_gate_id               IN NUMBER
) AS
    v_sched_dep TIMESTAMP;
    v_sched_arr TIMESTAMP;
    v_conflict_count NUMBER;
    v_gate_status VARCHAR2(20);
BEGIN
    -- Get flight times
    SELECT SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL
    INTO v_sched_dep, v_sched_arr
    FROM FLIGHT_INSTANCES
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id;

    -- Check gate operational status
    SELECT STATUS INTO v_gate_status FROM GATES WHERE GATE_ID = p_gate_id;
    IF v_gate_status = 'MAINTENANCE' THEN
        RAISE_APPLICATION_ERROR(-20007, 'Cannot assign gate: Gate is currently under maintenance.');
    END IF;

    -- Check for overlapping flight allocations at the same gate (30-minute buffer window)
    SELECT COUNT(*) INTO v_conflict_count
    FROM FLIGHT_INSTANCES
    WHERE DEPARTURE_GATE_ID = p_gate_id
      AND FLIGHT_INSTANCE_ID != p_flight_instance_id
      AND STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED')
      AND (
          (SCHEDULED_DEPARTURE BETWEEN (v_sched_dep - INTERVAL '30' MINUTE) AND (v_sched_dep + INTERVAL '30' MINUTE))
      );

    IF v_conflict_count > 0 THEN
        -- Log conflict to OPERATIONAL_LOGS
        INSERT INTO OPERATIONAL_LOGS (
            EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN, REQUIRES_ADMIN_APPROVAL, APPROVAL_STATUS
        ) VALUES (
            'CONFLICT_DETECTED', 'WARNING',
            'Overlapping gate assignment detected for Gate ID: ' || p_gate_id || ' and Flight Instance ID: ' || p_flight_instance_id,
            'Gate assignment blocked by validation procedure', 'N', 'NOT_REQUIRED'
        );
        COMMIT;

        RAISE_APPLICATION_ERROR(-20008, 'Gate Conflict: Another active flight is assigned to this gate during the selected time window.');
    END IF;

    -- Update gate assignment
    UPDATE FLIGHT_INSTANCES
    SET DEPARTURE_GATE_ID = p_gate_id
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Gate ' || p_gate_id || ' successfully assigned to flight instance ' || p_flight_instance_id);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20009, 'Flight instance or Gate record not found.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_assign_gate;
/

-- 4. Procedure to Update Flight Status & Dispatch Alerts
CREATE OR REPLACE PROCEDURE sp_update_flight_status (
    p_flight_instance_id    IN NUMBER,
    p_new_status            IN VARCHAR2,
    p_reason                IN VARCHAR2 DEFAULT NULL,
    p_changed_by_user_id    IN NUMBER DEFAULT NULL
) AS
    v_old_status VARCHAR2(20);
    v_flight_num VARCHAR2(10);
BEGIN
    SELECT STATUS, FLIGHT_NUMBER
    INTO v_old_status, v_flight_num
    FROM FLIGHT_INSTANCES
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id;

    IF v_old_status = p_new_status THEN
        DBMS_OUTPUT.PUT_LINE('Status is already ' || p_new_status || '. No update performed.');
        RETURN;
    END IF;

    -- Update flight status
    UPDATE FLIGHT_INSTANCES
    SET STATUS = UPPER(p_new_status),
        REMARKS = p_reason
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id;

    -- Audit in FLIGHT_STATUS_HISTORY
    INSERT INTO FLIGHT_STATUS_HISTORY (
        FLIGHT_INSTANCE_ID, OLD_STATUS, NEW_STATUS, REASON, CHANGED_BY_USER_ID
    ) VALUES (
        p_flight_instance_id, v_old_status, UPPER(p_new_status), p_reason, p_changed_by_user_id
    );

    -- Notify all booked passengers for this flight instance
    INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, NOTIFICATION_TYPE)
    SELECT DISTINCT b.USER_ID,
           'Flight Status Update: ' || v_flight_num,
           'Your flight ' || v_flight_num || ' status has changed from ' || v_old_status || ' to ' || UPPER(p_new_status) ||
           CASE WHEN p_reason IS NOT NULL THEN ' Reason: ' || p_reason ELSE '' END,
           'FLIGHT_DELAY'
    FROM TICKETS t
    JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
    WHERE t.FLIGHT_INSTANCE_ID = p_flight_instance_id
      AND t.STATUS != 'CANCELLED';

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Flight status updated to ' || UPPER(p_new_status) || ' and passenger alerts dispatched.');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20010, 'Flight instance ID ' || p_flight_instance_id || ' does not exist.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20011, 'Error updating flight status: ' || SQLERRM);
END sp_update_flight_status;
/
