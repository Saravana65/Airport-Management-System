-- ============================================================================
-- SCRIPT: 01_airport_tables.sql
-- MODULE: Airport Management
-- DESCRIPTION: Creates the core AIRPORTS table using standard Oracle SQL.
-- AUTHOR: Saravana (BTech Student Project)
-- ============================================================================

-- Drop table if already exists (safe re-run script)
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE AIRPORTS CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN
            RAISE;
        END IF;
END;
/

CREATE TABLE AIRPORTS (
    AIRPORT_CODE    VARCHAR2(3)     NOT NULL,
    AIRPORT_NAME    VARCHAR2(100)   NOT NULL,
    CITY            VARCHAR2(50)    NOT NULL,
    STATE           VARCHAR2(50),
    COUNTRY         VARCHAR2(50)    NOT NULL,
    TIMEZONE        VARCHAR2(50)    DEFAULT 'UTC' NOT NULL,
    IS_ACTIVE       CHAR(1)         DEFAULT 'Y' NOT NULL,
    CREATED_AT      TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,

    -- Primary Key: Standard 3-letter IATA code (e.g., 'BOM', 'JFK', 'LHR')
    CONSTRAINT pk_airports PRIMARY KEY (AIRPORT_CODE),

    -- Check Constraint: AIRPORT_CODE must be exactly 3 uppercase letters
    CONSTRAINT chk_airport_code_format CHECK (LENGTH(AIRPORT_CODE) = 3 AND AIRPORT_CODE = UPPER(AIRPORT_CODE)),

    -- Check Constraint: Active flag must be 'Y' or 'N'
    CONSTRAINT chk_airports_active CHECK (IS_ACTIVE IN ('Y', 'N'))
);

-- Table Comment for Data Dictionary
COMMENT ON TABLE AIRPORTS IS 'Stores international and domestic airport facilities identified by IATA code.';
COMMENT ON COLUMN AIRPORTS.AIRPORT_CODE IS 'Primary key: Official 3-letter IATA airport code.';
COMMENT ON COLUMN AIRPORTS.TIMEZONE IS 'Standard IANA timezone string for flight arrival/departure calculations.';
