/**
 * Comprehensive MySQL Migration Verification Test Suite
 * Tests all 10 mandatory criteria specified in TASK 1.
 */

const mysql = require('mysql2/promise');
const { config } = require('../src/config/environment');
const db = require('../src/services/database.service');
const authService = require('../src/services/auth.service');
const flightService = require('../src/services/flight.service');
const bookingService = require('../src/services/booking.service');
const checkinService = require('../src/services/checkin.service');
const store = require('../src/services/operations.store');

async function runAllTests() {
    console.log('================================================================');
    console.log('ORACLE-TO-MYSQL MIGRATION MANDATORY TEST SUITE');
    console.log('Target Database: ' + config.DB.database);
    console.log('Database Host:   ' + config.DB.host + ':' + config.DB.port);
    console.log('Time:            ' + new Date().toISOString());
    console.log('================================================================\n');

    const results = {};

    // -------------------------------------------------------------
    // TEST 1: MySQL Connection
    // -------------------------------------------------------------
    try {
        const connTest = await db.testConnection();
        if (connTest.healthy) {
            results.test1_connection = {
                status: 'PASS',
                latencyMs: connTest.latencyMs,
                serverTime: connTest.serverTime,
            };
            console.log('[TEST 1: MySQL Connection] PASS');
            console.log('  Server Time: ' + connTest.serverTime + ' (Latency: ' + connTest.latencyMs + 'ms)\n');
        } else {
            throw new Error(connTest.error);
        }
    } catch (err) {
        results.test1_connection = { status: 'FAIL', error: err.message };
        console.error('[TEST 1: MySQL Connection] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 2: Database and all 11 Required Tables
    // -------------------------------------------------------------
    try {
        const requiredTables = [
            'airports', 'airlines', 'gates', 'aircraft', 'flights',
            'flight_instances', 'users', 'passengers', 'employees',
            'bookings', 'tickets'
        ];
        const res = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [config.DB.database]);

        const existingTables = res.rows.map(r => r.TABLE_NAME.toLowerCase());
        const missing = requiredTables.filter(t => !existingTables.includes(t));

        if (missing.length === 0) {
            results.test2_tables = {
                status: 'PASS',
                totalTablesFound: existingTables.length,
                requiredTablesVerified: requiredTables,
            };
            console.log('[TEST 2: Database & 11 Tables] PASS');
            console.log('  Verified: ' + requiredTables.join(', ') + '\n');
        } else {
            throw new Error('Missing tables: ' + missing.join(', '));
        }
    } catch (err) {
        results.test2_tables = { status: 'FAIL', error: err.message };
        console.error('[TEST 2: Database & 11 Tables] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 3: Sample Data Retrieval
    // -------------------------------------------------------------
    try {
        await store.syncWithDatabase();
        const counts = {
            airports: store.airports.length,
            airlines: store.airlines.length,
            aircraft: store.aircraft.length,
            flights: store.flights.length,
            flightInstances: store.flightInstances.length,
            users: (await authService.getAllUsers()).length,
            passengers: store.passengers.length,
            bookings: store.bookings.length,
            tickets: store.tickets.length,
        };

        if (counts.airports > 0 && counts.flights > 0 && counts.bookings > 0) {
            results.test3_sample_data = {
                status: 'PASS',
                counts,
            };
            console.log('[TEST 3: Sample Data Retrieval] PASS');
            console.log('  Record Counts: ' + JSON.stringify(counts) + '\n');
        } else {
            throw new Error('Some tables have 0 rows: ' + JSON.stringify(counts));
        }
    } catch (err) {
        results.test3_sample_data = { status: 'FAIL', error: err.message };
        console.error('[TEST 3: Sample Data Retrieval] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 4: User Authentication (BCrypt + JWT against MySQL)
    // -------------------------------------------------------------
    try {
        const loginRes = await authService.loginUser('admin@airport.com', 'Admin@12345');
        const passLogin = await authService.loginUser('passenger@gmail.com', 'Pass@12345');

        if (loginRes.user && loginRes.token && passLogin.user && passLogin.token) {
            results.test4_authentication = {
                status: 'PASS',
                authenticatedAccounts: [
                    { email: loginRes.user.email, role: loginRes.user.role },
                    { email: passLogin.user.email, role: passLogin.user.role },
                ],
                tokenIssued: true,
            };
            console.log('[TEST 4: User Authentication] PASS');
            console.log('  Admin & Passenger credentials validated against MySQL USERS table\n');
        } else {
            throw new Error('Authentication returned invalid user or token');
        }
    } catch (err) {
        results.test4_authentication = { status: 'FAIL', error: err.message };
        console.error('[TEST 4: User Authentication] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 5: Flight Search
    // -------------------------------------------------------------
    try {
        const allFlights = await flightService.getAllFlights({ origin: 'BOM' }, { role: 'PASSENGER', userId: 4 });
        if (allFlights.length > 0) {
            results.test5_flight_search = {
                status: 'PASS',
                query: { origin: 'BOM' },
                resultsCount: allFlights.length,
                sample: {
                    flightNumber: allFlights[0].flightNumber,
                    route: allFlights[0].originAirport + ' -> ' + allFlights[0].destAirport,
                    status: allFlights[0].status,
                    fare: allFlights[0].baseFare,
                },
            };
            console.log('[TEST 5: Flight Search] PASS');
            console.log('  Found ' + allFlights.length + ' flights matching origin BOM (Sample: ' + allFlights[0].flightNumber + ' ' + allFlights[0].originAirport + '->' + allFlights[0].destAirport + ')\n');
        } else {
            throw new Error('No flights found for origin BOM');
        }
    } catch (err) {
        results.test5_flight_search = { status: 'FAIL', error: err.message };
        console.error('[TEST 5: Flight Search] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 6: Flight Status Update
    // -------------------------------------------------------------
    try {
        const updateRes = await flightService.updateFlightStatus(
            2,
            'DELAYED',
            'Weather holding pattern - 30 min delay',
            1
        );

        // Verify update in MySQL
        const checkRes = await db.execute('SELECT STATUS, REMARKS FROM FLIGHT_INSTANCES WHERE FLIGHT_INSTANCE_ID = ?', [2]);

        if (checkRes && checkRes.rows && checkRes.rows[0].STATUS === 'DELAYED') {
            results.test6_status_update = {
                status: 'PASS',
                flightInstanceId: 2,
                newStatus: checkRes.rows[0].STATUS,
                remarks: checkRes.rows[0].REMARKS,
                historyLogged: updateRes.history ? true : false,
            };
            console.log('[TEST 6: Flight Status Update] PASS');
            console.log('  FlightInstance #2 status transitioned to DELAYED and saved in MySQL\n');
        } else {
            throw new Error('Status not reflected in MySQL FLIGHT_INSTANCES table');
        }
    } catch (err) {
        results.test6_status_update = { status: 'FAIL', error: err.message };
        console.error('[TEST 6: Flight Status Update] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 7: Ticket Booking
    // -------------------------------------------------------------
    let bookedTicket = null;
    let bookedPnr = null;
    const testSeat = `${Math.floor(20 + Math.random() * 20)}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`;
    try {
        const bookingResult = await bookingService.createBooking(
            {
                flightInstanceId: 1,
                cabinClass: 'ECONOMY',
                seatNumber: testSeat,
            },
            { userId: 4, email: 'passenger@gmail.com', role: 'PASSENGER' }
        );

        bookedTicket = bookingResult.ticket;
        bookedPnr = bookingResult.booking.bookingReference;

        // Verify in MySQL
        const bCheck = await db.execute('SELECT * FROM BOOKINGS WHERE BOOKING_REFERENCE = ?', [bookedPnr]);
        const tCheck = await db.execute('SELECT * FROM TICKETS WHERE TICKET_NUMBER = ?', [bookedTicket.ticketNumber]);

        if (bCheck.rows.length > 0 && tCheck.rows.length > 0) {
            results.test7_booking = {
                status: 'PASS',
                pnr: bookedPnr,
                ticketNumber: bookedTicket.ticketNumber,
                seat: bookedTicket.seatNumber,
                amount: bookingResult.booking.totalAmount,
            };
            console.log('[TEST 7: Ticket Booking] PASS');
            console.log('  Booking created with PNR: ' + bookedPnr + ', Ticket: ' + bookedTicket.ticketNumber + ', Seat: ' + bookedTicket.seatNumber + '\n');
        } else {
            throw new Error('Booking or Ticket not found in MySQL tables');
        }
    } catch (err) {
        results.test7_booking = { status: 'FAIL', error: err.message };
        console.error('[TEST 7: Ticket Booking] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 8: Duplicate Seat Prevention
    // -------------------------------------------------------------
    try {
        let duplicateCaught = false;
        try {
            await bookingService.createBooking(
                {
                    flightInstanceId: 1,
                    cabinClass: 'ECONOMY',
                    seatNumber: testSeat, // Already booked in Test 7!
                },
                { userId: 5, email: 'john.doe@email.com', role: 'PASSENGER' }
            );
        } catch (dupErr) {
            if (dupErr.message && dupErr.message.includes('already been allocated')) {
                duplicateCaught = true;
            } else {
                throw dupErr;
            }
        }

        if (duplicateCaught) {
            results.test8_duplicate_seat = {
                status: 'PASS',
                message: `Duplicate seat ${testSeat} correctly rejected with HTTP 409 conflict.`,
            };
            console.log('[TEST 8: Duplicate Seat Prevention] PASS');
            console.log(`  Conflict detected and duplicate seat ${testSeat} rejected cleanly\n`);
        } else {
            throw new Error(`Duplicate seat ${testSeat} was allowed! Prevention failed.`);
        }
    } catch (err) {
        results.test8_duplicate_seat = { status: 'FAIL', error: err.message };
        console.error('[TEST 8: Duplicate Seat Prevention] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 9: Online Web Check-In
    // -------------------------------------------------------------
    let boardingPassCode = null;
    try {
        if (!bookedTicket) throw new Error('Cannot run Check-In without prior booked ticket');

        const checkInRes = await checkinService.processCheckIn(
            {
                ticketId: bookedTicket.ticketId,
                seatNumber: testSeat,
            },
            { userId: 4, email: 'passenger@gmail.com', role: 'PASSENGER' }
        );

        boardingPassCode = checkInRes.checkIn.boardingPassCode;

        // Verify in MySQL CHECK_IN table
        const chkVerify = await db.execute('SELECT * FROM CHECK_IN WHERE BOARDING_PASS_CODE = ?', [boardingPassCode]);

        if (chkVerify.rows.length > 0) {
            results.test9_checkin = {
                status: 'PASS',
                boardingPassCode,
                ticketId: bookedTicket.ticketId,
                checkInTime: checkInRes.checkIn.checkInTime,
            };
            console.log('[TEST 9: Online Web Check-In] PASS');
            console.log('  Web Check-In completed! Boarding Pass Code: ' + boardingPassCode + '\n');
        } else {
            throw new Error('Check-In record not found in MySQL CHECK_IN table');
        }
    } catch (err) {
        results.test9_checkin = { status: 'FAIL', error: err.message };
        console.error('[TEST 9: Online Web Check-In] FAIL: ' + err.message + '\n');
    }

    // -------------------------------------------------------------
    // TEST 10: Boarding Pass Retrieval
    // -------------------------------------------------------------
    try {
        const checkins = await checkinService.getAllCheckIns({ userId: 4, role: 'PASSENGER' });
        const myPass = checkins.find(c => c.boardingPassCode === boardingPassCode);

        if (myPass) {
            results.test10_boarding_pass = {
                status: 'PASS',
                boardingPassCode: myPass.boardingPassCode,
                passengerName: myPass.passengerName,
                flightNumber: myPass.flightNumber,
                route: myPass.origin + ' -> ' + myPass.destination,
                seat: myPass.seatNumber,
                gate: myPass.gate,
            };
            console.log('[TEST 10: Boarding Pass Retrieval] PASS');
            console.log('  Boarding Pass retrieved: ' + myPass.boardingPassCode + ' (' + myPass.flightNumber + ', Seat ' + myPass.seatNumber + ', Gate ' + myPass.gate + ')\n');
        } else {
            throw new Error('Issued boarding pass could not be retrieved from MySQL');
        }
    } catch (err) {
        results.test10_boarding_pass = { status: 'FAIL', error: err.message };
        console.error('[TEST 10: Boarding Pass Retrieval] FAIL: ' + err.message + '\n');
    }

    console.log('================================================================');
    console.log('ALL MANDATORY TESTS EXECUTED. SUMMARY:');
    let passCount = 0;
    for (const [tName, tRes] of Object.entries(results)) {
        console.log(`- ${tName}: ${tRes.status}`);
        if (tRes.status === 'PASS') passCount++;
    }
    console.log(`Score: ${passCount} / 10 Tests Passed`);
    console.log('================================================================');

    await db.testConnection();
    process.exit(passCount === 10 ? 0 : 1);
}

runAllTests().catch(e => {
    console.error('Test execution fatal error:', e);
    process.exit(1);
});
