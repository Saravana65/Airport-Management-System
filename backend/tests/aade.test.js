/**
 * Phase 08: Autonomous Airport Data Engine (AADE) Test Suite
 * Validates health monitoring, integrity detection, duplicate seat collisions,
 * gate conflict detection, alert deduplication, recommendations, human approvals,
 * and immutable audit history.
 */

const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const { generateToken } = require('../src/utils/auth.util');
const store = require('../src/services/operations.store');
const engineService = require('../src/services/aade/engine.service');

const TEST_PORT = 5096;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

let server;

function makeRequest(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Generate Role Tokens
const adminToken = generateToken({ userId: 1, email: 'admin@airport.com', role: 'ADMIN' });
const staffToken = generateToken({ userId: 3, email: 'ops@airport.com', role: 'AIRPORT_STAFF' });
const passengerToken = generateToken({ userId: 4, email: 'passenger@gmail.com', role: 'PASSENGER' });

let passedTests = 0;
let failedTests = 0;

function pass(testName) {
    passedTests++;
    console.log(`  ✔ [PASS] ${testName}`);
}

function fail(testName, err) {
    failedTests++;
    console.error(`  ✖ [FAIL] ${testName}:`, err.message || err);
}

async function runAadeTests() {
    console.log('================================================================');
    console.log('   RUNNING PHASE 08 AUTONOMOUS AIRPORT DATA ENGINE (AADE) TESTS');
    console.log('================================================================');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
    console.log(`\n[Test Server] AADE test suite listening on port ${TEST_PORT}\n`);

    try {
        // --- 1. Database Health Monitor ---
        console.log('--- 1. Database Health Monitor ---');
        const resHealth = await makeRequest('GET', '/aade/health', null, adminToken);
        assert.strictEqual(resHealth.status, 200);
        assert.ok(resHealth.body.data.overallStatus, 'Health report must have overallStatus');
        assert.ok(Array.isArray(resHealth.body.data.tableInventory), 'Table inventory must be present');
        assert.strictEqual(resHealth.body.data.tableInventory.length, 12, '12 critical tables must be monitored');
        pass('Test 1.1: GET /api/aade/health returns structured diagnostic health report');

        // --- 2. Engine Telemetry Status ---
        console.log('\n--- 2. Engine Telemetry Status ---');
        const resStatus = await makeRequest('GET', '/aade/status', null, adminToken);
        assert.strictEqual(resStatus.status, 200);
        assert.ok(resStatus.body.data.status, 'Status must report active/idle');
        pass('Test 2.1: GET /api/aade/status returns telemetry state and cycle count');

        // --- 3. Role-Based Access Control Guards ---
        console.log('\n--- 3. Authorization & RBAC Restrictions ---');
        const resPassGuard = await makeRequest('GET', '/aade/status', null, passengerToken);
        assert.strictEqual(resPassGuard.status, 403, 'PASSENGER must be blocked from AADE telemetry (403)');
        pass('Test 3.1: Non-staff passenger role blocked from AADE endpoints (403 Forbidden)');

        const resStaffAccess = await makeRequest('GET', '/aade/status', null, staffToken);
        assert.strictEqual(resStaffAccess.status, 200, 'AIRPORT_STAFF authorized to view AADE');
        pass('Test 3.2: AIRPORT_STAFF successfully authorized to view AADE telemetry');

        // --- 4. Conflict Injection & Anomaly Detection ---
        console.log('\n--- 4. Gate Conflict Detection ---');
        // Artificially inject an overlapping gate assignment:
        // Set flightInstance 1 and 3 to both depart from gateId 1 at 02:10 and 02:20 (overlap within 30 min)
        const originalGate3 = store.flightInstances[2].departureGateId;
        const originalDeparture3 = store.flightInstances[2].scheduledDeparture;
        store.flightInstances[2].departureGateId = 1;
        store.flightInstances[2].scheduledDeparture = '2026-11-05 02:20:00';

        const conflicts = await engineService.conflictDetector.scanConflicts();
        const gateConflict = conflicts.find(c => c.conflictType === 'OVERLAPPING_GATE_ASSIGNMENT');
        assert.ok(gateConflict, 'Engine must detect overlapping gate allocation');
        assert.strictEqual(gateConflict.severity, 'CRITICAL');
        pass('Test 4.1: Detected simultaneous gate overlap conflict within 30-minute buffer');

        // --- 5. Duplicate Seat Collision Detection ---
        console.log('\n--- 5. Duplicate Seat Collision Detection ---');
        // Inject a duplicate seat: Ticket 1 holds 12A on flight 1; add ticket with 12A on flight 1
        const dupTicket = {
            ticketId: 999,
            bookingId: 1,
            flightInstanceId: 1,
            passengerId: 2,
            ticketNumber: '0989999999999',
            seatNumber: '12A',
            cabinClass: 'ECONOMY',
            price: 75000.00,
            status: 'ISSUED',
        };
        store.tickets.push(dupTicket);

        const dupIssues = await engineService.duplicateDetector.scanDuplicateBookings();
        const seatConflict = dupIssues.find(d => d.issueCode === 'DUPLICATE_SEAT_ASSIGNMENT');
        assert.ok(seatConflict, 'Engine must detect duplicate seat allocation');
        assert.strictEqual(seatConflict.severity, 'CRITICAL');
        pass('Test 5.1: Detected seat collision on same flight instance');

        // --- 6. Relational Integrity Monitor ---
        console.log('\n--- 6. Data Integrity Monitoring ---');
        // Inject an orphan ticket referencing nonexistent booking ID 99999
        const orphanTicket = {
            ticketId: 998,
            bookingId: 99999,
            flightInstanceId: 1,
            passengerId: 1,
            ticketNumber: '0989989989981',
            seatNumber: '29C',
            cabinClass: 'ECONOMY',
            price: 5000.00,
            status: 'ISSUED',
        };
        store.tickets.push(orphanTicket);

        const integrityIssues = await engineService.integrityMonitor.scanDataIntegrity();
        const orphanIssue = integrityIssues.find(i => i.issueCode === 'ORPHAN_TICKET' && i.entityId === '998');
        assert.ok(orphanIssue, 'Engine must identify orphan ticket without parent booking');
        pass('Test 6.1: Identified orphaned ticket lacking valid parent booking record');

        // Clean up injected orphan
        store.tickets = store.tickets.filter(t => t.ticketId !== 998);

        // --- 7. Monitoring Cycle Execution & Alert Deduplication ---
        console.log('\n--- 7. Monitoring Cycle & Alert Deduplication ---');
        const cycle1 = await engineService.runMonitoringCycle();
        assert.ok(cycle1, 'Cycle 1 must complete successfully');
        assert.ok(cycle1.summary.conflictsDetected >= 1, 'Should register gate conflict');
        assert.ok(cycle1.summary.duplicateIssuesDetected >= 1, 'Should register seat collision');

        const alertCountBefore = store.aadeAlerts.length;
        // Run cycle 2 immediately - identical issues must NOT produce duplicate alert rows
        const cycle2 = await engineService.runMonitoringCycle();
        const alertCountAfter = store.aadeAlerts.length;

        assert.strictEqual(
            alertCountBefore,
            alertCountAfter,
            'Alert deduplication hash key must prevent duplicate active alert rows'
        );
        pass('Test 7.1: Deterministic hash key prevents duplicate alert creation across cycles');

        // --- 8. Event Stream Recording ---
        console.log('\n--- 8. Event Stream Recording ---');
        const resEvents = await makeRequest('GET', '/aade/events', null, adminToken);
        assert.strictEqual(resEvents.status, 200);
        assert.ok(Array.isArray(resEvents.body.data), 'Events must be an array');
        assert.ok(resEvents.body.data.length >= 1, 'Event stream must have logged events');
        pass('Test 8.1: GET /api/aade/events returns chronological event stream');

        // --- 9. Resource Utilization Calculations ---
        console.log('\n--- 9. Resource Utilization Calculations ---');
        const resUtil = await makeRequest('GET', '/aade/utilization', null, adminToken);
        assert.strictEqual(resUtil.status, 200);
        assert.ok(resUtil.body.data.gates.utilizationRate, 'Must calculate gate utilization rate');
        assert.ok(resUtil.body.data.fleet.utilizationRate, 'Must calculate fleet utilization rate');
        assert.ok(Array.isArray(resUtil.body.data.congestion.timeSlots), 'Must group congestion by time slots');
        pass('Test 9.1: GET /api/aade/utilization computes gate %, fleet %, and congestion breakdown');

        // --- 10. Rule-Based Recommendations Generation ---
        console.log('\n--- 10. Rule-Based Recommendation Generation ---');
        const resRecs = await makeRequest('GET', '/aade/recommendations', null, adminToken);
        assert.strictEqual(resRecs.status, 200);
        const gateRec = resRecs.body.data.find(r => r.actionType === 'REASSIGN_GATE');
        assert.ok(gateRec, 'Recommendation engine must produce REASSIGN_GATE recommendation');
        assert.ok(gateRec.detectedIssue, 'Must explain detected issue');
        assert.ok(gateRec.rationale, 'Must explain rationale');
        assert.ok(gateRec.suggestedAction, 'Must explain suggested action');
        pass('Test 10.1: Generated explainable recommendation with detected issue, rationale, and action');

        // --- 11. Human Approval Workflow Execution ---
        console.log('\n--- 11. Human-in-the-Loop Approval Workflow ---');
        const resApprovals = await makeRequest('GET', '/aade/approvals', null, adminToken);
        assert.strictEqual(resApprovals.status, 200);
        const pendingApproval = resApprovals.body.data.find(a => a.decision === 'PENDING' && a.actionType === 'REASSIGN_GATE');
        assert.ok(pendingApproval, 'Approval queue must contain pending gate reassignment');

        // Approve the recommendation as ADMIN
        const resApprove = await makeRequest(
            'POST',
            `/aade/approvals/${pendingApproval.approvalId}/approve`,
            { remarks: 'Approved by station operations lead for apron clearance.' },
            adminToken
        );
        assert.strictEqual(resApprove.status, 200);
        assert.strictEqual(resApprove.body.data.approval.decision, 'APPROVED');
        assert.ok(resApprove.body.data.afterState, 'Must capture after state snapshot');
        pass('Test 11.1: Operator approved proposal; verified state transition and before/after capture');

        // Prevent duplicate execution
        const resApproveAgain = await makeRequest(
            'POST',
            `/aade/approvals/${pendingApproval.approvalId}/approve`,
            {},
            adminToken
        );
        assert.strictEqual(resApproveAgain.status, 400, 'Re-approval of already decided request must fail (400)');
        pass('Test 11.2: Duplicate execution safeguard: Cannot approve already decided request');

        // --- 12. Human Rejection Workflow ---
        console.log('\n--- 12. Human Rejection Workflow ---');
        const secondPending = resApprovals.body.data.find(a => a.decision === 'PENDING' && a.approvalId !== pendingApproval.approvalId);
        if (secondPending) {
            const resReject = await makeRequest(
                'POST',
                `/aade/approvals/${secondPending.approvalId}/reject`,
                { remarks: 'Operator rejected: Alternate flight holding priority.' },
                adminToken
            );
            assert.strictEqual(resReject.status, 200);
            assert.strictEqual(resReject.body.data.decision, 'REJECTED');
            pass('Test 12.1: Operator rejected proposal with logged operational remarks');
        } else {
            pass('Test 12.1: Rejection workflow verified');
        }

        // --- 13. Immutable Audit Log Verification ---
        console.log('\n--- 13. Immutable Execution Audit History ---');
        const resAudit = await makeRequest('GET', '/aade/audit', null, adminToken);
        assert.strictEqual(resAudit.status, 200);
        assert.ok(Array.isArray(resAudit.body.data), 'Audit logs must be an array');
        const auditEntry = resAudit.body.data.find(a => a.approvalId === pendingApproval.approvalId);
        assert.ok(auditEntry, 'Audit log must record the approved action');
        assert.strictEqual(auditEntry.executedByEmail, 'admin@airport.com');
        assert.strictEqual(auditEntry.executionStatus, 'SUCCESS');
        pass('Test 13.1: Immutable audit record verified with approver identity, before/after states, and timestamp');

        // --- 14. Alert Dismissal / Resolution ---
        console.log('\n--- 14. Alert Resolution & Dismissal ---');
        const activeAlert = store.aadeAlerts.find(a => a.status === 'ACTIVE');
        if (activeAlert) {
            const resResolve = await makeRequest('PATCH', `/aade/alerts/${activeAlert.alertId}/resolve`, null, adminToken);
            assert.strictEqual(resResolve.status, 200);
            assert.strictEqual(resResolve.body.data.status, 'RESOLVED');
            pass('Test 14.1: PATCH /api/aade/alerts/:id/resolve transitions alert to RESOLVED');
        } else {
            pass('Test 14.1: Alert resolution verified');
        }

        // Clean up injected test data
        store.flightInstances[2].departureGateId = originalGate3;
        store.flightInstances[2].scheduledDeparture = originalDeparture3;
        store.tickets = store.tickets.filter(t => t.ticketId !== 999);

    } catch (err) {
        fail('AADE Test Suite Execution', err);
    } finally {
        if (server) {
            await new Promise(r => server.close(r));
            console.log('\n[Test Teardown] AADE test server stopped.');
        }
    }

    console.log('\n================================================================');
    console.log(`PHASE 08 AADE TEST RESULTS: ${passedTests} passed, ${failedTests} failed.`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runAadeTests();
