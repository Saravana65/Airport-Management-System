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
import AadeDashboard from '../pages/AadeDashboard/AadeDashboard';
import AlgorithmsDashboard from '../pages/AlgorithmsDashboard/AlgorithmsDashboard';
import ComingSoon from '../pages/ComingSoon/ComingSoon';
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
        <Route path="dashboard" element={<AdminDashboard initialTab="airports" />} />
        <Route path="users" element={<AdminDashboard initialTab="users" />} />
        <Route path="flights" element={<AdminDashboard initialTab="flights" />} />
        <Route path="airports" element={<AdminDashboard initialTab="airports" />} />
        <Route path="airlines" element={<AdminDashboard initialTab="airlines" />} />
        <Route path="employees" element={<AdminDashboard initialTab="employees" />} />
        <Route path="database" element={<AadeDashboard />} />
        <Route path="aade" element={<AadeDashboard />} />
        <Route path="algorithms" element={<AlgorithmsDashboard />} />
        <Route
          path="settings"
          element={
            <ComingSoon
              moduleName="System & Security Configuration"
              description="Security parameters (JWT 24h expiration, Helmet HTTP headers, CORS allowlist, and Oracle pool bounds) are actively managed via backend environment variables and middleware."
              phase="Production Ready"
              schemaTable="USERS & AUDIT_LOGS"
            />
          }
        />
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
        <Route path="dashboard" element={<AirlineDashboard initialTab="dispatch" />} />
        <Route path="my-airline" element={<AirlineDashboard initialTab="dispatch" />} />
        <Route path="flights" element={<AirlineDashboard initialTab="dispatch" />} />
        <Route path="passengers" element={<AirlineDashboard initialTab="passengers" />} />
        <Route path="bookings" element={<AirlineDashboard initialTab="bookings" />} />
        <Route path="tickets" element={<AirlineDashboard initialTab="bookings" />} />
        <Route path="aade" element={<AadeDashboard />} />
        <Route path="algorithms" element={<AlgorithmsDashboard />} />
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
        <Route path="dashboard" element={<AirportDashboard initialTab="gates" />} />
        <Route path="flights" element={<AirportDashboard initialTab="runway" />} />
        <Route path="gates" element={<AirportDashboard initialTab="gates" />} />
        <Route path="checkin" element={<AirportDashboard initialTab="checkin" />} />
        <Route path="baggage" element={<AirportDashboard initialTab="baggage" />} />
        <Route path="employees" element={<AirportDashboard initialTab="gates" />} />
        <Route path="aade" element={<AadeDashboard />} />
        <Route path="algorithms" element={<AlgorithmsDashboard />} />
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
        <Route path="dashboard" element={<PassengerDashboard initialTab="bookings" />} />
        <Route path="search" element={<PassengerDashboard initialTab="search" />} />
        <Route path="bookings" element={<PassengerDashboard initialTab="bookings" />} />
        <Route path="tickets" element={<PassengerDashboard initialTab="bookings" />} />
        <Route path="checkin" element={<PassengerDashboard initialTab="checkin" />} />
        <Route
          path="travel-info"
          element={
            <ComingSoon
              moduleName="Travel Guidelines & Checkpoint Advisories"
              description="Carry-on baggage limit: 7.0 kg. Check-in baggage allowance: 25.0 kg. Gate closes 25 minutes prior to scheduled flight departure."
              phase="Information Active"
              schemaTable="AIRPORTS & FLIGHTS"
            />
          }
        />
        <Route
          path="profile"
          element={
            <ComingSoon
              moduleName="Passenger Profile & Account Security"
              description="View session details, authenticated email address, and encrypted biometric travel documentation on the station header."
              phase="Profile Active"
              schemaTable="PASSENGERS table"
            />
          }
        />
        <Route path="algorithms" element={<AlgorithmsDashboard />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
