const puppeteer = require('../frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ssana\\.gemini\\antigravity\\brain\\c6b58404-1919-4ea2-8efc-d20a37408fa4';

async function capture() {
    console.log('Launching browser to capture Task 4 Booking UI evidence...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        // 1. Login as passenger
        console.log('Navigating to login...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'passenger@gmail.com');
        await page.type('input[type="password"]', 'Pass@12345');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // 2. Go to Flights / Search Tab
        console.log('Navigating to passenger flight booking tab...');
        await page.goto('http://localhost:5173/passenger/search', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot Flight Schedules with Book buttons
        const shot1Path = path.join(ARTIFACT_DIR, 'task4_flight_search_results.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log('Saved screenshot 1:', shot1Path);

        // 3. Click first Book button
        console.log('Opening flight booking modal...');
        const bookBtns = await page.$$('.uq-details-btn');
        let clicked = false;
        for (const btn of bookBtns) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.includes('Book')) {
                await btn.click();
                clicked = true;
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1500));

        // Screenshot the Booking Modal with Passenger Form and Interactive Seat Map
        const shot2Path = path.join(ARTIFACT_DIR, 'task4_booking_modal_seatmap.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log('Saved screenshot 2:', shot2Path);

        // 4. Click a seat and book
        console.log('Selecting seat and confirming booking...');
        const seatBtns = await page.$$('.seat-map-btn.available');
        if (seatBtns.length > 0) {
            await seatBtns[0].click();
            await new Promise(r => setTimeout(r, 500));
        }

        // Click "Book Reservation Only"
        const confirmBtn = await page.$('button[type="submit"]');
        if (confirmBtn) {
            await confirmBtn.click();
            await new Promise(r => setTimeout(r, 2500));
        }

        // Screenshot Confirmation Modal
        const shot3Path = path.join(ARTIFACT_DIR, 'task4_booking_confirmation_modal.png');
        await page.screenshot({ path: shot3Path, fullPage: false });
        console.log('Saved screenshot 3:', shot3Path);

        // 5. Navigate to "My Bookings" tab
        console.log('Navigating to My Bookings...');
        await page.goto('http://localhost:5173/passenger/bookings', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1500));

        const shot4Path = path.join(ARTIFACT_DIR, 'task4_passenger_booking_history.png');
        await page.screenshot({ path: shot4Path, fullPage: false });
        console.log('Saved screenshot 4:', shot4Path);

        console.log('Visual evidence capture complete!');
    } finally {
        await browser.close();
    }
}

capture().catch(err => {
    console.error('Capture error:', err);
    process.exit(1);
});
