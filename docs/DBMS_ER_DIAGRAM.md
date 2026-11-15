# Entity-Relationship (ER) Diagram: Airport Management System

**Project**: Airport Management System  
**Evaluation**: College DBMS Project Review & Faculty Viva Defense  
**Auditor**: Senior Oracle DBA & DBMS Faculty Mentor  
**Dialect**: Mermaid GFM (GitHub Flavored Markdown) ER Syntax  

---

## 1. Visual Entity-Relationship Diagram

```mermaid
erDiagram
    AIRPORTS ||--o{ GATES : "contains (1:N)"
    AIRPORTS ||--o{ FLIGHTS : "originates (1:N)"
    AIRPORTS ||--o{ FLIGHTS : "terminates (1:N)"
    AIRPORTS ||--o{ EMPLOYEES : "employs at (1:N)"
    
    AIRLINES ||--o{ AIRCRAFT : "owns fleet (1:N)"
    AIRLINES ||--o{ FLIGHTS : "schedules (1:N)"
    AIRLINES ||--o{ EMPLOYEES : "employs (1:N)"
    
    AIRCRAFT ||--o{ FLIGHT_INSTANCES : "assigned to (1:N)"
    GATES ||--o{ FLIGHT_INSTANCES : "dep_gate (1:N)"
    GATES ||--o{ FLIGHT_INSTANCES : "arr_gate (1:N)"
    GATES ||--o{ CHECK_IN : "boarding_gate (1:N)"
    
    FLIGHTS ||--o{ FLIGHT_INSTANCES : "instantiates (1:N)"
    
    USERS ||--o| PASSENGERS : "authenticates (1:1)"
    USERS ||--o| EMPLOYEES : "authenticates (1:1)"
    USERS ||--o{ BOOKINGS : "places order (1:N)"
    USERS ||--o{ NOTIFICATIONS : "receives (1:N)"
    
    BOOKINGS ||--|{ TICKETS : "contains (1:N)"
    FLIGHT_INSTANCES ||--o{ TICKETS : "allocates seat (1:N)"
    PASSENGERS ||--o{ TICKETS : "travels on (1:N)"
    
    TICKETS ||--o| CHECK_IN : "issues pass (1:1)"
    TICKETS ||--o{ BAGGAGE : "checks luggage (1:N)"
    
    FLIGHT_INSTANCES ||--o{ FLIGHT_STATUS_HISTORY : "tracks delays (1:N)"
    USERS ||--o{ FLIGHT_STATUS_HISTORY : "recorded by (1:N)"

    AIRPORTS {
        varchar2 AIRPORT_CODE PK "IATA 3-char code"
        varchar2 AIRPORT_NAME
        varchar2 CITY
        varchar2 COUNTRY
        varchar2 TIMEZONE
        char IS_ACTIVE
    }

    AIRLINES {
        varchar2 AIRLINE_CODE PK "IATA 2-char code"
        varchar2 AIRLINE_NAME
        varchar2 THREE_DIGIT_CODE UK
        varchar2 COUNTRY
        char IS_ACTIVE
    }

    GATES {
        number GATE_ID PK "Identity"
        varchar2 AIRPORT_CODE FK
        varchar2 TERMINAL
        varchar2 GATE_NUMBER
        varchar2 STATUS "AVAILABLE / OCCUPIED"
    }

    AIRCRAFT {
        number AIRCRAFT_ID PK "Identity"
        varchar2 REGISTRATION_NO UK "Tail number"
        varchar2 MODEL
        varchar2 AIRLINE_CODE FK
        number TOTAL_SEATS
        number ECONOMY_SEATS
        number BUSINESS_SEATS
        number FIRST_SEATS
        varchar2 STATUS
    }

    FLIGHTS {
        varchar2 FLIGHT_NUMBER PK "e.g. AI2014"
        varchar2 AIRLINE_CODE FK
        varchar2 ORIGIN_AIRPORT FK
        varchar2 DEST_AIRPORT FK
        varchar2 SCHEDULED_DEPARTURE_TIME
        varchar2 SCHEDULED_ARRIVAL_TIME
        varchar2 FLIGHT_TYPE
        number BASE_FARE
    }

    FLIGHT_INSTANCES {
        number FLIGHT_INSTANCE_ID PK "Identity"
        varchar2 FLIGHT_NUMBER FK
        date FLIGHT_DATE
        number AIRCRAFT_ID FK
        number DEPARTURE_GATE_ID FK
        number ARRIVAL_GATE_ID FK
        timestamp SCHEDULED_DEPARTURE
        timestamp ACTUAL_DEPARTURE
        timestamp SCHEDULED_ARRIVAL
        timestamp ACTUAL_ARRIVAL
        varchar2 STATUS "ON_TIME / DELAYED"
    }

    USERS {
        number USER_ID PK "Identity"
        varchar2 EMAIL UK
        varchar2 PASSWORD_HASH
        varchar2 ROLE "ADMIN / AIRLINE / PASSENGER"
        char IS_ACTIVE
    }

    PASSENGERS {
        number PASSENGER_ID PK "Identity"
        number USER_ID FK
        varchar2 FIRST_NAME
        varchar2 LAST_NAME
        varchar2 PASSPORT_NUMBER UK
        varchar2 PHONE
        varchar2 EMAIL
    }

    EMPLOYEES {
        number EMPLOYEE_ID PK "Identity"
        number USER_ID FK
        varchar2 AIRPORT_CODE FK
        varchar2 AIRLINE_CODE FK
        varchar2 FIRST_NAME
        varchar2 LAST_NAME
        varchar2 JOB_TITLE
        varchar2 SHIFT
    }

    BOOKINGS {
        number BOOKING_ID PK "Identity"
        varchar2 BOOKING_REFERENCE UK "6-char PNR"
        number USER_ID FK
        timestamp BOOKING_DATE
        number TOTAL_AMOUNT
        varchar2 STATUS "CONFIRMED / CANCELLED"
    }

    TICKETS {
        number TICKET_ID PK "Identity"
        number BOOKING_ID FK
        number FLIGHT_INSTANCE_ID FK
        number PASSENGER_ID FK
        varchar2 TICKET_NUMBER UK "13-digit e-ticket"
        varchar2 SEAT_NUMBER
        varchar2 CABIN_CLASS
        number PRICE
        varchar2 STATUS "ISSUED / CHECKED_IN"
    }

    CHECK_IN {
        number CHECKIN_ID PK "Identity"
        number TICKET_ID FK, UK "1:1 per ticket"
        varchar2 BOARDING_PASS_CODE UK
        timestamp BOARDING_TIME
        number GATE_ID FK
        varchar2 STATUS
    }

    BAGGAGE {
        number BAGGAGE_ID PK "Identity"
        number TICKET_ID FK
        varchar2 TAG_NUMBER UK "RFID barcode"
        number WEIGHT_KG
        varchar2 STATUS "LOADED / CLAIM_READY"
        varchar2 CAROUSEL_NUMBER
    }
```

---

## 2. Cardinality & Relationship Breakdown

| Parent Table | Relationship | Child Table | Foreign Key Column | On Delete Action | Business Semantics |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `AIRPORTS` | **1 : N** | `GATES` | `GATES.AIRPORT_CODE` | `CASCADE` | One airport contains many terminal gates. |
| `AIRPORTS` | **1 : N** | `FLIGHTS` | `FLIGHTS.ORIGIN_AIRPORT` | `CASCADE` | Airport originates scheduled flight routes. |
| `AIRPORTS` | **1 : N** | `FLIGHTS` | `FLIGHTS.DEST_AIRPORT` | `CASCADE` | Airport terminates scheduled flight routes. |
| `AIRPORTS` | **1 : N** | `EMPLOYEES` | `EMPLOYEES.AIRPORT_CODE` | `CASCADE` | Airport stations operational personnel. |
| `AIRLINES` | **1 : N** | `AIRCRAFT` | `AIRCRAFT.AIRLINE_CODE` | `CASCADE` | Commercial carrier owns fleet aircraft. |
| `AIRLINES` | **1 : N** | `FLIGHTS` | `FLIGHTS.AIRLINE_CODE` | `CASCADE` | Airline operates flight timetable routes. |
| `FLIGHTS` | **1 : N** | `FLIGHT_INSTANCES` | `FLIGHT_INSTANCES.FLIGHT_NUMBER` | `CASCADE` | Route template instantiates daily occurrences. |
| `AIRCRAFT` | **1 : N** | `FLIGHT_INSTANCES` | `FLIGHT_INSTANCES.AIRCRAFT_ID` | `SET NULL` | Aircraft assigned to specific physical flight. |
| `GATES` | **1 : N** | `FLIGHT_INSTANCES` | `FLIGHT_INSTANCES.DEPARTURE_GATE_ID` | `SET NULL` | Gate docks aircraft for departure boarding. |
| `USERS` | **1 : 1** | `PASSENGERS` | `PASSENGERS.USER_ID` | `SET NULL` | Login account linked to traveler profile. |
| `USERS` | **1 : 1** | `EMPLOYEES` | `EMPLOYEES.USER_ID` | `CASCADE` | Login account linked to staff profile. |
| `USERS` | **1 : N** | `BOOKINGS` | `BOOKINGS.USER_ID` | `CASCADE` | User places one or more flight reservations. |
| `BOOKINGS` | **1 : N** | `TICKETS` | `TICKETS.BOOKING_ID` | `CASCADE` | A booking order contains 1 or more seats/tickets. |
| `FLIGHT_INSTANCES` | **1 : N** | `TICKETS` | `TICKETS.FLIGHT_INSTANCE_ID` | `CASCADE` | Daily flight allocates seats to issued tickets. |
| `PASSENGERS` | **1 : N** | `TICKETS` | `TICKETS.PASSENGER_ID` | `CASCADE` | Ticket is issued in traveler's passport name. |
| `TICKETS` | **1 : 1** | `CHECK_IN` | `CHECK_IN.TICKET_ID` | `CASCADE` | One ticket generates at most one boarding pass. |
| `TICKETS` | **1 : N** | `BAGGAGE` | `BAGGAGE.TICKET_ID` | `CASCADE` | Ticket passenger checks in 0, 1, or more bags. |

---

## 3. Academic Defense: Resolving Many-to-Many (M:N) Relationships

In your viva evaluation, faculty members often ask:
> *"Where are your Many-to-Many relationships, and how did you resolve them into physical tables?"*

1. **Airlines and Airports (M:N)**:
   - An airline flies to many airports; an airport serves many airlines.
   - **Resolution**: Resolved via the associative entity `FLIGHTS` (with foreign keys `AIRLINE_CODE`, `ORIGIN_AIRPORT`, and `DEST_AIRPORT`).
2. **Passengers and Flight Instances (M:N)**:
   - A passenger travels on many flights over time; a flight instance carries hundreds of passengers.
   - **Resolution**: Resolved via the bridge relation `TICKETS` (with foreign keys `PASSENGER_ID` and `FLIGHT_INSTANCE_ID`), enriched with transaction attributes like `SEAT_NUMBER`, `CABIN_CLASS`, and `PRICE`.
3. **Employees and Passengers (M:N)**:
   - Staff members service many passengers; passengers interact with various staff (gate agents, check-in desks).
   - **Resolution**: Tracked via `CHECK_IN.GATE_ID` and `EMPLOYEES.AIRPORT_CODE`.
