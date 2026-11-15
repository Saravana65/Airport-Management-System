/**
 * Comprehensive Verification Script for Task 6: Baggage Management Module
 * Tests all 19 scenarios against live backend & MySQL database.
 */

const http = require('http');
const db = require('../backend/src/services/database.service');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const postData = body ? JSON.stringify(body) : '';
        const headers = {
            'Content-Type': 'application/json',
        };
        if (body) {
            headers['Content-Length'] = Buffer.byteLength(postData);
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed,
                });
            });
        });

        req.on('error', (err) => reject(err));
        if (postData) req.write(postData);
        req.end();
    });
}

async function login(email, password) {
    const res = await request('POST', '/auth/login', { email, password });
    if (res.status !== 200 || !res.body.data?.token) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
    }
    return {
        token: res.body.data.token,
        user: res.body.data.user,
    };
}

async function runTests() {
    console.log('===============================================================');
    console.log('   TASK 6 — BAGGAGE MANAGEMENT: 19-SCENARIO VERIFICATION       ');
    console.log('===============================================================\n');

    const results = [];

    function recordResult(num, name, pass, details) {
        results.push({ num, name, pass, details });
        const tag = pass ? '[PASS]' : '[FAIL]';
        console.log(`${tag} Scenario ${num}: ${name}`);
        if (details) {
            console.log(`       Details: ${details}`);
        }
    }

    try {
        // 1. Authenticate Users
        console.log('--> Authenticating users...');
        const passengerAuth = await login('passenger@gmail.com', 'Pass@12345');
        const adminAuth = await login('admin@airport.com', 'Admin@12345');
        console.log(`    Passenger User ID: ${passengerAuth.user.userId}`);
        console.log(`    Admin User ID: ${adminAuth.user.userId}\n`);

        // Prepare a valid booking and ticket for passenger
        console.log('--> Ensuring active ticket for passenger test operations...');
        let targetTicket = null;
        const myBookingsRes = await request('GET', '/bookings', null, passengerAuth.token);
        if (myBookingsRes.status === 200 && myBookingsRes.body.data && myBookingsRes.body.data.length > 0) {
            for (const b of myBookingsRes.body.data) {
                if ((b.status === 'CONFIRMED' || b.status === 'ISSUED') && b.tickets && b.tickets.length > 0) {
                    targetTicket = b.tickets.find(t => t.status !== 'CANCELLED');
                    if (targetTicket) {
                        targetTicket.pnr = b.bookingReference;
                        break;
                    }
                }
            }
        }

        if (!targetTicket) {
            // Create a fresh booking
            const [flightRows] = await db.execute(
                `SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES WHERE STATUS IN ('SCHEDULED', 'ON_TIME') LIMIT 1`
            );
            const bRes = await request('POST', '/bookings', {
                flightInstanceId: flightRows.rows[0].FLIGHT_INSTANCE_ID,
                cabinClass: 'ECONOMY',
                seatNumber: '29F',
                passengers: [{
                    firstName: 'Traveler',
                    lastName: 'Passenger',
                    dateOfBirth: '1995-01-01',
                    gender: 'MALE',
                    seatNumber: '29F',
                    cabinClass: 'ECONOMY'
                }],
                paymentMethod: 'CREDIT_CARD'
            }, passengerAuth.token);
            targetTicket = bRes.body.data.ticket;
            targetTicket.pnr = bRes.body.data.booking?.bookingReference;
        }

        console.log(`    Target Passenger Ticket ID: ${targetTicket.ticketId}, PNR: ${targetTicket.pnr}\n`);

        // SCENARIO 5: Baggage registration works for a valid booking
        const testTag = `BAG-TEST-${Date.now().toString().slice(-5)}`;
        const regRes = await request('POST', '/baggage', {
            ticketId: targetTicket.ticketId,
            weightKg: 20.5,
            tagNumber: testTag,
            carouselNumber: 'BELT-03',
        }, passengerAuth.token);

        const s5Pass = regRes.status === 201 && regRes.body.data?.tagNumber === testTag;
        recordResult(5, 'Baggage Registration Works for a Valid Booking', s5Pass, `Status=${regRes.status}, Tag=${regRes.body.data?.tagNumber}`);

        // SCENARIO 7: Baggage details persist in MySQL
        const [dbBagRes] = [await db.execute(
            `SELECT * FROM BAGGAGE WHERE TAG_NUMBER = ?`,
            [testTag]
        )];
        const savedBag = dbBagRes.rows[0];
        const s7Pass = savedBag && parseFloat(savedBag.WEIGHT_KG) === 20.5 && savedBag.STATUS === 'CHECKED_IN';
        recordResult(7, 'Baggage Details Persist in MySQL', s7Pass, `Baggage ID=${savedBag?.BAGGAGE_ID}, Weight=${savedBag?.WEIGHT_KG}kg, Status=${savedBag?.STATUS}`);

        // SCENARIO 1: Passenger can view their own baggage records
        const passBagsRes = await request('GET', '/baggage', null, passengerAuth.token);
        const s1Pass = passBagsRes.status === 200 && Array.isArray(passBagsRes.body.data) && passBagsRes.body.data.some(b => b.tagNumber === testTag);
        recordResult(1, 'Passenger Can View Their Own Baggage Records', s1Pass, `Status=${passBagsRes.status}, Total Baggage=${passBagsRes.body.data?.length}`);

        // SCENARIO 2: Passenger cannot view another passenger's baggage
        // Find or create baggage belonging to another user (admin)
        const [foreignTicketRes] = [await db.execute(
            `SELECT t.TICKET_ID FROM TICKETS t 
             JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID 
             WHERE b.USER_ID != ? AND t.STATUS != 'CANCELLED' LIMIT 1`,
            [passengerAuth.user.userId]
        )];
        let foreignTag = 'BAG-FRG-99999';
        if (foreignTicketRes.rows.length > 0) {
            const fTktId = foreignTicketRes.rows[0].TICKET_ID;
            // Check if foreign ticket already has baggage
            const [fBagRes] = [await db.execute(`SELECT TAG_NUMBER FROM BAGGAGE WHERE TICKET_ID = ? LIMIT 1`, [fTktId])];
            if (fBagRes.rows.length > 0) {
                foreignTag = fBagRes.rows[0].TAG_NUMBER;
            } else {
                await db.execute(
                    `INSERT INTO BAGGAGE (TICKET_ID, TAG_NUMBER, WEIGHT_KG, STATUS, CAROUSEL_NUMBER) 
                     VALUES (?, ?, 18.0, 'LOADED', 'C01')`,
                    [fTktId, foreignTag]
                );
            }
        }
        const foreignInspectRes = await request('GET', `/baggage/${foreignTag}`, null, passengerAuth.token);
        const s2Pass = foreignInspectRes.status === 403;
        recordResult(2, 'Passenger Cannot View Another Passenger Baggage (403)', s2Pass, `Status=${foreignInspectRes.status}, Message="${foreignInspectRes.body.message}"`);

        // SCENARIO 3: Authorized staff can view baggage records
        const staffBagsRes = await request('GET', '/baggage', null, adminAuth.token);
        const s3Pass = staffBagsRes.status === 200 && Array.isArray(staffBagsRes.body.data) && staffBagsRes.body.data.length >= 2;
        recordResult(3, 'Authorized Staff Can View Baggage Records', s3Pass, `Status=${staffBagsRes.status}, Total Records=${staffBagsRes.body.data?.length}`);

        // SCENARIO 4: Passenger cannot access staff baggage APIs
        const staffPatchRes = await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, {
            status: 'LOADED',
        }, passengerAuth.token);
        const staffOverviewRes = await request('GET', '/baggage/staff/overview', null, passengerAuth.token);
        const s4Pass = staffPatchRes.status === 403 && staffOverviewRes.status === 403;
        recordResult(4, 'Passenger Cannot Access Staff Baggage APIs (403)', s4Pass, `PATCH Status=${staffPatchRes.status}, Overview Status=${staffOverviewRes.status}`);

        // SCENARIO 6: Invalid booking references are rejected
        const invBagRes = await request('POST', '/baggage', {
            ticketId: 99999999,
            weightKg: 15.0,
        }, adminAuth.token);
        const s6Pass = invBagRes.status === 404;
        recordResult(6, 'Invalid Booking References Rejected (404)', s6Pass, `Status=${invBagRes.status}, Message="${invBagRes.body.message}"`);

        // SCENARIO 8: Baggage status update works
        const statusUpdateRes = await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, {
            status: 'SECURITY_CLEARED',
            carouselNumber: 'BELT-04',
        }, adminAuth.token);
        const s8Pass = statusUpdateRes.status === 200 && statusUpdateRes.body.data?.status === 'SECURITY_CLEARED';
        recordResult(8, 'Baggage Status Update Works', s8Pass, `Status=${statusUpdateRes.status}, NewStatus=${statusUpdateRes.body.data?.status}`);

        // SCENARIO 9: Invalid status transitions are rejected
        // First transition to terminal state DELIVERED
        await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, { status: 'LOADED' }, adminAuth.token);
        await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, { status: 'ARRIVED' }, adminAuth.token);
        await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, { status: 'DELIVERED' }, adminAuth.token);
        
        // Attempt illegal regression from DELIVERED to CHECKED_IN
        const invalidTransRes = await request('PATCH', `/baggage/${savedBag.BAGGAGE_ID}/status`, {
            status: 'CHECKED_IN',
        }, adminAuth.token);
        const s9Pass = invalidTransRes.status === 400 && invalidTransRes.body.message.toLowerCase().includes('transition');
        recordResult(9, 'Invalid Status Transitions Are Rejected (400)', s9Pass, `Status=${invalidTransRes.status}, Message="${invalidTransRes.body.message}"`);

        // SCENARIO 10: Baggage search by PNR works
        const pnrSearchRes = await request('GET', `/baggage?pnr=${targetTicket.pnr}`, null, adminAuth.token);
        const s10Pass = pnrSearchRes.status === 200 && pnrSearchRes.body.data?.some(b => b.tagNumber === testTag);
        recordResult(10, 'Baggage Search by PNR Works', s10Pass, `Status=${pnrSearchRes.status}, Found=${pnrSearchRes.body.data?.length}`);

        // SCENARIO 11: Baggage search by tag works
        const tagSearchRes = await request('GET', `/baggage?tagNumber=${testTag}`, null, adminAuth.token);
        const s11Pass = tagSearchRes.status === 200 && tagSearchRes.body.data?.length === 1 && tagSearchRes.body.data[0].tagNumber === testTag;
        recordResult(11, 'Baggage Search by Tag Works', s11Pass, `Status=${tagSearchRes.status}, Matches=${tagSearchRes.body.data?.length}`);

        // SCENARIO 12: Baggage search by flight number works
        const [bagFlightRow] = [await db.execute(
            `SELECT fi.FLIGHT_NUMBER 
             FROM BAGGAGE bg 
             JOIN TICKETS t ON bg.TICKET_ID = t.TICKET_ID 
             JOIN FLIGHT_INSTANCES fi ON t.FLIGHT_INSTANCE_ID = fi.FLIGHT_INSTANCE_ID 
             WHERE bg.TAG_NUMBER = ?`,
            [testTag]
        )];
        const fltNum = bagFlightRow.rows[0]?.FLIGHT_NUMBER;
        const fltSearchRes = await request('GET', `/baggage?flightNumber=${fltNum}`, null, adminAuth.token);
        const s12Pass = fltSearchRes.status === 200 && fltSearchRes.body.data?.some(b => b.tagNumber === testTag);
        recordResult(12, 'Baggage Search by Flight Number Works', s12Pass, `Flight=${fltNum}, Found=${fltSearchRes.body.data?.length}`);

        // SCENARIO 13: Duplicate baggage references are prevented
        const dupTagRes = await request('POST', '/baggage', {
            ticketId: targetTicket.ticketId,
            weightKg: 19.0,
            tagNumber: testTag, // Already exists in MySQL
        }, adminAuth.token);
        const s13Pass = dupTagRes.status === 409;
        recordResult(13, 'Duplicate Baggage References Prevented (409)', s13Pass, `Status=${dupTagRes.status}, Message="${dupTagRes.body.message}"`);

        // SCENARIO 14: Unauthenticated access is rejected
        const unauthRes = await request('GET', '/baggage');
        const s14Pass = unauthRes.status === 401;
        recordResult(14, 'Unauthenticated Access Rejected (401)', s14Pass, `Status=${unauthRes.status}, Message="${unauthRes.body.message}"`);

        // SCENARIO 15: Regression: Flight Search regression test passes
        const fSearchRes = await request('GET', '/flights/search?origin=DEL&destination=BOM', null, passengerAuth.token);
        const s15Pass = fSearchRes.status === 200 && Array.isArray(fSearchRes.body.data);
        recordResult(15, 'Regression: Flight Search Operational', s15Pass, `Status=${fSearchRes.status}, Flights=${fSearchRes.body.data?.length}`);

        // SCENARIO 16: Regression: Flight Status regression test passes
        const [sampleFlight] = [await db.execute(`SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES LIMIT 1`)];
        const statusPatch = await request('PATCH', `/flights/${sampleFlight.rows[0].FLIGHT_INSTANCE_ID}/status`, {
            status: 'ON_TIME',
            remarks: 'Task 6 regression check'
        }, adminAuth.token);
        const s16Pass = statusPatch.status === 200 && (statusPatch.body.data?.instance?.status === 'ON_TIME' || statusPatch.body.data?.status === 'ON_TIME');
        recordResult(16, 'Regression: Flight Status Update Operational', s16Pass, `Status=${statusPatch.status}`);

        // SCENARIO 17: Regression: Ticket Booking regression test passes
        const [schedFlight] = [await db.execute(`SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES WHERE STATUS = 'SCHEDULED' LIMIT 1`)];
        const schedId = schedFlight.rows[0].FLIGHT_INSTANCE_ID;
        const [takenSeats] = [await db.execute(
            `SELECT SEAT_NUMBER FROM TICKETS WHERE FLIGHT_INSTANCE_ID = ? AND STATUS != 'CANCELLED'`,
            [schedId]
        )];
        const occupied = new Set(takenSeats.rows.map(r => r.SEAT_NUMBER));
        let regSeat = '28E';
        for (let row = 20; row <= 30; row++) {
            for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
                const s = `${row}${col}`;
                if (!occupied.has(s)) {
                    regSeat = s;
                    break;
                }
            }
            if (!occupied.has(regSeat)) break;
        }
        const bookRes = await request('POST', '/bookings', {
            flightInstanceId: schedId,
            cabinClass: 'ECONOMY',
            seatNumber: regSeat,
            passengers: [{
                firstName: 'TaskSix',
                lastName: 'Regression',
                dateOfBirth: '1996-06-06',
                gender: 'FEMALE',
                seatNumber: regSeat,
                cabinClass: 'ECONOMY'
            }],
            paymentMethod: 'DEBIT_CARD'
        }, passengerAuth.token);
        const pnrVal = bookRes.body.data?.booking?.bookingReference || bookRes.body.data?.bookingReference;
        const s17Pass = bookRes.status === 201 && !!pnrVal;
        recordResult(17, 'Regression: Ticket Booking Operational', s17Pass, `Status=${bookRes.status}, PNR=${pnrVal}`);

        // SCENARIO 18: Regression: Online Web Check-in regression test passes
        const checkinTicketId = bookRes.body.data?.ticket?.ticketId || bookRes.body.data?.ticketId;
        const ciRes = await request('POST', '/checkin', {
            ticketId: checkinTicketId,
            seatNumber: regSeat,
            safetyDeclaration: true,
        }, passengerAuth.token);
        const s18Pass = ciRes.status === 201 && ciRes.body.data?.boardingPass?.boardingPassCode;
        recordResult(18, 'Regression: Online Web Check-In Operational', s18Pass, `Status=${ciRes.status}, BoardingPass=${ciRes.body.data?.boardingPass?.boardingPassCode}`);

        // SCENARIO 19: Regression: Passenger booking history regression test passes
        const histRes = await request('GET', '/bookings', null, passengerAuth.token);
        const s19Pass = histRes.status === 200 && Array.isArray(histRes.body.data) && histRes.body.data.length > 0;
        recordResult(19, 'Regression: Passenger Booking History Operational', s19Pass, `Status=${histRes.status}, Total Bookings=${histRes.body.data?.length}`);

        console.log('\n===============================================================');
        console.log(`TOTAL SCENARIOS: ${results.length} | PASSED: ${results.filter(r => r.pass).length} | FAILED: ${results.filter(r => !r.pass).length}`);
        console.log('===============================================================\n');

        const allPassed = results.every(r => r.pass);
        if (!allPassed) {
            process.exit(1);
        }
    } catch (err) {
        console.error('Fatal error during test run:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTests();
