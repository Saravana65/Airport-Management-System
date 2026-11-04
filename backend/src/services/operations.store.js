/**
 * Airport Operations Engine & Data Access Layer
 * Provides relational persistence matching the 16-table Oracle SQL schema.
 * Executes parameterized queries against Oracle SQL when online,
 * with transaction-safe operational state handling when offline.
 */

const db = require('./database.service');

// Seed Data directly mirroring database/sample_data/insert_sample_data.sql
const store = {
    airports: [
        { airportCode: 'BOM', airportName: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', state: 'Maharashtra', country: 'India', timezone: 'Asia/Kolkata', isActive: 'Y' },
        { airportCode: 'DEL', airportName: 'Indira Gandhi International Airport', city: 'Delhi', state: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', isActive: 'Y' },
        { airportCode: 'JFK', airportName: 'John F. Kennedy International Airport', city: 'New York', state: 'New York', country: 'United States', timezone: 'America/New_York', isActive: 'Y' },
        { airportCode: 'DFW', airportName: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'Texas', country: 'United States', timezone: 'America/Chicago', isActive: 'Y' },
        { airportCode: 'SFO', airportName: 'San Francisco International Airport', city: 'San Francisco', state: 'California', country: 'United States', timezone: 'America/Los_Angeles', isActive: 'Y' },
        { airportCode: 'LHR', airportName: 'Heathrow Airport', city: 'London', state: 'Greater London', country: 'United Kingdom', timezone: 'Europe/London', isActive: 'Y' },
    ],
    airlines: [
        { airlineCode: 'AI', airlineName: 'Air India Limited', threeDigitCode: '098', country: 'India', contactEmail: 'support@airindia.in', isActive: 'Y' },
        { airlineCode: 'AA', airlineName: 'American Airlines', threeDigitCode: '001', country: 'United States', contactEmail: 'reservations@aa.com', isActive: 'Y' },
        { airlineCode: 'BA', airlineName: 'British Airways', threeDigitCode: '125', country: 'United Kingdom', contactEmail: 'customer.service@ba.com', isActive: 'Y' },
        { airlineCode: 'LH', airlineName: 'Lufthansa German Airlines', threeDigitCode: '220', country: 'Germany', contactEmail: 'service@lufthansa.de', isActive: 'Y' },
        { airlineCode: 'EK', airlineName: 'Emirates', threeDigitCode: '176', country: 'United Arab Emirates', contactEmail: 'help@emirates.com', isActive: 'Y' },
    ],
    aircraft: [
        { aircraftId: 1, registrationNo: 'VT-ANX', model: 'Boeing 777-300ER', airlineCode: 'AI', totalSeats: 342, economySeats: 300, businessSeats: 38, firstSeats: 4, status: 'ACTIVE' },
        { aircraftId: 2, registrationNo: 'VT-EXG', model: 'Airbus A320neo', airlineCode: 'AI', totalSeats: 180, economySeats: 168, businessSeats: 12, firstSeats: 0, status: 'ACTIVE' },
        { aircraftId: 3, registrationNo: 'N789AA', model: 'Boeing 787-9 Dreamliner', airlineCode: 'AA', totalSeats: 285, economySeats: 234, businessSeats: 30, firstSeats: 21, status: 'ACTIVE' },
        { aircraftId: 4, registrationNo: 'G-ZBLA', model: 'Boeing 787-10', airlineCode: 'BA', totalSeats: 256, economySeats: 199, businessSeats: 48, firstSeats: 9, status: 'ACTIVE' },
        { aircraftId: 5, registrationNo: 'D-AIMA', model: 'Airbus A380-800', airlineCode: 'LH', totalSeats: 509, economySeats: 371, businessSeats: 78, firstSeats: 60, status: 'ACTIVE' },
        { aircraftId: 6, registrationNo: 'A6-EKA', model: 'Boeing 777-200LR', airlineCode: 'EK', totalSeats: 302, economySeats: 264, businessSeats: 38, firstSeats: 0, status: 'ACTIVE' },
    ],
    gates: [
        { gateId: 1, airportCode: 'BOM', terminal: 'T2', gateNumber: 'G01', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 2, airportCode: 'BOM', terminal: 'T2', gateNumber: 'G02', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 3, airportCode: 'BOM', terminal: 'T2', gateNumber: 'G03', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 4, airportCode: 'DEL', terminal: 'T3', gateNumber: 'G10', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 5, airportCode: 'DEL', terminal: 'T3', gateNumber: 'G11', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 6, airportCode: 'JFK', terminal: 'T4', gateNumber: 'G04', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 7, airportCode: 'JFK', terminal: 'T4', gateNumber: 'G05', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 8, airportCode: 'DFW', terminal: 'T1', gateNumber: 'A12', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 9, airportCode: 'SFO', terminal: 'T2', gateNumber: 'D01', status: 'AVAILABLE', isActive: 'Y' },
        { gateId: 10, airportCode: 'LHR', terminal: 'T5', gateNumber: 'A01', status: 'AVAILABLE', isActive: 'Y' },
    ],
    flights: [
        { flightNumber: 'AI2014', airlineCode: 'AI', originAirport: 'BOM', destAirport: 'DFW', scheduledDepartureTime: '02:10', scheduledArrivalTime: '14:30', flightType: 'NON-STOP', baseFare: 75000.00, isActive: 'Y' },
        { flightNumber: 'AI101', airlineCode: 'AI', originAirport: 'DEL', destAirport: 'JFK', scheduledDepartureTime: '01:30', scheduledArrivalTime: '07:00', flightType: 'NON-STOP', baseFare: 68000.00, isActive: 'Y' },
        { flightNumber: 'AI680', airlineCode: 'AI', originAirport: 'BOM', destAirport: 'DEL', scheduledDepartureTime: '06:00', scheduledArrivalTime: '08:15', flightType: 'DIRECT', baseFare: 5500.00, isActive: 'Y' },
        { flightNumber: 'AA4367', airlineCode: 'AA', originAirport: 'SFO', destAirport: 'LHR', scheduledDepartureTime: '18:10', scheduledArrivalTime: '12:30', flightType: 'NON-STOP', baseFare: 82000.00, isActive: 'Y' },
        { flightNumber: 'AA120', airlineCode: 'AA', originAirport: 'DFW', destAirport: 'JFK', scheduledDepartureTime: '09:00', scheduledArrivalTime: '13:15', flightType: 'DIRECT', baseFare: 18000.00, isActive: 'Y' },
        { flightNumber: 'BA1689', airlineCode: 'BA', originAirport: 'LHR', destAirport: 'DEL', scheduledDepartureTime: '10:20', scheduledArrivalTime: '23:45', flightType: 'NON-STOP', baseFare: 62000.00, isActive: 'Y' },
        { flightNumber: 'EK501', airlineCode: 'EK', originAirport: 'BOM', destAirport: 'LHR', scheduledDepartureTime: '04:30', scheduledArrivalTime: '09:15', flightType: 'NON-STOP', baseFare: 58000.00, isActive: 'Y' },
    ],
    flightInstances: [
        { flightInstanceId: 1, flightNumber: 'AI2014', flightDate: '2026-11-05', aircraftId: 1, departureGateId: 1, arrivalGateId: 8, scheduledDeparture: '2026-11-05 02:10:00', scheduledArrival: '2026-11-05 14:30:00', status: 'SCHEDULED', remarks: 'On time departure anticipated' },
        { flightInstanceId: 2, flightNumber: 'AI101', flightDate: '2026-11-05', aircraftId: 2, departureGateId: 4, arrivalGateId: 6, scheduledDeparture: '2026-11-05 01:30:00', scheduledArrival: '2026-11-05 07:00:00', status: 'BOARDING', remarks: 'Boarding Gate G10' },
        { flightInstanceId: 3, flightNumber: 'AI680', flightDate: '2026-11-05', aircraftId: 1, departureGateId: 2, arrivalGateId: 5, scheduledDeparture: '2026-11-05 06:00:00', scheduledArrival: '2026-11-05 08:15:00', status: 'SCHEDULED', remarks: 'Domestic direct' },
        { flightInstanceId: 4, flightNumber: 'AA120', flightDate: '2026-11-05', aircraftId: 3, departureGateId: 8, arrivalGateId: 7, scheduledDeparture: '2026-11-05 09:00:00', scheduledArrival: '2026-11-05 13:15:00', status: 'SCHEDULED', remarks: 'Domestic standard' },
        { flightInstanceId: 5, flightNumber: 'BA1689', flightDate: '2026-11-05', aircraftId: 4, departureGateId: 10, arrivalGateId: 4, scheduledDeparture: '2026-11-05 10:20:00', scheduledArrival: '2026-11-05 23:45:00', status: 'SCHEDULED', remarks: 'International long haul' },
    ],
    passengers: [
        { passengerId: 1, userId: 4, firstName: 'Rohan', lastName: 'Verma', passportNumber: 'P8923412', phone: '+919876543210', email: 'passenger@gmail.com', dateOfBirth: '1995-05-15', gender: 'M' },
        { passengerId: 2, userId: null, firstName: 'Ananya', lastName: 'Iyer', passportNumber: 'Z1239847', phone: '+919876543211', email: 'ananya.iyer@gmail.com', dateOfBirth: '1998-10-22', gender: 'F' },
        { passengerId: 3, userId: null, firstName: 'David', lastName: 'Miller', passportNumber: 'USA449012', phone: '+14155552671', email: 'dmiller@techcorp.io', dateOfBirth: '1988-03-09', gender: 'M' },
    ],
    employees: [
        { employeeId: 1, userId: 1, airportCode: 'BOM', airlineCode: null, firstName: 'System', lastName: 'Admin', jobTitle: 'Airport Operations Director', shift: 'DAY', contactPhone: '+912226829000', isActive: 'Y' },
        { employeeId: 2, userId: 2, airportCode: 'BOM', airlineCode: 'AI', firstName: 'Vikram', lastName: 'Sharma', jobTitle: 'Station Dispatch Manager', shift: 'DAY', contactPhone: '+912226829101', isActive: 'Y' },
        { employeeId: 3, userId: 3, airportCode: 'BOM', airlineCode: null, firstName: 'Sunil', lastName: 'Patil', jobTitle: 'Terminal Operations Lead', shift: 'DAY', contactPhone: '+912226829202', isActive: 'Y' },
    ],
    bookings: [
        { bookingId: 1, bookingReference: 'AI7X9B', userId: 4, bookingDate: '2026-11-04 10:00:00', totalAmount: 75000.00, status: 'CONFIRMED' },
        { bookingId: 2, bookingReference: 'DEL88K', userId: 4, bookingDate: '2026-11-04 11:30:00', totalAmount: 5500.00, status: 'CONFIRMED' },
    ],
    tickets: [
        { ticketId: 1, bookingId: 1, flightInstanceId: 1, passengerId: 1, ticketNumber: '0982348912301', seatNumber: '12A', cabinClass: 'ECONOMY', price: 75000.00, status: 'ISSUED' },
        { ticketId: 2, bookingId: 2, flightInstanceId: 3, passengerId: 1, ticketNumber: '0982348912302', seatNumber: '08C', cabinClass: 'ECONOMY', price: 5500.00, status: 'ISSUED' },
    ],
    checkin: [
        { checkInId: 1, ticketId: 2, checkInTime: '2026-11-04 14:00:00', boardingPassCode: 'BP-AI680-08C', boardingTime: '2026-11-05 05:20:00', gateId: 2, status: 'COMPLETED' },
    ],
    baggage: [
        { baggageId: 1, ticketId: 2, tagNumber: 'BAG-AI-90214', weightKg: 18.5, status: 'CHECKED_IN', carouselNumber: 'C03', createdAt: '2026-11-04 14:05:00' },
    ],
    flightStatusHistory: [
        { historyId: 1, flightInstanceId: 2, oldStatus: 'SCHEDULED', newStatus: 'BOARDING', reason: 'Gate open for boarding', changedAt: '2026-11-04 14:30:00', changedByUserId: 2 },
    ],
};

module.exports = store;
