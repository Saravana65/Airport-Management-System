const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function run() {
  console.log('Launching browser to capture Web Check-In & Flight Booking flow...');
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

    // 1. Log in as Passenger
    console.log('Logging in as passenger@gmail.com...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'passenger@gmail.com');
    await page.type('input[type="password"]', 'Pass@12345');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    // 2. Flight Booking Site & Open Booking Modal
    console.log('Navigating to Flight Booking Site...');
    await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.uq-table', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Click "Book Flight" on the first row
    const bookBtn = await page.$('.btn-book-action');
    if (bookBtn) {
      await bookBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('Capturing Booking Modal...');
      const modalPath = path.join(OUTPUT_DIR, 'passenger_booking_modal.png');
      await page.screenshot({ path: modalPath, fullPage: false });
      fs.copyFileSync(modalPath, path.join(ARTIFACT_DIR, 'passenger_booking_modal.png'));
      console.log('✔ Captured passenger_booking_modal.png');

      // Close modal
      const closeBtn = await page.$('.modal-close');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // 3. Web Check-In Desk & Seat Picker
    console.log('Navigating to Web Check-In Portal...');
    await page.goto('http://localhost:5173/passenger/checkin', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Look for "Start Web Check-In" button
    const checkinBtn = await page.$('.checkin-ticket-selection-view button.btn-primary');
    if (checkinBtn) {
      console.log('Clicking Start Web Check-In on ticket...');
      await checkinBtn.click();
      await new Promise(r => setTimeout(r, 1200));

      // Now on Seat Map Picker view
      console.log('Capturing Airplane Seat Map & Declarations...');
      const seatMapPath = path.join(OUTPUT_DIR, 'passenger_seat_map.png');
      await page.screenshot({ path: seatMapPath, fullPage: false });
      fs.copyFileSync(seatMapPath, path.join(ARTIFACT_DIR, 'passenger_seat_map.png'));
      console.log('✔ Captured passenger_seat_map.png');

      // Click seat 14A or 12B
      const seatBtn = await page.$('button.seat-map-btn.available');
      if (seatBtn) {
        await seatBtn.click();
        await new Promise(r => setTimeout(r, 500));
      }

      // Check safety declaration
      const checkbox = await page.$('.safety-declaration-box input[type="checkbox"]');
      if (checkbox) {
        await checkbox.click();
        await new Promise(r => setTimeout(r, 500));
      }

      // Click "Complete Web Check-In & Issue Boarding Pass"
      const completeBtn = await page.$('.checkin-submit-bar button.btn-primary');
      if (completeBtn) {
        console.log('Completing Web Check-In...');
        await completeBtn.click();
        await new Promise(r => setTimeout(r, 2000));

        // Now on Digital Boarding Pass view
        console.log('Capturing Digital Boarding Pass...');
        const bpPath = path.join(OUTPUT_DIR, 'passenger_boarding_pass.png');
        await page.screenshot({ path: bpPath, fullPage: false });
        fs.copyFileSync(bpPath, path.join(ARTIFACT_DIR, 'passenger_boarding_pass.png'));
        console.log('✔ Captured passenger_boarding_pass.png');
      }
    } else {
      console.log('Active boarding pass or empty ticket state, capturing direct view...');
      const checkinDirect = path.join(OUTPUT_DIR, 'passenger_checkin.png');
      await page.screenshot({ path: checkinDirect, fullPage: false });
      fs.copyFileSync(checkinDirect, path.join(ARTIFACT_DIR, 'passenger_checkin.png'));
    }

    // Also update passenger_overview.png, passenger_bookings.png
    console.log('Updating overview & bookings screenshots...');
    await page.goto('http://localhost:5173/passenger/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const ovPath = path.join(OUTPUT_DIR, 'passenger_overview.png');
    await page.screenshot({ path: ovPath, fullPage: false });
    fs.copyFileSync(ovPath, path.join(ARTIFACT_DIR, 'passenger_overview.png'));

    await page.goto('http://localhost:5173/passenger/bookings', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const bkPath = path.join(OUTPUT_DIR, 'passenger_bookings.png');
    await page.screenshot({ path: bkPath, fullPage: false });
    fs.copyFileSync(bkPath, path.join(ARTIFACT_DIR, 'passenger_bookings.png'));

    console.log('All flow captures completed successfully!');
  } catch (err) {
    console.error('Error during flow capture:', err);
  } finally {
    await browser.close();
  }
}

run();
