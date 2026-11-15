const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function capture() {
    console.log('Launching browser to capture Task 5 Online Web Check-in UI evidence...');
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

        // 2. Go to Passenger Check-In Tab
        console.log('Navigating to passenger check-in tab...');
        await page.goto('http://localhost:5173/passenger/checkin', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot 1: Eligible tickets listing
        const shot1Path = path.join(ARTIFACT_DIR, 'task5_eligible_tickets.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log('Saved screenshot 1:', shot1Path);

        // 3. Click "Proceed to Check-In" on first eligible ticket
        console.log('Opening check-in workspace...');
        const checkinBtns = await page.$$('button');
        for (const btn of checkinBtns) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Proceed to Check-In')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1500));

        // Screenshot 2: Check-in seat selection & safety declaration
        const shot2Path = path.join(ARTIFACT_DIR, 'task5_checkin_seat_selection.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log('Saved screenshot 2:', shot2Path);

        // 4. Check safety declaration checkbox and confirm check-in
        console.log('Confirming check-in to generate boarding pass...');
        const checkbox = await page.$('input[type="checkbox"]');
        if (checkbox) {
            await checkbox.click();
        }
        await new Promise(r => setTimeout(r, 500));

        // Click "Confirm Check-In & Generate Boarding Pass" button
        const confirmBtns = await page.$$('button');
        for (const btn of confirmBtns) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Generate Boarding Pass')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot 3: Digital Boarding Pass preview with Demo Notice
        const shot3Path = path.join(ARTIFACT_DIR, 'task5_boarding_pass_preview.png');
        await page.screenshot({ path: shot3Path, fullPage: false });
        console.log('Saved screenshot 3:', shot3Path);

        // 5. Logout and Login as Staff / Admin
        console.log('Logging in as staff/admin for monitoring dashboard...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'admin@airport.com');
        await page.type('input[type="password"]', 'Admin@12345');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // 6. Go to Staff Airport Dashboard Check-In tab
        console.log('Navigating to staff airport check-in operations...');
        await page.goto('http://localhost:5173/airport/checkin', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2500));

        // Screenshot 4: Staff check-in telemetry & passenger monitoring
        const shot4Path = path.join(ARTIFACT_DIR, 'task5_staff_checkin_monitoring.png');
        await page.screenshot({ path: shot4Path, fullPage: false });
        console.log('Saved screenshot 4:', shot4Path);

        console.log('All Task 5 screenshots captured successfully!');
    } catch (err) {
        console.error('Error capturing screenshots:', err);
    } finally {
        await browser.close();
    }
}

capture();
