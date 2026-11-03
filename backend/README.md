# Airport Management System — Backend API

> **Runtime**: Node.js v24+ (LTS) & Express.js  
> **Database Driver**: `node-oracledb` (Thin Mode)  
> **Security**: JWT & bcryptjs with Role-Based Access Control (RBAC)  
> **Author**: Saravana (BTech Student Capstone Project)

---

## 1. Quick Start

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Configure Environment
Copy `.env.example` to `.env` and configure your settings:
```bash
cp .env.example .env
```

### 1.3 Run Integration Tests
```bash
npm test
```
*Executes both `tests/health.test.js` and `tests/auth.test.js` (19 total tests).*

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
| **Test** | `npm test` | Runs the full integration test suite (`tests/health.test.js` & `tests/auth.test.js`). |

---

## 3. Directory Layout

```
backend/
├── .env.example                 # Environment template with JWT_SECRET and DB settings
├── .gitignore                   # Ignores node_modules and secret .env
├── package.json                 # Dependencies and npm scripts
├── README.md                    # This file
│
├── src/
│   ├── app.js                   # Express configuration, security headers, cookie parsing, and middleware
│   ├── server.js                # Server entry point, Oracle pool init, and graceful shutdown
│   ├── config/
│   │   ├── database.js          # Oracle connection pool manager (node-oracledb Thin Mode)
│   │   └── environment.js       # Environment configuration validator
│   ├── controllers/
│   │   ├── admin.controller.js  # User directory and role modification endpoints
│   │   ├── auth.controller.js   # Register, login, logout, profile, and password handlers
│   │   └── health.controller.js # System and database health handlers
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT validation, RBAC guards, and payload sanitizers
│   │   ├── error.middleware.js  # Centralized error handler (masks database passwords)
│   │   └── notFound.middleware.js # Standardized 404 handler
│   ├── routes/
│   │   ├── admin.routes.js      # Protected admin routes (/api/admin/users)
│   │   ├── auth.routes.js       # Authentication routes (/api/auth/...)
│   │   ├── health.routes.js     # Health route declarations
│   │   └── index.js             # Root API router
│   ├── services/
│   │   ├── auth.service.js      # User queries, bcrypt hashing, and role updates
│   │   └── database.service.js  # Parameterized SQL query executor with auto-release
│   └── utils/
│       ├── auth.util.js         # Bcrypt hashing and JWT sign/verify functions
│       └── response.util.js     # Standard JSON formatters
│
└── tests/
    ├── health.test.js           # Express boot & database connectivity test
    └── auth.test.js             # Bcrypt hashing, JWT, RBAC, and privilege escalation tests
```

---

## 4. Endpoints Overview

### Health Endpoints
| Method | Endpoint | Access Level | Description | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | API Gateway index and documentation links | `200 OK` |
| `GET` | `/api/health` | Public | Application status, memory usage, and uptime | `200 OK` |
| `GET` | `/api/health/database`| Public | Oracle connection pool test & query latency | `200 OK` (when connected) / `503` (when DB offline) |

### Authentication Endpoints
| Method | Endpoint | Access Level | Description | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new passenger account | `201 Created` |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and sets HTTP-only cookie | `200 OK` |
| `POST` | `/api/auth/logout` | Public | Clears authentication token cookie | `200 OK` |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current user profile | `200 OK` |
| `PUT` | `/api/auth/change-password` | Authenticated | Verifies current password and updates hash | `200 OK` |

### Administrator Endpoints
| Method | Endpoint | Access Level | Description | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | `ADMIN` Only | Lists complete user directory | `200 OK` |
| `PUT` | `/api/admin/users/:id/role` | `ADMIN` Only | Promotes/demotes user operational roles | `200 OK` |
| `PUT` | `/api/admin/users/:id/status`| `ADMIN` Only | Activates (`Y`) or deactivates (`N`) user login | `200 OK` |

For detailed documentation, see:
- [`docs/BACKEND_SETUP.md`](../docs/BACKEND_SETUP.md)
- [`docs/AUTHENTICATION_DESIGN.md`](../docs/AUTHENTICATION_DESIGN.md)
- [`docs/ROLE_PERMISSIONS.md`](../docs/ROLE_PERMISSIONS.md)
