# Node.js Backend Setup & Oracle Connection Guide

> **Project Phase**: Phase 04 — Node.js Backend Foundation & Oracle Database Connection  
> **Course / Degree**: BTech Capstone Project  
> **Author**: Saravana  
> **Repository**: [https://github.com/Saravana65/Airport-Management-System](https://github.com/Saravana65/Airport-Management-System)  
> **Runtime**: Node.js v24+ (LTS) & Express.js with `node-oracledb`

---

## 1. Architectural Overview

The backend is built as a stateless, modular RESTful API gateway using **Node.js** and **Express.js**. It manages communication between frontend web clients, native algorithm/OOP workers, and the persistent **Oracle Database** tier.

```mermaid
graph LR
    Client([HTTP Client / Browser]) -->|HTTP Request| Express[Express.js App]
    
    subgraph Security ["Security & Middleware"]
        Helmet[Helmet Security Headers]
        CORS[CORS Policy Guard]
        Logger[Morgan HTTP Logger]
    end

    subgraph CoreBackend ["Backend Architecture"]
        Router[API Gateway Router: /api]
        HealthCtrl[Health Controller]
        DBSvc[Database Service Wrapper]
        Pool[Oracle Connection Pool]
    end

    subgraph Persistence ["Persistence Layer"]
        OracleDB[(Oracle Database)]
    end

    Express --> Security
    Security --> Router
    Router --> HealthCtrl
    HealthCtrl --> DBSvc
    DBSvc --> Pool
    Pool <-->|TCP Thin Mode (Port 1521)| OracleDB
```

### Key Engineering Decisions:
1. **Connection Pooling**: Uses `oracledb.createPool` with configurable limits (`DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_INCREMENT`) to maintain persistent, reusable database sessions instead of opening costly TCP handshakes per HTTP request.
2. **Oracle Thin Mode by Default**: In `oracledb` v6+, the driver connects using a pure JavaScript TCP implementation. It does **not** require Oracle Instant Client binaries, client libraries, or environment variables like `LD_LIBRARY_PATH` or `OCI_DIR` to be configured on the host machine.
3. **Resilient Bootstrapping**: If Oracle is temporarily offline when the Node server boots, the application catches the error and starts in degraded mode. It does not crash; instead, `GET /api/health/database` returns an informative `503 Service Unavailable` status while `GET /api/health` continues serving.
4. **Leak Prevention**: The `database.service.js` wrapper acquires connections and always returns them to the pool inside a mandatory `finally { connection.close(); }` block.
5. **Security**: Hardening via `helmet`, strict `cors` origins, environment variable isolation, and bind variable parameterization (`:param`).

---

## 2. Directory Structure

```
backend/
├── .env.example                 # Template for local environment variables
├── .gitignore                   # Excludes node_modules and secret .env files
├── package.json                 # Project dependencies and test scripts
├── README.md                    # Quickstart guide
│
├── src/
│   ├── app.js                   # Express application setup, security middleware, routing
│   ├── server.js                # Server entry point, pool init, and graceful shutdown
│   │
│   ├── config/
│   │   ├── database.js          # Oracle connection pool manager (oracledb)
│   │   └── environment.js       # Environment configuration and validation
│   │
│   ├── controllers/
│   │   └── health.controller.js # Diagnostic endpoints for server and DB status
│   │
│   ├── middleware/
│   │   ├── error.middleware.js  # Centralized error handler (masks secrets)
│   │   └── notFound.middleware.js # 404 route interceptor
│   │
│   ├── routes/
│   │   ├── health.routes.js     # Health route declarations
│   │   └── index.js             # Master API router
│   │
│   ├── services/
│   │   └── database.service.js  # Query execution wrapper with pool acquisition & release
│   │
│   └── utils/
│       └── response.util.js     # Standardized JSON response formatters
│
└── tests/
    └── health.test.js           # Integration test verifying server and DB health
```

---

## 3. Environment Variables Reference

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP port on which the Express server listens. |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`). |
| `API_PREFIX` | `/api` | Base path prefix for all endpoints. |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5173` | Allowed client origins for browser cross-origin requests. |
| `DB_USER` | `airport_admin` | Oracle database schema username. |
| `DB_PASSWORD` | *(empty)* | Oracle database schema password. |
| `DB_CONNECT_STRING`| `localhost:1521/XEPDB1` | Easy Connect string: `host:port/service_name`. |
| `DB_POOL_MIN` | `2` | Minimum number of idle connections maintained in the pool. |
| `DB_POOL_MAX` | `10` | Maximum number of concurrent connections permitted in the pool. |
| `DB_POOL_INCREMENT`| `2` | Number of connections added when pool limits are reached. |
| `DB_POOL_TIMEOUT` | `60` | Seconds after which idle connections are terminated down to `poolMin`. |

---

## 4. API Endpoints Specification

### 4.1 Root Gateway
- **Method / Route**: `GET /`
- **Purpose**: Provides quick discovery of base endpoints and documentation.
- **Sample Response**:
  ```json
  {
    "message": "Airport Management System API Gateway",
    "healthCheck": "/api/health",
    "databaseHealth": "/api/health/database",
    "documentation": "docs/BACKEND_SETUP.md"
  }
  ```

---

### 4.2 Application Health Check
- **Method / Route**: `GET /api/health`
- **Purpose**: Verifies that the Express process is active and responsive.
- **Status Code**: `200 OK`
- **Sample Response**:
  ```json
  {
    "success": true,
    "message": "API service is running smoothly.",
    "data": {
      "status": "UP",
      "service": "Airport Management System API",
      "environment": "development",
      "uptimeSeconds": 142,
      "timestamp": "2026-11-03T23:25:00.000Z",
      "system": {
        "nodeVersion": "v24.15.0",
        "platform": "win32",
        "memoryMb": 24
      }
    },
    "timestamp": "2026-11-03T23:25:00.000Z"
  }
  ```

---

### 4.3 Database Connectivity Check
- **Method / Route**: `GET /api/health/database`
- **Purpose**: Tests Oracle connection pool by executing `SELECT 1 AS STATUS_CHECK, SYSDATE FROM DUAL` and measuring round-trip query latency.
- **Case 1: Database Connected (Status 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Oracle database connection is healthy and responsive.",
    "data": {
      "status": "UP",
      "dialect": "Oracle SQL",
      "targetHost": "localhost:1521/XEPDB1",
      "latencyMs": 14,
      "serverTime": "2026-11-03 23:25:10"
    },
    "timestamp": "2026-11-03T23:25:10.000Z"
  }
  ```
- **Case 2: Database Offline / Unreachable (Status 503 Service Unavailable)**:
  ```json
  {
    "success": false,
    "message": "Oracle database connection is currently unavailable.",
    "data": {
      "status": "DOWN",
      "dialect": "Oracle SQL",
      "targetHost": "localhost:1521/XEPDB1",
      "latencyMs": 321,
      "reason": "NJS-500: connection to the Oracle Database was not established."
    },
    "timestamp": "2026-11-03T23:25:10.000Z"
  }
  ```

---

## 5. Startup & Execution Instructions

### 5.1 Installation
Navigate to the `backend/` directory and install dependencies:
```bash
cd backend
npm install
```

### 5.2 Starting the Server
- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Mode** (with automatic reload via nodemon):
  ```bash
  npm run dev
  ```

### 5.3 Running Integration Tests
```bash
npm test
```

---

## 6. Actual Test Results

Executed via `node tests/health.test.js`:

```text
================================================================
   RUNNING BACKEND HEALTH & INTEGRATION TESTS
================================================================
[Test Setup] Test server listening on 127.0.0.1:5099

GET / 200 8.328 ms - 159
✔ [PASS] Test 1: GET / returns gateway information (200 OK)
GET /api/health 200 2.113 ms - 319
✔ [PASS] Test 2: GET /api/health returns status UP (200 OK)
[Database] Initializing Oracle connection pool...
[Database] Target Host/Connect String: localhost:1521/XEPDB1
[Database] User: airport_admin
[Database] Oracle connection pool created successfully.
[Database] Pool limits: Min 2, Max 10
GET /api/health/database 503 321.297 ms - 385
✔ [PASS] Test 3: GET /api/health/database gracefully handled offline Oracle DB (503 Service Unavailable)
GET /api/nonexistent-route-testing-404 404 0.735 ms - 127
✔ [PASS] Test 4: GET /api/nonexistent-route returns structured 404 error

[Test Teardown] Test server stopped.
[Database] Closing Oracle connection pool...
[Database] Oracle connection pool closed.
================================================================
TEST RESULTS: 4 passed, 0 failed.
================================================================
```

---

## 7. Known Limitations & Next Steps

1. **Authentication Token Issuance**: JWT generation and password hashing (`bcryptjs`) will be added in Phase 05 along with user login/registration endpoints.
2. **Domain CRUD Routes**: Routes for flights, bookings, check-in, and gates will consume the `database.service.js` query wrapper in the next implementation milestone.
3. **Autonomous Engine Background Worker**: The autonomous invariant poller will be constructed as a background worker consuming the established database connection pool.
