const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

// Test API seat availability and pricing
function testApi() {
  return new Promise((resolve, reject) => {
    // Login as passenger first
    const authData = JSON.stringify({ email: 'passenger@gmail.com', password: 'Pass@12345' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': authData.length }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const token = JSON.parse(data).data.token;
        http.get({
          hostname: 'localhost',
          port: 5000,
          path: '/api/flights/search?origin=BOM&destination=DEL',
          headers: { 'Authorization': `Bearer ${token}` }
        }, r => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => {
            const body = JSON.parse(b);
            const flight = body.data[0];
            console.log('API Verified Flight Data:');
            console.log('- Flight Number:', flight.flightNumber);
            console.log('- Base Fare:', flight.baseFare);
            console.log('- Total Seats (Actual Aircraft):', flight.totalSeats);
            console.log('- Booked Seats:', flight.bookedSeats);
            console.log('- Available Seats:', flight.availableSeats);
            resolve();
          });
        });
      });
    });
    req.write(authData);
    req.end();
  });
}

async function captureScreenshots() {
  await testApi();

  console.log('Capturing updated browser screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,950'],
    defaultViewport: { width: 1440, height: 950 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'passenger@gmail.com');
  await page.type('input[type="password"]', 'Pass@12345');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.uq-table tbody tr');

  // 1. Open Flight Details Modal
  await page.click('.uq-table tbody tr');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task3_1_modal_basefare_seats.png') });
  console.log('✔ Screenshot 1: task3_1_modal_basefare_seats.png captured');

  // 2. Open Booking Modal
  const reserveBtn = await page.$('.btn-primary');
  if (reserveBtn) {
    await reserveBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task3_1_booking_modal_pricing.png') });
    console.log('✔ Screenshot 2: task3_1_booking_modal_pricing.png captured');
  }

  await browser.close();
}

captureScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
