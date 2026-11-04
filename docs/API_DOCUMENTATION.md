# Airport Management System — REST API Specification (Phase 07)

## Base URL
- Production / Development: `http://localhost:5000/api`
- Authentication Scheme: JWT Bearer Token (Authorization Header `Bearer <token>` or HttpOnly Session Cookie `token`)

---

## 1. Health & Telemetry Endpoints

### 1.1 System Gateway Information
- **Endpoint**: `GET /`
- **Auth**: Public
- **Response**: `200 OK`
```json
{
  "name": "Airport Management System API",
  "version": "1.0.0",
  "status": "OPERATIONAL",
  "phase": "07 - Airport Operations Modules & Full-Stack Integration"
}
```

### 1.2 Application Health
- **Endpoint**: `GET /api/health`
- **Auth**: Public
- **Response**: `200 OK`
```json
{
  "status": "UP",
  "timestamp": "2026-11-04T15:30:00.000Z",
  "uptime": 124.52
}
```

### 1.3 Oracle Database Health
- **Endpoint**: `GET /api/health/database`
- **Auth**: Public
- **Response**: `200 OK` (when Oracle is connected) or `503 Service Unavailable` (when Oracle listener is offline, handled gracefully):
```json
{
  "status": "DOWN",
  "database": "Oracle Database XE / Autonomous Engine",
  "message": "NJS-503: connection to host 127.0.0.1 port 1521 could not be established."
}
```

---

## 2. Authentication & Session Endpoints

### 2.1 User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "admin@airport.com",
  "password": "Password@123"
}
```
- **Response**: `200 OK` with Set-Cookie `token=...; HttpOnly; SameSite=Strict; Path=/`
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "userId": 1,
    "email": "admin@airport.com",
    "name": "System Administrator",
    "role": "ADMIN"
  }
}
```

### 2.2 User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: Public / Authenticated
- **Response**: `200 OK` (clears cookie)

### 2.3 Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Authenticated (Any role)
- **Response**: `200 OK` with active user profile and permissions.

---

## 3. Module 1: Airports, Airlines & Aircraft

### 3.1 List Operational Airports
- **Endpoint**: `GET /api/airports`
- **Auth**: Authenticated
- **Response**: `200 OK`
```json
[
  {
    "airportCode": "DEL",
    "airportName": "Indira Gandhi International Airport",
    "city": "New Delhi",
    "country": "India",
    "timezone": "Asia/Kolkata"
  }
]
```

### 3.2 Register New Airport
- **Endpoint**: `POST /api/airports`
- **Auth**: `ADMIN`
- **Request Body**:
```json
{
  "airportCode": "SIN",
  "airportName": "Singapore Changi Airport",
  "city": "Singapore",
  "country": "Singapore",
  "timezone": "Asia/Singapore"
}
```
- **Response**: `201 Created`

### 3.3 List Registered Airlines
- **Endpoint**: `GET /api/airlines`
- **Auth**: Authenticated
- **Response**: `200 OK`

### 3.4 List Aircraft Fleet
- **Endpoint**: `GET /api/aircraft`
- **Auth**: Authenticated
- **Response**: `200 OK`

### 3.5 Register Aircraft Unit
- **Endpoint**: `POST /api/aircraft`
- **Auth**: `ADMIN`, `AIRLINE_STAFF`
- **Request Body**:
```json
{
  "registrationNo": "VT-EXQ",
  "model": "Airbus A321neo",
  "airlineCode": "AI",
  "economySeats": 150,
  "businessSeats": 20,
  "firstSeats": 0
}
```
- **Response**: `201 Created`

---

## 4. Module 2: Flights & Scheduling

### 4.1 Search Flights
- **Endpoint**: `GET /api/flights?origin=DEL&destination=BOM`
- **Auth**: Authenticated
- **Response**: `200 OK`
```json
[
  {
    "flightInstanceId": 1,
    "flightNumber": "AI-101",
    "originAirport": "DEL",
    "destAirport": "BOM",
    "scheduledDepartureTime": "06:00",
    "scheduledArrivalTime": "08:15",
    "status": "SCHEDULED",
    "baseFare": 4500,
    "gateNumber": "14A"
  }
]
```

### 4.2 Schedule Commercial Flight
- **Endpoint**: `POST /api/flights`
- **Auth**: `ADMIN`, `AIRLINE_STAFF`
- **Request Body**:
```json
{
  "flightNumber": "AI-984",
  "originAirport": "DEL",
  "destAirport": "BOM",
  "scheduledDepartureTime": "10:00",
  "scheduledArrivalTime": "12:15",
  "baseFare": 4500
}
```
- **Response**: `201 Created`

### 4.3 Update Flight Status (Dispatch Telemetry)
- **Endpoint**: `PATCH /api/flights/:id/status`
- **Auth**: `ADMIN`, `AIRLINE_STAFF`, `AIRPORT_STAFF`
- **Request Body**:
```json
{
  "status": "BOARDING",
  "reason": "Gate open, passenger boarding commenced"
}
```
- **Response**: `200 OK`

---

## 5. Module 3: Passengers

### 5.1 List Passenger Manifest
- **Endpoint**: `GET /api/passengers`
- **Auth**: `ADMIN`, `AIRLINE_STAFF`
- **Response**: `200 OK` (Passports masked: `K9****01`)

### 5.2 My Passenger Profile
- **Endpoint**: `GET /api/passengers/me`
- **Auth**: `PASSENGER`
- **Response**: `200 OK`

---

## 6. Module 4: Bookings & Tickets

### 6.1 List Bookings
- **Endpoint**: `GET /api/bookings`
- **Auth**: Authenticated (Passengers receive only their bookings; Airlines receive their flights; Admins receive all)
- **Response**: `200 OK`

### 6.2 Create Booking & Issue E-Ticket
- **Endpoint**: `POST /api/bookings`
- **Auth**: Authenticated
- **Request Body**:
```json
{
  "flightInstanceId": 1,
  "cabinClass": "ECONOMY",
  "seatNumber": "14A"
}
```
- **Response**: `201 Created`
```json
{
  "booking": {
    "bookingId": 4,
    "bookingReference": "AI984X",
    "totalAmount": 4500,
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED_SIMULATED"
  },
  "ticket": {
    "ticketId": 4,
    "ticketNumber": "0981928491023",
    "seatNumber": "14A",
    "cabinClass": "ECONOMY"
  }
}
```

### 6.3 Cancel Reservation
- **Endpoint**: `PATCH /api/bookings/:id/cancel`
- **Auth**: Authenticated (Owner passenger, Airline Staff, or Admin)
- **Response**: `200 OK`

---

## 7. Module 5: Check-in Operations

### 7.1 Tickets Ready for Web Check-In
- **Endpoint**: `GET /api/checkin/eligible`
- **Auth**: Authenticated
- **Response**: `200 OK`

### 7.2 Process Check-in
- **Endpoint**: `POST /api/checkin`
- **Auth**: Authenticated
- **Request Body**:
```json
{
  "ticketId": 4,
  "seatNumber": "14A",
  "baggageCount": 1
}
```
- **Response**: `201 Created`
```json
{
  "checkIn": {
    "checkInId": 3,
    "ticketId": 4,
    "boardingPassNumber": "BP-AI101-14A-9412",
    "seatNumber": "14A",
    "gateNumber": "14A",
    "checkInTime": "2026-11-04 15:35:00"
  }
}
```

---

## 8. Module 6: Baggage Tracking

### 8.1 List Baggage
- **Endpoint**: `GET /api/baggage`
- **Auth**: Authenticated
- **Response**: `200 OK`

### 8.2 Update Baggage Conveyance Status
- **Endpoint**: `PATCH /api/baggage/:id/status`
- **Auth**: `ADMIN`, `AIRPORT_STAFF`
- **Request Body**:
```json
{
  "status": "LOADED",
  "carouselNumber": "Carousel-04"
}
```
- **Response**: `200 OK`

---

## 9. Module 7: Gate Management

### 9.1 List Gates
- **Endpoint**: `GET /api/gates`
- **Auth**: Authenticated
- **Response**: `200 OK`

### 9.2 Assign Gate to Flight
- **Endpoint**: `POST /api/gates/assign`
- **Auth**: `ADMIN`, `AIRPORT_STAFF`
- **Request Body**:
```json
{
  "gateId": 1,
  "flightInstanceId": 1
}
```
- **Response**: `200 OK` (or `409 Conflict` if overlapping window detected)

---

## 10. Module 8: Employee Operations

### 10.1 List Employees
- **Endpoint**: `GET /api/employees`
- **Auth**: `ADMIN`
- **Response**: `200 OK`

### 10.2 Register Employee
- **Endpoint**: `POST /api/employees`
- **Auth**: `ADMIN`
- **Request Body**:
```json
{
  "airportCode": "DEL",
  "jobTitle": "Lead Air Traffic Dispatcher",
  "department": "Airside Ground Operations",
  "shift": "MORNING",
  "firstName": "Kavita",
  "lastName": "Nair",
  "contactPhone": "+91 98765 43210"
}
```
- **Response**: `201 Created`
