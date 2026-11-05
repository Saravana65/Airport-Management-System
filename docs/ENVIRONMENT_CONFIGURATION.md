# Phase 10: Environment Configuration Reference

**Project:** Airport Management System  
**Audience:** System Administrators, Developers, and Evaluators  

This document details all configuration parameters supported across the Node.js API Gateway, Java Microservice, C Engine, and React Frontend containers.

---

## 1. Environment Variable Reference Matrix

| Variable Name | Target Container / Layer | Default Value | Purpose & Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `backend` | `production` | Node.js execution environment (`development` or `production`). |
| `PORT` | `backend` | `5000` | HTTP port on which the Express server listens. |
| `API_PREFIX` | `backend` | `/api` | Base URL path prefix for all REST API endpoints. |
| `CORS_ORIGIN` | `backend` | `http://localhost,http://localhost:80,http://localhost:3000,http://localhost:5173` | Comma-separated list of permitted web browser origins. |
| `JWT_SECRET` | `backend` | *Random secret* | Cryptographic key used to sign and verify session JWT tokens. |
| `JWT_EXPIRES_IN` | `backend` | `24h` | Token expiration duration (e.g., `24h`, `7d`). |
| `COOKIE_SECRET` | `backend` | *Random secret* | Encryption key used for signing HttpOnly session cookies. |
| `DB_USER` | `backend` | `airport_admin` | Oracle SQL database user account. |
| `DB_PASSWORD` | `backend` | *(empty string)* | Password for the Oracle database user. **Never commit to Git.** |
| `DB_CONNECT_STRING` | `backend` | `host.docker.internal:1521/XEPDB1` | Oracle TNS connect string. In Docker, `host.docker.internal` maps to the host OS. |
| `DB_POOL_MIN` | `backend` | `2` | Minimum number of connections in the Oracle connection pool. |
| `DB_POOL_MAX` | `backend` | `10` | Maximum number of concurrent connections in the Oracle pool. |
| `DB_POOL_INCREMENT` | `backend` | `2` | Connections added when the pool expands. |
| `DB_POOL_TIMEOUT` | `backend` | `60` | Connection timeout in seconds. |
| `AADE_INTERVAL_MS`| `backend` | `60000` | Autonomous Airport Data Engine scan interval (in milliseconds). |
| `JAVA_SERVICE_URL` | `backend` | `http://java-service:5050` | Internal Docker network URL of the Java 17 OOP microservice. |
| `C_ENGINE_PATH` | `backend` | `/app/c-engine/c-engine` | Absolute path to the compiled C algorithm binary. |
| `JAVA_PORT` | `java-service` | `5050` | Port for the embedded Java HTTP microservice. |
| `FRONTEND_PORT` | `frontend` | `80` | Host port mapped to Nginx web server. |
| `VITE_API_URL` | `frontend` | `/api` | Base path for frontend API calls (proxied by Nginx). |

---

## 2. Setting Up `.env`

To create your local configuration:

```bash
# Copy template
cp .env.example .env
```

### Development vs Production Recommendations:
- In **development**, `DB_CONNECT_STRING` can be set to `localhost:1521/XEPDB1` if running Node.js outside Docker.
- In **Docker**, `DB_CONNECT_STRING` must point to `host.docker.internal:1521/XEPDB1` so the containerized backend reaches the host machine's Oracle XE listener.
- **Security Check:** Verify that `.env` is listed in `.gitignore` and never committed to version control.
