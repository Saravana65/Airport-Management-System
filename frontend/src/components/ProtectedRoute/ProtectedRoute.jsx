/**
 * ProtectedRoute Component
 * Guards routes against unauthenticated access and enforces Role-Based Access Control (RBAC).
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './ProtectedRoute.css';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="radar-spinner">
          <div className="radar-sweep"></div>
          <div className="radar-blip"></div>
        </div>
        <p className="auth-loading-text">Synchronizing Flight Control Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user has at least one of them
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
