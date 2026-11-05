const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ROLES = [
    {
        name: 'admin',
        title: 'Admin Dashboard',
        email: 'admin@airport.com',
        password: 'Admin@12345',
        expectedPath: '/admin',
        outFile: 'admin_dashboard.png'
    },
    {
        name: 'airline',
        title: 'Airline Staff Dashboard',
        email: 'staff@airline.com',
        password: 'Airline@12345',
        expectedPath: '/airline',
        outFile: 'airline_dashboard.png'
    },
    {
        name: 'airport',
        title: 'Airport Operations Dashboard',
        email: 'ops@airport.com',
        password: 'Airport@12345',
        expectedPath: '/airport',
        outFile: 'airport_dashboard.png'
    },
    {
        name: 'passenger',
        title: 'Passenger Portal Dashboard',
        email: 'passenger@gmail.com',
        password: 'Pass@12345',
        expectedPath: '/passenger',
        outFile: 'passenger_dashboard.png'
    }
];

async function capture() {
    console.log('Launching Edge browser at:', EDGE_PATH);
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1440,900'
        ],
        defaultViewport: {
            width: 1440,
            height: 900
        }
    });

    try {
        const page = await browser.newPage();

        // 1. Capture Login Screen
        console.log('Navigating to Login page...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1000));
        const loginPath = path.join(OUTPUT_DIR, 'login_screen.png');
        await page.screenshot({ path: loginPath, fullPage: false });
        console.log('✔ Captured Login Screen:', loginPath);

        // 2. Capture Each Dashboard
        for (const role of ROLES) {
            console.log(`\nLogging in as ${role.name.toUpperCase()} (${role.email})...`);

            // Clear cookies & storage to get fresh session
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');

            await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });

            // Type credentials
            await page.waitForSelector('input[type="email"]', { timeout: 5000 });
            await page.$eval('input[type="email"]', (el) => el.value = '');
            await page.type('input[type="email"]', role.email, { delay: 20 });

            await page.waitForSelector('input[type="password"]', { timeout: 5000 });
            await page.$eval('input[type="password"]', (el) => el.value = '');
            await page.type('input[type="password"]', role.password, { delay: 20 });

            // Click submit button
            await page.click('button[type="submit"]');

            // Wait for navigation
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 2000));

            const currentUrl = page.url();
            console.log(`Current URL after login: ${currentUrl}`);

            // Take screenshot
            const destPath = path.join(OUTPUT_DIR, role.outFile);
            await page.screenshot({ path: destPath, fullPage: false });
            console.log(`✔ Captured ${role.title}: ${destPath}`);
        }

        console.log('\nAll screenshots captured successfully!');
    } catch (err) {
        console.error('Error capturing screenshots:', err);
    } finally {
        await browser.close();
    }
}

capture();
