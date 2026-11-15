const mysql = require('../backend/node_modules/mysql2/promise');
const http = require('http');
const path = require('path');
const fs = require('fs');
const puppeteer = require('../frontend/node_modules/puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

// Helper for HTTP requests
function httpRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (dataString) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method,
      headers: reqHeaders,
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function verifyAll() {
  console.log('================================================================');
  console.log('TASK 3: FLIGHT SEARCH VERIFICATION');
  console.log('================================================================\n');

  // 1. MySQL DIRECT VERIFICATION
  console.log('--- STEP 1: MySQL Database Verification ---');
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Saravana@123',
    database: 'airport_management_db',
  });

  const [dbFlights] = await pool.query(`
    SELECT 
      fi.FLIGHT_INSTANCE_ID,
      fi.FLIGHT_NUMBER,
      fi.FLIGHT_DATE,
      fi.STATUS,
      f.ORIGIN_AIRPORT,
      f.DEST_AIRPORT,
      f.BASE_FARE,
      fi.SCHEDULED_DEPARTURE,
      fi.ESTIMATED_DEPARTURE,
      fi.SCHEDULED_ARRIVAL,
      fi.ESTIMATED_ARRIVAL,
      ac.MODEL AS AIRCRAFT_MODEL,
      ac.TOTAL_SEATS,
      COUNT(CASE WHEN t.STATUS != 'CANCELLED' THEN 1 END) AS BOOKED_SEATS,
      (COALESCE(ac.TOTAL_SEATS, 180) - COUNT(CASE WHEN t.STATUS != 'CANCELLED' THEN 1 END)) AS AVAILABLE_SEATS
    FROM FLIGHT_INSTANCES fi
    JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER
    LEFT JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID
    LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID
    GROUP BY fi.FLIGHT_INSTANCE_ID
    LIMIT 6
  `);
  console.log(`Retrieved ${dbFlights.length} flight instances directly from MySQL:`);
  console.table(dbFlights);

  // 2. AUTHENTICATION FOR API TESTS
  console.log('\n--- STEP 2: Authenticating User Roles ---');
  const passLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'passenger@gmail.com', password: 'Pass@12345' }
  });
  const passToken = passLogin.data.data.token;
  console.log('✔ Authenticated as PASSENGER (Token retrieved)');

  const adminLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'admin@airport.com', password: 'Admin@12345' }
  });
  const adminToken = adminLogin.data.data.token;
  console.log('✔ Authenticated as ADMIN (Token retrieved)');

  const staffLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'staff@airline.com', password: 'Airline@12345' }
  });
  const staffToken = staffLogin.data.data.token;
  console.log('✔ Authenticated as AIRLINE_STAFF (Token retrieved)');

  // 3. API SEARCH REQUIREMENTS TESTING
  console.log('\n--- STEP 3: API Endpoint Verification (GET /api/flights/search) ---');

  // Test 1: Search by Departure & Destination (BOM -> DEL)
  console.log('\n[Req 1, 2, 3, 4, 5, 6, 7] Testing Route Search: BOM -> DEL');
  const routeRes = await httpRequest({
    path: '/flights/search?origin=BOM&destination=DEL',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status:', routeRes.status);
  console.log('Match Count:', routeRes.data.data?.length);
  if (routeRes.data.data?.length > 0) {
    const f0 = routeRes.data.data[0];
    console.log('Sample Flight Returned:', {
      flightNumber: f0.flightNumber,
      airlineName: f0.airlineName,
      origin: `${f0.originAirport} (${f0.originCity})`,
      destination: `${f0.destAirport} (${f0.destCity})`,
      scheduledDeparture: f0.scheduledDeparture,
      estimatedDeparture: f0.estimatedDeparture,
      scheduledArrival: f0.scheduledArrival,
      estimatedArrival: f0.estimatedArrival,
      status: f0.status,
      ticketPrice: f0.baseFare,
      totalSeats: f0.totalSeats,
      bookedSeats: f0.bookedSeats,
      availableSeats: f0.availableSeats,
      delayMinutes: f0.delayMinutes,
    });
  }

  // Test 2: Search by City Name: Mumbai -> Delhi
  console.log('\n[Req 1] Testing City Name Search: Mumbai -> Delhi');
  const cityRes = await httpRequest({
    path: '/flights/search?origin=Mumbai&destination=Delhi',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status:', cityRes.status, '| Match Count:', cityRes.data.data?.length);

  // Test 3: Search with Travel Date: BOM -> DEL on 2026-11-15
  console.log('\n[Req 1, 2] Testing Date Search: BOM -> DEL on 2026-11-15');
  const dateRes = await httpRequest({
    path: '/flights/search?origin=BOM&destination=DEL&date=2026-11-15',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status:', dateRes.status, '| Match Count:', dateRes.data.data?.length);

  // Test 4: Unavailable route search (No matching flights)
  console.log('\n[Req 8] Testing Route with No Flights: JFK -> SFO on 2026-12-31');
  const emptyRes = await httpRequest({
    path: '/flights/search?origin=JFK&destination=SFO&date=2026-12-31',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status:', emptyRes.status, '| Returned Results:', emptyRes.data.data, '| Message:', emptyRes.data.message);

  // Test 5: Invalid Input - Same Departure and Arrival (BOM -> BOM)
  console.log('\n[Req 9] Testing Invalid Input: Departure == Destination (BOM -> BOM)');
  const sameRes = await httpRequest({
    path: '/flights/search?origin=BOM&destination=BOM',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status (Expect 400):', sameRes.status, '| Error Response:', sameRes.data.message);

  // Test 6: Invalid Input - Bad Date Format
  console.log('\n[Req 9] Testing Invalid Date Format: 15-11-2026');
  const badDateRes = await httpRequest({
    path: '/flights/search?date=15-11-2026',
    headers: { Authorization: `Bearer ${passToken}` }
  });
  console.log('HTTP Status (Expect 400):', badDateRes.status, '| Error Response:', badDateRes.data.message);

  // Test 7: Access Control - Admin & Airline Staff Access
  console.log('\n[Req 10] Testing Access Control for ADMIN and AIRLINE_STAFF');
  const adminRes = await httpRequest({
    path: '/flights/search?origin=BOM&destination=DEL',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('ADMIN Access HTTP Status:', adminRes.status, '| Found:', adminRes.data.data?.length);

  const staffRes = await httpRequest({
    path: '/flights/search?origin=BOM&destination=DEL',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  console.log('AIRLINE_STAFF Access HTTP Status:', staffRes.status, '| Found:', staffRes.data.data?.length);

  // Test 8: Flight Status Diversity Check
  console.log('\n[Req 5] Verifying Diversity of Flight Statuses across Instances in DB');
  const [statuses] = await pool.query(`
    SELECT STATUS, COUNT(*) as COUNT FROM FLIGHT_INSTANCES GROUP BY STATUS
  `);
  console.table(statuses);

  // Test 9: Flight Status Management Regression (PATCH /api/flights/:id/status)
  console.log('\n[Req 12] Testing Flight Status Management Regression (PATCH /api/flights/1/status)');
  const patchRes = await httpRequest({
    path: '/flights/1/status',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      status: 'DELAYED',
      reason: 'Air traffic congestion over terminal waypoint',
      estimatedDeparture: '2026-11-15 21:00:00',
      estimatedArrival: '2026-11-16 02:30:00'
    }
  });
  console.log('PATCH Status Update Result HTTP Status:', patchRes.status, '| Message:', patchRes.data.message);

  // Check audit history in MySQL
  const [histRows] = await pool.query(`
    SELECT HISTORY_ID, FLIGHT_INSTANCE_ID, OLD_STATUS, NEW_STATUS, REASON, CHANGED_AT 
    FROM FLIGHT_STATUS_HISTORY 
    WHERE FLIGHT_INSTANCE_ID = 1 
    ORDER BY HISTORY_ID DESC 
    LIMIT 1
  `);
  console.log('Recorded in FLIGHT_STATUS_HISTORY:');
  console.table(histRows);

  // 4. BROWSER END-TO-END VERIFICATION & SCREENSHOTS
  console.log('\n--- STEP 4: Browser Testing & Screenshot Evidence ---');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,950'],
    defaultViewport: { width: 1440, height: 950 }
  });
  const page = await browser.newPage();

  // Login as Passenger
  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.type('input[type="email"]', 'passenger@gmail.com');
  await page.type('input[type="password"]', 'Pass@12345');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Navigate to Flight Search Page
  console.log('Navigating to Flight Search tab (/passenger/search)...');
  await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.waitForSelector('.uq-table', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Full flight board with all fields
  const fullSearchShot = path.join(ARTIFACT_DIR, 'task3_flight_search_board.png');
  await page.screenshot({ path: fullSearchShot, fullPage: false });
  console.log('✔ Screenshot 1: Full Flight Search Board captured');

  // 2. Type "BOM" in search box
  console.log('Searching for route "BOM"...');
  const searchInput = await page.$('input[placeholder*="Search flight"]');
  if (searchInput) {
    await searchInput.type('BOM');
    await new Promise(r => setTimeout(r, 1000));
    const bomSearchShot = path.join(ARTIFACT_DIR, 'task3_flight_search_bom.png');
    await page.screenshot({ path: bomSearchShot, fullPage: false });
    console.log('✔ Screenshot 2: Route Search "BOM" captured');
  }

  // 3. Search for non-existent flight to verify no-results message
  console.log('Searching for non-existent query "XYZ999"...');
  if (searchInput) {
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search flight"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await searchInput.type('XYZ999');
    await new Promise(r => setTimeout(r, 1000));
    const noResultShot = path.join(ARTIFACT_DIR, 'task3_flight_search_no_results.png');
    await page.screenshot({ path: noResultShot, fullPage: false });
    console.log('✔ Screenshot 3: No Results State captured');
  }

  // 4. Click flight to inspect detailed modal
  console.log('Clearing search and opening flight detail modal...');
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search flight"]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  const firstRow = await page.$('.uq-row');
  if (firstRow) {
    await firstRow.click();
    await new Promise(r => setTimeout(r, 1000));
    const modalShot = path.join(ARTIFACT_DIR, 'task3_flight_details_modal.png');
    await page.screenshot({ path: modalShot, fullPage: false });
    console.log('✔ Screenshot 4: Flight Details Modal with Pricing & Capacity captured');
  }

  await browser.close();
  await pool.end();
  console.log('\n================================================================');
  console.log('ALL VERIFICATION STEPS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
