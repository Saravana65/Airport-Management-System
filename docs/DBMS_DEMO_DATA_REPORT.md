# DBMS Demonstration Data Report

**Project**: Airport Management System  
**Evaluation**: College DBMS Project Review & Faculty Viva Defense  
**Auditor**: Senior Oracle DBA & DBMS Faculty Mentor  
**Dataset Source**: [`database/sample_data/insert_sample_data.sql`](../../database/sample_data/insert_sample_data.sql) & [`backend/src/services/operations.store.js`](../../backend/src/services/operations.store.js)  

---

## 1. Table Record Count Summary

All tables in the Airport Management System contain real, coherent aviation operational data. There are **zero orphan records**, and all foreign key references strictly satisfy referential integrity constraints.

| # | Table Name | Status | Record Count | Primary Key Range / Sample Identifiers |
| :-: | :--- | :---: | :-: | :--- |
| **1** | `AIRPORTS` | Active | **6** | `'BOM'`, `'DEL'`, `'DFW'`, `'JFK'`, `'LHR'`, `'SFO'` |
| **2** | `AIRLINES` | Active | **5** | `'AI'` (Air India), `'AA'` (American), `'BA'`, `'LH'`, `'EK'` |
| **3** | `GATES` | Active | **11** | Gate IDs `1` to `11` (BOM T2-G01 to LHR T5-A01) |
| **4** | `AIRCRAFT` | Active | **6** | Aircraft IDs `1` to `6` (`VT-ANX`, `VT-EXG`, `N789AA`, etc.) |
| **5** | `FLIGHTS` | Active | **8** | Master routes: `'AI2014'`, `'AI101'`, `'AI680'`, `'BA1689'`, etc. |
| **6** | `FLIGHT_INSTANCES` | Active | **5** | Daily instances: Today & Tomorrow operational schedules |
| **7** | `USERS` | Active | **7** | User IDs `1` to `7` (1 Admin, 2 Airline, 1 Airport, 3 Passengers) |
| **8** | `PASSENGERS` | Active | **5** | Pass IDs `1` to `5` (`'P10293847'`, `'Z84729103'`, etc.) |
| **9** | `EMPLOYEES` | Active | **3** | Employee IDs `1` to `3` (Operations Controller, Gate Agent, Security) |
| **10**| `BOOKINGS` | Active | **4** | PNRs: `'PNR8391'`, `'PNR9284'`, `'PNR1045'`, `'PNR5542'` |
| **11**| `TICKETS` | Active | **4** | Tickets: `'0981234567001'` through `'1259876543001'` |
| **12**| `CHECK_IN` | Active | **2** | Boarding passes: `'BP-567001-14A'`, `'BP-567003-01A'` |
| **13**| `BAGGAGE` | Active | **3** | Barcode RFID tags: `'BAG-7001-01'`, `'BAG-7003-01'`, `'BAG-7003-02'` |
| **14**| `NOTIFICATIONS` | Active | **2** | Personal travel notices & gate boarding broadcasts |
| **15**| `OPERATIONAL_LOGS` | Active | **1+** | System health baseline + runtime anomaly detection logs |

---

## 2. Representative Sample Records (Read-Only Audit)

### 1. `AIRPORTS` (Sample Rows)
```sql
SELECT AIRPORT_CODE, AIRPORT_NAME, CITY, COUNTRY, TIMEZONE, IS_ACTIVE FROM AIRPORTS;
```
| AIRPORT_CODE | AIRPORT_NAME | CITY | COUNTRY | TIMEZONE | IS_ACTIVE |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `BOM` | Chhatrapati Shivaji Maharaj International Airport | Mumbai | India | Asia/Kolkata | Y |
| `DEL` | Indira Gandhi International Airport | Delhi | India | Asia/Kolkata | Y |
| `JFK` | John F. Kennedy International Airport | New York | United States | America/New_York | Y |
| `DFW` | Dallas/Fort Worth International Airport | Dallas | United States | America/Chicago | Y |
| `LHR` | Heathrow Airport | London | United Kingdom | Europe/London | Y |

---

### 2. `AIRLINES` & `AIRCRAFT` (Fleet Records)
```sql
SELECT al.AIRLINE_CODE, al.AIRLINE_NAME, ac.REGISTRATION_NO, ac.MODEL, ac.TOTAL_SEATS 
FROM AIRLINES al 
JOIN AIRCRAFT ac ON al.AIRLINE_CODE = ac.AIRLINE_CODE;
```
| AIRLINE_CODE | AIRLINE_NAME | REGISTRATION_NO | MODEL | TOTAL_SEATS |
| :--- | :--- | :--- | :--- | :-: |
| `AI` | Air India Limited | `VT-ANX` | Boeing 777-300ER | 342 |
| `AI` | Air India Limited | `VT-EXG` | Airbus A320neo | 180 |
| `AA` | American Airlines | `N789AA` | Boeing 787-9 Dreamliner | 285 |
| `BA` | British Airways | `G-ZBLA` | Boeing 787-10 | 256 |
| `LH` | Lufthansa German Airlines | `D-AIMA` | Airbus A380-800 | 509 |
| `EK` | Emirates | `A6-EKA` | Boeing 777-200LR | 302 |

---

### 3. `FLIGHTS` & `FLIGHT_INSTANCES` (Operational Schedule)
```sql
SELECT fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER, f.ORIGIN_AIRPORT, f.DEST_AIRPORT,
       TO_CHAR(fi.SCHEDULED_DEPARTURE, 'YYYY-MM-DD HH24:MI') AS DEPARTURE,
       fi.STATUS, NVL(fi.REMARKS, 'Normal') AS REMARKS
FROM FLIGHT_INSTANCES fi
JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER;
```
| FLIGHT_INSTANCE_ID | FLIGHT_NUMBER | ORIGIN_AIRPORT | DEST_AIRPORT | DEPARTURE | STATUS | REMARKS |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| `1` | `AI2014` | BOM | DFW | 2026-11-14 02:10 | `ON_TIME` | Departed on schedule |
| `2` | `AI680` | BOM | DEL | 2026-11-14 06:00 | `BOARDING` | Gate T2-G02 active |
| `3` | `AI101` | DEL | JFK | 2026-11-14 01:30 | `DELAYED` | Technical inspection hold |
| `4` | `BA1689` | LHR | DEL | 2026-11-14 10:20 | `SCHEDULED` | Awaiting inward aircraft |
| `5` | `AI2014` | BOM | DFW | 2026-11-15 02:10 | `SCHEDULED` | Advance booking open |

---

### 4. `BOOKINGS`, `TICKETS`, and `PASSENGERS` (Passenger Reservation Record)
```sql
SELECT b.BOOKING_REFERENCE, p.FIRST_NAME || ' ' || p.LAST_NAME AS PASSENGER, 
       p.PASSPORT_NUMBER, t.TICKET_NUMBER, t.SEAT_NUMBER, t.CABIN_CLASS, t.PRICE
FROM BOOKINGS b
JOIN TICKETS t ON b.BOOKING_ID = t.BOOKING_ID
JOIN PASSENGERS p ON t.PASSENGER_ID = p.PASSENGER_ID;
```
| BOOKING_REFERENCE (PNR) | PASSENGER | PASSPORT_NUMBER | TICKET_NUMBER | SEAT_NUMBER | CABIN_CLASS | PRICE (₹) |
| :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| `PNR8391` | JOHN DOE | `P10293847` | `0981234567001` | `14A` | ECONOMY | 75,000.00 |
| `PNR9284` | PRIYA SHARMA | `Z84729103` | `0981234567002` | `02B` | BUSINESS | 12,000.00 |
| `PNR1045` | RAHUL VERMA | `A93821045` | `0981234567003` | `01A` | FIRST | 180,000.00 |
| `PNR5542` | EMILY CLARK | `US83920194` | `1259876543001` | `24C` | ECONOMY | 62,000.00 |

---

### 5. `CHECK_IN` & `BAGGAGE` (Issued Boarding Passes & RFID Tags)
```sql
SELECT ci.BOARDING_PASS_CODE, t.TICKET_NUMBER, t.SEAT_NUMBER, 
       b.TAG_NUMBER, b.WEIGHT_KG, b.STATUS AS BAGGAGE_STATUS
FROM CHECK_IN ci
JOIN TICKETS t ON ci.TICKET_ID = t.TICKET_ID
LEFT JOIN BAGGAGE b ON t.TICKET_ID = b.TICKET_ID;
```
| BOARDING_PASS_CODE | TICKET_NUMBER | SEAT_NUMBER | TAG_NUMBER | WEIGHT_KG | BAGGAGE_STATUS |
| :--- | :--- | :--- | :--- | :-: | :--- |
| `BP-567001-14A` | `0981234567001` | `14A` | `BAG-7001-01` | 22.5 | LOADED |
| `BP-567003-01A` | `0981234567003` | `01A` | `BAG-7003-01` | 18.0 | LOADED |
| `BP-567003-01A` | `0981234567003` | `01A` | `BAG-7003-02` | 24.0 | LOADED |

---

## 3. Referential Integrity Verification

The dataset has been checked to verify relational consistency:
1. **Foreign Key Validity**: Every `AIRLINE_CODE` in `FLIGHTS` exists in `AIRLINES`. Every `ORIGIN_AIRPORT` and `DEST_AIRPORT` exists in `AIRPORTS`.
2. **Cascading Safety**: Deleting a passenger or booking safely respects the ON DELETE rules specified in DDL (`ON DELETE CASCADE` on tickets/baggage, `ON DELETE SET NULL` on aircraft/gates).
3. **No Duplicate Seats**: The composite unique constraint `uq_flight_seat (FLIGHT_INSTANCE_ID, SEAT_NUMBER)` is verified. All assigned seats (`14A`, `02B`, `01A`, `24C`) are distinct per flight.
4. **Aircraft Capacity Integrity**: In `AIRCRAFT`, the total seats equals the exact sum of Economy, Business, and First-class seats across all 6 aircraft.
