-- ============================================================================
-- SCRIPT: 02_airline_tables.sql
-- MODULE: Airline Management
-- DESCRIPTION: Creates the AIRLINES table storing commercial air carriers.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE AIRLINES CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN
            RAISE;
        END IF;
END;
/

CREATE TABLE AIRLINES (
    AIRLINE_CODE        VARCHAR2(3)     NOT NULL,
    AIRLINE_NAME        VARCHAR2(100)   NOT NULL,
    THREE_DIGIT_CODE    VARCHAR2(3),
    COUNTRY             VARCHAR2(50)    NOT NULL,
    CONTACT_EMAIL       VARCHAR2(100),
    IS_ACTIVE           CHAR(1)         DEFAULT 'Y' NOT NULL,
    CREATED_AT          TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,

    -- Primary Key: 2 or 3 character IATA/ICAO airline code (e.g., 'AI', 'AA', 'BA')
    CONSTRAINT pk_airlines PRIMARY KEY (AIRLINE_CODE),

    -- Unique Constraint: 3-digit numerical accounting code (e.g., '098' for Air India)
    CONSTRAINT uq_airline_3digit UNIQUE (THREE_DIGIT_CODE),

    -- Check Constraints
    CONSTRAINT chk_airline_code CHECK (AIRLINE_CODE = UPPER(AIRLINE_CODE)),
    CONSTRAINT chk_airlines_active CHECK (IS_ACTIVE IN ('Y', 'N'))
);

COMMENT ON TABLE AIRLINES IS 'Stores registered commercial airlines and accounting codes.';
COMMENT ON COLUMN AIRLINES.AIRLINE_CODE IS 'Primary key: 2-3 character carrier identifier.';
COMMENT ON COLUMN AIRLINES.THREE_DIGIT_CODE IS 'IATA 3-digit numeric airline accounting code.';
