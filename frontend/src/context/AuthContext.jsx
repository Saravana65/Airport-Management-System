/**
 * Authentication Context & Provider
 * Manages user authentication state, role-based identity, and session restoration.
 * Adheres strictly to HttpOnly cookie security—never writes JWTs to localStorage.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restore user session on application initialization or page refresh.
   * Calls GET /api/auth/me which sends the browser's HttpOnly session cookie.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();
      // Expecting user object: { userId, email, role, isActive }
      if (profile && profile.userId) {
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 just means no active cookie or expired session - normal for anonymous visitor
      setUser(null);
      if (err.status !== 401) {
        // Backend offline or server error
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      // data typically has { user, token }
      const authenticatedUser = data.user || data;
      setUser(authenticatedUser);
      return { success: true, user: authenticatedUser };
    } catch (err) {
      const message = err.message || 'Login failed. Please verify your credentials.';
      setError(message);
      return { success: false, error: message, status: err.status };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
