const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function run() {
  console.log('Launching browser to capture redesigned passenger views...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,950'
    ],
    defaultViewport: {
      width: 1440,
      height: 950
    }
  });

  try {
    const page = await browser.newPage();

    // Log in as Passenger
    console.log('Logging in as passenger@gmail.com...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'passenger@gmail.com');
    await page.type('input[type="password"]', 'Pass@12345');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    // 1. Overview Tab
    console.log('Capturing Passenger Overview...');
    await page.goto('http://localhost:5173/passenger/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const overviewPath = path.join(OUTPUT_DIR, 'passenger_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    fs.copyFileSync(overviewPath, path.join(ARTIFACT_DIR, 'passenger_overview.png'));
    console.log('✔ Captured Passenger Overview');

    // 2. Flight Status & Booking Tab
    console.log('Capturing Passenger Flights & Booking...');
    await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.uq-table', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));
    const flightsPath = path.join(OUTPUT_DIR, 'passenger_flight_status.png');
    await page.screenshot({ path: flightsPath, fullPage: false });
    fs.copyFileSync(flightsPath, path.join(ARTIFACT_DIR, 'passenger_flight_status.png'));
    console.log('✔ Captured Passenger Flight Status & Booking');

    // 3. My Bookings Tab
    console.log('Capturing Passenger My Bookings...');
    await page.goto('http://localhost:5173/passenger/bookings', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const bookingsPath = path.join(OUTPUT_DIR, 'passenger_bookings.png');
    await page.screenshot({ path: bookingsPath, fullPage: false });
    fs.copyFileSync(bookingsPath, path.join(ARTIFACT_DIR, 'passenger_bookings.png'));
    console.log('✔ Captured Passenger My Bookings');

    // 4. Web Check-In Tab
    console.log('Capturing Passenger Web Check-In...');
    await page.goto('http://localhost:5173/passenger/checkin', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const checkinPath = path.join(OUTPUT_DIR, 'passenger_checkin.png');
    await page.screenshot({ path: checkinPath, fullPage: false });
    fs.copyFileSync(checkinPath, path.join(ARTIFACT_DIR, 'passenger_checkin.png'));
    console.log('✔ Captured Passenger Web Check-In');

    // 5. Travel Guidelines Tab
    console.log('Capturing Travel Guidelines...');
    await page.goto('http://localhost:5173/passenger/travel-info', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const travelPath = path.join(OUTPUT_DIR, 'passenger_travel_info.png');
    await page.screenshot({ path: travelPath, fullPage: false });
    fs.copyFileSync(travelPath, path.join(ARTIFACT_DIR, 'passenger_travel_info.png'));
    console.log('✔ Captured Travel Guidelines');

    // 6. My Profile Tab
    console.log('Capturing Passenger Profile...');
    await page.goto('http://localhost:5173/passenger/profile', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const profilePath = path.join(OUTPUT_DIR, 'passenger_profile.png');
    await page.screenshot({ path: profilePath, fullPage: false });
    fs.copyFileSync(profilePath, path.join(ARTIFACT_DIR, 'passenger_profile.png'));
    console.log('✔ Captured Passenger Profile');

    console.log('All passenger views captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
