/**
 * Phase 07: Airport Operations API Client Service
 * Bridges React frontend with all 8 operational backend modules.
 */

import api from './api';

export const operationsService = {
  // Module 1: Airports, Airlines & Aircraft
  getAirports: () => api.get('/airports').then(r => r.data || r),
  createAirport: (data) => api.post('/airports', data).then(r => r.data || r),
  getAirlines: () => api.get('/airlines').then(r => r.data || r),
  createAirline: (data) => api.post('/airlines', data).then(r => r.data || r),
  getAircraft: () => api.get('/aircraft').then(r => r.data || r),
  createAircraft: (data) => api.post('/aircraft', data).then(r => r.data || r),

  // Module 2: Flights
  getFlights: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/flights${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  createFlight: (data) => api.post('/flights', data).then(r => r.data || r),
  updateFlightStatus: (id, status, reason) =>
    api.patch(`/flights/${id}/status`, { status, reason }).then(r => r.data || r),

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
  getEligibleTickets: () => api.get('/checkin/eligible').then(r => r.data || r),
  getCheckIns: () => api.get('/checkin').then(r => r.data || r),
  processCheckIn: (data) => api.post('/checkin', data).then(r => r.data || r),

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
