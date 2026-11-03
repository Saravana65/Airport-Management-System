# Airport Management System — Backend API

> **Runtime**: Node.js v24+ (LTS) & Express.js  
> **Database Driver**: `node-oracledb` (Thin Mode)  
> **Author**: Saravana (BTech Student Capstone Project)

---

## 1. Quick Start

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Configure Environment
Copy `.env.example` to `.env` and fill in your Oracle database credentials:
```bash
cp .env.example .env
```

### 1.3 Run Integration Tests
```bash
npm test
```

### 1.4 Start Development Server
```bash
npm run dev
```

The server will boot at `http://localhost:5000` with the base API mounted at `/api`.

---

## 2. Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start** | `npm start` | Boots the server in production mode using `node src/server.js`. |
| **Dev** | `npm run dev` | Boots the server with live reloading via `nodemon`. |
| **Test** | `npm test` | Runs the integration test suite (`tests/health.test.js`). |

---

## 3. Directory Layout

```
backend/
├── .env.example                 # Environment template
├── .gitignore                   # Ignores node_modules and secret .env
├── package.json                 # Dependencies and npm scripts
├── README.md                    # This file
│
├── src/
│   ├── app.js                   # Express configuration, security, and middleware
│   ├── server.js                # Server entry point and graceful shutdown
│   ├── config/
│   │   ├── database.js          # Oracle connection pool manager
│   │   └── environment.js       # Environment configuration validator
│   ├── controllers/
│   │   └── health.controller.js # System and database health handlers
│   ├── middleware/
│   │   ├── error.middleware.js  # Centralized error handler
│   │   └── notFound.middleware.js # 404 handler
│   ├── routes/
│   │   ├── health.routes.js     # Health route declarations
│   │   └── index.js             # Root API router
│   ├── services/
│   │   └── database.service.js  # Parameterized SQL query executor
│   └── utils/
│       └── response.util.js     # Standard JSON formatters
│
└── tests/
    └── health.test.js           # Integration test verifying server & DB status
```

---

## 4. Endpoints Overview

| Method | Endpoint | Description | Expected Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Gateway index and documentation links | `200 OK` |
| `GET` | `/api/health` | Application status, memory usage, and uptime | `200 OK` |
| `GET` | `/api/health/database`| Oracle connection pool test & query latency | `200 OK` (when connected) / `503` (when DB offline) |

For complete documentation, see [`docs/BACKEND_SETUP.md`](../docs/BACKEND_SETUP.md).
