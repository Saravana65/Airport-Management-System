# Flight Status & Telemetry Data Flow Architecture

## 1. High-Level Architectural Flow Diagram

```mermaid
flowchart TD
    subgraph DatabaseLayer [Oracle SQL & Relational Tables]
        ORA_FLIGHTS[(FLIGHTS)]
        ORA_INSTANCES[(FLIGHT_INSTANCES)]
        ORA_AIRLINES[(AIRLINES)]
        ORA_AIRPORTS[(AIRPORTS)]
        ORA_GATES[(GATES)]
        ORA_AIRCRAFT[(AIRCRAFT)]
    end

    subgraph BackendLayer [Node.js & Express REST Backend]
        STORE[operations.store.js\nResilient Seed Store]
        SERVICE[flight.service.js\nEnrichment & Calculations]
        AUTH_MW[auth.middleware.js\nJWT & RBAC Guard]
        ROUTER[routes/operations.routes.js\nGET /api/flights]
    end

    subgraph FrontendServiceLayer [Client Services & API Client]
        HTTP_CLIENT[apiClient.js\nCredentials & Bearer Token]
        OPS_SERVICE[operations.service.js\ngetFlights()]
    end

    subgraph ComponentLayer [Ultra-Quality Data Table Component]
        STATE[Telemetry Poller &\nState Machine]
        SEARCH_FILTER[Search, Status, Airline\n& Movement Filters]
        SORT_PAGINATE[Multi-Column Sorter &\nPagination Engine]
        COUNTDOWN[Dynamic Minute Countdowns &\nOperational Message Synthesizer]
        MODAL[Flight Telemetry &\nRouting Inspection Modal]
    end

    subgraph RoleStations [Role-Based Station Dashboards]
        ADMIN_DASH[Admin Dashboard\n/admin/flights]
        AIRLINE_DASH[Airline Dashboard\n/airline/flights]
        AIRPORT_DASH[Airport Dashboard\n/airport/flights]
        PASSENGER_DASH[Passenger Portal\n/passenger/search]
    end

    ORA_FLIGHTS --> STORE
    ORA_INSTANCES --> STORE
    ORA_AIRLINES --> STORE
    ORA_AIRPORTS --> STORE
    ORA_GATES --> STORE
    ORA_AIRCRAFT --> STORE

    STORE --> SERVICE
    SERVICE --> ROUTER
    AUTH_MW --> ROUTER
    ROUTER --> HTTP_CLIENT
    HTTP_CLIENT --> OPS_SERVICE
    OPS_SERVICE --> STATE

    STATE --> SEARCH_FILTER
    SEARCH_FILTER --> SORT_PAGINATE
    SORT_PAGINATE --> COUNTDOWN
    COUNTDOWN --> MODAL

    SORT_PAGINATE --> ADMIN_DASH
    SORT_PAGINATE --> AIRLINE_DASH
    SORT_PAGINATE --> AIRPORT_DASH
    SORT_PAGINATE --> PASSENGER_DASH
```

---

## 2. Detailed Data Transformation Steps

### Step 1: Database & Persistence Layer
- **Relational Tables**:
  - `FLIGHTS`: Route definition (`FLIGHT_NUMBER`, `AIRLINE_ID`, `ORIGIN_AIRPORT_ID`, `DEST_AIRPORT_ID`, `SCHEDULED_DEPARTURE_TIME`, `SCHEDULED_ARRIVAL_TIME`, `BASE_FARE`).
  - `FLIGHT_INSTANCES`: Concrete movement instance (`FLIGHT_INSTANCE_ID`, `FLIGHT_ID`, `FLIGHT_DATE`, `STATUS`, `DEPARTURE_GATE_ID`, `ARRIVAL_GATE_ID`, `ACTUAL_DEPARTURE`, `ACTUAL_ARRIVAL`, `DELAY_MINUTES`).
  - `AIRLINES`, `AIRPORTS`, `GATES`, `AIRCRAFT`: Reference dimension entities.
- **Failover Memory Store**: `backend/src/services/operations.store.js` guarantees high availability during offline Oracle listener states with 12 initial commercial flight instances.

### Step 2: Backend Service Enrichment (`flight.service.js`)
When `getAllFlights()` or `getFlightById(id)` executes:
1. **Relational Join Resolution**: Resolves carrier names, IATA codes, city names, airport names, and gate codes (e.g., `T2-G01`).
2. **Estimated Time Computation**:
   - `estimatedDeparture`: Dynamically offsets scheduled departure by `delayMinutes` (e.g., `+75m` for `AI2014`).
   - `estimatedArrival`: Adjusts arrival timestamp taking into account scheduled flight duration and delays.
3. **Operational Message Generation**:
   - Computes human-readable dispatch messages based on real-time flight phase (`ON_TIME`, `DELAYED`, `BOARDING`, `GATE_CLOSED`, `IN_AIR`, `LANDED`, `ARRIVED`, `CANCELLED`).
4. **Timezone Annotation**: Annotates departure and arrival stations with IANA timezones (e.g., `Asia/Kolkata`, `America/Chicago`, `Europe/London`).

### Step 3: API Delivery & Security
- **Endpoint**: `GET /api/flights` and `GET /api/flights/:id`.
- **Security Middleware**: Authenticated sessions via `authMiddleware` verifying JWT signature from `ams_token` HttpOnly cookie or `Authorization: Bearer <token>` header.
- **Payload Schema**:
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "flightInstanceId": 1,
      "flightNumber": "AI2014",
      "flightDate": "2026-11-05",
      "airlineCode": "AI",
      "airlineName": "Air India Limited",
      "originAirport": "BOM",
      "originCity": "Mumbai",
      "destAirport": "DFW",
      "destCity": "Dallas",
      "scheduledDeparture": "2026-11-05 02:10:00",
      "scheduledArrival": "2026-11-05 14:30:00",
      "estimatedDeparture": "2026-11-04 21:55:00",
      "estimatedArrival": "2026-11-05 10:15:00",
      "status": "DELAYED",
      "delayMinutes": 75,
      "terminal": "T2",
      "gate": "G01",
      "departureGate": "T2-G01",
      "aircraftModel": "Boeing 777-300ER",
      "aircraftReg": "VT-ANX",
      "operationalMessage": "Delayed — Estimated departure at 21:55 (+75m)"
    }
  ]
}
```

### Step 4: Frontend Service (`operationsService.getFlights()`)
- Calls backend via `apiClient.get('/flights')`.
- Sanitizes and formats array for React state consumption.

### Step 5: `UltraQualityDataTable` Rendering Pipeline
1. **Search Query Filtering**: Evaluates input string against flight number, carrier name, origin/destination IATA codes, cities, and gate assignments.
2. **Category Filters**: Filters by operational status, airline carrier, airport hub, and movement type (Departures, Arrivals, Delayed, Boarding).
3. **Sorting**: In-memory comparator sorting by timestamps, alphanumeric strings, and numeric IDs with ascending/descending toggles.
4. **Pagination**: Dynamic page slice calculation according to user-selected page sizes (`5`, `10`, `20`, `50`).
5. **Real-time Countdowns**: Dynamic client-side clock ticks updating minute estimations every 30 seconds.
