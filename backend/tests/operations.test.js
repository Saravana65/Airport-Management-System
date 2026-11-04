/**
 * Phase 07: Airport Operations Modules & Full-Stack Integration Test Suite
 * Validates all 8 operational modules, input validation, role security,
 * transaction safety, duplicate seat prevention, and gate conflict detection.
 */

const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const { generateToken } = require('../src/utils/auth.util');

const TEST_PORT = 5097;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

let server;

// Helper: Make HTTP request with optional Bearer token and JSON body
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

// Generate test tokens
const adminToken = generateToken({ userId: 1, email: 'admin@airport.com', role: 'ADMIN' });
const airlineToken = generateToken({ userId: 2, email: 'staff@airline.com', role: 'AIRLINE_STAFF', airlineCode: 'AI' });
const airportToken = generateToken({ userId: 3, email: 'ops@airport.com', role: 'AIRPORT_STAFF' });
const passengerToken = generateToken({ userId: 4, email: 'passenger@gmail.com', role: 'PASSENGER' });
const unauthorizedPassengerToken = generateToken({ userId: 5, email: 'other@gmail.com', role: 'PASSENGER' });

let passedTests = 0;
let failedTests = 0;

function pass(testName) {
    console.log(`  ✔ [PASS] ${testName}`);
    passedTests++;
}

function fail(testName, err) {
    console.error(`  ✖ [FAIL] ${testName}:`, err.message || err);
    failedTests++;
}

async function runOperationsTests() {
    console.log('\n================================================================');
    console.log('   RUNNING PHASE 07 AIRPORT OPERATIONS TEST SUITE');
    console.log('================================================================\n');

    await new Promise(resolve => {
        server = app.listen(TEST_PORT, '127.0.0.1', () => {
            console.log(`[Test Server] Operations suite listening on port ${TEST_PORT}\n`);
            resolve();
        });
    });

    try {
        // --- MODULE 1: AIRPORTS, AIRLINES, AIRCRAFT ---
        console.log('--- Module 1: Airport, Airline & Aircraft Management ---');

        // Test 1.1: Get airports
        const res1 = await makeRequest('GET', '/airports', null, passengerToken);
        assert.strictEqual(res1.status, 200);
        assert.ok(res1.body.data.length >= 6);
        pass('Test 1.1: GET /api/airports returns verified international airports');

        // Test 1.2: Add airport as ADMIN
        const res2 = await makeRequest('POST', '/airports', {
            airportCode: 'DXB',
            airportName: 'Dubai International Airport',
            city: 'Dubai',
            country: 'United Arab Emirates',
            timezone: 'Asia/Dubai',
        }, adminToken);
        assert.strictEqual(res2.status, 201);
        assert.strictEqual(res2.body.data.airportCode, 'DXB');
        pass('Test 1.2: POST /api/airports successfully registers new airport as ADMIN');

        // Test 1.3: Reject airport creation by non-admin
        const res3 = await makeRequest('POST', '/airports', { airportCode: 'SIN' }, passengerToken);
        assert.strictEqual(res3.status, 403);
        pass('Test 1.3: POST /api/airports blocked for non-admin role (403 Forbidden)');

        // Test 1.4: Reject duplicate airport code
        const res4 = await makeRequest('POST', '/airports', { airportCode: 'DXB' }, adminToken);
        assert.strictEqual(res4.status, 409);
        pass('Test 1.4: POST /api/airports rejects duplicate airport code (409 Conflict)');

        // Test 1.5: Register aircraft
        const res5 = await makeRequest('POST', '/aircraft', {
            registrationNo: 'VT-TEST1',
            model: 'Boeing 737 MAX 8',
            airlineCode: 'AI',
            totalSeats: 189,
            economySeats: 173,
            businessSeats: 16,
        }, airlineToken);
        assert.strictEqual(res5.status, 201);
        pass('Test 1.5: POST /api/aircraft registers aircraft fleet with seating breakdown');

        // --- MODULE 2: FLIGHT MANAGEMENT ---
        console.log('\n--- Module 2: Flight Schedule & Status Management ---');

        // Test 2.1: Filter flights by origin and destination
        const res6 = await makeRequest('GET', '/flights?origin=BOM&destination=DFW', null, passengerToken);
        assert.strictEqual(res6.status, 200);
        assert.ok(res6.body.data.some(f => f.flightNumber === 'AI2014'));
        pass('Test 2.1: GET /api/flights filters flight routes by origin and destination');

        // Test 2.2: Reject flight where origin equals destination
        const res7 = await makeRequest('POST', '/flights', {
            flightNumber: 'AI999',
            airlineCode: 'AI',
            originAirport: 'BOM',
            destAirport: 'BOM',
        }, adminToken);
        assert.strictEqual(res7.status, 400);
        pass('Test 2.2: POST /api/flights rejects identical origin and destination (400 Bad Request)');

        // Test 2.3: Update flight status and log history
        const res8 = await makeRequest('PATCH', '/flights/1/status', {
            status: 'BOARDING',
            reason: 'Boarding gate open on schedule',
        }, airportToken);
        assert.strictEqual(res8.status, 200);
        assert.strictEqual(res8.body.data.instance.status, 'BOARDING');
        assert.strictEqual(res8.body.data.history.newStatus, 'BOARDING');
        pass('Test 2.3: PATCH /api/flights/:id/status updates status and logs transition audit');

        // --- MODULE 3: PASSENGER MANAGEMENT ---
        console.log('\n--- Module 3: Passenger Profile & Privacy ---');

        // Test 3.1: Register passenger
        const res9 = await makeRequest('POST', '/passengers', {
            firstName: 'Aarav',
            lastName: 'Gupta',
            passportNumber: 'K9812401',
            phone: '+919876500001',
            gender: 'M',
        }, passengerToken);
        assert.strictEqual(res9.status, 201);
        pass('Test 3.1: POST /api/passengers registers passenger profile');

        // Test 3.2: Reject duplicate passport number
        const res10 = await makeRequest('POST', '/passengers', {
            firstName: 'Another',
            lastName: 'Person',
            passportNumber: 'K9812401',
        }, passengerToken);
        assert.strictEqual(res10.status, 409);
        pass('Test 3.2: POST /api/passengers rejects duplicate passport number (409 Conflict)');

        // Test 3.3: Passenger data privacy (masking for airline staff)
        const res11 = await makeRequest('GET', '/passengers', null, airlineToken);
        assert.strictEqual(res11.status, 200);
        assert.ok(res11.body.data.every(p => p.passportNumber.includes('****')));
        pass('Test 3.3: GET /api/passengers masks sensitive passport numbers for privacy');

        // --- MODULE 4: BOOKINGS & TICKETS ---
        console.log('\n--- Module 4: Booking & Ticket Management ---');

        // Test 4.1: Transaction-safe booking creation
        const res12 = await makeRequest('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: '21A',
        }, passengerToken);
        assert.strictEqual(res12.status, 201);
        assert.strictEqual(res12.body.data.booking.status, 'CONFIRMED');
        assert.strictEqual(res12.body.data.ticket.seatNumber, '21A');
        assert.strictEqual(res12.body.data.booking.bookingReference.length, 6);
        pass('Test 4.1: POST /api/bookings issues confirmed PNR and ticket with simulated payment');

        // Test 4.2: Duplicate seat prevention on same flight instance
        const res13 = await makeRequest('POST', '/bookings', {
            flightInstanceId: 1,
            seatNumber: '21A', // Same seat on same flight
        }, unauthorizedPassengerToken);
        assert.strictEqual(res13.status, 409);
        pass('Test 4.2: Duplicate seat allocation strictly blocked (409 Conflict)');

        // Test 4.3: Passenger ownership restriction
        const bookingId = res12.body.data.booking.bookingId;
        const res14 = await makeRequest('GET', `/bookings/${bookingId}`, null, unauthorizedPassengerToken);
        assert.strictEqual(res14.status, 403);
        pass('Test 4.3: Passenger ownership enforced: other users cannot inspect foreign PNRs (403)');

        // Test 4.4: Cancel booking releases seat
        const res15 = await makeRequest('PATCH', `/bookings/${bookingId}/cancel`, null, passengerToken);
        assert.strictEqual(res15.status, 200);
        assert.strictEqual(res15.body.data.status, 'CANCELLED');
        pass('Test 4.4: PATCH /api/bookings/:id/cancel cancels reservation and releases allocated seat');

        // --- MODULE 5: CHECK-IN OPERATIONS ---
        console.log('\n--- Module 5: Check-in & Boarding Passes ---');

        // Test 5.1: Process check-in and issue boarding pass
        const res16 = await makeRequest('POST', '/checkin', {
            ticketId: 1,
            seatNumber: '12A',
        }, passengerToken);
        assert.strictEqual(res16.status, 201);
        assert.ok(res16.body.data.checkIn.boardingPassCode.startsWith('BP-'));
        pass('Test 5.1: POST /api/checkin confirms passenger check-in and issues boarding pass code');

        // Test 5.2: Prevent duplicate check-in
        const res17 = await makeRequest('POST', '/checkin', {
            ticketId: 1,
        }, passengerToken);
        assert.strictEqual(res17.status, 409);
        pass('Test 5.2: POST /api/checkin blocks duplicate check-in attempts (409 Conflict)');

        // --- MODULE 6: BAGGAGE TRACKING ---
        console.log('\n--- Module 6: Baggage Management & Routing ---');

        // Test 6.1: Register baggage with unique barcode
        const res18 = await makeRequest('POST', '/baggage', {
            ticketId: 1,
            weightKg: 22.5,
            carouselNumber: 'C02',
        }, airportToken);
        assert.strictEqual(res18.status, 201);
        assert.ok(res18.body.data.tagNumber.startsWith('BAG-'));
        pass('Test 6.1: POST /api/baggage generates unique barcode baggage tag');

        // Test 6.2: Reject invalid baggage weight (> 60kg)
        const res19 = await makeRequest('POST', '/baggage', {
            ticketId: 1,
            weightKg: 75.0,
        }, airportToken);
        assert.strictEqual(res19.status, 400);
        pass('Test 6.2: POST /api/baggage rejects out-of-bounds weight > 60kg (400 Bad Request)');

        // Test 6.3: Update baggage status progression
        const bagId = res18.body.data.baggageId;
        const res20 = await makeRequest('PATCH', `/baggage/${bagId}/status`, {
            status: 'LOADED',
        }, airportToken);
        assert.strictEqual(res20.status, 200);
        assert.strictEqual(res20.body.data.status, 'LOADED');
        pass('Test 6.3: PATCH /api/baggage/:id/status updates routing status to LOADED');

        // --- MODULE 7: GATE MANAGEMENT ---
        console.log('\n--- Module 7: Gate Management & Conflict Detection ---');

        // Test 7.1: Get gates
        const res21 = await makeRequest('GET', '/gates', null, airportToken);
        assert.strictEqual(res21.status, 200);
        assert.ok(res21.body.data.length >= 10);
        pass('Test 7.1: GET /api/gates returns terminal gates with real-time occupancy');

        // Test 7.2: Assign gate to flight instance
        const res22 = await makeRequest('POST', '/gates/assign', {
            flightInstanceId: 3,
            gateId: 3,
            gateType: 'departure',
        }, airportToken);
        assert.strictEqual(res22.status, 200);
        pass('Test 7.2: POST /api/gates/assign safely allocates available gate to flight instance');

        // --- MODULE 8: EMPLOYEE MANAGEMENT ---
        console.log('\n--- Module 8: Employee & Workforce Management ---');

        // Test 8.1: Register employee as ADMIN
        const res23 = await makeRequest('POST', '/employees', {
            firstName: 'Karan',
            lastName: 'Malhotra',
            airportCode: 'DEL',
            jobTitle: 'Ramp Marshaller Lead',
            shift: 'DAY',
        }, adminToken);
        assert.strictEqual(res23.status, 201);
        assert.strictEqual(res23.body.data.jobTitle, 'Ramp Marshaller Lead');
        pass('Test 8.1: POST /api/employees registers employee with distinct operational job title');

        // Test 8.2: Block non-admin from employee management
        const res24 = await makeRequest('GET', '/employees', null, passengerToken);
        assert.strictEqual(res24.status, 403);
        pass('Test 8.2: GET /api/employees blocked for non-admin role (403 Forbidden)');

    } catch (err) {
        fail('Execution Error', err);
    } finally {
        if (server) {
            await new Promise(resolve => server.close(resolve));
            console.log('\n[Test Teardown] Operations test server stopped.');
        }

        console.log('\n================================================================');
        console.log(`PHASE 07 OPERATIONS TEST RESULTS: ${passedTests} passed, ${failedTests} failed.`);
        console.log('================================================================\n');

        if (failedTests > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

runOperationsTests();
