/**
 * Health Endpoints & Server Integration Test
 * Verifies Express boot, health endpoint, database health endpoint, and 404 handler.
 * Usage: npm test
 */

const http = require('http');
const app = require('../src/app');
const { closePool } = require('../src/config/database');

const TEST_PORT = 5099;

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${TEST_PORT}${path}`, (res) => {
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

        req.on('error', (err) => {
            reject(err);
        });
    });
}

async function runTests() {
    console.log('================================================================');
    console.log('   RUNNING BACKEND HEALTH & INTEGRATION TESTS');
    console.log('================================================================');

    let server;
    let passed = 0;
    let failed = 0;

    try {
        // Start test server
        server = await new Promise((resolve) => {
            const s = app.listen(TEST_PORT, '127.0.0.1', () => resolve(s));
        });
        console.log(`[Test Setup] Test server listening on 127.0.0.1:${TEST_PORT}\n`);

        // Test 1: Root redirect endpoint
        try {
            const rootRes = await makeRequest('/');
            if (rootRes.statusCode === 200 && rootRes.body.message) {
                console.log('✔ [PASS] Test 1: GET / returns gateway information (200 OK)');
                passed++;
            } else {
                throw new Error(`Expected 200, got ${rootRes.statusCode}`);
            }
        } catch (err) {
            console.error('✘ [FAIL] Test 1: GET / failed:', err.code || err.message || err);
            failed++;
        }

        // Test 2: App Health Endpoint
        try {
            const healthRes = await makeRequest('/api/health');
            if (healthRes.statusCode === 200 && healthRes.body.data.status === 'UP') {
                console.log('✔ [PASS] Test 2: GET /api/health returns status UP (200 OK)');
                passed++;
            } else {
                throw new Error(`Expected status UP with 200, got ${healthRes.statusCode}`);
            }
        } catch (err) {
            console.error('✘ [FAIL] Test 2: GET /api/health failed:', err.code || err.message || err);
            failed++;
        }

        // Test 3: Database Health Endpoint
        try {
            const dbRes = await makeRequest('/api/health/database');
            // Either 200 (if Oracle DB is running) or 503 (if Oracle DB is offline) is a valid, structured response
            if (dbRes.statusCode === 200 && dbRes.body.data.status === 'UP') {
                console.log('✔ [PASS] Test 3: GET /api/health/database connected to Oracle (200 OK)');
                passed++;
            } else if (dbRes.statusCode === 503 && dbRes.body.data.status === 'DOWN') {
                console.log('✔ [PASS] Test 3: GET /api/health/database gracefully handled offline Oracle DB (503 Service Unavailable)');
                passed++;
            } else {
                throw new Error(`Unexpected database response format: status ${dbRes.statusCode}`);
            }
        } catch (err) {
            console.error('✘ [FAIL] Test 3: GET /api/health/database failed:', err.code || err.message || err);
            failed++;
        }

        // Test 4: 404 Not Found Handler
        try {
            const notFoundRes = await makeRequest('/api/nonexistent-route-testing-404');
            if (notFoundRes.statusCode === 404 && notFoundRes.body.success === false) {
                console.log('✔ [PASS] Test 4: GET /api/nonexistent-route returns structured 404 error');
                passed++;
            } else {
                throw new Error(`Expected 404, got ${notFoundRes.statusCode}`);
            }
        } catch (err) {
            console.error('✘ [FAIL] Test 4: 404 Handler failed:', err.code || err.message || err);
            failed++;
        }

    } finally {
        if (server) {
            server.close();
            console.log('\n[Test Teardown] Test server stopped.');
        }
        await closePool();
    }

    console.log('================================================================');
    console.log(`TEST RESULTS: ${passed} passed, ${failed} failed.`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
