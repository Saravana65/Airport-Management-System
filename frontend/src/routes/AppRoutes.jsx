import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Layout
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

// Pages
import Login from '../pages/Login/Login';
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard';
import AirlineDashboard from '../pages/AirlineDashboard/AirlineDashboard';
import AirportDashboard from '../pages/AirportDashboard/AirportDashboard';
import PassengerDashboard from '../pages/PassengerDashboard/PassengerDashboard';
import Unauthorized from '../pages/Unauthorized/Unauthorized';
import NotFound from '../pages/NotFound/NotFound';

/**
 * Intelligent Role-Based Redirector
 * Dynamically forwards authenticated users to their designated station dashboard.
 */
function RoleRedirector() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // ProtectedRoute will render loader
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'AIRLINE_STAFF':
      return <Navigate to="/airline/dashboard" replace />;
    case 'AIRPORT_STAFF':
      return <Navigate to="/airport/dashboard" replace />;
    case 'PASSENGER':
      return <Navigate to="/passenger/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Gateway Entry / Auto Role Routing */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRedirector />
          </ProtectedRoute>
        }
      />

      {/* ADMIN Station Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Administrator Command & Control Center" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="flights" element={<AdminDashboard />} />
        <Route path="database" element={<AdminDashboard />} />
        <Route path="logs" element={<AdminDashboard />} />
      </Route>

      {/* AIRLINE_STAFF Station Routes */}
      <Route
        path="/airline"
        element={
          <ProtectedRoute allowedRoles={['AIRLINE_STAFF']}>
            <DashboardLayout title="Airline Operations & Fleet Dispatch" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/airline/dashboard" replace />} />
        <Route path="dashboard" element={<AirlineDashboard />} />
        <Route path="flights" element={<AirlineDashboard />} />
        <Route path="passengers" element={<AirlineDashboard />} />
        <Route path="bookings" element={<AirlineDashboard />} />
        <Route path="fleet" element={<AirlineDashboard />} />
      </Route>

      {/* AIRPORT_STAFF Station Routes */}
      <Route
        path="/airport"
        element={
          <ProtectedRoute allowedRoles={['AIRPORT_STAFF']}>
            <DashboardLayout title="Airport Ground & Terminal Operations" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/airport/dashboard" replace />} />
        <Route path="dashboard" element={<AirportDashboard />} />
        <Route path="flights" element={<AirportDashboard />} />
        <Route path="gates" element={<AirportDashboard />} />
        <Route path="checkin" element={<AirportDashboard />} />
        <Route path="baggage" element={<AirportDashboard />} />
      </Route>

      {/* PASSENGER Station Routes */}
      <Route
        path="/passenger"
        element={
          <ProtectedRoute allowedRoles={['PASSENGER']}>
            <DashboardLayout title="Passenger Flight & Travel Portal" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/passenger/dashboard" replace />} />
        <Route path="dashboard" element={<PassengerDashboard />} />
        <Route path="search" element={<PassengerDashboard />} />
        <Route path="bookings" element={<PassengerDashboard />} />
        <Route path="tickets" element={<PassengerDashboard />} />
        <Route path="checkin" element={<PassengerDashboard />} />
        <Route path="alerts" element={<PassengerDashboard />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
