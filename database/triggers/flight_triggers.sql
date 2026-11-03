-- ============================================================================
-- SCRIPT: flight_triggers.sql
-- MODULE: Flight Event Triggers & Conflict Sentinels
-- DESCRIPTION: Triggers for flight delay auditing and autonomous gate collision prevention.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- 1. Trigger: Audit Flight Status Transitions
CREATE OR REPLACE TRIGGER trg_flight_status_audit
AFTER UPDATE OF STATUS ON FLIGHT_INSTANCES
FOR EACH ROW
WHEN (OLD.STATUS != NEW.STATUS)
DECLARE
BEGIN
    -- Record status transition in FLIGHT_STATUS_HISTORY
    INSERT INTO FLIGHT_STATUS_HISTORY (
        FLIGHT_INSTANCE_ID, OLD_STATUS, NEW_STATUS, REASON, CHANGED_AT
    ) VALUES (
        :NEW.FLIGHT_INSTANCE_ID, :OLD.STATUS, :NEW.STATUS, :NEW.REMARKS, SYSTIMESTAMP
    );

    -- If flight becomes DELAYED or CANCELLED, log critical event in OPERATIONAL_LOGS
    IF :NEW.STATUS IN ('DELAYED', 'CANCELLED') THEN
        INSERT INTO OPERATIONAL_LOGS (
            EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN
        ) VALUES (
            'DELAY_DETECTED',
            CASE WHEN :NEW.STATUS = 'CANCELLED' THEN 'CRITICAL' ELSE 'WARNING' END,
            'Flight ' || :NEW.FLIGHT_NUMBER || ' transitioned from ' || :OLD.STATUS || ' to ' || :NEW.STATUS,
            'Logged to status history and queued for passenger notification'
        );
    END IF;
END;
/

-- 2. Trigger: Autonomous Gate Conflict Sentinel
CREATE OR REPLACE TRIGGER trg_prevent_gate_conflict
BEFORE INSERT OR UPDATE OF DEPARTURE_GATE_ID, SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL ON FLIGHT_INSTANCES
FOR EACH ROW
WHEN (NEW.DEPARTURE_GATE_ID IS NOT NULL AND NEW.STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED'))
DECLARE
    v_overlap_count NUMBER := 0;
BEGIN
    -- Query for overlapping flights at the same gate within a 30-minute buffer window
    SELECT COUNT(*) INTO v_overlap_count
    FROM FLIGHT_INSTANCES
    WHERE DEPARTURE_GATE_ID = :NEW.DEPARTURE_GATE_ID
      AND FLIGHT_INSTANCE_ID != NVL(:NEW.FLIGHT_INSTANCE_ID, -1)
      AND STATUS NOT IN ('CANCELLED', 'ARRIVED', 'DEPARTED')
      AND (
          (:NEW.SCHEDULED_DEPARTURE BETWEEN (SCHEDULED_DEPARTURE - INTERVAL '30' MINUTE) AND (SCHEDULED_DEPARTURE + INTERVAL '30' MINUTE))
          OR
          (SCHEDULED_DEPARTURE BETWEEN (:NEW.SCHEDULED_DEPARTURE - INTERVAL '30' MINUTE) AND (:NEW.SCHEDULED_DEPARTURE + INTERVAL '30' MINUTE))
      );

    IF v_overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(
            -20031,
            'Autonomous Sentinel Conflict: Gate ID ' || :NEW.DEPARTURE_GATE_ID ||
            ' already has an overlapping flight assignment within the 30-minute safety window.'
        );
    END IF;
END;
/
