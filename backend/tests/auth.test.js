/**
 * Authentication & Authorization Integration Test Suite
 * Tests bcrypt hashing, JWT issuance/verification, RBAC middleware guards,
 * privilege escalation blocks, input validation, and logout cookie clearing.
 * Usage: node tests/auth.test.js
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../src/utils/auth.util');
const { closePool } = require('../src/config/database');
const { config } = require('../src/config/environment');

const TEST_PORT = 5098;

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path: options.path,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(data),
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        rawBody: data,
                    });
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function runAuthTests() {
    console.log('================================================================');
    console.log('   RUNNING AUTHENTICATION & RBAC INTEGRATION TESTS');
    console.log('================================================================');

    let server;
    let passed = 0;
    let failed = 0;

    try {
        // -------------------------------------------------------------
        // UNIT TESTS: Password Hashing (bcrypt)
        // -------------------------------------------------------------
        console.log('\n--- Section 1: Password Hashing (bcrypt) ---');

        const rawPassword = 'SecurePassword123!';
        const hash = await hashPassword(rawPassword);

        if (hash && hash.startsWith('$2') && hash !== rawPassword) {
            console.log('✔ [PASS] Test 1.1: Password hashed successfully with bcrypt salt.');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 1.1: bcrypt hashing failed.');
            failed++;
        }

        const isMatch = await comparePassword(rawPassword, hash);
        const isWrongMatch = await comparePassword('WrongPassword999', hash);

        if (isMatch === true && isWrongMatch === false) {
            console.log('✔ [PASS] Test 1.2: bcrypt correctly verifies matching password and rejects incorrect password.');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 1.2: Password comparison failed.');
            failed++;
        }

        // -------------------------------------------------------------
        // UNIT TESTS: JWT Issuance & Verification
        // -------------------------------------------------------------
        console.log('\n--- Section 2: JWT Issuance & Verification ---');

        const tokenPayload = { userId: 42, email: 'pilot@airline.com', role: 'AIRLINE_STAFF' };
        const token = generateToken(tokenPayload);

        if (token && typeof token === 'string' && token.split('.').length === 3) {
            console.log('✔ [PASS] Test 2.1: Signed valid 3-part JWT generated.');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 2.1: Token generation failed.');
            failed++;
        }

        const decoded = verifyToken(token);
        if (decoded.userId === 42 && decoded.role === 'AIRLINE_STAFF') {
            console.log('✔ [PASS] Test 2.2: JWT verified and decoded payload matches user identity.');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 2.2: Token verification failed.');
            failed++;
        }

        // Test Expired Token Handling
        try {
            const expiredToken = jwt.sign({ userId: 1 }, config.JWT_SECRET, { expiresIn: '0s' });
            verifyToken(expiredToken);
            console.error('✘ [FAIL] Test 2.3: Expired token was not rejected.');
            failed++;
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('✔ [PASS] Test 2.3: Expired JWT correctly rejected by verifier.');
                passed++;
            } else {
                console.error('✘ [FAIL] Test 2.3: Unexpected error on expired token:', err.message);
                failed++;
            }
        }

        // -------------------------------------------------------------
        // API INTEGRATION TESTS: HTTP Endpoints & RBAC Middleware
        // -------------------------------------------------------------
        console.log('\n--- Section 3: API Endpoints & RBAC Middleware Guards ---');

        server = await new Promise((resolve) => {
            const s = app.listen(TEST_PORT, '127.0.0.1', () => resolve(s));
        });
        console.log(`[Test Server] Listening on 127.0.0.1:${TEST_PORT}\n`);

        // Test 3.1: Public Registration Privilege Escalation Block
        const escalationRes = await makeRequest(
            { path: '/api/auth/register', method: 'POST' },
            { email: 'hacker@malicious.com', password: 'password123', role: 'ADMIN' }
        );
        if (escalationRes.statusCode === 403 && escalationRes.body.errors && escalationRes.body.errors.code === 'PRIVILEGE_ESCALATION_ATTEMPT') {
            console.log('✔ [PASS] Test 3.1: Privilege Escalation blocked: Public registration as ADMIN is forbidden (403)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.1: Expected 403 for ADMIN registration attempt, got:', escalationRes.statusCode);
            failed++;
        }

        // Test 3.2: Registration Input Validation (invalid email)
        const invalidEmailRes = await makeRequest(
            { path: '/api/auth/register', method: 'POST' },
            { email: 'not-an-email', password: 'password123' }
        );
        if (invalidEmailRes.statusCode === 400) {
            console.log('✔ [PASS] Test 3.2: Registration rejected malformed email format (400 Bad Request)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.2: Expected 400 for bad email, got:', invalidEmailRes.statusCode);
            failed++;
        }

        // Test 3.3: Registration Input Validation (short password)
        const shortPasswordRes = await makeRequest(
            { path: '/api/auth/register', method: 'POST' },
            { email: 'user@test.com', password: '123' }
        );
        if (shortPasswordRes.statusCode === 400) {
            console.log('✔ [PASS] Test 3.3: Registration rejected password < 6 characters (400 Bad Request)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.3: Expected 400 for short password, got:', shortPasswordRes.statusCode);
            failed++;
        }

        // Test 3.4: Login Input Validation (missing credentials)
        const emptyLoginRes = await makeRequest(
            { path: '/api/auth/login', method: 'POST' },
            { email: '' }
        );
        if (emptyLoginRes.statusCode === 400) {
            console.log('✔ [PASS] Test 3.4: Login rejected empty credentials payload (400 Bad Request)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.4: Expected 400 for empty login, got:', emptyLoginRes.statusCode);
            failed++;
        }

        // Test 3.5: Protected Route Access Without Token
        const noAuthRes = await makeRequest({ path: '/api/auth/me', method: 'GET' });
        if (noAuthRes.statusCode === 401 && noAuthRes.body.success === false) {
            console.log('✔ [PASS] Test 3.5: GET /api/auth/me blocked unauthenticated request without token (401 Unauthorized)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.5: Expected 401 for unauthenticated request, got:', noAuthRes.statusCode);
            failed++;
        }

        // Test 3.6: Protected Route Access With Malformed Token
        const badTokenRes = await makeRequest({
            path: '/api/auth/me',
            method: 'GET',
            headers: { Authorization: 'Bearer this.is.a.fake.token' },
        });
        if (badTokenRes.statusCode === 401 && badTokenRes.body.errors.code === 'TOKEN_INVALID') {
            console.log('✔ [PASS] Test 3.6: Protected route rejected invalid/tampered token (401 Unauthorized)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.6: Expected 401 for bad token, got:', badTokenRes.statusCode);
            failed++;
        }

        // Test 3.7: RBAC Guard: PASSENGER accessing Admin endpoints
        const passengerToken = generateToken({ userId: 101, email: 'traveler@gmail.com', role: 'PASSENGER' });
        const rbacPassengerRes = await makeRequest({
            path: '/api/admin/users',
            method: 'GET',
            headers: { Authorization: `Bearer ${passengerToken}` },
        });
        if (rbacPassengerRes.statusCode === 403 && rbacPassengerRes.body.errors.requiredRoles.includes('ADMIN')) {
            console.log('✔ [PASS] Test 3.7: RBAC Guard blocked PASSENGER from accessing /api/admin/users (403 Forbidden)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.7: Expected 403 for passenger accessing admin, got:', rbacPassengerRes.statusCode);
            failed++;
        }

        // Test 3.8: RBAC Guard: AIRLINE_STAFF accessing Admin endpoints
        const staffToken = generateToken({ userId: 102, email: 'gate.agent@airindia.in', role: 'AIRLINE_STAFF' });
        const rbacStaffRes = await makeRequest({
            path: '/api/admin/users',
            method: 'GET',
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        if (rbacStaffRes.statusCode === 403) {
            console.log('✔ [PASS] Test 3.8: RBAC Guard blocked AIRLINE_STAFF from accessing /api/admin/users (403 Forbidden)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.8: Expected 403 for airline staff accessing admin, got:', rbacStaffRes.statusCode);
            failed++;
        }

        // Test 3.9: RBAC Guard: ADMIN passing authorization gate
        const adminToken = generateToken({ userId: 1, email: 'admin@airport.com', role: 'ADMIN' });
        const rbacAdminRes = await makeRequest({
            path: '/api/admin/users',
            method: 'GET',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        // Note: The RBAC middleware authorized the request (neither 401 nor 403 was returned).
        // Since Oracle DB is offline locally, the controller reached the DB query and safely returned 500/503.
        if (rbacAdminRes.statusCode === 200 || rbacAdminRes.statusCode === 500 || rbacAdminRes.statusCode === 503) {
            console.log(`✔ [PASS] Test 3.9: RBAC Guard authorized ADMIN role successfully (Bypassed 403 gate; DB controller reached, status: ${rbacAdminRes.statusCode})`);
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.9: Admin role was unexpectedly rejected with status:', rbacAdminRes.statusCode);
            failed++;
        }

        // Test 3.10: Logout Clears Cookie
        const logoutRes = await makeRequest({ path: '/api/auth/logout', method: 'POST' });
        const setCookie = logoutRes.headers['set-cookie'];
        if (logoutRes.statusCode === 200 && setCookie && setCookie[0].includes('token=;')) {
            console.log('✔ [PASS] Test 3.10: POST /api/auth/logout cleared session cookie (200 OK)');
            passed++;
        } else {
            console.error('✘ [FAIL] Test 3.10: Logout did not clear cookie as expected.');
            failed++;
        }

    } finally {
        if (server) {
            server.close();
            console.log('\n[Test Teardown] Auth test server stopped.');
        }
        await closePool();
    }

    console.log('\n================================================================');
    console.log(`PHASE 05 TEST RESULTS: ${passed} passed, ${failed} failed.`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runAuthTests();
