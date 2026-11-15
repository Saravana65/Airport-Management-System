const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function captureModal() {
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
  await page.click('.uq-table tbody tr');
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task3_flight_details_modal.png') });
  console.log('✔ Captured task3_flight_details_modal.png');
  await browser.close();
}

captureModal().catch(err => {
  console.error(err);
  process.exit(1);
});
