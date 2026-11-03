/**
 * Centralized API Client
 * Manages HTTP communication with the Airport Operations Backend.
 * Uses 'credentials: include' to transmit secure HttpOnly session cookies.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom API Error class with status and payload information
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Core fetch wrapper
 * @param {string} endpoint - API path (e.g. '/auth/login')
 * @param {RequestInit} options - Fetch options
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Enables browser to send and receive HttpOnly cookies across origin/proxy
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    
    // Attempt parsing JSON
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || response.statusText };
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    // If it's already an ApiError, re-throw
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (backend server offline or unreachable)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to Airport Operations Backend. Verify that the Node.js server is running on port 5000.',
        0,
        { code: 'NETWORK_ERROR' }
      );
    }

    throw new ApiError(error.message || 'An unexpected client error occurred.', 500);
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
