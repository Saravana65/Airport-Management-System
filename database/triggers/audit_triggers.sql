-- ============================================================================
-- SCRIPT: audit_triggers.sql
-- MODULE: System Activity & Security Audit Triggers
-- DESCRIPTION: Triggers that automatically record security and operational events.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- 1. Trigger: Audit Ticket Cancellations
CREATE OR REPLACE TRIGGER trg_audit_ticket_cancellation
AFTER UPDATE OF STATUS ON TICKETS
FOR EACH ROW
WHEN (OLD.STATUS != 'CANCELLED' AND NEW.STATUS = 'CANCELLED')
DECLARE
BEGIN
    INSERT INTO OPERATIONAL_LOGS (
        EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN
    ) VALUES (
        'TICKET_CANCELLED', 'INFO',
        'Ticket ' || :OLD.TICKET_NUMBER || ' (Flight Instance: ' || :OLD.FLIGHT_INSTANCE_ID ||
        ', Seat: ' || NVL(:OLD.SEAT_NUMBER, 'N/A') || ') cancelled.',
        'Seat released and status recorded'
    );
END;
/

-- 2. Trigger: Audit New User Account Creation
CREATE OR REPLACE TRIGGER trg_audit_user_registration
AFTER INSERT ON USERS
FOR EACH ROW
DECLARE
BEGIN
    INSERT INTO OPERATIONAL_LOGS (
        EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN
    ) VALUES (
        'USER_REGISTERED', 'INFO',
        'New user registered: ' || :NEW.EMAIL || ' with role ' || :NEW.ROLE,
        'Account created and active'
    );
END;
/

-- 3. Trigger: Audit Aircraft Maintenance Status
CREATE OR REPLACE TRIGGER trg_audit_aircraft_status
AFTER UPDATE OF STATUS ON AIRCRAFT
FOR EACH ROW
WHEN (OLD.STATUS != NEW.STATUS)
DECLARE
BEGIN
    INSERT INTO OPERATIONAL_LOGS (
        EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN, REQUIRES_ADMIN_APPROVAL
    ) VALUES (
        'AIRCRAFT_STATUS_CHANGE',
        CASE WHEN :NEW.STATUS = 'MAINTENANCE' THEN 'WARNING' ELSE 'INFO' END,
        'Aircraft ' || :NEW.REGISTRATION_NO || ' (' || :NEW.MODEL || ') changed from ' || :OLD.STATUS || ' to ' || :NEW.STATUS,
        'Fleet availability updated',
        CASE WHEN :NEW.STATUS = 'MAINTENANCE' THEN 'Y' ELSE 'N' END
    );
END;
/
