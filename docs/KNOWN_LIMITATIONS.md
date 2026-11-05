# Known Limitations & Academic Boundary Report

**Project:** Airport Management System  
**Phase:** Phase 11 — Demonstration Readiness  
**Target:** Academic Faculty Presentation & Viva Evaluation  
**Author:** Saravana (BTech Student Project)

---

## 1. Academic Scope & Boundary Disclaimers

This system was created as an advanced BTech student capstone project demonstrating **relational database modeling**, **autonomous monitoring systems**, **object-oriented software engineering**, **native algorithm design in C**, and **production containerization**.

To maintain academic clarity and explainability, the following deliberate boundaries and limitations exist:

### 1.1 Physical Equipment & Hardware Simulation
- **No Physical Radar or Transponders:** Flight statuses and airside movements are simulated based on scheduled departure and arrival timestamps. The system does not interface with physical ADS-B radio receivers or avionics transponders.
- **Simulated Baggage RFID & Conveyors:** Baggage tags are issued as unique alphanumeric identifiers and routing is calculated via Dijkstra's shortest-path algorithm. The platform does not control physical PLC sorters or optical baggage scanners.

### 1.2 Relational Database vs. Standby In-Memory Fallback
- **Oracle XE Host Prerequisite:** To achieve real disk persistence, Oracle Database Express Edition (XE) must be installed and running on port 1521 with pluggable database `XEPDB1`.
- **Standby Memory Store:** If Oracle XE is not running on the evaluator's machine, the platform automatically enters its resilient in-memory fallback mode. In this mode, all APIs, authentication flows, operations, AADE monitoring, and algorithm visualizers remain 100% interactive and functional, but changes are stored in memory and reset upon server restart.

### 1.3 Container Runtime Availability
- **Docker Daemon Dependency:** Multi-container orchestration is defined in `docker-compose.yml` and fully validated with `docker-compose config`. However, running containers live via `docker compose up` requires Docker Desktop to be installed and active on the host machine. If Docker Desktop is offline, the entire platform can be run directly on the host using standard Node.js, Java, and C compilers.

### 1.4 Financial Transactions & Payment Gateway
- **Simulated Payment Gateway:** Payment statuses are marked as `COMPLETED_SIMULATED`. The system deliberately omits real third-party payment gateways (such as Stripe or Razorpay) to prevent credential overhead and transaction costs during viva presentations.

---

## 2. Recommended Demonstration Environment

- **Operating System:** Windows 10/11 x64 or Linux (Ubuntu 22.04+)
- **Node.js:** v20.x LTS or higher
- **Java:** OpenJDK 17 LTS or higher
- **C Compiler:** MSVC 19+ (Windows) or GCC 11+ (Linux)
- **Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox (Modern Evergreen)
