/**
 * Phase 09: C Algorithm Engine & Java OOP Services API Client
 */

import api from './api';

export const integrationService = {
  getStatus: () => api.get('/integration/status').then(r => r.data || r),
  
  // C Engine Algorithms
  getGateAllocation: () => api.get('/integration/c/gate-allocation').then(r => r.data || r),
  getRunwayQueue: () => api.get('/integration/c/runway-queue').then(r => r.data || r),
  getBaggageRouting: () => api.get('/integration/c/baggage-routing').then(r => r.data || r),
  
  // Java OOP Microservice
  getJavaBookings: () => api.get('/integration/java/bookings').then(r => r.data || r),
  getJavaBookingById: (id) => api.get(`/integration/java/bookings/${id}`).then(r => r.data || r),
  createJavaBooking: (payload) => api.post('/integration/java/bookings', payload).then(r => r.data || r),
  transitionJavaBooking: (id, targetStatus) => api.post(`/integration/java/bookings/${id}/transition`, { targetStatus }).then(r => r.data || r),
  calculatePricing: (payload) => api.post('/integration/java/pricing/calculate', payload).then(r => r.data || r),
};

export default integrationService;
