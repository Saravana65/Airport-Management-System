/**
 * Authentication Service
 * Communicates with backend /api/auth endpoints for session and profile management.
 */

import api from './api';

export const authService = {
  /**
   * Log in user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ user: Object, token?: string }>}
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // Backend standard structure: { success: true, message: '...', data: { user, token } }
    return response.data || response;
  },

  /**
   * Log out active user and clear session cookie
   * @returns {Promise<{ loggedOut: boolean }>}
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout', {});
      return response.data || response;
    } catch (error) {
      // Even if backend fails, client should clear local auth state
      return { loggedOut: true };
    }
  },

  /**
   * Retrieve current authenticated user profile
   * Restores session on browser refresh via HttpOnly cookie
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data || response;
  },

  /**
   * Change current user's password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<Object>}
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data || response;
  },
};

export default authService;
