/**
 * Phase 08: Autonomous Airport Data Engine (AADE) Frontend API Client
 * Connects React UI with autonomous monitoring, alerts, approvals, and telemetry.
 */

import api from './api';

export const aadeService = {
  getStatus: () => api.get('/aade/status').then(r => r.data || r),
  getHealth: () => api.get('/aade/health').then(r => r.data || r),
  runCycle: () => api.post('/aade/run').then(r => r.data || r),
  getAlerts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/aade/alerts${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  resolveAlert: (id) => api.patch(`/aade/alerts/${id}/resolve`).then(r => r.data || r),
  dismissAlert: (id) => api.patch(`/aade/alerts/${id}/dismiss`).then(r => r.data || r),
  getEvents: (limit = 50) => api.get(`/aade/events?limit=${limit}`).then(r => r.data || r),
  getConflicts: () => api.get('/aade/conflicts').then(r => r.data || r),
  getUtilization: () => api.get('/aade/utilization').then(r => r.data || r),
  getRecommendations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/aade/recommendations${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  getApprovals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/aade/approvals${query ? `?${query}` : ''}`).then(r => r.data || r);
  },
  approveAction: (id, remarks = '') =>
    api.post(`/aade/approvals/${id}/approve`, { remarks }).then(r => r.data || r),
  rejectAction: (id, remarks = '') =>
    api.post(`/aade/approvals/${id}/reject`, { remarks }).then(r => r.data || r),
  getAuditLogs: (limit = 100) => api.get(`/aade/audit?limit=${limit}`).then(r => r.data || r),
};

export default aadeService;
