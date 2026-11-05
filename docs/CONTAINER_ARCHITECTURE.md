# Phase 10: Multi-Tier Container Architecture & Production Orchestration

**Project:** Airport Management System  
**Audience:** BTech Viva Defense, Software Architecture & DevOps Engineering  

---

## 1. System Container Topology

The Airport Management System is deployed as an orchestrated multi-container application on an isolated Docker bridge network (`airport-network`).

```mermaid
graph TD
    Client["Client Browser (Port 80)"] -->|HTTP / SPA Navigation| Nginx["airport-frontend<br/>(Nginx 1.27 Alpine)"]
    
    subgraph "Docker Isolated Network: airport-network"
        Nginx -->|Reverse Proxy /api/*| Backend["airport-backend<br/>(Node.js 20 Alpine + dumb-init)"]
        
        subgraph "Internal Binary Execution"
            Backend -->|child_process.execFile| C_Engine["c-engine (Linux ELF)<br/>Native ANSI C99 Algorithms"]
        end
        
        Backend -->|HTTP REST Client (Port 5050)| JavaService["airport-java-service<br/>(Eclipse Temurin 17 JRE Alpine)"]
    end
    
    Backend -->|Oracle Net via host.docker.internal:1521| OracleDB[("Host Oracle XE Database<br/>(Service: XEPDB1)")]
```

---

## 2. Multi-Stage Docker Build Strategies

To adhere to industry-standard DevOps best practices, every service utilizes **Multi-Stage Dockerfiles**. Build tools, compilers, and development headers are strictly excluded from runtime production images to minimize attack surface and reduce image sizes.

### 2.1 React Frontend (`frontend/Dockerfile`)
1. **Stage 1 (`builder-frontend`):**
   - Base image: `node:20-alpine`
   - Executes `npm ci` and `npm run build` using Vite.
   - Output: Compact, optimized static bundle in `/app/dist`.
2. **Stage 2 (`runtime`):**
   - Base image: `nginx:1.27-alpine` (~23 MB).
   - Serves static assets with gzip compression and browser caching.
   - Proxies `/api/` requests to `http://backend:5000/api/`, eliminating Cross-Origin Resource Sharing (CORS) complexity in production.
   - Implements SPA client-side routing fallback (`try_files $uri $uri/ /index.html;`).

### 2.2 Node.js Gateway & Native C Engine (`backend/Dockerfile`)
1. **Stage 1 (`builder-c`):**
   - Base image: `alpine:3.20` with `gcc`, `musl-dev`, `make`.
   - Compiles native Linux ELF binaries: `c-engine` and `test_algorithms`.
   - **Pre-Package Verification:** Runs `./test_algorithms` during image build. If any C test fails, the Docker image build aborts immediately!
2. **Stage 2 (`runtime`):**
   - Base image: `node:20-alpine`.
   - Copies compiled `c-engine` binary into `/app/c-engine/c-engine` and discards all C build tools.
   - Installs production dependencies (`npm ci --only=production`).
   - Uses `dumb-init` as PID 1 to properly handle `SIGTERM` and `SIGINT` signals for graceful Express server shutdown.
   - Drops root privileges to the unprivileged `node` user.

### 2.3 Java 17 OOP Domain Microservice (`java-service/Dockerfile`)
1. **Stage 1 (`builder-java`):**
   - Base image: `eclipse-temurin:17-jdk-alpine`.
   - Compiles bytecode using standard `javac` (zero heavy Maven/Gradle dependencies).
   - Executes standalone `BookingWorkflowTest` suite to verify OOP domain models during image creation.
2. **Stage 2 (`runtime`):**
   - Base image: `eclipse-temurin:17-jre-alpine` (~100 MB).
   - Creates a dedicated non-root user `airport`.
   - Runs embedded `HttpServer` listening on port `5050`.

---

## 3. Inter-Container Networking & Port Mapping

1. **Bridge Network (`airport-network`):**
   - Provides internal DNS resolution: `backend` resolves to the Node.js container, `java-service` resolves to the Java microservice.
2. **Reverse Proxying:**
   - Web clients only connect to port `80` (or `3000`).
   - All `/api/` traffic is routed internally to `backend:5000`, keeping the backend off the public network if desired.
3. **Host Gateway Access:**
   - The backend container utilizes `extra_hosts: "host.docker.internal:host-gateway"`, allowing it to reach the Oracle Database XE instance hosted on the physical host machine at port `1521`.

---

## 4. Security Hardening & Best Practices

| Security Feature | Implementation Mechanism |
| :--- | :--- |
| **Least Privilege (Non-root)** | `USER node` in backend, `USER airport` in Java microservice. Prevents container breakout vulnerabilities. |
| **Secrets Exclusion** | All `.env` and credential files are listed in `.dockerignore`. No passwords appear in Dockerfiles or Git commits. |
| **PID 1 Signal Handling** | `dumb-init` ensures OS signals (`SIGTERM`) propagate cleanly to Node.js, allowing the connection pool and AADE daemon to shut down without data corruption. |
| **Healthcheck Probes** | Active Docker `HEALTHCHECK` instructions periodically probe `/api/health`, `/healthz`, and `/health`. |
| **Graceful Fallbacks** | If Oracle XE or Java service is offline, backend services return structured fallback diagnostics rather than throwing uncaught exceptions. |
