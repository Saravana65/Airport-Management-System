# Autonomous Airport Data Engine (AADE): API Documentation

## Base Route
`http://localhost:5000/api/aade`

All endpoints require authentication (`Bearer <token>` or session cookie). Access is restricted to `ADMIN`, `AIRPORT_STAFF`, and `AIRLINE_STAFF` via Role-Based Access Control (`authorizeRoles`).

---

## Endpoint Specification

### 1. Engine Status & Telemetry
- **Method:** `GET /api/aade/status`
- **Roles:** `ADMIN`, `AIRPORT_STAFF`, `AIRLINE_STAFF`
- **Description:** Returns the background monitoring daemon state, cycle counts, and active alert summaries.
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "engineStartedAt": "2026-11-04T16:00:00.000Z",
    "totalCyclesRun": 42,
    "lastCycleTime": "2026-11-04T16:21:00.000Z",
    "isCycleRunning": false,
    "activeAlertsCount": 2,
    "pendingApprovalsCount": 1,
    "recommendationsCount": 1,
    "auditLogsCount": 5
  }
}
```

---

### 2. Database Health & Diagnostic Report
- **Method:** `GET /api/aade/health`
- **Roles:** `ADMIN`, `AIRPORT_STAFF`, `AIRLINE_STAFF`
- **Description:** Returns real Oracle connection health, connection pool parameters, and table inventory counts across all 12 operational entities.
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overallStatus": "HEALTHY",
    "isOracleOnline": false,
    "pingLatencyMs": null,
    "summaryMessage": "Oracle 1521 listener offline. App running in resilient in-memory mode.",
    "failedOperationsCount": 0,
    "pool": { "min": 2, "max": 10, "active": 0, "status": "STANDBY" },
    "tableInventory": [
      { "name": "AIRPORTS", "count": 6, "status": "AVAILABLE" },
      { "name": "GATES", "count": 10, "status": "AVAILABLE" },
      { "name": "FLIGHTS", "count": 7, "status": "AVAILABLE" }
    ],
    "lastChecked": "2026-11-04T16:25:00.000Z"
  }
}
```

---

### 3. Trigger Immediate Monitoring Sweep
- **Method:** `POST /api/aade/run`
- **Roles:** `ADMIN`, `AIRPORT_STAFF`, `AIRLINE_STAFF`
- **Description:** Manually executes a full monitoring cycle immediately. Ideal for viva demonstration and testing.
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "AADE monitoring cycle executed successfully.",
  "data": {
    "cycleNumber": 43,
    "durationMs": 14,
    "summary": {
      "healthStatus": "HEALTHY",
      "conflictsDetected": 1,
      "duplicateIssuesDetected": 0,
      "integrityIssuesDetected": 0,
      "newRecommendationsGenerated": 1,
      "activeAlertsCount": 1,
      "pendingApprovalsCount": 1
    }
  }
}
```

---

### 4. Active & Historical Alerts
- **Method:** `GET /api/aade/alerts`
- **Query Params:** `status` (`ACTIVE`, `RESOLVED`, `ALL`), `severity` (`INFO`, `WARNING`, `CRITICAL`)
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "alertId": 1,
      "hashKey": "d41d8cd98f00b204e9800998ecf8427e",
      "alertType": "OVERLAPPING_GATE_ASSIGNMENT",
      "severity": "CRITICAL",
      "title": "Airside Conflict: Stand Overlap",
      "message": "Stand conflict: Gate T2-G01 has simultaneous departure allocations for AI2014 and AI680.",
      "status": "ACTIVE",
      "occurrenceCount": 3,
      "firstDetectedAt": "2026-11-04T16:15:00.000Z",
      "lastDetectedAt": "2026-11-04T16:25:00.000Z"
    }
  ]
}
```

---

### 5. Resolve Alert
- **Method:** `PATCH /api/aade/alerts/:id/resolve`
- **Response:** `200 OK` (Updates status to `RESOLVED` and logs operator email)

---

### 6. Dismiss Alert
- **Method:** `PATCH /api/aade/alerts/:id/dismiss`
- **Response:** `200 OK` (Updates status to `DISMISSED`)

---

### 7. Chronological Event Stream
- **Method:** `GET /api/aade/events`
- **Query Params:** `limit` (default: 50)
- **Response:** `200 OK`

---

### 8. Airside Conflicts & Booking Anomalies
- **Method:** `GET /api/aade/conflicts`
- **Response:** `200 OK` (Returns `{ conflicts: [...], duplicates: [...] }`)

---

### 9. Resource Utilization Metrics
- **Method:** `GET /api/aade/utilization`
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gates": { "total": 10, "occupied": 2, "available": 8, "maintenance": 0, "utilizationRate": "20%" },
    "fleet": { "totalAircraft": 6, "deployedAircraft": 3, "utilizationRate": "50%" },
    "congestion": {
      "timeSlots": [
        { "label": "00:00 - 04:00", "departures": 2, "arrivals": 0 },
        { "label": "04:00 - 08:00", "departures": 3, "arrivals": 2 }
      ],
      "peakWindow": "04:00 - 08:00"
    },
    "baggage": { "totalTracked": 1, "bottlenecks": 0 },
    "checkIn": { "totalIssuedTickets": 2, "completedCheckIns": 1, "completionRate": "50%" }
  }
}
```

---

### 10. Rule-Based Recommendations
- **Method:** `GET /api/aade/recommendations`
- **Response:** `200 OK` (Lists recommendations with `detectedIssue`, `rationale`, and `suggestedAction`)

---

### 11. Human Approval Queue & Decisions
- **Method:** `GET /api/aade/approvals`
- **Approve Action:** `POST /api/aade/approvals/:id/approve`
  - **Request Body:** `{ "remarks": "Approved by supervisor" }`
  - **Response:** `200 OK` with executed before/after states.
- **Reject Action:** `POST /api/aade/approvals/:id/reject`
  - **Request Body:** `{ "remarks": "Rejected by operator" }`
  - **Response:** `200 OK`

---

### 12. Immutable Execution Audit History
- **Method:** `GET /api/aade/audit`
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "auditId": 1,
      "approvalId": 1,
      "actionType": "REASSIGN_GATE",
      "executedByEmail": "admin@airport.com",
      "beforeState": { "flightInstanceId": 3, "departureGateId": 1 },
      "afterState": { "flightInstanceId": 3, "departureGateId": 3, "assignedGateName": "T2-G03" },
      "executionStatus": "SUCCESS",
      "details": "Operator admin@airport.com approved: Reassign Flight AI680 to Gate T2-G03.",
      "executedAt": "2026-11-04T16:26:00.000Z"
    }
  ]
}
```
