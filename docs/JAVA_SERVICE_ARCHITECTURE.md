# Phase 09: Java OOP Service Architecture

**Module:** Object-Oriented Airport Services  
**Language:** Java 17 LTS (Pure Standard Library)  
**Port:** 5050 (Embedded HTTP Server)  
**Target Environment:** Academic Capstone & Production Polyglot Architecture  

---

## 1. Architectural Overview

The **Java Airport OOP Service** is a dedicated domain microservice engineered to encapsulate core transaction workflows, booking lifecycle state transitions, dynamic pricing computations, and thread-safe in-memory repository storage.

Rather than introducing bulky third-party enterprise frameworks (such as Spring Boot or Quarkus) that obscure fundamental computer science concepts during viva examinations, this service is built on standard **Java 17 LTS SE** using `com.sun.net.httpserver.HttpServer`. It starts in under **50 milliseconds** with zero external JAR dependencies.

```mermaid
graph TD
    Client["React Frontend (Port 5173)"] -->|HTTP / JSON| Express["Node.js Express Backend (Port 5000)"]
    Express -->|HTTP REST Client (Port 5050)| JavaService["Java OOP Microservice (Port 5050)"]
    
    subgraph "Java 17 OOP Domain Layer"
        JavaService --> BookingHandler["BookingHttpHandler"]
        BookingHandler --> BookingService["BookingService (Interface)"]
        BookingService --> BookingServiceImpl["BookingServiceImpl"]
        
        BookingServiceImpl --> Pricing["PricingStrategy (Interface)"]
        Pricing --> StdPricing["StandardPricingStrategy"]
        Pricing --> SurgePricing["SurgePricingStrategy"]
        
        BookingServiceImpl --> Lifecycle["BookingLifecycleManager (State Machine)"]
        BookingServiceImpl --> Repo["BookingRepository (Interface)"]
        Repo --> MemRepo["InMemoryBookingRepository (ConcurrentHashMap)"]
        
        BookingServiceImpl --> Domain["Domain Entities (Booking, Ticket, Flight, Passenger)"]
    end
```

---

## 2. Package & Directory Structure

```
java-service/
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/
│   │           └── airport/
│   │               ├── model/
│   │               │   ├── BookingStatus.java          # Lifecycle stages enum
│   │               │   ├── CabinClass.java             # Seat tier & baggage multiplier enum
│   │               │   ├── Passenger.java              # Encapsulated traveler record
│   │               │   ├── Flight.java                 # Flight instance with synchronized seat capacity
│   │               │   ├── Ticket.java                 # Boarding pass credential
│   │               │   ├── Booking.java                # Abstract base class
│   │               │   ├── CommercialBooking.java      # Specialized commercial booking
│   │               │   └── VipBooking.java             # Specialized VIP booking with concierge
│   │               ├── exception/
│   │               │   ├── AirportException.java       # Base domain runtime exception
│   │               │   ├── BookingNotFoundException.java
│   │               │   ├── InvalidBookingStateException.java
│   │               │   ├── SeatUnavailableException.java
│   │               │   └── InvalidCancellationException.java
│   │               ├── workflow/
│   │               │   └── BookingLifecycleManager.java# Deterministic state machine
│   │               ├── service/
│   │               │   ├── PricingStrategy.java        # Strategy pattern interface
│   │               │   ├── StandardPricingStrategy.java# Fixed distance & tier multiplier
│   │               │   ├── SurgePricingStrategy.java   # Dynamic load factor & urgency pricing
│   │               │   ├── BookingService.java         # Service interface
│   │               │   └── BookingServiceImpl.java     # Service orchestration
│   │               ├── repository/
│   │               │   ├── BookingRepository.java      # Repository interface
│   │               │   └── InMemoryBookingRepository.java# ConcurrentHashMap storage
│   │               └── integration/
│   │                   ├── JsonHelper.java             # Dependency-free JSON formatter & parser
│   │                   ├── BookingHttpHandler.java     # Sun HttpServer HTTP Handler
│   │                   └── JavaServiceApplication.java # Microservice bootstrap entry point
│   └── test/
│       └── java/
│           └── com/
│               └── airport/
│                   └── BookingWorkflowTest.java        # Standalone OOP & workflow test suite
├── build.bat                                           # Automated compilation and test runner
└── run.bat                                             # Service startup batch script
```

---

## 3. Microservice REST Endpoints (Port 5050)

| Method | Endpoint | Description | Request Body / Parameters | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Diagnostic heartbeat & OOP module telemetry | None | `200 OK` |
| `GET` | `/api/bookings` | List all registered bookings | None | `200 OK` |
| `GET` | `/api/bookings/{id}` | Retrieve booking by ID or Reference | None | `200 OK` / `400 Bad Request` |
| `POST` | `/api/bookings` | Create new Commercial or VIP booking | JSON payload (passenger, flight, seat, tier) | `201 Created` |
| `POST` | `/api/bookings/{id}/transition` | Advance booking lifecycle state | `{"targetStatus": "CONFIRMED"}` | `200 OK` / `400 Bad Request` |
| `POST` | `/api/pricing/calculate` | Calculate dynamic pricing via strategy | JSON payload (fare, load, days, tier) | `200 OK` |

---

## 4. Concurrency & Thread-Safety Model

1. **HTTP Thread Pool:**  
   The HTTP server uses a fixed thread pool (`Executors.newFixedThreadPool(10)`) to concurrently service requests without blocking the application event loop.
2. **Concurrent Data Storage:**  
   `InMemoryBookingRepository` uses `java.util.concurrent.ConcurrentHashMap<String, Booking>`, ensuring lock-free reads and segmented writes without deadlocks.
3. **Synchronized Seat Allocation:**  
   `Flight.java` uses `synchronized` methods on `reserveSeat()` and `releaseSeat()` to prevent race conditions during simultaneous booking transactions.

---

## 5. Build and Execution Instructions

### Compile and Run Test Suite:
```cmd
cd java-service
build.bat
```

### Start Live Java Service:
```cmd
cd java-service
run.bat
```
*(Listening at `http://localhost:5050`)*
