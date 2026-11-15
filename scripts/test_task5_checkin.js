/**
 * Comprehensive Verification Script for Task 5: Online Web Check-in
 * Tests all 16 scenarios against live backend & MySQL database.
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
    console.log('   TASK 5 — ONLINE WEB CHECK-IN: 16-SCENARIO VERIFICATION     ');
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
        // Authenticate Users
        console.log('--> Authenticating users...');
        const passengerAuth = await login('passenger@gmail.com', 'Pass@12345');
        const adminAuth = await login('admin@airport.com', 'Admin@12345');
        console.log(`    Passenger User ID: ${passengerAuth.user.userId}`);
        console.log(`    Admin User ID: ${adminAuth.user.userId}\n`);

        // Check or create a fresh booking for the passenger that has an ISSUED ticket
        console.log('--> Creating fresh booking for passenger to verify check-in...');
        const flightRes = await db.execute(
            `SELECT fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER, fi.STATUS 
             FROM FLIGHT_INSTANCES fi 
             WHERE fi.STATUS IN ('SCHEDULED', 'ON_TIME', 'BOARDING') 
             ORDER BY fi.FLIGHT_INSTANCE_ID ASC 
             LIMIT 1`
        );
        const flightInstanceId = flightRes.rows[0].FLIGHT_INSTANCE_ID;
        
        // Find an unbooked seat
        const takenSeats = await db.execute(
            `SELECT SEAT_NUMBER FROM TICKETS WHERE FLIGHT_INSTANCE_ID = ? AND STATUS != 'CANCELLED'`,
            [flightInstanceId]
        );
        const occupied = new Set(takenSeats.rows.map(r => r.SEAT_NUMBER));
        let chosenSeat = '18A';
        for (let row = 15; row <= 28; row++) {
            for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
                const s = `${row}${col}`;
                if (!occupied.has(s)) {
                    chosenSeat = s;
                    break;
                }
            }
            if (chosenSeat !== '18A' || !occupied.has('18A')) break;
        }

        const bookingPayload = {
            flightInstanceId,
            cabinClass: 'ECONOMY',
            seatNumber: chosenSeat,
            passengers: [
                {
                    firstName: 'Aarav',
                    lastName: 'Mehta',
                    dateOfBirth: '1990-08-20',
                    gender: 'MALE',
                    seatNumber: chosenSeat,
                    cabinClass: 'ECONOMY'
                }
            ],
            paymentMethod: 'CREDIT_CARD'
        };
        const bRes = await request('POST', '/bookings', bookingPayload, passengerAuth.token);
        if (bRes.status !== 201) {
            throw new Error(`Failed to create fresh booking: ${JSON.stringify(bRes.body)}`);
        }
        
        const eligibleRes = await request('GET', '/checkin/eligible', null, passengerAuth.token);
        const targetTicket = eligibleRes.body.data.find(t => t.seatNumber === chosenSeat) || eligibleRes.body.data[0];
        console.log(`--> Selected ticket for checkin: ID=${targetTicket.ticketId}, PNR=${targetTicket.pnr}, Seat=${targetTicket.seatNumber}\n`);

        // SCENARIO 1: Successful passenger check-in (POST /api/checkin -> 201)
        const checkinPayload = {
            ticketId: targetTicket.ticketId,
            seatNumber: targetTicket.seatNumber,
            safetyDeclaration: true,
            hasSpecialAssistance: false,
            baggageCount: 1
        };
        const s1Res = await request('POST', '/checkin', checkinPayload, passengerAuth.token);
        const s1Pass = s1Res.status === 201 && s1Res.body.data?.boardingPass?.boardingPassCode;
        const bpCode = s1Res.body.data?.boardingPass?.boardingPassCode;
        recordResult(1, 'Successful Passenger Web Check-In', s1Pass, `Status=${s1Res.status}, BoardingPassCode=${bpCode}`);

        // SCENARIO 2: Check-in record saved permanently in MySQL
        const ciRes = await db.execute(
            `SELECT * FROM CHECK_IN WHERE TICKET_ID = ?`,
            [targetTicket.ticketId]
        );
        const tktRes = await db.execute(
            `SELECT STATUS FROM TICKETS WHERE TICKET_ID = ?`,
            [targetTicket.ticketId]
        );
        const s2Pass = ciRes.rows.length === 1 && ciRes.rows[0].STATUS === 'COMPLETED' && tktRes.rows[0]?.STATUS === 'CHECKED_IN';
        recordResult(2, 'Check-In Record Saved Permanently in MySQL', s2Pass, `CheckIn Rows=${ciRes.rows.length}, TicketStatus=${tktRes.rows[0]?.STATUS}, Code=${ciRes.rows[0]?.BOARDING_PASS_CODE}`);

        // SCENARIO 3: Boarding Pass preview displays correct details
        const bp = s1Res.body.data?.boardingPass;
        const s3Pass = bp && 
            bp.flightNumber && 
            bp.origin && 
            bp.destination && 
            bp.demoNotice && 
            bp.demoNotice.includes('DIGITAL DEMO BOARDING-PASS PREVIEW');
        recordResult(3, 'Digital Boarding Pass Preview with Required Demo Notice', s3Pass, `PNR=${bp?.pnr}, Gate=${bp?.gateNumber}, Notice="${bp?.demoNotice?.slice(0, 35)}..."`);

        // SCENARIO 4: Passenger cannot check in for another passenger's booking (403 Forbidden)
        const otherRes = await db.execute(
            `SELECT t.TICKET_ID, b.USER_ID 
             FROM TICKETS t 
             JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID 
             WHERE b.USER_ID != ? AND t.STATUS = 'ISSUED' LIMIT 1`,
            [passengerAuth.user.userId]
        );
        let s4Pass = false;
        let s4Details = '';
        if (otherRes.rows.length > 0) {
            const foreignTicketId = otherRes.rows[0].TICKET_ID;
            const foreignRes = await request('POST', '/checkin', {
                ticketId: foreignTicketId,
                seatNumber: '12B',
                safetyDeclaration: true
            }, passengerAuth.token);
            s4Pass = foreignRes.status === 403;
            s4Details = `Status=${foreignRes.status}, Message="${foreignRes.body.message}"`;
        } else {
            const bAdmRef = 'AFR' + Math.floor(1000 + Math.random() * 9000);
            const tAdmNum = 'TKTAFR' + Math.floor(100000 + Math.random() * 900000);
            const bAdm = await db.execute(
                `INSERT INTO BOOKINGS (USER_ID, BOOKING_REFERENCE, TOTAL_AMOUNT, STATUS) 
                 VALUES (?, ?, 3000.00, 'CONFIRMED')`,
                [adminAuth.user.userId, bAdmRef]
            );
            const tAdm = await db.execute(
                `INSERT INTO TICKETS (BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS, TICKET_NUMBER) 
                 VALUES (?, 1, 1, '04A', 'BUSINESS', 3000.00, 'ISSUED', ?)`,
                [bAdm.insertId, tAdmNum]
            );
            const foreignRes = await request('POST', '/checkin', {
                ticketId: tAdm.insertId,
                seatNumber: '04A',
                safetyDeclaration: true
            }, passengerAuth.token);
            s4Pass = foreignRes.status === 403;
            s4Details = `Status=${foreignRes.status}, Message="${foreignRes.body.message}"`;
        }
        recordResult(4, 'Foreign Booking Rejection (RBAC Privacy)', s4Pass, s4Details);

        // SCENARIO 5: Duplicate check-in is rejected (409 Conflict)
        const dupRes = await request('POST', '/checkin', {
            ticketId: targetTicket.ticketId,
            seatNumber: targetTicket.seatNumber,
            safetyDeclaration: true
        }, passengerAuth.token);
        const s5Pass = dupRes.status === 409;
        recordResult(5, 'Duplicate Check-In Rejection', s5Pass, `Status=${dupRes.status}, Message="${dupRes.body.message}"`);

        // SCENARIO 6: Cancelled booking is rejected (400 Bad Request)
        const cancBRes = await db.execute(
            `SELECT t.TICKET_ID FROM TICKETS t 
             JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID 
             WHERE b.USER_ID = ? AND b.STATUS = 'CANCELLED' LIMIT 1`,
            [passengerAuth.user.userId]
        );
        let cancTicketId = cancBRes.rows[0]?.TICKET_ID;
        if (!cancTicketId) {
            const bCancRef6 = 'CBK' + Math.floor(1000 + Math.random() * 9000);
            const tCancNum6 = 'TKTCB' + Math.floor(100000 + Math.random() * 900000);
            const bIns = await db.execute(
                `INSERT INTO BOOKINGS (USER_ID, BOOKING_REFERENCE, TOTAL_AMOUNT, STATUS) 
                 VALUES (?, ?, 5000.00, 'CANCELLED')`,
                [passengerAuth.user.userId, bCancRef6]
            );
            const tIns = await db.execute(
                `INSERT INTO TICKETS (BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS, TICKET_NUMBER) 
                 VALUES (?, ?, 1, '22B', 'ECONOMY', 5000.00, 'CANCELLED', ?)`,
                [bIns.insertId, targetTicket.flightInstanceId || 1, tCancNum6]
            );
            cancTicketId = tIns.insertId;
        }
        const cancRes = await request('POST', '/checkin', {
            ticketId: cancTicketId,
            seatNumber: '22B',
            safetyDeclaration: true
        }, passengerAuth.token);
        const s6Pass = cancRes.status === 400 && cancRes.body.message.toLowerCase().includes('cancelled');
        recordResult(6, 'Cancelled Booking / Ticket Check-In Rejection', s6Pass, `Status=${cancRes.status}, Message="${cancRes.body.message}"`);

        // SCENARIO 7: Cancelled flight is rejected (400 Bad Request)
        const fiCancRes = await db.execute(`SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES WHERE STATUS = 'CANCELLED' LIMIT 1`);
        const cancFiId = fiCancRes.rows[0].FLIGHT_INSTANCE_ID;
        const bCancRef = 'CFL' + Math.floor(1000 + Math.random() * 9000);
        const tCancNum = 'TKTC' + Math.floor(100000 + Math.random() * 900000);
        const tCancSeat = '8' + Math.floor(1 + Math.random() * 9) + 'A';
        const bCanc = await db.execute(
            `INSERT INTO BOOKINGS (USER_ID, BOOKING_REFERENCE, TOTAL_AMOUNT, STATUS) VALUES (?, ?, 4500.00, 'CONFIRMED')`,
            [passengerAuth.user.userId, bCancRef]
        );
        const tCanc = await db.execute(
            `INSERT INTO TICKETS (BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS, TICKET_NUMBER) 
             VALUES (?, ?, 1, ?, 'ECONOMY', 4500.00, 'ISSUED', ?)`,
            [bCanc.insertId, cancFiId, tCancSeat, tCancNum]
        );
        const cancFRes = await request('POST', '/checkin', {
            ticketId: tCanc.insertId,
            seatNumber: tCancSeat,
            safetyDeclaration: true
        }, passengerAuth.token);
        const s7Pass = cancFRes.status === 400 && cancFRes.body.message.toLowerCase().includes('flight');
        recordResult(7, 'Cancelled Flight Check-In Rejection', s7Pass, `Status=${cancFRes.status}, Message="${cancFRes.body.message}"`);

        // SCENARIO 8: Departed flight is rejected (400 Bad Request)
        let depFiRes = await db.execute(`SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES WHERE STATUS = 'DEPARTED' LIMIT 1`);
        let depFiId = depFiRes.rows[0]?.FLIGHT_INSTANCE_ID;
        let restoredFiStatus = null;
        if (!depFiId) {
            const pickRes = await db.execute(`SELECT FLIGHT_INSTANCE_ID, STATUS FROM FLIGHT_INSTANCES WHERE FLIGHT_INSTANCE_ID = 6`);
            depFiId = pickRes.rows[0].FLIGHT_INSTANCE_ID;
            restoredFiStatus = pickRes.rows[0].STATUS;
            await db.execute(`UPDATE FLIGHT_INSTANCES SET STATUS = 'DEPARTED' WHERE FLIGHT_INSTANCE_ID = ?`, [depFiId]);
        }
        const bDepRef = 'DFL' + Math.floor(1000 + Math.random() * 9000);
        const tDepNum = 'TKTD' + Math.floor(100000 + Math.random() * 900000);
        const tDepSeat = '8' + Math.floor(1 + Math.random() * 9) + 'B';
        const bDep = await db.execute(
            `INSERT INTO BOOKINGS (USER_ID, BOOKING_REFERENCE, TOTAL_AMOUNT, STATUS) VALUES (?, ?, 4500.00, 'CONFIRMED')`,
            [passengerAuth.user.userId, bDepRef]
        );
        const tDep = await db.execute(
            `INSERT INTO TICKETS (BOOKING_ID, FLIGHT_INSTANCE_ID, PASSENGER_ID, SEAT_NUMBER, CABIN_CLASS, PRICE, STATUS, TICKET_NUMBER) 
             VALUES (?, ?, 1, ?, 'ECONOMY', 4500.00, 'ISSUED', ?)`,
            [bDep.insertId, depFiId, tDepSeat, tDepNum]
        );
        const depFRes = await request('POST', '/checkin', {
            ticketId: tDep.insertId,
            seatNumber: tDepSeat,
            safetyDeclaration: true
        }, passengerAuth.token);
        if (restoredFiStatus) {
            await db.execute(`UPDATE FLIGHT_INSTANCES SET STATUS = ? WHERE FLIGHT_INSTANCE_ID = ?`, [restoredFiStatus, depFiId]);
        }
        const s8Pass = depFRes.status === 400 && depFRes.body.message.toLowerCase().includes('departed');
        recordResult(8, 'Departed Flight Check-In Rejection', s8Pass, `Status=${depFRes.status}, Message="${depFRes.body.message}"`);

        // SCENARIO 9: Invalid PNR or booking reference is rejected
        const invRetRes = await request('GET', '/checkin/retrieve?pnr=INVALID999&surname=Ghost', null, passengerAuth.token);
        const s9Pass = invRetRes.status === 404;
        recordResult(9, 'Invalid PNR / Surname Retrieval Rejection (404)', s9Pass, `Status=${invRetRes.status}, Message="${invRetRes.body.message}"`);

        // SCENARIO 10: Unauthenticated access is rejected (401 Unauthorized)
        const unauthRes = await request('GET', '/checkin/eligible');
        const s10Pass = unauthRes.status === 401;
        recordResult(10, 'Unauthenticated Access Rejection (401)', s10Pass, `Status=${unauthRes.status}, Message="${unauthRes.body.message}"`);

        // SCENARIO 11: Passenger cannot access staff check-in management (403 Forbidden)
        const staffResAsPass = await request('GET', '/checkin/staff/overview', null, passengerAuth.token);
        const s11Pass = staffResAsPass.status === 403;
        recordResult(11, 'Passenger Access to Staff Overview Rejection (403)', s11Pass, `Status=${staffResAsPass.status}, Message="${staffResAsPass.body.message}"`);

        // SCENARIO 12: Authorized staff can view check-in records & telemetry
        const staffResAsAdmin = await request('GET', '/checkin/staff/overview', null, adminAuth.token);
        const staffCheckIns = await request('GET', '/checkin', null, adminAuth.token);
        const s12Pass = staffResAsAdmin.status === 200 && 
            staffResAsAdmin.body.data?.summary && 
            staffResAsAdmin.body.data?.flights?.length > 0 &&
            staffCheckIns.status === 200 &&
            staffCheckIns.body.data?.length > 0;
        recordResult(12, 'Authorized Staff Check-In Monitoring & Telemetry', s12Pass, `Overview Status=${staffResAsAdmin.status}, Flights Tracked=${staffResAsAdmin.body.data?.flights?.length}, Total Checkins=${staffCheckIns.body.data?.length}`);

        // SCENARIO 13: Regression: Flight Search still works
        const searchRes = await request('GET', '/flights/search?origin=DEL&destination=BOM', null, passengerAuth.token);
        const s13Pass = searchRes.status === 200 && Array.isArray(searchRes.body.data);
        recordResult(13, 'Regression: Flight Search Operational', s13Pass, `Status=${searchRes.status}, Flights Returned=${searchRes.body.data?.length}`);

        // SCENARIO 14: Regression: Flight Status still works
        const sampleFlight = await db.execute(`SELECT FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES LIMIT 1`);
        const statusPatch = await request('PATCH', `/flights/${sampleFlight.rows[0].FLIGHT_INSTANCE_ID}/status`, {
            status: 'ON_TIME',
            remarks: 'Task 5 regression check'
        }, adminAuth.token);
        const s14Pass = statusPatch.status === 200 && (statusPatch.body.data?.instance?.status === 'ON_TIME' || statusPatch.body.data?.status === 'ON_TIME');
        recordResult(14, 'Regression: Flight Status Update Operational', s14Pass, `Status=${statusPatch.status}, FlightStatus=${statusPatch.body.data?.instance?.status || statusPatch.body.data?.status}`);

        // SCENARIO 15: Regression: Ticket Booking still works
        const regFlight = await db.execute(
            `SELECT fi.FLIGHT_INSTANCE_ID FROM FLIGHT_INSTANCES fi 
             WHERE fi.STATUS = 'SCHEDULED' LIMIT 1`
        );
        
        // Find unused seat
        const regSeats = await db.execute(
            `SELECT SEAT_NUMBER FROM TICKETS WHERE FLIGHT_INSTANCE_ID = ? AND STATUS != 'CANCELLED'`,
            [regFlight.rows[0].FLIGHT_INSTANCE_ID]
        );
        const regOccupied = new Set(regSeats.rows.map(r => r.SEAT_NUMBER));
        let regSeat = '27F';
        for (let row = 25; row <= 30; row++) {
            for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
                const s = `${row}${col}`;
                if (!regOccupied.has(s)) {
                    regSeat = s;
                    break;
                }
            }
            if (!regOccupied.has(regSeat)) break;
        }

        const regBookingPayload = {
            flightInstanceId: regFlight.rows[0].FLIGHT_INSTANCE_ID,
            cabinClass: 'ECONOMY',
            seatNumber: regSeat,
            passengers: [
                {
                    firstName: 'Regression',
                    lastName: 'Tester',
                    dateOfBirth: '1995-01-01',
                    gender: 'MALE',
                    seatNumber: regSeat,
                    cabinClass: 'ECONOMY'
                }
            ],
            paymentMethod: 'DEBIT_CARD'
        };
        const regBookRes = await request('POST', '/bookings', regBookingPayload, passengerAuth.token);
        const pnrVal = regBookRes.body.data?.booking?.bookingReference || regBookRes.body.data?.bookingReference;
        const s15Pass = regBookRes.status === 201 && !!pnrVal;
        recordResult(15, 'Regression: Ticket Booking Operational', s15Pass, `Status=${regBookRes.status}, PNR=${pnrVal}`);

        // SCENARIO 16: Regression: Passenger booking history still works
        const regHistRes = await request('GET', '/bookings', null, passengerAuth.token);
        const s16Pass = regHistRes.status === 200 && Array.isArray(regHistRes.body.data) && regHistRes.body.data.length > 0;
        recordResult(16, 'Regression: Passenger Booking History Operational', s16Pass, `Status=${regHistRes.status}, Total Bookings=${regHistRes.body.data?.length}`);

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
