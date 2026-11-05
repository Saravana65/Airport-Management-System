# Phase 10: Docker Setup & Operations Guide

**Project:** Airport Management System  
**Audience:** BTech Faculty Evaluation, Viva Demonstration & DevOps Deployment  

---

## 1. Prerequisites

Before running the containerized Airport Management System, ensure your machine meets the following prerequisites:

1. **Docker Desktop** (Windows or macOS) or **Docker Engine + Docker Compose** (Linux):
   - Docker version $\ge$ 20.10
   - Docker Compose version $\ge$ v2.0
2. **Oracle Database XE (Optional for host connection):**
   - If installed locally on Windows, ensure the Oracle listener service is running on port `1521` (Service: `XEPDB1`).
   - If Oracle is not installed or offline, the backend container automatically starts in **resilient fallback mode** without crashing.

---

## 2. Quick Start (One-Click Launch)

### On Windows:
```cmd
cd Airport-Management-System
docker-up.bat
```

### On Linux / macOS:
```bash
cd Airport-Management-System
chmod +x docker-up.sh docker-down.sh
./docker-up.sh
```

### Manual Command Line:
```bash
# 1. Prepare environment configuration
cp .env.example .env

# 2. Build and launch all multi-tier services in background
docker-compose up -d --build

# 3. View container health and status
docker-compose ps
```

---

## 3. Container Topology & Port Allocations

| Service | Container Name | Port Mapping | Healthcheck Endpoint | Description |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend** | `airport-frontend` | `80:80` | `http://localhost:80/healthz` | React 18 SPA served via Nginx with API reverse proxy |
| **Backend** | `airport-backend` | `5000:5000` | `http://localhost:5000/api/health` | Node.js Express Gateway & compiled C99 algorithm engine |
| **Java Service**| `airport-java-service` | `5050:5050` | `http://localhost:5050/health` | Java 17 OOP Domain Microservice (Dynamic pricing & state machine) |

---

## 4. Connecting to Host Oracle Database

When running inside Docker containers on Windows, `localhost` refers to the container itself, not your Windows host machine.

The `docker-compose.yml` file is pre-configured with:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

To connect the backend container to your host's Oracle XE database:
1. Open `.env`
2. Set your Oracle credentials:
   ```env
   DB_USER=airport_admin
   DB_PASSWORD=your_actual_oracle_password
   DB_CONNECT_STRING=host.docker.internal:1521/XEPDB1
   ```
3. Restart backend:
   ```bash
   docker-compose restart backend
   ```

---

## 5. Stopping and Cleaning Up Containers

To stop all running containers and remove the internal bridge network:

### On Windows:
```cmd
docker-down.bat
```

### On Linux / macOS:
```bash
./docker-down.sh
```

### Manual Command:
```bash
docker-compose down
```

To stop containers and delete build images:
```bash
docker-compose down --rmi all
```

---

## 6. Troubleshooting Common Issues

### Issue 1: "open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified"
* **Cause:** Docker Desktop is installed but the background application is not currently started.
* **Fix:** Open **Docker Desktop** from your Windows Start Menu, wait for the status bar icon to show *"Engine Running"*, then re-run `docker-up.bat`.

### Issue 2: Port 80 is already in use (e.g. by IIS or Skype)
* **Cause:** Windows World Wide Web Publishing Service (IIS) occupies port 80.
* **Fix:** Open `.env` and change `FRONTEND_PORT=80` to `FRONTEND_PORT=3000` or `8080`, then run `docker-compose up -d`.

### Issue 3: Database Connection Timeout
* **Cause:** Windows Defender Firewall blocks port 1521 from WSL/Docker subnet.
* **Fix:** The backend container contains built-in graceful degradation. Even if Oracle is blocked, the API services continue running with structured diagnostic status messages on `GET /api/health/database`.
