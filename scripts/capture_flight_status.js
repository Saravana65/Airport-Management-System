const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser...');
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

    // 1. Log in as ADMIN
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@airport.com');
    await page.type('input[type="password"]', 'Admin@12345');
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // 2. Navigate to Flight Status Dashboard (/admin/flights)
    console.log('Navigating to /admin/flights...');
    await page.goto('http://localhost:5173/admin/flights', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.uq-table', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture main flight status dashboard
    const flightDashPath = path.join(OUTPUT_DIR, 'flight_status_dashboard.png');
    await page.screenshot({ path: flightDashPath, fullPage: false });
    console.log('✔ Captured flight status dashboard:', flightDashPath);

    // Copy to artifact directory
    const artifactDashPath = path.join(ARTIFACT_DIR, 'flight_status_dashboard.png');
    fs.copyFileSync(flightDashPath, artifactDashPath);

    // 3. Click "View" details button to open flight modal
    console.log('Opening flight modal...');
    const detailsBtn = await page.$('.uq-details-btn');
    if (detailsBtn) {
      await detailsBtn.click();
      await page.waitForSelector('.uq-modal-backdrop', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 1000));

      const modalPath = path.join(OUTPUT_DIR, 'flight_status_modal.png');
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log('✔ Captured flight modal:', modalPath);

      const artifactModalPath = path.join(ARTIFACT_DIR, 'flight_status_modal.png');
      fs.copyFileSync(modalPath, artifactModalPath);
    }

    // 4. Test Passenger Dashboard with Flight Tracking
    console.log('Switching to Passenger session...');
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'passenger@gmail.com');
    await page.type('input[type="password"]', 'Pass@12345');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // Navigate to /passenger/search
    console.log('Navigating to /passenger/search...');
    await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.uq-table', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    const passDashPath = path.join(OUTPUT_DIR, 'passenger_flight_status.png');
    await page.screenshot({ path: passDashPath, fullPage: false });
    console.log('✔ Captured passenger flight status:', passDashPath);

    const artifactPassPath = path.join(ARTIFACT_DIR, 'passenger_flight_status.png');
    fs.copyFileSync(passDashPath, artifactPassPath);

    console.log('\nAll flight dashboard screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
