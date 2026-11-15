const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function capture() {
    console.log('Launching browser to capture Task 6 Baggage Management UI evidence...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        // 1. Login as passenger
        console.log('Navigating to login as passenger...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'passenger@gmail.com');
        await page.type('input[type="password"]', 'Pass@12345');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // 2. Go to Passenger Baggage Tab
        console.log('Navigating to passenger baggage tracking tab...');
        await page.goto('http://localhost:5173/passenger/baggage', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot 1: Passenger Baggage View with Advisory & Records
        const shot1Path = path.join(ARTIFACT_DIR, 'task6_passenger_baggage_view.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log('Saved screenshot 1:', shot1Path);

        // 3. Open Passenger Add Baggage Modal
        console.log('Opening passenger add baggage modal...');
        const addBtns = await page.$$('button');
        for (const btn of addBtns) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Add Baggage to Booking')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1200));

        // Screenshot 2: Passenger Add Baggage Modal
        const shot2Path = path.join(ARTIFACT_DIR, 'task6_passenger_add_baggage_modal.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log('Saved screenshot 2:', shot2Path);

        // 4. Logout and Login as Staff / Admin
        console.log('Logging in as staff/admin for baggage management dashboard...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'admin@airport.com');
        await page.type('input[type="password"]', 'Admin@12345');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // 5. Go to Staff Baggage Tab
        console.log('Navigating to staff airport baggage handling...');
        await page.goto('http://localhost:5173/airport/baggage', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2500));

        // Screenshot 3: Staff Baggage Dashboard with KPIs and filters
        const shot3Path = path.join(ARTIFACT_DIR, 'task6_staff_baggage_dashboard.png');
        await page.screenshot({ path: shot3Path, fullPage: false });
        console.log('Saved screenshot 3:', shot3Path);

        // 6. Click Update Status on first baggage row
        console.log('Opening staff baggage status update modal...');
        const updateBtns = await page.$$('button');
        for (const btn of updateBtns) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Update Status')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1200));

        // Screenshot 4: Staff Baggage Status Update Modal
        const shot4Path = path.join(ARTIFACT_DIR, 'task6_staff_baggage_status_modal.png');
        await page.screenshot({ path: shot4Path, fullPage: false });
        console.log('Saved screenshot 4:', shot4Path);

        console.log('All Task 6 screenshots captured successfully!');
    } catch (err) {
        console.error('Error capturing screenshots:', err);
    } finally {
        await browser.close();
    }
}

capture();
