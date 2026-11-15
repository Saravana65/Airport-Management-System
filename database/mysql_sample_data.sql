-- ============================================================================
-- SCRIPT: mysql_sample_data.sql
-- PROJECT: Airport Management System
-- TARGET: MySQL 8.0+
-- DESCRIPTION: Inserts realistic seed data into MySQL with correct relationships.
-- ============================================================================

USE airport_management_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE OPERATIONAL_LOGS;
TRUNCATE TABLE NOTIFICATIONS;
TRUNCATE TABLE FLIGHT_STATUS_HISTORY;
TRUNCATE TABLE BAGGAGE;
TRUNCATE TABLE CHECK_IN;
TRUNCATE TABLE TICKETS;
TRUNCATE TABLE BOOKINGS;
TRUNCATE TABLE EMPLOYEES;
TRUNCATE TABLE PASSENGERS;
TRUNCATE TABLE USERS;
TRUNCATE TABLE FLIGHT_INSTANCES;
TRUNCATE TABLE FLIGHTS;
TRUNCATE TABLE AIRCRAFT;
TRUNCATE TABLE GATES;
TRUNCATE TABLE AIRLINES;
TRUNCATE TABLE AIRPORTS;

-- 1. AIRPORTS
INSERT INTO AIRPORTS (AIRPORT_CODE, AIRPORT_NAME, CITY, STATE, COUNTRY, TIMEZONE) VALUES
('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'Maharashtra', 'India', 'Asia/Kolkata'),
('DEL', 'Indira Gandhi International Airport', 'Delhi', 'Delhi', 'India', 'Asia/Kolkata'),
('JFK', 'John F. Kennedy International Airport', 'New York', 'New York', 'United States', 'America/New_York'),
('DFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'Texas', 'United States', 'America/Chicago'),
('SFO', 'San Francisco International Airport', 'San Francisco', 'California', 'United States', 'America/Los_Angeles'),
('LHR', 'Heathrow Airport', 'London', 'Greater London', 'United Kingdom', 'Europe/London');

-- 2. AIRLINES
INSERT INTO AIRLINES (AIRLINE_CODE, AIRLINE_NAME, THREE_DIGIT_CODE, COUNTRY, CONTACT_EMAIL) VALUES
('AI', 'Air India Limited', '098', 'India', 'support@airindia.in'),
('AA', 'American Airlines', '001', 'United States', 'reservations@aa.com'),
('BA', 'British Airways', '125', 'United Kingdom', 'customer.service@ba.com'),
('LH', 'Lufthansa German Airlines', '220', 'Germany', 'service@lufthansa.de'),
('EK', 'Emirates', '176', 'United Arab Emirates', 'help@emirates.com');

-- 3. GATES
INSERT INTO GATES (GATE_ID, AIRPORT_CODE, TERMINAL, GATE_NUMBER, STATUS) VALUES
(1, 'BOM', 'T2', 'G01', 'AVAILABLE'),
(2, 'BOM', 'T2', 'G02', 'AVAILABLE'),
(3, 'BOM', 'T2', 'G03', 'AVAILABLE'),
(4, 'DEL', 'T3', 'G10', 'AVAILABLE'),
(5, 'DEL', 'T3', 'G11', 'AVAILABLE'),
(6, 'JFK', 'T4', 'G04', 'AVAILABLE'),
(7, 'JFK', 'T4', 'G05', 'AVAILABLE'),
(8, 'DFW', 'T1', 'A12', 'AVAILABLE'),
(9, 'DFW', 'T1', 'A14', 'AVAILABLE'),
(10, 'SFO', 'T2', 'D01', 'AVAILABLE'),
(11, 'LHR', 'T5', 'A01', 'AVAILABLE');

-- 4. AIRCRAFT
INSERT INTO AIRCRAFT (AIRCRAFT_ID, REGISTRATION_NO, MODEL, AIRLINE_CODE, TOTAL_SEATS, ECONOMY_SEATS, BUSINESS_SEATS, FIRST_SEATS, STATUS) VALUES
(1, 'VT-ANX', 'Boeing 777-300ER', 'AI', 342, 300, 38, 4, 'ACTIVE'),
(2, 'VT-EXG', 'Airbus A320neo', 'AI', 180, 168, 12, 0, 'ACTIVE'),
(3, 'N789AA', 'Boeing 787-9 Dreamliner', 'AA', 285, 234, 30, 21, 'ACTIVE'),
(4, 'G-ZBLA', 'Boeing 787-10', 'BA', 256, 199, 48, 9, 'ACTIVE'),
(5, 'D-AIMA', 'Airbus A380-800', 'LH', 509, 371, 78, 60, 'ACTIVE'),
(6, 'A6-EKA', 'Boeing 777-200LR', 'EK', 302, 264, 38, 0, 'ACTIVE');

-- 5. FLIGHTS (Routes)
INSERT INTO FLIGHTS (FLIGHT_NUMBER, AIRLINE_CODE, ORIGIN_AIRPORT, DEST_AIRPORT, SCHEDULED_DEPARTURE_TIME, SCHEDULED_ARRIVAL_TIME, FLIGHT_TYPE, BASE_FARE) VALUES
('AI2014', 'AI', 'BOM', 'DFW', '02:10', '14:30', 'NON-STOP', 75000.00),
('AI101', 'AI', 'DEL', 'JFK', '01:30', '07:00', 'NON-STOP', 68000.00),
('AI680', 'AI', 'BOM', 'DEL', '06:00', '08:15', 'DIRECT', 5500.00),
('AA4367', 'AA', 'SFO', 'LHR', '18:10', '12:30', 'NON-STOP', 82000.00),
('AA120', 'AA', 'DFW', 'JFK', '09:00', '13:15', 'DIRECT', 18000.00),
('BA1689', 'BA', 'LHR', 'DEL', '10:20', '23:45', 'NON-STOP', 62000.00),
('EK501', 'EK', 'BOM', 'LHR', '04:30', '09:15', 'NON-STOP', 58000.00),
('LH756', 'LH', 'DEL', 'BOM', '15:45', '18:00', 'DIRECT', 6000.00);

-- 6. FLIGHT_INSTANCES
INSERT INTO FLIGHT_INSTANCES (
    FLIGHT_INSTANCE_ID, FLIGHT_NUMBER, FLIGHT_DATE, AIRCRAFT_ID, DEPARTURE_GATE_ID,
    SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL, STATUS, REMARKS
) VALUES
(1, 'AI2014', CURDATE(), 1, 1,
 CONCAT(CURDATE(), ' 02:10:00'), CONCAT(CURDATE(), ' 14:30:00'), 'ON_TIME', 'Departed on schedule'),
(2, 'AI680', CURDATE(), 2, 2,
 CONCAT(CURDATE(), ' 06:00:00'), CONCAT(CURDATE(), ' 08:15:00'), 'BOARDING', 'Gate T2-G02 active'),
(3, 'AI101', CURDATE(), 1, 4,
 CONCAT(CURDATE(), ' 01:30:00'), CONCAT(CURDATE(), ' 07:00:00'), 'DELAYED', 'Technical inspection hold'),
(4, 'BA1689', CURDATE(), 4, 11,
 CONCAT(CURDATE(), ' 10:20:00'), CONCAT(CURDATE(), ' 23:45:00'), 'SCHEDULED', 'Awaiting inward aircraft'),
(5, 'AI2014', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1, 1,
 CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 02:10:00'), CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 14:30:00'), 'SCHEDULED', 'Advance booking open'),
(6, 'EK501', CURDATE(), 6, NULL,
 CONCAT(CURDATE(), ' 04:30:00'), CONCAT(CURDATE(), ' 09:15:00'), 'SCHEDULED', 'International terminal departure');

-- 7. USERS
-- Password hashes for testing:
-- admin@airport.com / Admin@12345
-- staff@airline.com / Airline@12345
-- ops@airport.com / Airport@12345
-- passenger@gmail.com / Pass@12345
INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, ROLE, IS_ACTIVE) VALUES
(1, 'admin@airport.com', '$2a$10$a7XTii86Y.ODNdXKfWdxbOtsXtDxf9Cb8sTuCA3nvAbYO7ScfQLnW', 'ADMIN', 'Y'),
(2, 'staff@airline.com', '$2a$10$JwHdnJqttl4/64GZwwFYm.LBpL4RemPgQFfaJbJ2qQgOKQAuQ7hwm', 'AIRLINE_STAFF', 'Y'),
(3, 'ops@airport.com', '$2a$10$QuVzjV4Gpltf8Sa4ciLhVedidV/XatpGoSrDwo.SwaNqA1iaCxAaO', 'AIRPORT_STAFF', 'Y'),
(4, 'passenger@gmail.com', '$2a$10$DjNC1ksLaBfAnY0UIzO8J.1YFpDY35YFu0O7M3B14CPZBang43TXC', 'PASSENGER', 'Y'),
(5, 'john.doe@email.com', '$2a$10$DjNC1ksLaBfAnY0UIzO8J.1YFpDY35YFu0O7M3B14CPZBang43TXC', 'PASSENGER', 'Y'),
(6, 'priya.sharma@email.com', '$2a$10$DjNC1ksLaBfAnY0UIzO8J.1YFpDY35YFu0O7M3B14CPZBang43TXC', 'PASSENGER', 'Y'),
(7, 'rahul.verma@email.com', '$2a$10$DjNC1ksLaBfAnY0UIzO8J.1YFpDY35YFu0O7M3B14CPZBang43TXC', 'PASSENGER', 'Y');

-- 8. PASSENGERS
INSERT INTO PASSENGERS (PASSENGER_ID, USER_ID, FIRST_NAME, LAST_NAME, PASSPORT_NUMBER, PHONE, EMAIL, DATE_OF_BIRTH, GENDER) VALUES
(1, 4, 'PASSENGER', 'TEST', 'P78291045', '9876543210', 'passenger@gmail.com', '1992-05-15', 'M'),
(2, 5, 'JOHN', 'DOE', 'P10293847', '9876543211', 'john.doe@email.com', '1988-04-12', 'M'),
(3, 6, 'PRIYA', 'SHARMA', 'Z84729103', '9820192834', 'priya.sharma@email.com', '1994-08-25', 'F'),
(4, 7, 'RAHUL', 'VERMA', 'A93821045', '9833445566', 'rahul.verma@email.com', '1991-11-03', 'M'),
(5, NULL, 'EMILY', 'CLARK', 'US83920194', '1415555267', 'emily.clark@email.com', '1996-02-17', 'F');

-- 9. EMPLOYEES
INSERT INTO EMPLOYEES (EMPLOYEE_ID, USER_ID, AIRPORT_CODE, AIRLINE_CODE, FIRST_NAME, LAST_NAME, JOB_TITLE, SHIFT, CONTACT_PHONE) VALUES
(1, 3, 'BOM', NULL, 'RAJ', 'SHARMA', 'OPERATIONS_CONTROLLER', 'DAY', '9820334455'),
(2, 2, 'BOM', 'AI', 'ANANYA', 'PATEL', 'GATE_AGENT', 'DAY', '9820112233'),
(3, 1, 'BOM', NULL, 'ADMIN', 'SYSTEM', 'AIRPORT_DIRECTOR', 'DAY', '9820000000');

-- 10. BOOKINGS
INSERT INTO BOOKINGS (BOOKING_ID, BOOKING_REFERENCE, USER_ID, TOTAL_AMOUNT, STATUS) VALUES
(1, 'PNR8391', 4, 75000.00, 'CONFIRMED'),
(2, 'PNR9284', 6, 12000.00, 'CONFIRMED'),
(3, 'PNR1045', 7, 180000.00, 'CONFIRMED'),
(4, 'PNR5542', 5, 62000.00, 'CONFIRMED');

-- 11. TICKETS
INSERT INTO TICKETS (TICKET_ID, BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, TICKET_NUMBER, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS) VALUES
(1, 1, 1, 1, '0981234567001', '14A', 'ECONOMY', 75000.00, 'ISSUED'),
(2, 2, 2, 3, '0981234567002', '02B', 'BUSINESS', 12000.00, 'CHECKED_IN'),
(3, 3, 1, 4, '0981234567003', '01A', 'FIRST', 180000.00, 'ISSUED'),
(4, 4, 4, 2, '1259876543001', '24C', 'ECONOMY', 62000.00, 'ISSUED');

-- 12. CHECK_IN
INSERT INTO CHECK_IN (CHECK_IN_ID, TICKET_ID, BOARDING_PASS_CODE, BOARDING_TIME, GATE_ID, STATUS) VALUES
(1, 2, 'BP-567002-02B', CONCAT(CURDATE(), ' 05:20:00'), 2, 'COMPLETED');

-- 13. BAGGAGE
INSERT INTO BAGGAGE (BAGGAGE_ID, TICKET_ID, TAG_NUMBER, WEIGHT_KG, STATUS, CAROUSEL_NUMBER) VALUES
(1, 1, 'BAG-AI-7001', 22.5, 'LOADED', 'BELT-02'),
(2, 3, 'BAG-AI-7003', 18.0, 'LOADED', 'BELT-02');

-- 14. FLIGHT_STATUS_HISTORY
INSERT INTO FLIGHT_STATUS_HISTORY (FLIGHT_INSTANCE_ID, OLD_STATUS, NEW_STATUS, REASON, CHANGED_BY_USER_ID) VALUES
(1, 'SCHEDULED', 'ON_TIME', 'Aircraft ready at gate', 1),
(2, 'SCHEDULED', 'BOARDING', 'Gate clearance granted', 2),
(3, 'SCHEDULED', 'DELAYED', 'Technical hold', 3);

-- 15. NOTIFICATIONS
INSERT INTO NOTIFICATIONS (NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, NOTIFICATION_TYPE, IS_READ) VALUES
(1, 4, 'Booking Confirmed: PNR8391', 'Your flight AI2014 from BOM to DFW is confirmed. Boarding gate: T2-G01.', 'SYSTEM', 'Y'),
(2, 6, 'Boarding Call: Flight AI680', 'Flight AI680 is now boarding at Gate T2-G02.', 'BOARDING', 'N');

-- 16. OPERATIONAL_LOGS
INSERT INTO OPERATIONAL_LOGS (EVENT_CATEGORY, SEVERITY, DETAILS, ACTION_TAKEN) VALUES
('DATABASE_MIGRATION', 'INFO', 'MySQL 8.0 schema and seed dataset loaded successfully into airport_management_db.', 'Migration completed.');

SET FOREIGN_KEY_CHECKS = 1;
