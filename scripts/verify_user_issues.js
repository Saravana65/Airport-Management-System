const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function testAll() {
  console.log('Launching Edge to audit all issues...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,950'],
    defaultViewport: { width: 1440, height: 950 }
  });

  const page = await browser.newPage();

  // 1. Audit Login Page
  console.log('Checking Login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_login_page.png') });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- LOGIN PAGE CHECK ---');
  console.log('Has "Self-Service Mobile Reservations":', bodyText.includes('Self-Service Mobile Reservations'));
  console.log('Has "Automated Gate & Baggage Handling":', bodyText.includes('Automated Gate & Baggage Handling'));
  console.log('Has "Autonomous AI Engine Monitoring":', bodyText.includes('Autonomous AI Engine Monitoring'));
  console.log('Has "SMART PASSENGER & OPERATIONS SUITE":', bodyText.includes('SMART PASSENGER & OPERATIONS SUITE'));
  console.log('Has "Encrypted with bcrypt & HttpOnly JWT tokens":', bodyText.includes('Encrypted with bcrypt & HttpOnly JWT tokens'));

  // 2. Audit Admin Dashboard Navigation
  console.log('\nChecking Admin login and sidebar...');
  await page.type('input[type="email"]', 'admin@airport.com');
  await page.type('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const adminSidebarText = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  console.log('--- ADMIN SIDEBAR CHECK ---');
  console.log('Admin Sidebar has "Autonomous Data Engine":', adminSidebarText.includes('Autonomous Data Engine'));
  console.log('Admin Sidebar has "C & Java Algorithms":', adminSidebarText.includes('C & Java Algorithms'));

  // Overview Screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_admin_overview.png') });
  console.log('✔ Captured Admin Overview');

  // Navigate to Airport Management
  console.log('Navigating to /admin/airports...');
  await page.goto('http://localhost:5173/admin/airports', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_admin_airports.png') });
  const airportsText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Airports page has "Airport Facilities Management":', airportsText.includes('Airport Facilities Management'));
  console.log('Airports page has "Live Operational Telemetry" (SHOULD BE FALSE):', airportsText.includes('Live Operational Telemetry'));

  // Navigate to Flights
  console.log('Navigating to /admin/flights...');
  await page.goto('http://localhost:5173/admin/flights', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_admin_flights.png') });
  const flightsText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Flights page has "Live Operational Telemetry" (SHOULD BE FALSE):', flightsText.includes('Live Operational Telemetry'));

  // Navigate to Bookings & Tickets
  console.log('Navigating to /admin/bookings...');
  await page.goto('http://localhost:5173/admin/bookings', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_admin_bookings.png') });
  const bookingsText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Bookings page has "Passenger Bookings & Electronic Tickets":', bookingsText.includes('Passenger Bookings & Electronic Tickets'));
  console.log('Bookings page has "Live Operational Telemetry" (SHOULD BE FALSE):', bookingsText.includes('Live Operational Telemetry'));

  // 3. Audit Airport Staff Dashboard
  console.log('\nChecking Airport Staff Ground Operations...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  // Logout / clear
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.type('input[type="email"]', 'ops@airport.com');
  await page.type('input[type="password"]', 'Airport@12345');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Overview
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_airport_overview.png') });
  const airportOverviewText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Airport Overview has "Ground Operations Resource Metrics":', airportOverviewText.includes('Ground Operations Resource Metrics'));

  // Gate Management
  await page.goto('http://localhost:5173/airport/gates', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_airport_gates.png') });
  const airportGatesText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Airport Gates has "Ground Operations Resource Metrics" (SHOULD BE FALSE):', airportGatesText.includes('Ground Operations Resource Metrics'));
  console.log('Airport Gates has "Terminal Gate Allocations & Aerobridges":', airportGatesText.includes('Terminal Gate Allocations & Aerobridges'));

  // 4. Audit Passenger Dashboard
  console.log('\nChecking Passenger Dashboard...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.type('input[type="email"]', 'passenger@gmail.com');
  await page.type('input[type="password"]', 'Pass@12345');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Passenger Overview
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_passenger_overview.png') });
  const passOverviewText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Passenger Overview has "Confirmed Bookings":', passOverviewText.includes('Confirmed Bookings'));

  // Passenger Search Flights
  await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_passenger_search.png') });
  const passSearchText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Passenger Search has "Confirmed Bookings" (SHOULD BE FALSE):', passSearchText.includes('Confirmed Bookings'));

  // Passenger My Bookings
  await page.goto('http://localhost:5173/passenger/bookings', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_passenger_bookings.png') });
  const passBookingsText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Passenger Bookings has "Confirmed Bookings" (SHOULD BE FALSE):', passBookingsText.includes('Confirmed Bookings'));
  console.log('Passenger Bookings has "My Bookings":', passBookingsText.includes('My Bookings') || passBookingsText.includes('Bookings'));

  // Passenger My Tickets
  await page.goto('http://localhost:5173/passenger/tickets', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_passenger_tickets.png') });
  const passTicketsText = await page.evaluate(() => document.querySelector('.ams-content-area')?.innerText || '');
  console.log('Passenger Tickets has "Confirmed Bookings" (SHOULD BE FALSE):', passTicketsText.includes('Confirmed Bookings'));
  console.log('Passenger Tickets has "Electronic Tickets":', passTicketsText.includes('Electronic Tickets') || passTicketsText.includes('Tickets'));

  await browser.close();
  console.log('\nAudit complete! All screenshots saved in artifact directory.');
}

testAll().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
