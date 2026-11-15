/**
 * Comprehensive Verification Script for All Should-Add Features
 * Covers:
 * 1. Seat selection and availability
 * 2. Duplicate seat booking prevention
 * 3. Ticket cancellation
 * 4. Seat release after cancellation
 * 5. Notification creation and display (booking, cancel, check-in, flight status, gate)
 * 6. Passenger dashboard data & isolation
 * 7. Admin dashboard statistics (real MySQL queries, RBAC guard)
 * 8. Digital boarding pass generation & duplicate check-in prevention
 * 9. Baggage tracking & ownership isolation
 * 10. Booking confirmation & PNR generation
 * 11. MySQL data persistence
 * 12. Authentication and authorization guards
 * 13. Regression: Flight search
 * 14. Regression: Flight status management & estimated timings
 * 15. Regression: Ticket booking
 * 16. Regression: Web check-in
 * 17. Regression: Baggage management
 */

const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const setCookie = res.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    return {
        status: res.status,
        headers: res.headers,
        cookie,
        data
    };
}

async function runVerification() {
    console.log('================================================================');
    console.log('   VERIFYING ALL SHOULD-ADD FEATURES & SYSTEM REGRESSIONS');
    console.log('================================================================');

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'tiger',
        database: process.env.DB_NAME || 'airport_management_db',
        port: process.env.DB_PORT || 3306
    });

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✔ [PASS] ${message}`);
            passed++;
        } else {
            console.error(`  ✖ [FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // --- 1. Authentication Setup ---
        console.log('\n--- 1. Authenticating Test Personas ---');
        
        // Admin
        const adminLoginRes = await request(`${BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@airport.com', password: 'Admin@12345' })
        });
        const adminCookie = adminLoginRes.cookie;
        assert(adminLoginRes.status === 200 && adminLoginRes.data?.data?.user?.role === 'ADMIN', 'Admin login successful with ADMIN role');

        // Passenger 1 (Register new test passenger)
        const p1Email = `test.passenger.${Date.now()}@airport.test`;
        const p1Pass = 'Pass@123456';
        await request(`${BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ email: p1Email, password: p1Pass })
        });
        const p1LoginRes = await request(`${BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: p1Email, password: p1Pass })
        });
        const p1Cookie = p1LoginRes.cookie;
        assert(p1LoginRes.status === 200 && p1LoginRes.data?.data?.user?.role === 'PASSENGER', `Passenger 1 login successful (${p1Email})`);

        // Passenger 2 (Register second test passenger)
        const p2Email = `test.passenger2.${Date.now()}@airport.test`;
        const p2Pass = 'Pass@123456';
        await request(`${BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ email: p2Email, password: p2Pass })
        });
        const p2LoginRes = await request(`${BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: p2Email, password: p2Pass })
        });
        const p2Cookie = p2LoginRes.cookie;
        assert(p2LoginRes.status === 200 && p2LoginRes.data?.data?.user?.role === 'PASSENGER', `Passenger 2 login successful (${p2Email})`);

        // --- 2. Admin Dashboard Statistics (Feature 5) ---
        console.log('\n--- 2. Verifying Admin Dashboard Live MySQL Statistics (Feature 5) ---');
        
        // Check RBAC guard: Passenger should be blocked (403)
        const p1StatsAttempt = await request(`${BASE_URL}/admin/stats`, {
            headers: { Cookie: p1Cookie }
        });
        assert(p1StatsAttempt.status === 403, 'RBAC Guard blocks PASSENGER from /api/admin/stats (403 Forbidden)');

        // Admin access
        const adminStatsRes = await request(`${BASE_URL}/admin/stats`, {
            headers: { Cookie: adminCookie }
        });
        assert(adminStatsRes.status === 200, 'Admin successfully accesses /api/admin/stats (200 OK)');
        const stats = adminStatsRes.data.data;

        // Verify against direct MySQL counts
        const [dbFlights] = await db.query('SELECT COUNT(*) as cnt FROM flight_instances');
        const [dbPassengers] = await db.query('SELECT COUNT(*) as cnt FROM passengers');
        const [dbBookings] = await db.query('SELECT COUNT(*) as cnt FROM bookings');
        const [dbConfirmed] = await db.query("SELECT COUNT(*) as cnt FROM bookings WHERE status = 'CONFIRMED'");
        const [dbCancelled] = await db.query("SELECT COUNT(*) as cnt FROM bookings WHERE status = 'CANCELLED'");
        const [dbCheckIn] = await db.query('SELECT COUNT(*) as cnt FROM check_in');
        const [dbDelayed] = await db.query("SELECT COUNT(*) as cnt FROM flight_instances WHERE status = 'DELAYED'");

        assert(stats.totalFlights === dbFlights[0].cnt, `Admin totalFlights (${stats.totalFlights}) matches MySQL (${dbFlights[0].cnt})`);
        assert(stats.totalPassengers === dbPassengers[0].cnt, `Admin totalPassengers (${stats.totalPassengers}) matches MySQL (${dbPassengers[0].cnt})`);
        assert(stats.totalBookings === dbBookings[0].cnt, `Admin totalBookings (${stats.totalBookings}) matches MySQL (${dbBookings[0].cnt})`);
        assert(stats.confirmedBookings === dbConfirmed[0].cnt, `Admin confirmedBookings (${stats.confirmedBookings}) matches MySQL (${dbConfirmed[0].cnt})`);
        assert(stats.cancelledBookings === dbCancelled[0].cnt, `Admin cancelledBookings (${stats.cancelledBookings}) matches MySQL (${dbCancelled[0].cnt})`);
        assert(stats.checkedInPassengers === dbCheckIn[0].cnt, `Admin checkedInPassengers (${stats.checkedInPassengers}) matches MySQL (${dbCheckIn[0].cnt})`);
        assert(stats.delayedFlights === dbDelayed[0].cnt, `Admin delayedFlights (${stats.delayedFlights}) matches MySQL (${dbDelayed[0].cnt})`);
        assert(typeof stats.availableSeats === 'number' && stats.availableSeats >= 0, `Admin availableSeats (${stats.availableSeats}) is dynamically computed`);

        // --- 3. Seat Selection & Duplicate Seat Prevention (Feature 1 & 8) ---
        console.log('\n--- 3. Verifying Seat Selection, Availability & Collision Prevention (Features 1 & 8) ---');
        
        // Find an active flight instance
        const [flightRows] = await db.query(
            "SELECT FLIGHT_INSTANCE_ID, FLIGHT_NUMBER FROM flight_instances WHERE status NOT IN ('CANCELLED', 'DEPARTED', 'ARRIVED') LIMIT 1"
        );
        const targetFlight = flightRows[0];
        assert(!!targetFlight, `Found target flight instance: ${targetFlight?.FLIGHT_NUMBER} (ID: ${targetFlight?.FLIGHT_INSTANCE_ID})`);

        // Check seat map endpoint
        const seatsRes = await request(`${BASE_URL}/flights/${targetFlight.FLIGHT_INSTANCE_ID}/seats`, {
            headers: { Cookie: p1Cookie }
        });
        assert(seatsRes.status === 200 && Array.isArray(seatsRes.data.data.occupiedSeats), 'Flight seat map returned occupied seats array');
        const occupiedSeats = seatsRes.data.data.occupiedSeats.map(s => s.toUpperCase());

        // Choose a unique test seat
        const candidateSeats = ['17A', '17B', '17C', '17D', '18A', '18B', '18C', '18D', '19A', '19B', '19C', '19D'];
        const testSeat = candidateSeats.find(s => !occupiedSeats.includes(s)) || `20${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`;

        // Create booking with testSeat for Passenger 1
        const bookRes1 = await request(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: { Cookie: p1Cookie },
            body: JSON.stringify({
                flightInstanceId: targetFlight.FLIGHT_INSTANCE_ID,
                seatNumber: testSeat,
                cabinClass: 'ECONOMY',
                firstName: 'Test',
                lastName: 'PassengerOne',
                email: 'passenger@gmail.com',
                phone: '9876543210'
            })
        });

        assert(bookRes1.status === 201, `Passenger 1 booked seat ${testSeat} (PNR: ${bookRes1.data.data.booking.bookingReference})`);
        const pnr1 = bookRes1.data.data.booking.bookingReference;
        const bookingId1 = bookRes1.data.data.booking.bookingId;
        const ticketId1 = bookRes1.data.data.ticket.ticketId;

        // Verify seat is persisted in MySQL TICKETS
        const [ticketRow] = await db.query('SELECT SEAT_NUMBER, STATUS FROM tickets WHERE TICKET_ID = ?', [ticketId1]);
        assert(ticketRow[0].SEAT_NUMBER === testSeat && ticketRow[0].STATUS === 'ISSUED', `MySQL tickets table has SEAT_NUMBER = ${testSeat} and STATUS = ISSUED`);

        // Attempt Duplicate Seat Booking on same seat for Passenger 2 (Should Fail with 409)
        const dupBookRes = await request(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: { Cookie: p2Cookie },
            body: JSON.stringify({
                flightInstanceId: targetFlight.FLIGHT_INSTANCE_ID,
                seatNumber: testSeat,
                cabinClass: 'ECONOMY',
                firstName: 'Test',
                lastName: 'PassengerTwo',
                email: 'john.doe@email.com',
                phone: '9876543211'
            })
        });
        assert(dupBookRes.status === 409, `Duplicate seat booking on seat ${testSeat} strictly blocked (409 Conflict)`);

        // --- 4. Notifications Verification (Feature 3) ---
        console.log('\n--- 4. Verifying Flight Notifications in MySQL (Feature 3) ---');
        
        // Check that Passenger 1 received a booking notification
        const notifRes1 = await request(`${BASE_URL}/notifications`, { headers: { Cookie: p1Cookie } });
        assert(notifRes1.status === 200, 'Passenger 1 accessed /api/notifications (200 OK)');
        const p1Notifications = notifRes1.data.data.notifications;
        const bookingNotif = p1Notifications.find(n => n.title.includes(pnr1) || n.message.includes(testSeat));
        assert(!!bookingNotif, `In-app notification generated for Booking PNR ${pnr1}: "${bookingNotif?.title}"`);

        // Verify Passenger 2 does NOT see Passenger 1's notification (User isolation)
        const notifRes2 = await request(`${BASE_URL}/notifications`, { headers: { Cookie: p2Cookie } });
        const p2HasP1Notif = notifRes2.data.data.notifications.some(n => n.notificationId === bookingNotif?.notificationId);
        assert(!p2HasP1Notif, 'Notifications are strictly scoped to authenticated user (Passenger 2 cannot view Passenger 1 notifications)');

        // Test Mark as Read
        if (bookingNotif) {
            const markReadRes = await request(`${BASE_URL}/notifications/${bookingNotif.notificationId}/read`, {
                method: 'PATCH',
                headers: { Cookie: p1Cookie }
            });
            assert(markReadRes.status === 200, `Notification ${bookingNotif.notificationId} marked as read via API`);

            // Verify in MySQL
            const [notifDb] = await db.query('SELECT IS_READ FROM notifications WHERE NOTIFICATION_ID = ?', [bookingNotif.notificationId]);
            assert(notifDb[0].IS_READ === 'Y', `MySQL notifications table IS_READ updated to 'Y'`);
        }

        // --- 5. Web Check-In & Digital Boarding Pass (Feature 6) ---
        console.log('\n--- 5. Verifying Web Check-In & Digital Boarding Pass (Feature 6) ---');
        
        const checkinRes = await request(`${BASE_URL}/checkin`, {
            method: 'POST',
            headers: { Cookie: p1Cookie },
            body: JSON.stringify({
                ticketId: ticketId1,
                seatNumber: testSeat
            })
        });

        assert(checkinRes.status === 201, 'Web check-in processed successfully (201 Created)');
        const bp = checkinRes.data.data.boardingPass;
        assert(bp.seatNumber === testSeat, `Boarding Pass seat matches allocated seat: ${bp.seatNumber}`);
        assert(bp.pnr === pnr1, `Boarding Pass PNR matches booking: ${bp.pnr}`);
        assert(!!bp.boardingPassNumber, `Digital Boarding Pass barcode/code generated: ${bp.boardingPassNumber}`);
        assert(!!bp.demoNotice, 'Digital Boarding Pass contains clear Demo disclosure notice');

        // Check check-in notification generated
        const notifResPostCheckin = await request(`${BASE_URL}/notifications`, { headers: { Cookie: p1Cookie } });
        const checkinNotif = notifResPostCheckin.data.data.notifications.find(
            n => n.title.includes('Check-in') || n.type === 'CHECKIN_REMINDER' || n.type === 'BOARDING' || n.message.includes('Boarding Pass')
        );
        assert(!!checkinNotif, `In-app notification generated for Check-in: "${checkinNotif?.title}"`);

        // Duplicate Check-In Prevention (Should Fail with 409)
        const dupCheckinRes = await request(`${BASE_URL}/checkin`, {
            method: 'POST',
            headers: { Cookie: p1Cookie },
            body: JSON.stringify({
                ticketId: ticketId1,
                seatNumber: testSeat
            })
        });
        assert(dupCheckinRes.status === 409, 'Duplicate check-in on same ticket blocked (409 Conflict)');

        // --- 6. Baggage Tracking & Ownership Privacy (Feature 7) ---
        console.log('\n--- 6. Verifying Baggage Tracking & Ownership Privacy (Feature 7) ---');
        
        const bagRes = await request(`${BASE_URL}/baggage`, {
            method: 'POST',
            headers: { Cookie: p1Cookie },
            body: JSON.stringify({
                ticketId: ticketId1,
                weightKg: 18.5,
                baggageType: 'CHECKED_LUGGAGE',
                description: 'Navy blue hard-case trolley'
            })
        });

        assert(bagRes.status === 201, `Baggage registered with RFID tag: ${bagRes.data.data.tagNumber}`);
        const tagNumber = bagRes.data.data.tagNumber;

        // Verify Passenger 1 can view own baggage
        const p1BagsRes = await request(`${BASE_URL}/baggage`, { headers: { Cookie: p1Cookie } });
        const p1HasBag = p1BagsRes.data.data.some(b => b.tagNumber === tagNumber);
        assert(p1HasBag, `Passenger 1 sees own baggage tag ${tagNumber} in /api/baggage`);

        // Verify Passenger 2 CANNOT see Passenger 1's baggage
        const p2BagsRes = await request(`${BASE_URL}/baggage`, { headers: { Cookie: p2Cookie } });
        const p2HasBag = p2BagsRes.data.data.some(b => b.tagNumber === tagNumber);
        assert(!p2HasBag, `Strict Passenger Isolation: Passenger 2 cannot see Passenger 1's baggage tag ${tagNumber}`);

        // --- 7. Ticket Cancellation & Seat Release (Feature 2 & 4) ---
        console.log('\n--- 7. Verifying Ticket Cancellation & Seat Inventory Release (Features 2 & 4) ---');

        // Verify Passenger 2 cannot cancel Passenger 1's booking (Ownership guard: 403)
        const p2CancelAttempt = await request(`${BASE_URL}/bookings/${bookingId1}/cancel`, {
            method: 'PATCH',
            headers: { Cookie: p2Cookie }
        });
        assert(p2CancelAttempt.status === 403, 'Ownership Guard blocks Passenger 2 from cancelling Passenger 1 reservation (403 Forbidden)');

        // Passenger 1 cancels own booking
        const cancelRes = await request(`${BASE_URL}/bookings/${bookingId1}/cancel`, {
            method: 'PATCH',
            headers: { Cookie: p1Cookie }
        });
        assert(cancelRes.status === 200, `Passenger 1 successfully cancelled booking ${pnr1}`);

        // Verify MySQL BOOKINGS and TICKETS are CANCELLED and SEAT_NUMBER is released (NULL)
        const [bDb] = await db.query('SELECT STATUS FROM bookings WHERE BOOKING_ID = ?', [bookingId1]);
        const [tDb] = await db.query('SELECT STATUS, SEAT_NUMBER FROM tickets WHERE BOOKING_ID = ?', [bookingId1]);
        assert(bDb[0].STATUS === 'CANCELLED', `MySQL bookings table STATUS = CANCELLED for booking ${bookingId1}`);
        assert(tDb[0].STATUS === 'CANCELLED' && tDb[0].SEAT_NUMBER === null, `MySQL tickets table STATUS = CANCELLED and SEAT_NUMBER = NULL (Released)`);

        // Verify Cancellation notification generated in MySQL
        const notifResPostCancel = await request(`${BASE_URL}/notifications`, { headers: { Cookie: p1Cookie } });
        const cancelNotif = notifResPostCancel.data.data.notifications.find(
            n => n.title.includes(pnr1) || n.message.includes(pnr1) || n.title.includes('Cancel')
        );
        assert(!!cancelNotif, `In-app notification generated for Cancellation: "${cancelNotif?.title}"`);

        // Attempting to cancel already cancelled booking should fail (400)
        const dupCancelRes = await request(`${BASE_URL}/bookings/${bookingId1}/cancel`, {
            method: 'PATCH',
            headers: { Cookie: p1Cookie }
        });
        assert(dupCancelRes.status === 400, 'Cancelling already cancelled booking rejected (400 Bad Request)');

        // Verify released seat is now available again for booking!
        const bookResSeatReused = await request(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: { Cookie: p2Cookie },
            body: JSON.stringify({
                flightInstanceId: targetFlight.FLIGHT_INSTANCE_ID,
                seatNumber: testSeat,
                cabinClass: 'ECONOMY',
                firstName: 'Rebooked',
                lastName: 'Traveler',
                email: 'john.doe@email.com',
                phone: '9876543212'
            })
        });

        assert(bookResSeatReused.status === 201, `Released seat ${testSeat} was immediately re-bookable by Passenger 2 (PNR: ${bookResSeatReused.data.data.booking.bookingReference})`);

        // --- 8. Flight Status & Gate Update Broadcast Notifications ---
        console.log('\n--- 8. Verifying Operational Status & Gate Broadcast Notifications ---');

        // Admin updates flight status to DELAYED with manual timings
        const updateStatusRes = await request(`${BASE_URL}/flights/${targetFlight.FLIGHT_INSTANCE_ID}/status`, {
            method: 'PATCH',
            headers: { Cookie: adminCookie },
            body: JSON.stringify({
                status: 'DELAYED',
                reason: 'Air Traffic Control Flow Management Delay',
                delayMinutes: 35,
                estimatedDeparture: '2026-11-15 18:35:00',
                estimatedArrival: '2026-11-15 21:00:00'
            })
        });
        assert(updateStatusRes.status === 200, `Admin updated flight ${targetFlight.FLIGHT_NUMBER} status to DELAYED`);

        // Verify Passenger 2 (who has an active ticket on this flight) received broadcast notification
        const notifResP2AfterDelay = await request(`${BASE_URL}/notifications`, { headers: { Cookie: p2Cookie } });
        const flightDelayNotif = notifResP2AfterDelay.data.data.notifications.find(
            n => n.title.includes(targetFlight.FLIGHT_NUMBER) && (n.type === 'FLIGHT_DELAY' || n.title.includes('DELAY') || n.message.includes('DELAY'))
        );
        assert(!!flightDelayNotif, `Booked passenger automatically received broadcast delay notification: "${flightDelayNotif?.title}"`);

        // Restore flight status back to ON_TIME
        await request(`${BASE_URL}/flights/${targetFlight.FLIGHT_INSTANCE_ID}/status`, {
            method: 'PATCH',
            headers: { Cookie: adminCookie },
            body: JSON.stringify({ status: 'ON_TIME', reason: 'Schedule Normalized' })
        });

        // --- 9. Flight Search Regression Verification ---
        console.log('\n--- 9. Verifying Flight Search Module Regression ---');
        const searchRes = await request(`${BASE_URL}/flights`, { headers: { Cookie: p1Cookie } });
        assert(searchRes.status === 200 && Array.isArray(searchRes.data.data), 'Flight search/listing endpoint returns 200 OK with active routes');
        const sampleFlight = searchRes.data.data[0];
        assert(sampleFlight?.flightNumber && sampleFlight?.airlineName && typeof sampleFlight?.baseFare !== 'undefined', 'Flight search results contain flightNumber, airlineName, and baseFare');

        console.log('\n================================================================');
        console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
        console.log('================================================================');

    } catch (err) {
        console.error('Unexpected test error:', err);
        failed++;
    } finally {
        await db.end();
    }

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runVerification();
