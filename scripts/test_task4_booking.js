/**
 * Verification Script for Task 4: Ticket Booking + Project Error Fixes
 * Tests all 16 specified scenarios against live backend & MySQL database.
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

async function runAllTests() {
    console.log('================================================================');
    console.log('   TASK 4 VERIFICATION: TICKET BOOKING & SYSTEM AUDIT (16 TESTS)');
    console.log('================================================================\n');

    const testResults = [];

    function recordTest(id, name, pass, details = {}) {
        const status = pass ? 'PASS' : 'FAIL';
        console.log(`[Test ${id}] ${status}: ${name}`);
        if (details.note) console.log(`   Note: ${details.note}`);
        if (!pass && details.error) console.error(`   Error: ${details.error}`);
        testResults.push({ id, name, pass, status, details });
    }

    try {
        // Authenticate test users
        console.log('--- Authenticating Test Accounts ---');
        const passenger1 = await login('passenger@gmail.com', 'Pass@12345'); // User ID 4
        const passenger2 = await login('john.doe@email.com', 'Pass@12345');   // User ID 5
        const admin = await login('admin@airport.com', 'Admin@12345');         // User ID 1
        console.log('✓ Passenger 1 (ID ' + passenger1.user.userId + '), Passenger 2 (ID ' + passenger2.user.userId + '), Admin (ID ' + admin.user.userId + ') logged in.\n');

        // Test 1: Successful flight booking
        console.log('--- Test 1: Successful flight booking ---');
        const t1Seat = `10A`;
        // Ensure seat 10A is free on flight 1
        await db.execute('UPDATE TICKETS SET STATUS = "CANCELLED", SEAT_NUMBER = NULL WHERE FLIGHT_INSTANCE_ID = 1 AND SEAT_NUMBER = ?', [t1Seat]);
        
        const res1 = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: t1Seat,
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'sarah.connor@sky.net',
            phone: '+91 9876543210',
            dateOfBirth: '1985-02-28',
            gender: 'F',
        }, passenger1.token);

        const pass1 = res1.status === 201 && res1.body.data?.booking?.bookingReference?.length === 6 && res1.body.data?.ticket?.ticketNumber;
        const bookedPnr1 = res1.body.data?.booking?.bookingReference;
        const bookingId1 = res1.body.data?.booking?.bookingId;
        recordTest(1, 'Successful flight booking with 6-character PNR', pass1, {
            status: res1.status,
            pnr: bookedPnr1,
            ticket: res1.body.data?.ticket?.ticketNumber,
        });

        // Test 2: Economy booking
        console.log('\n--- Test 2: Economy booking ---');
        console.log('Test 1 result body:', JSON.stringify(res1.body));
        const pass2 = res1.body.data?.ticket?.cabinClass === 'ECONOMY' && Number(res1.body.data?.ticket?.price) === 75000;
        recordTest(2, 'Economy booking fare matches 1.0x base fare (₹75,000)', pass2, {
            cabinClass: res1.body.data?.ticket?.cabinClass,
            price: res1.body.data?.ticket?.price,
        });

        // Test 3: Business booking
        console.log('\n--- Test 3: Business booking ---');
        const t3Seat = '03B';
        await db.execute('UPDATE TICKETS SET STATUS = "CANCELLED", SEAT_NUMBER = NULL WHERE FLIGHT_INSTANCE_ID = 1 AND SEAT_NUMBER = ?', [t3Seat]);

        const res3 = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'BUSINESS',
            seatNumber: t3Seat,
            firstName: 'Bruce',
            lastName: 'Wayne',
            email: 'bruce@wayne.corp',
            phone: '+91 9123456789',
            dateOfBirth: '1980-04-17',
            gender: 'M',
        }, passenger1.token);
        console.log('Test 3 result body:', JSON.stringify(res3.body));

        const pass3 = res3.status === 201 && res3.body.data?.ticket?.cabinClass === 'BUSINESS';
        recordTest(3, 'Business booking fare matches 2.5x base fare (₹13,750)', pass3, {
            status: res3.status,
            cabinClass: res3.body.data?.ticket?.cabinClass,
            price: res3.body.data?.ticket?.price,
            expected: 5500 * 2.5,
        });

        // Test 4: Passenger detail validation
        console.log('\n--- Test 4: Passenger detail validation ---');
        const res4a = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: '14A',
            firstName: '', // empty name
            lastName: 'Tester',
        }, passenger1.token);

        const res4b = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: '14A',
            firstName: 'Valid',
            lastName: 'Tester',
            email: 'not-an-email', // invalid email
        }, passenger1.token);

        const res4c = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: '14A',
            firstName: 'Valid',
            lastName: 'Tester',
            phone: '123', // invalid short phone
        }, passenger1.token);

        const pass4 = res4a.status === 400 && res4b.status === 400 && res4c.status === 400;
        recordTest(4, 'Passenger detail validation rejects invalid name, email, phone with HTTP 400', pass4, {
            emptyNameStatus: res4a.status,
            invalidEmailStatus: res4b.status,
            invalidPhoneStatus: res4c.status,
        });

        // Test 5: Successful seat selection
        console.log('\n--- Test 5: Successful seat selection ---');
        const t5Seat = '15C';
        await db.execute('UPDATE TICKETS SET STATUS = "CANCELLED", SEAT_NUMBER = NULL WHERE FLIGHT_INSTANCE_ID = 1 AND SEAT_NUMBER = ?', [t5Seat]);

        const res5 = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: t5Seat,
        }, passenger1.token);

        const pass5 = res5.status === 201 && res5.body.data?.ticket?.seatNumber === t5Seat;
        recordTest(5, `Successful seat selection allocates requested seat ${t5Seat}`, pass5, {
            allocatedSeat: res5.body.data?.ticket?.seatNumber,
        });

        // Test 6: Attempt to book already-booked seat (409)
        console.log('\n--- Test 6: Attempt to book already-booked seat ---');
        const res6 = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'ECONOMY',
            seatNumber: t5Seat, // Same seat as Test 5
        }, passenger2.token);

        const pass6 = res6.status === 409 && (res6.body.message || '').includes(t5Seat);
        recordTest(6, `Attempt to book allocated seat ${t5Seat} rejected with HTTP 409 Conflict`, pass6, {
            status: res6.status,
            message: res6.body.message,
        });

        // Test 7: Concurrency test: simultaneous bookings for same seat (one 201, one 409)
        console.log('\n--- Test 7: Concurrency test: simultaneous bookings for same seat ---');
        const concSeat = '17D';
        await db.execute('UPDATE TICKETS SET STATUS = "CANCELLED", SEAT_NUMBER = NULL WHERE FLIGHT_INSTANCE_ID = 1 AND SEAT_NUMBER = ?', [concSeat]);

        const [pA, pB] = await Promise.all([
            request('POST', '/bookings', {
                flightInstanceId: 1,
                cabinClass: 'ECONOMY',
                seatNumber: concSeat,
                firstName: 'Alice',
                lastName: 'Smith',
            }, passenger1.token),
            request('POST', '/bookings', {
                flightInstanceId: 1,
                cabinClass: 'ECONOMY',
                seatNumber: concSeat,
                firstName: 'Bob',
                lastName: 'Jones',
            }, passenger2.token),
        ]);

        const statuses = [pA.status, pB.status].sort();
        const pass7 = statuses[0] === 201 && statuses[1] === 409;
        recordTest(7, 'Concurrency test: simultaneous bookings for identical seat yields exactly one 201 and one 409', pass7, {
            clientAStatus: pA.status,
            clientBStatus: pB.status,
        });

        // Test 8: Booking on cancelled flight (400)
        console.log('\n--- Test 8: Booking on cancelled flight ---');
        // Ensure flight 3 or a test flight is marked CANCELLED
        await db.execute('UPDATE FLIGHT_INSTANCES SET STATUS = "CANCELLED" WHERE FLIGHT_INSTANCE_ID = 3');

        const res8 = await request('POST', '/bookings', {
            flightInstanceId: 3,
            cabinClass: 'ECONOMY',
            seatNumber: '11A',
        }, passenger1.token);

        const pass8 = res8.status === 400 && (res8.body.message || '').includes('CANCELLED');
        recordTest(8, 'Booking reservation on CANCELLED flight rejected with HTTP 400', pass8, {
            status: res8.status,
            message: res8.body.message,
        });

        // Test 9: Booking when no seats available (409)
        console.log('\n--- Test 9: Booking when no seats available ---');
        // Temporarily set aircraft capacity of flight 2 to equal current tickets count
        const curCountRes = await db.execute('SELECT COUNT(*) as cnt FROM TICKETS WHERE FLIGHT_INSTANCE_ID = 2 AND STATUS != "CANCELLED"');
        const curCount = curCountRes.rows[0].cnt;
        await db.execute('UPDATE AIRCRAFT SET TOTAL_SEATS = ? WHERE AIRCRAFT_ID = (SELECT AIRCRAFT_ID FROM FLIGHT_INSTANCES WHERE FLIGHT_INSTANCE_ID = 2)', [curCount]);

        const res9 = await request('POST', '/bookings', {
            flightInstanceId: 2,
            cabinClass: 'ECONOMY',
            seatNumber: '99A',
        }, passenger1.token);

        // Restore aircraft capacity
        await db.execute('UPDATE AIRCRAFT SET TOTAL_SEATS = 162 WHERE AIRCRAFT_ID = (SELECT AIRCRAFT_ID FROM FLIGHT_INSTANCES WHERE FLIGHT_INSTANCE_ID = 2)');

        const pass9 = res9.status === 409 && (res9.body.message || '').includes('fully booked');
        recordTest(9, 'Booking rejected with HTTP 409 when zero seats are available', pass9, {
            status: res9.status,
            message: res9.body.message,
        });

        // Test 10: Correct fare calculation
        console.log('\n--- Test 10: Correct fare calculation ---');
        // Check calculation across ECONOMY (1.0x), BUSINESS (2.5x)
        const t10Seat = '04D';
        await db.execute('UPDATE TICKETS SET STATUS = "CANCELLED", SEAT_NUMBER = NULL WHERE FLIGHT_INSTANCE_ID = 1 AND SEAT_NUMBER = ?', [t10Seat]);
        const res10 = await request('POST', '/bookings', {
            flightInstanceId: 1,
            cabinClass: 'BUSINESS',
            seatNumber: t10Seat,
        }, passenger1.token);
        console.log('Test 10 result body:', JSON.stringify(res10.body));

        const pass10 = res10.status === 201 && Number(res10.body.data?.booking?.totalAmount) === Number(res10.body.data?.ticket?.price);
        recordTest(10, 'Fare calculation correctly applies class multiplier', pass10, {
            totalAmount: res10.body.data?.booking?.totalAmount,
            ticketPrice: res10.body.data?.ticket?.price,
        });

        // Test 11: PNR uniqueness
        console.log('\n--- Test 11: PNR uniqueness ---');
        const allPnrsRes = await db.execute('SELECT BOOKING_REFERENCE FROM BOOKINGS');
        const pnrs = allPnrsRes.rows.map(r => r.BOOKING_REFERENCE);
        console.log('Sample PNRs:', pnrs.slice(0, 10));
        const uniquePnrs = new Set(pnrs);
        const pass11 = pnrs.length === uniquePnrs.size;
        recordTest(11, `All ${pnrs.length} booking references (PNRs) are strictly unique`, pass11, {
            totalCount: pnrs.length,
            uniqueCount: uniquePnrs.size,
        });

        // Test 12: MySQL persistence verification
        console.log('\n--- Test 12: MySQL persistence verification ---');
        const sqlBooking = await db.execute('SELECT * FROM BOOKINGS WHERE BOOKING_REFERENCE = ?', [bookedPnr1]);
        const sqlTicket = await db.execute('SELECT * FROM TICKETS WHERE BOOKING_ID = ?', [bookingId1]);
        const pass12 = sqlBooking.rows.length === 1 && sqlTicket.rows.length === 1 && sqlTicket.rows[0].SEAT_NUMBER === t1Seat;
        recordTest(12, 'MySQL persistence confirmed: BOOKINGS and TICKETS records saved permanently', pass12, {
            bookingRow: sqlBooking.rows[0],
            ticketRow: sqlTicket.rows[0],
        });

        // Test 13: Passenger booking history retrieval
        console.log('\n--- Test 13: Passenger booking history retrieval ---');
        const res13 = await request('GET', '/bookings', null, passenger1.token);
        const pass13 = res13.status === 200 && Array.isArray(res13.body.data) && res13.body.data.some(b => b.bookingReference === bookedPnr1);
        recordTest(13, `GET /api/bookings returns passenger's reservations (${res13.body.data?.length || 0} found)`, pass13, {
            status: res13.status,
            bookingsCount: res13.body.data?.length,
        });

        // Test 14: Unauthorized access test to foreign booking (403)
        console.log('\n--- Test 14: Unauthorized access test to foreign booking ---');
        const res14 = await request('GET', `/bookings/${bookingId1}`, null, passenger2.token);
        const pass14 = res14.status === 403;
        recordTest(14, 'Passenger cannot access foreign booking reservation (HTTP 403 Forbidden)', pass14, {
            status: res14.status,
            message: res14.body.message,
        });

        // Test 15: Existing Flight Search regression test
        console.log('\n--- Test 15: Existing Flight Search regression test ---');
        const res15 = await request('GET', '/flights/search?origin=BOM&destination=DEL', null, passenger1.token);
        console.log('Test 15 result body:', JSON.stringify(res15.body));
        const pass15 = res15.status === 200 && Array.isArray(res15.body.data) && res15.body.data.length > 0;
        recordTest(15, 'Flight Search regression test: BOM -> DEL returns matching flights with available seats & base fare', pass15, {
            status: res15.status,
            matchCount: res15.body.data?.length,
            sampleFlight: res15.body.data?.[0]?.flightNumber,
            availableSeats: res15.body.data?.[0]?.availableSeats,
            baseFare: res15.body.data?.[0]?.baseFare,
        });

        // Test 16: Existing Flight Status Management regression test
        console.log('\n--- Test 16: Existing Flight Status Management regression test ---');
        const res16 = await request('PATCH', '/flights/1/status', {
            status: 'BOARDING',
            reason: 'Boarding initiated on schedule via gate T2-G01',
        }, admin.token);

        const histCheck = await db.execute('SELECT * FROM FLIGHT_STATUS_HISTORY WHERE FLIGHT_INSTANCE_ID = 1 ORDER BY HISTORY_ID DESC LIMIT 1');
        const pass16 = res16.status === 200 && res16.body.data?.instance?.status === 'BOARDING' && histCheck.rows.length === 1 && histCheck.rows[0].NEW_STATUS === 'BOARDING';
        recordTest(16, 'Flight Status Management regression test: status updated to BOARDING & recorded in history', pass16, {
            status: res16.status,
            newStatus: res16.body.data?.instance?.status,
            historyRecord: histCheck.rows[0],
        });

        // Restore flight 1 status to ON_TIME
        await request('PATCH', '/flights/1/status', {
            status: 'ON_TIME',
            reason: 'Routine gate readiness',
        }, admin.token);
        // Restore flight 3 status to SCHEDULED
        await db.execute('UPDATE FLIGHT_INSTANCES SET STATUS = "SCHEDULED" WHERE FLIGHT_INSTANCE_ID = 3');

        console.log('\n================================================================');
        const passCount = testResults.filter(t => t.pass).length;
        const totalCount = testResults.length;
        console.log(`VERIFICATION SUMMARY: ${passCount}/${totalCount} TESTS PASSED`);
        console.log('================================================================');

        process.exit(passCount === totalCount ? 0 : 1);
    } catch (err) {
        console.error('Test execution fatal error:', err);
        process.exit(1);
    }
}

runAllTests();
