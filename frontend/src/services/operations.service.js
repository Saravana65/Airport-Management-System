/**
 * Phase 07: Airport Operations API Client Service
 * Bridges React frontend with all 8 operational backend modules.
 */

import api from './api';

export const operationsService = {
  // Module 1: Airports, Airlines & Aircraft
  getAirports: () =>
    api.get('/airports').then((r) => {
      const list = r.data || r;
      if (!Array.isArray(list)) return [];
      return list.map((a) => ({
        ...a,
        airportCode: a.airportCode || a.AIRPORT_CODE,
        airportName: a.airportName || a.AIRPORT_NAME,
        city: a.city || a.CITY,
        state: a.state || a.STATE,
        country: a.country || a.COUNTRY,
        timezone: a.timezone || a.TIMEZONE,
        isActive: a.isActive || a.IS_ACTIVE,
      }));
    }),
  createAirport: (data) => api.post('/airports', data).then((r) => r.data || r),
  getAirlines: () =>
    api.get('/airlines').then((r) => {
      const list = r.data || r;
      if (!Array.isArray(list)) return [];
      return list.map((l) => ({
        ...l,
        airlineCode: l.airlineCode || l.AIRLINE_CODE,
        airlineName: l.airlineName || l.AIRLINE_NAME,
        threeDigitCode: l.threeDigitCode || l.THREE_DIGIT_CODE,
        country: l.country || l.COUNTRY,
        contactEmail: l.contactEmail || l.CONTACT_EMAIL,
        isActive: l.isActive || l.IS_ACTIVE,
      }));
    }),
  createAirline: (data) => api.post('/airlines', data).then((r) => r.data || r),
  getAircraft: () =>
    api.get('/aircraft').then((r) => {
      const list = r.data || r;
      if (!Array.isArray(list)) return [];
      return list.map((c) => ({
        ...c,
        aircraftId: c.aircraftId || c.AIRCRAFT_ID,
        registrationNo: c.registrationNo || c.REGISTRATION_NO,
        model: c.model || c.MODEL,
        airlineCode: c.airlineCode || c.AIRLINE_CODE,
        totalSeats: c.totalSeats || c.TOTAL_SEATS,
        status: c.status || c.STATUS,
      }));
    }),
  createAircraft: (data) => api.post('/aircraft', data).then((r) => r.data || r),

  // Module 2: Flights
  getFlights: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/flights${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  getFlightSeats: (id) => api.get(`/flights/${id}/seats`).then(r => r.data || r),
  createFlight: (data) => api.post('/flights', data).then(r => r.data || r),
  updateFlightStatus: (id, status, reason, extra = {}) =>
    api.patch(`/flights/${id}/status`, { status, reason, ...extra }).then(r => r.data || r),

  // Module 3: Passengers
  getPassengers: (q = '') =>
    api.get(`/passengers${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(r => r.data || r),
  getMyPassengerProfile: () => api.get('/passengers/me').then(r => r.data || r),
  createPassenger: (data) => api.post('/passengers', data).then(r => r.data || r),

  // Module 4: Bookings & Tickets
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/bookings${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  createBooking: (data) => api.post('/bookings', data).then(r => r.data || r),
  cancelBooking: (id) => api.patch(`/bookings/${id}/cancel`).then(r => r.data || r),

  // Module 5: Check-in Operations
  getEligibleTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/checkin/eligible${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  getCheckIns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/checkin${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  processCheckIn: (data) => api.post('/checkin', data).then(r => r.data || r),
  getStaffCheckInOverview: () => api.get('/checkin/staff/overview').then(r => r.data || r),
  retrieveBookingForCheckIn: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/checkin/retrieve${query ? `?${query}` : ''}`).then(r => r.data || r);
  },

  // Module 6: Baggage Management
  getBaggage: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/baggage${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  registerBaggage: (data) => api.post('/baggage', data).then(r => r.data || r),
  updateBaggageStatus: (id, status, carouselNumber) =>
    api.patch(`/baggage/${id}/status`, { status, carouselNumber }).then(r => r.data || r),

  // Module 7: Gate Management
  getGates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/gates${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  createGate: (data) => api.post('/gates', data).then(r => r.data || r),
  assignGate: (data) => api.post('/gates/assign', data).then(r => r.data || r),

  // Module 8: Employee & Workforce Management
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/employees${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  createEmployee: (data) => api.post('/employees', data).then(r => r.data || r),
};

export default operationsService;
