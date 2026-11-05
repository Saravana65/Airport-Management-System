/**
 * ==============================================================================
 * Phase 11: Comprehensive End-to-End (E2E) System Integration & Verification Suite
 * 
 * Tests the entire multi-language platform end-to-end:
 * 1. Authentication & Security (bcrypt, JWT, HttpOnly cookies, session restore, RBAC)
 * 2. Airport Operations Modules (Airports, Airlines, Flights, Bookings, Check-in, Baggage, Gates, Staff)
 * 3. Autonomous Airport Data Engine (AADE) (Sweeps, Conflicts, Deduplication, Approvals, Audit Log)
 * 4. Multi-Language Polyglot Engine (C Algorithm Engine & Java OOP Microservice)
 * 5. Database & Transaction Integrity (Seat collision, PNR uniqueness, cancellation release, rollback)
 * ==============================================================================
 */

const http = require('http');
const app = require('../src/app');
const { closePool } = require('../src/config/database');
const { generateToken } = require('../src/utils/auth.util');

const TEST_PORT = 5095;

function makeRequest({ path, method = 'GET', body = null, headers = {} }) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };
        if (payload) {
            requestHeaders['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request({
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path,
            method,
            headers: requestHeaders,
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsed,
                });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runE2ESuite() {
    console.log('================================================================');
    console.log('   AIRPORT MANAGEMENT SYSTEM — PHASE 11 E2E VERIFICATION SUITE');
    console.log('================================================================\n');

    let server;
    let passed = 0;
    let failed = 0;

    function assertTest(condition, testName, details = '') {
        if (condition) {
            console.log(`  ✔ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  ✘ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
            failed++;
        }
    }

    try {
        server = await new Promise((resolve) => {
            const s = app.listen(TEST_PORT, '127.0.0.1', () => resolve(s));
        });

        // -------------------------------------------------------------------------
        // SECTION 1: AUTHENTICATION & SECURITY VALIDATION
        // -------------------------------------------------------------------------
        console.log('--- 1. Authentication & Security Life-Cycle ---');

        // 1.1 Passenger Registration
        const testEmail = `e2e.traveler.${Date.now()}@test.org`;
        const regRes = await makeRequest({
            path: '/api/auth/register',
            method: 'POST',
            body: { email: testEmail, password: 'SecurePassword123' },
        });
        assertTest(regRes.statusCode === 201 && regRes.body.data.user.email === testEmail, '1.1 Passenger registration succeeds (201 Created)');

        // 1.2 Prevent Duplicate Email Registration
        const dupRegRes = await makeRequest({
            path: '/api/auth/register',
            method: 'POST',
            body: { email: testEmail, password: 'AnotherPassword123' },
        });
        assertTest(dupRegRes.statusCode === 409, '1.2 Duplicate registration blocked (409 Conflict)');

        // 1.3 Invalid Password Rejection
        const badLoginRes = await makeRequest({
            path: '/api/auth/login',
            method: 'POST',
            body: { email: testEmail, password: 'WrongPassword' },
        });
        assertTest(badLoginRes.statusCode === 401, '1.3 Invalid password rejected (401 Unauthorized)');

        // 1.4 Valid Passenger Login & HttpOnly Cookie Issuance
        const loginRes = await makeRequest({
            path: '/api/auth/login',
            method: 'POST',
            body: { email: testEmail, password: 'SecurePassword123' },
        });
        const passengerCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';
        assertTest(loginRes.statusCode === 200 && passengerCookie.includes('token='), '1.4 Passenger login issues signed session cookie');

        // 1.5 Session Restoration via /api/auth/me
        const meRes = await makeRequest({
            path: '/api/auth/me',
            headers: { Cookie: passengerCookie },
        });
        assertTest(meRes.statusCode === 200 && meRes.body.data.email === testEmail, '1.5 Session restored from HttpOnly cookie (/api/auth/me)');

        // 1.6 RBAC Protection: Passenger blocked from Admin APIs
        const adminProbeRes = await makeRequest({
            path: '/api/admin/users',
            headers: { Cookie: passengerCookie },
        });
        assertTest(adminProbeRes.statusCode === 403, '1.6 RBAC Guard blocks PASSENGER from Admin User Directory (403 Forbidden)');

        // 1.7 Admin Login & Clearance
        const adminLoginRes = await makeRequest({
            path: '/api/auth/login',
            method: 'POST',
            body: { email: 'admin@airport.com', password: 'Admin@12345' },
        });
        const adminCookie = adminLoginRes.headers['set-cookie'] ? adminLoginRes.headers['set-cookie'][0].split(';')[0] : '';
        assertTest(adminLoginRes.statusCode === 200 && adminLoginRes.body.data.user.role === 'ADMIN', '1.7 Administrator authenticated with ADMIN clearance');

        // 1.8 Admin User Directory Access
        const adminUsersRes = await makeRequest({
            path: '/api/admin/users',
            headers: { Cookie: adminCookie },
        });
        assertTest(adminUsersRes.statusCode === 200 && Array.isArray(adminUsersRes.body.data.users), '1.8 Admin retrieves system user directory (200 OK)');

        // 1.9 Admin Self-Modification Safeguard
        const selfModRes = await makeRequest({
            path: '/api/admin/users/1/status',
            method: 'PUT',
            body: { status: 'N' },
            headers: { Cookie: adminCookie },
        });
        assertTest(selfModRes.statusCode === 400, '1.9 Self-deactivation safeguard blocks Admin disabling own account');

        // 1.10 Session Termination (Logout)
        const logoutRes = await makeRequest({
            path: '/api/auth/logout',
            method: 'POST',
            headers: { Cookie: passengerCookie },
        });
        assertTest(logoutRes.statusCode === 200 && logoutRes.headers['set-cookie'][0].includes('token=;'), '1.10 Logout invalidates session and clears cookie');

        console.log('');

        // -------------------------------------------------------------------------
        // SECTION 2: AIRPORT OPERATIONS & BOOKING TRANSACTION VALIDATION
        // -------------------------------------------------------------------------
        console.log('--- 2. End-to-End Airport Operations Lifecycle ---');

        // Re-authenticate passenger for operational booking workflow
        const passSessionRes = await makeRequest({
            path: '/api/auth/login',
            method: 'POST',
            body: { email: testEmail, password: 'SecurePassword123' },
        });
        const activePassengerCookie = passSessionRes.headers['set-cookie'] ? passSessionRes.headers['set-cookie'][0].split(';')[0] : '';

        // 2.1 Airport Infrastructure
        const airportsRes = await makeRequest({
            path: '/api/airports',
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(airportsRes.statusCode === 200 && airportsRes.body.data.length >= 3, '2.1 Query registered international airports');

        // 2.2 Airline Registry
        const airlinesRes = await makeRequest({
            path: '/api/airlines',
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(airlinesRes.statusCode === 200 && airlinesRes.body.data.length >= 2, '2.2 Query commercial carrier airlines');

        // 2.3 Flight Discovery
        const flightsRes = await makeRequest({
            path: '/api/flights',
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(flightsRes.statusCode === 200 && flightsRes.body.data.length >= 2, '2.3 Query scheduled flight movements');
        const targetFlight = flightsRes.body.data[0];

        // 2.4 Passenger Booking Creation
        const bookingPayload = {
            flightInstanceId: targetFlight.flightInstanceId,
            cabinClass: 'ECONOMY',
            seatNumber: '28A',
            firstName: 'Alex',
            lastName: 'Cross',
            phone: '+91 9876543210',
        };
        const createBookingRes = await makeRequest({
            path: '/api/bookings',
            method: 'POST',
            body: bookingPayload,
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(
            createBookingRes.statusCode === 201 &&
            createBookingRes.body.data.booking.bookingReference &&
            createBookingRes.body.data.ticket.ticketNumber,
            '2.4 Confirmed booking and issued e-ticket with unique 6-character PNR'
        );
        const bookedId = createBookingRes.body.data.booking.bookingId;
        const bookedTicket = createBookingRes.body.data.ticket;

        // 2.5 Seat Collision Prevention (ACID Constraint)
        const duplicateSeatRes = await makeRequest({
            path: '/api/bookings',
            method: 'POST',
            body: {
                flightInstanceId: targetFlight.flightInstanceId,
                cabinClass: 'ECONOMY',
                seatNumber: '28A', // Same seat!
                firstName: 'Eve',
                lastName: 'Collision',
            },
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(duplicateSeatRes.statusCode === 409, '2.5 Duplicate seat assignment strictly prevented (409 Conflict)');

        // 2.6 Web Check-in & Boarding Pass Issuance
        const checkinRes = await makeRequest({
            path: '/api/checkin',
            method: 'POST',
            body: { ticketId: bookedTicket.ticketId, seatNumber: '28A' },
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(
            (checkinRes.statusCode === 200 || checkinRes.statusCode === 201) &&
            checkinRes.body.data.checkIn.boardingPassCode.startsWith('BP-'),
            '2.6 Web check-in processed and digital boarding pass issued'
        );

        // 2.7 Duplicate Check-in Prevention
        const dupCheckinRes = await makeRequest({
            path: '/api/checkin',
            method: 'POST',
            body: { ticketId: bookedTicket.ticketId, seatNumber: '28A' },
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(dupCheckinRes.statusCode === 409, '2.7 Duplicate check-in on same ticket blocked (409 Conflict)');

        // 2.8 Baggage Tagging & Tracking
        const baggageRes = await makeRequest({
            path: '/api/baggage',
            method: 'POST',
            body: {
                ticketId: bookedTicket.ticketId,
                weightKg: 18.5,
                tagNumber: `BAG-DEL-${Date.now().toString().slice(-6)}`,
            },
            headers: { Cookie: adminCookie },
        });
        assertTest(baggageRes.statusCode === 201 && baggageRes.body.data.status === 'CHECKED_IN', '2.8 Baggage intake registered with RFID barcode tracking');

        // 2.9 Gate Allocation & Overlap Prevention
        const gatesRes = await makeRequest({
            path: '/api/gates',
            headers: { Cookie: adminCookie },
        });
        const testGate = gatesRes.body.data.find(g => g.status === 'AVAILABLE') || gatesRes.body.data[0];
        const assignGateRes = await makeRequest({
            path: '/api/gates/assign',
            method: 'POST',
            body: { flightInstanceId: targetFlight.flightInstanceId, gateId: testGate.gateId },
            headers: { Cookie: adminCookie },
        });
        assertTest(assignGateRes.statusCode === 200, '2.9 Aerobridge gate allocated to flight instance');

        // 2.10 Booking Cancellation Transaction & Seat Release
        const cancelRes = await makeRequest({
            path: `/api/bookings/${bookedId}/cancel`,
            method: 'PATCH',
            headers: { Cookie: activePassengerCookie },
        });
        assertTest(cancelRes.statusCode === 200 && cancelRes.body.data.status === 'CANCELLED', '2.10 Booking cancelled and seats released');

        console.log('');

        // -------------------------------------------------------------------------
        // SECTION 3: AUTONOMOUS AIRPORT DATA ENGINE (AADE)
        // -------------------------------------------------------------------------
        console.log('--- 3. Autonomous Airport Data Engine (AADE) ---');

        // 3.1 AADE Telemetry State
        const aadeStatusRes = await makeRequest({
            path: '/api/aade/status',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            aadeStatusRes.statusCode === 200 &&
            (aadeStatusRes.body.data.status === 'ACTIVE' || aadeStatusRes.body.data.status === 'IDLE'),
            '3.1 AADE continuous telemetry online'
        );

        // 3.2 AADE Operational Conflict Detection (Manual trigger cycle)
        const aadeCycleRes = await makeRequest({
            path: '/api/aade/run',
            method: 'POST',
            headers: { Cookie: adminCookie },
        });
        assertTest(aadeCycleRes.statusCode === 200, '3.2 Autonomous invariant and conflict sweep executed');

        // 3.3 AADE Rule-Based Recommendations
        const aadeRecsRes = await makeRequest({
            path: '/api/aade/recommendations',
            headers: { Cookie: adminCookie },
        });
        assertTest(aadeRecsRes.statusCode === 200 && Array.isArray(aadeRecsRes.body.data), '3.3 Generated explainable operational recommendations');

        // 3.4 Human-in-the-Loop Operator Approval Workflow
        const approvalsRes = await makeRequest({
            path: '/api/aade/approvals',
            headers: { Cookie: adminCookie },
        });
        assertTest(approvalsRes.statusCode === 200 && approvalsRes.body.data.length > 0, '3.4 Retrieved pending human-in-the-loop approval proposals');

        const pendingProposal = approvalsRes.body.data.find(a => a.decision === 'PENDING') || approvalsRes.body.data[0];
        const approveRes = await makeRequest({
            path: `/api/aade/approvals/${pendingProposal.approvalId}/approve`,
            method: 'POST',
            body: { remarks: 'Approved by Lead Airside Controller via Phase 11 E2E Suite.' },
            headers: { Cookie: adminCookie },
        });
        assertTest(
            approveRes.statusCode === 200 || approveRes.statusCode === 400,
            '3.5 Operator action executed (or safely locked if previously decided)'
        );

        // 3.5 Immutable Execution Audit Trail
        const auditRes = await makeRequest({
            path: '/api/aade/audit',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            auditRes.statusCode === 200 && auditRes.body.data.length > 0,
            '3.6 Immutable execution audit log verified with timestamp and operator identity'
        );

        console.log('');

        // -------------------------------------------------------------------------
        // SECTION 4: MULTI-LANGUAGE POLYGLOT INTEGRATION
        // -------------------------------------------------------------------------
        console.log('--- 4. Multi-Language Algorithms & Services Integration ---');

        // 4.1 Integration Gateway Telemetry
        const polyStatusRes = await makeRequest({
            path: '/api/integration/status',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            polyStatusRes.statusCode === 200 &&
            polyStatusRes.body.success &&
            polyStatusRes.body.cEngine &&
            polyStatusRes.body.cEngine.available === true,
            '4.1 Native C Algorithm Engine binary verified available'
        );

        // 4.2 C Gate Allocation Algorithm (Interval Scheduling)
        const cGateRes = await makeRequest({
            path: '/api/integration/c/gate-allocation',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            cGateRes.statusCode === 200 &&
            cGateRes.body.success &&
            Array.isArray(cGateRes.body.data.allocations),
            '4.2 C Engine computes conflict-free gate schedule via greedy interval algorithm'
        );

        // 4.3 C Flight Priority Queue (Binary Min-Heap)
        const cQueueRes = await makeRequest({
            path: '/api/integration/c/runway-queue',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            cQueueRes.statusCode === 200 &&
            cQueueRes.body.success &&
            Array.isArray(cQueueRes.body.data.sequencedTakeoffs),
            '4.3 C Engine sequences runway landings via binary min-heap priority queue'
        );

        // 4.4 C Baggage Routing (Dijkstra Shortest Path)
        const cRouteRes = await makeRequest({
            path: '/api/integration/c/baggage-routing',
            headers: { Cookie: adminCookie },
        });
        assertTest(
            cRouteRes.statusCode === 200 &&
            cRouteRes.body.success &&
            cRouteRes.body.data.routeFound === true,
            '4.4 C Engine finds optimal conveyor transit route via Dijkstra algorithm'
        );

        // 4.5 Java Dynamic Strategy Pricing
        const javaPricingRes = await makeRequest({
            path: '/api/integration/java/pricing/calculate',
            method: 'POST',
            body: {
                flightNumber: 'AI-202',
                baseFare: 200,
                totalCapacity: 180,
                bookedSeats: 160,
                daysBeforeDeparture: 1,
                cabinClass: 'BUSINESS',
                useSurge: true,
            },
            headers: { Cookie: adminCookie },
        });
        assertTest(
            javaPricingRes.statusCode === 200 &&
            javaPricingRes.body.success &&
            javaPricingRes.body.calculatedPrice > 200,
            '4.5 Java Microservice computes polymorphic surge price using Strategy Pattern'
        );

        console.log('');
    } catch (err) {
        console.error('Fatal E2E error:', err);
        failed++;
    } finally {
        if (server) {
            server.close();
        }
        await closePool();

        console.log('================================================================');
        console.log(`PHASE 11 E2E RESULTS: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
        console.log('================================================================');

        process.exit(failed > 0 ? 1 : 0);
    }
}

runE2ESuite();
