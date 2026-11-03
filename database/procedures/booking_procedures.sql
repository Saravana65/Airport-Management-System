-- ============================================================================
-- SCRIPT: booking_procedures.sql
-- MODULE: Reservation, Ticketing, Check-in & Baggage Operations
-- DESCRIPTION: Transaction-safe procedures for booking, cancellation, check-in, and baggage intake.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- 1. Procedure to Book a Ticket (Transaction-Safe)
CREATE OR REPLACE PROCEDURE sp_book_ticket (
    p_user_id               IN NUMBER,
    p_flight_instance_id    IN NUMBER,
    p_first_name            IN VARCHAR2,
    p_last_name             IN VARCHAR2,
    p_passport_number       IN VARCHAR2,
    p_seat_number           IN VARCHAR2,
    p_cabin_class           IN VARCHAR2,
    p_price                 IN NUMBER,
    o_booking_ref           OUT VARCHAR2,
    o_ticket_number         OUT VARCHAR2
) AS
    v_passenger_id NUMBER;
    v_booking_id NUMBER;
    v_seat_taken NUMBER;
    v_flight_status VARCHAR2(20);
BEGIN
    -- 1. Verify flight instance is bookable
    SELECT STATUS INTO v_flight_status
    FROM FLIGHT_INSTANCES
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id;

    IF v_flight_status IN ('CANCELLED', 'DEPARTED', 'ARRIVED') THEN
        RAISE_APPLICATION_ERROR(-20020, 'Cannot book: Flight instance is ' || v_flight_status);
    END IF;

    -- 2. Prevent duplicate seat allocation (Application-level validation before DB constraint)
    SELECT COUNT(*) INTO v_seat_taken
    FROM TICKETS
    WHERE FLIGHT_INSTANCE_ID = p_flight_instance_id
      AND SEAT_NUMBER = UPPER(p_seat_number)
      AND STATUS != 'CANCELLED';

    IF v_seat_taken > 0 THEN
        -- Log attempt in OPERATIONAL_LOGS
        INSERT INTO OPERATIONAL_LOGS (
            EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN, REQUIRES_ADMIN_APPROVAL
        ) VALUES (
            'DUPLICATE_BOOKING', 'WARNING',
            'Attempted double-booking for Seat: ' || p_seat_number || ' on Flight Instance: ' || p_flight_instance_id,
            'Rejected duplicate seat booking attempt', 'N'
        );
        COMMIT;

        RAISE_APPLICATION_ERROR(-20021, 'Seat ' || p_seat_number || ' is already booked on this flight.');
    END IF;

    -- 3. Find or Create Passenger record
    BEGIN
        SELECT PASSENGER_ID INTO v_passenger_id
        FROM PASSENGERS
        WHERE PASSPORT_NUMBER = UPPER(p_passport_number);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            INSERT INTO PASSENGERS (USER_ID, FIRST_NAME, LAST_NAME, PASSPORT_NUMBER)
            VALUES (p_user_id, UPPER(p_first_name), UPPER(p_last_name), UPPER(p_passport_number))
            RETURNING PASSENGER_ID INTO v_passenger_id;
    END;

    -- 4. Generate unique 6-character PNR (e.g., 'PNR' || random 4-digit number)
    o_booking_ref := 'PNR' || LPAD(TRUNC(DBMS_RANDOM.VALUE(1000, 9999)), 4, '0');

    -- Create Booking
    INSERT INTO BOOKINGS (BOOKING_REFERENCE, USER_ID, TOTAL_AMOUNT, STATUS)
    VALUES (o_booking_ref, p_user_id, p_price, 'CONFIRMED')
    RETURNING BOOKING_ID INTO v_booking_id;

    -- 5. Generate 13-digit standard e-ticket number
    o_ticket_number := '098' || TO_CHAR(SYSTIMESTAMP, 'YYMMDD') || LPAD(TRUNC(DBMS_RANDOM.VALUE(1000, 9999)), 4, '0');

    -- Issue Ticket
    INSERT INTO TICKETS (
        BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, TICKET_NUMBER,
        SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS
    ) VALUES (
        v_booking_id, p_flight_instance_id, v_passenger_id, o_ticket_number,
        UPPER(p_seat_number), UPPER(p_cabin_class), p_price, 'ISSUED'
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Booking successful! PNR: ' || o_booking_ref || ', Ticket: ' || o_ticket_number);
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20022, 'Concurrency Conflict: Seat was reserved by another user. Please select a different seat.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_book_ticket;
/

-- 2. Procedure to Cancel a Booking
CREATE OR REPLACE PROCEDURE sp_cancel_booking (
    p_booking_reference IN VARCHAR2
) AS
    v_booking_id NUMBER;
    v_status VARCHAR2(20);
BEGIN
    SELECT BOOKING_ID, STATUS INTO v_booking_id, v_status
    FROM BOOKINGS
    WHERE BOOKING_REFERENCE = UPPER(p_booking_reference);

    IF v_status = 'CANCELLED' THEN
        DBMS_OUTPUT.PUT_LINE('Booking ' || p_booking_reference || ' is already cancelled.');
        RETURN;
    END IF;

    -- Update booking status
    UPDATE BOOKINGS
    SET STATUS = 'CANCELLED'
    WHERE BOOKING_ID = v_booking_id;

    -- Update tickets and release seat numbers so seats become bookable again
    UPDATE TICKETS
    SET STATUS = 'CANCELLED',
        SEAT_NUMBER = NULL
    WHERE BOOKING_ID = v_booking_id;

    -- Log cancellation in OPERATIONAL_LOGS
    INSERT INTO OPERATIONAL_LOGS (
        EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN
    ) VALUES (
        'TICKET_CANCELLED', 'INFO',
        'Booking cancelled for PNR: ' || UPPER(p_booking_reference),
        'Tickets marked CANCELLED and seat numbers released.'
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Booking ' || UPPER(p_booking_reference) || ' and associated tickets cancelled successfully.');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20023, 'Booking reference ' || p_booking_reference || ' not found.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20024, 'Error cancelling booking: ' || SQLERRM);
END sp_cancel_booking;
/

-- 3. Procedure to Check-in a Passenger
CREATE OR REPLACE PROCEDURE sp_check_in_passenger (
    p_ticket_number         IN VARCHAR2,
    o_boarding_pass_code    OUT VARCHAR2
) AS
    v_ticket_id NUMBER;
    v_ticket_status VARCHAR2(20);
    v_flight_instance_id NUMBER;
    v_gate_id NUMBER;
    v_seat_no VARCHAR2(5);
    v_sched_dep TIMESTAMP;
BEGIN
    -- Query ticket details
    SELECT TICKET_ID, STATUS, FLIGHT_INSTANCE_ID, SEAT_NUMBER
    INTO v_ticket_id, v_ticket_status, v_flight_instance_id, v_seat_no
    FROM TICKETS
    WHERE TICKET_NUMBER = p_ticket_number;

    IF v_ticket_status = 'CANCELLED' THEN
        RAISE_APPLICATION_ERROR(-20025, 'Cannot check in: Ticket is CANCELLED.');
    ELSIF v_ticket_status = 'CHECKED_IN' THEN
        RAISE_APPLICATION_ERROR(-20026, 'Passenger is already checked in for this ticket.');
    ELSIF v_seat_no IS NULL THEN
        RAISE_APPLICATION_ERROR(-20027, 'Cannot check in: No seat allocated to ticket.');
    END IF;

    -- Get gate and departure time
    SELECT DEPARTURE_GATE_ID, SCHEDULED_DEPARTURE
    INTO v_gate_id, v_sched_dep
    FROM FLIGHT_INSTANCES
    WHERE FLIGHT_INSTANCE_ID = v_flight_instance_id;

    -- Generate unique Boarding Pass code
    o_boarding_pass_code := 'BP-' || SUBSTR(p_ticket_number, -6) || '-' || v_seat_no;

    -- Insert check-in record
    INSERT INTO CHECK_IN (
        TICKET_ID, BOARDING_PASS_CODE, BOARDING_TIME, GATE_ID, STATUS
    ) VALUES (
        v_ticket_id, o_boarding_pass_code, (v_sched_dep - INTERVAL '45' MINUTE), v_gate_id, 'COMPLETED'
    );

    -- Update ticket status
    UPDATE TICKETS
    SET STATUS = 'CHECKED_IN'
    WHERE TICKET_ID = v_ticket_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Check-in complete. Boarding Pass: ' || o_boarding_pass_code);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20028, 'Ticket number ' || p_ticket_number || ' not found.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_check_in_passenger;
/

-- 4. Procedure to Record Checked Baggage
CREATE OR REPLACE PROCEDURE sp_record_baggage (
    p_ticket_number     IN VARCHAR2,
    p_weight_kg         IN NUMBER,
    o_bag_tag_number    OUT VARCHAR2
) AS
    v_ticket_id NUMBER;
    v_ticket_status VARCHAR2(20);
BEGIN
    SELECT TICKET_ID, STATUS INTO v_ticket_id, v_ticket_status
    FROM TICKETS
    WHERE TICKET_NUMBER = p_ticket_number;

    IF v_ticket_status = 'CANCELLED' THEN
        RAISE_APPLICATION_ERROR(-20029, 'Cannot check baggage on a CANCELLED ticket.');
    END IF;

    IF p_weight_kg > 32.0 THEN
        DBMS_OUTPUT.PUT_LINE('Warning: Baggage exceeds standard 32kg allowance. Heavy baggage tag applied.');
    END IF;

    -- Generate barcode tag number
    o_bag_tag_number := 'BAG-' || SUBSTR(p_ticket_number, -4) || '-' || LPAD(TRUNC(DBMS_RANDOM.VALUE(100, 999)), 3, '0');

    INSERT INTO BAGGAGE (
        TICKET_ID, TAG_NUMBER, WEIGHT_KG, STATUS
    ) VALUES (
        v_ticket_id, o_bag_tag_number, p_weight_kg, 'CHECKED_IN'
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Baggage registered. Tag Number: ' || o_bag_tag_number);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20030, 'Ticket number ' || p_ticket_number || ' not found.');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_record_baggage;
/
