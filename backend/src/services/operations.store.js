/**
 * Airport Operations Engine & Data Access Layer
 * Provides relational persistence matching the MySQL 8.0 schema.
 * Synchronizes real-time state with the MySQL database tables.
 */

const db = require('./database.service');

const store = {
    airports: [],
    airlines: [],
    aircraft: [],
    gates: [],
    flights: [],
    flightInstances: [],
    passengers: [],
    employees: [],
    bookings: [],
    tickets: [],
    checkin: [],
    baggage: [],
    flightStatusHistory: [],
    aadeEvents: [],
    aadeAlerts: [],
    aadeRecommendations: [],
    aadeApprovals: [],
    aadeAuditLogs: [],
};

/**
 * Loads all active tables from MySQL database into operational cache
 */
async function syncWithDatabase() {
    try {
        const [
            ports, lines, craft, gts, flts, insts, psgs, emps, bks, tks, chks, bags, hist
        ] = await Promise.all([
            db.execute('SELECT AIRPORT_CODE as airportCode, AIRPORT_NAME as airportName, CITY as city, STATE as state, COUNTRY as country, TIMEZONE as timezone, IS_ACTIVE as isActive FROM AIRPORTS ORDER BY AIRPORT_CODE'),
            db.execute('SELECT AIRLINE_CODE as airlineCode, AIRLINE_NAME as airlineName, THREE_DIGIT_CODE as threeDigitCode, COUNTRY as country, CONTACT_EMAIL as contactEmail, IS_ACTIVE as isActive FROM AIRLINES ORDER BY AIRLINE_CODE'),
            db.execute('SELECT AIRCRAFT_ID as aircraftId, REGISTRATION_NO as registrationNo, MODEL as model, AIRLINE_CODE as airlineCode, TOTAL_SEATS as totalSeats, ECONOMY_SEATS as economySeats, BUSINESS_SEATS as businessSeats, FIRST_SEATS as firstSeats, STATUS as status FROM AIRCRAFT'),
            db.execute('SELECT GATE_ID as gateId, AIRPORT_CODE as airportCode, TERMINAL as terminal, GATE_NUMBER as gateNumber, STATUS as status, IS_ACTIVE as isActive FROM GATES'),
            db.execute('SELECT FLIGHT_NUMBER as flightNumber, AIRLINE_CODE as airlineCode, ORIGIN_AIRPORT as originAirport, DEST_AIRPORT as destAirport, SCHEDULED_DEPARTURE_TIME as scheduledDepartureTime, SCHEDULED_ARRIVAL_TIME as scheduledArrivalTime, FLIGHT_TYPE as flightType, BASE_FARE as baseFare, IS_ACTIVE as isActive FROM FLIGHTS'),
            db.execute('SELECT FLIGHT_INSTANCE_ID as flightInstanceId, FLIGHT_NUMBER as flightNumber, DATE_FORMAT(FLIGHT_DATE, "%Y-%m-%d") as flightDate, AIRCRAFT_ID as aircraftId, DEPARTURE_GATE_ID as departureGateId, ARRIVAL_GATE_ID as arrivalGateId, DATE_FORMAT(SCHEDULED_DEPARTURE, "%Y-%m-%d %H:%i:%s") as scheduledDeparture, DATE_FORMAT(ESTIMATED_DEPARTURE, "%Y-%m-%d %H:%i:%s") as estimatedDeparture, DATE_FORMAT(ACTUAL_DEPARTURE, "%Y-%m-%d %H:%i:%s") as actualDeparture, DATE_FORMAT(SCHEDULED_ARRIVAL, "%Y-%m-%d %H:%i:%s") as scheduledArrival, DATE_FORMAT(ESTIMATED_ARRIVAL, "%Y-%m-%d %H:%i:%s") as estimatedArrival, DATE_FORMAT(ACTUAL_ARRIVAL, "%Y-%m-%d %H:%i:%s") as actualArrival, STATUS as status, REMARKS as remarks FROM FLIGHT_INSTANCES'),
            db.execute('SELECT PASSENGER_ID as passengerId, USER_ID as userId, FIRST_NAME as firstName, LAST_NAME as lastName, PASSPORT_NUMBER as passportNumber, PHONE as phone, EMAIL as email, DATE_FORMAT(DATE_OF_BIRTH, "%Y-%m-%d") as dateOfBirth, GENDER as gender FROM PASSENGERS'),
            db.execute('SELECT EMPLOYEE_ID as employeeId, USER_ID as userId, AIRPORT_CODE as airportCode, AIRLINE_CODE as airlineCode, FIRST_NAME as firstName, LAST_NAME as lastName, JOB_TITLE as jobTitle, SHIFT as shift, CONTACT_PHONE as contactPhone, IS_ACTIVE as isActive FROM EMPLOYEES'),
            db.execute('SELECT BOOKING_ID as bookingId, BOOKING_REFERENCE as bookingReference, USER_ID as userId, DATE_FORMAT(BOOKING_DATE, "%Y-%m-%d %H:%i:%s") as bookingDate, TOTAL_AMOUNT as totalAmount, STATUS as status FROM BOOKINGS'),
            db.execute('SELECT TICKET_ID as ticketId, BOOKING_ID as bookingId, FLIGHT_INSTANCE_ID as flightInstanceId, PASSENGER_ID as passengerId, TICKET_NUMBER as ticketNumber, SEAT_NUMBER as seatNumber, CABIN_CLASS as cabinClass, PRICE as price, STATUS as status FROM TICKETS'),
            db.execute('SELECT CHECK_IN_ID as checkInId, TICKET_ID as ticketId, DATE_FORMAT(CHECK_IN_TIME, "%Y-%m-%d %H:%i:%s") as checkInTime, BOARDING_PASS_CODE as boardingPassCode, DATE_FORMAT(BOARDING_TIME, "%Y-%m-%d %H:%i:%s") as boardingTime, GATE_ID as gateId, STATUS as status FROM CHECK_IN'),
            db.execute('SELECT BAGGAGE_ID as baggageId, TICKET_ID as ticketId, TAG_NUMBER as tagNumber, WEIGHT_KG as weightKg, STATUS as status, CAROUSEL_NUMBER as carouselNumber, DATE_FORMAT(CREATED_AT, "%Y-%m-%d %H:%i:%s") as createdAt FROM BAGGAGE'),
            db.execute('SELECT HISTORY_ID as historyId, FLIGHT_INSTANCE_ID as flightInstanceId, OLD_STATUS as oldStatus, NEW_STATUS as newStatus, REASON as reason, DATE_FORMAT(CHANGED_AT, "%Y-%m-%d %H:%i:%s") as changedAt, CHANGED_BY_USER_ID as changedByUserId FROM FLIGHT_STATUS_HISTORY'),
        ]);

        if (ports?.rows) store.airports = ports.rows;
        if (lines?.rows) store.airlines = lines.rows;
        if (craft?.rows) store.aircraft = craft.rows;
        if (gts?.rows) store.gates = gts.rows;
        if (flts?.rows) store.flights = flts.rows;
        if (insts?.rows) store.flightInstances = insts.rows;
        if (psgs?.rows) store.passengers = psgs.rows;
        if (emps?.rows) store.employees = emps.rows;
        if (bks?.rows) store.bookings = bks.rows;
        if (tks?.rows) store.tickets = tks.rows;
        if (chks?.rows) store.checkin = chks.rows;
        if (bags?.rows) store.baggage = bags.rows;
        if (hist?.rows) store.flightStatusHistory = hist.rows;

        console.log('[Operations Store] Synchronized with MySQL tables:', {
            airports: store.airports.length,
            airlines: store.airlines.length,
            aircraft: store.aircraft.length,
            gates: store.gates.length,
            flights: store.flights.length,
            flightInstances: store.flightInstances.length,
            passengers: store.passengers.length,
            employees: store.employees.length,
            bookings: store.bookings.length,
            tickets: store.tickets.length,
            checkin: store.checkin.length,
            baggage: store.baggage.length,
        });
        return true;
    } catch (err) {
        console.warn('[Operations Store] Sync warning:', err.message);
        return false;
    }
}

// Auto-sync on startup
syncWithDatabase().catch(() => {});

store.syncWithDatabase = syncWithDatabase;

module.exports = store;
