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
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route
          path="users"
          element={
            <ComingSoon
              moduleName="User & Role Administration"
              description="Manage system users, assign clearance roles (ADMIN, AIRLINE_STAFF, AIRPORT_STAFF, PASSENGER), and toggle active flags. Backend APIs already live in Phase 05 under /api/admin/users."
              phase="Phase 05 Ready"
              schemaTable="USERS table"
            />
          }
        />
        <Route
          path="flights"
          element={
            <ComingSoon
              moduleName="Flight Operations Management"
              description="Global dispatch, schedule coordination, and flight status tracking."
              phase="Phase 07"
              schemaTable="FLIGHT_SCHEDULES & FLIGHTS"
            />
          }
        />
        <Route
          path="airports"
          element={
            <ComingSoon
              moduleName="Airport Infrastructure Management"
              description="Manage airport terminals, runways, and airside physical capacities."
              phase="Phase 07"
              schemaTable="AIRPORTS & RUNWAYS"
            />
          }
        />
        <Route
          path="airlines"
          element={
            <ComingSoon
              moduleName="Carrier Airline Administration"
              description="Authorized airlines, operational call signs, and allocated fleet inventory."
              phase="Phase 07"
              schemaTable="AIRLINES & AIRCRAFTS"
            />
          }
        />
        <Route
          path="employees"
          element={
            <ComingSoon
              moduleName="Employee & Staff Management"
              description="Airport and ground staff profiles, shifts, and departmental assignments."
              phase="Phase 07"
              schemaTable="EMPLOYEES & SHIFTS"
            />
          }
        />
        <Route path="database" element={<AadeDashboard />} />
        <Route path="aade" element={<AadeDashboard />} />
        <Route
          path="settings"
          element={
            <ComingSoon
              moduleName="System & Security Settings"
              description="JWT session expiration parameters, CORS allowlists, and system auditing controls."
              phase="Phase 08"
              schemaTable="SYSTEM_CONFIGURATION"
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
        <Route path="dashboard" element={<AirlineDashboard />} />
        <Route
          path="my-airline"
          element={
            <ComingSoon
              moduleName="My Airline Overview"
              description="Carrier profile, active aircraft fleet, and assigned terminal gates."
              phase="Phase 07"
              schemaTable="AIRLINES & AIRCRAFTS"
            />
          }
        />
        <Route
          path="flights"
          element={
            <ComingSoon
              moduleName="Carrier Flight Management"
              description="Publish flight numbers, aircraft assignments, and departure schedules."
              phase="Phase 07"
              schemaTable="FLIGHT_SCHEDULES"
            />
          }
        />
        <Route
          path="passengers"
          element={
            <ComingSoon
              moduleName="Passenger Manifest Management"
              description="Passenger lookup, passport validation, and special service requirements."
              phase="Phase 07"
              schemaTable="PASSENGERS & BOOKINGS"
            />
          }
        />
        <Route
          path="bookings"
          element={
            <ComingSoon
              moduleName="Booking & Reservation Management"
              description="Manage PNRs, booking statuses, fare classes, and cancellation refunds."
              phase="Phase 07"
              schemaTable="BOOKINGS table"
            />
          }
        />
        <Route
          path="tickets"
          element={
            <ComingSoon
              moduleName="Carrier Ticket Information"
              description="Issued e-tickets, seat allocations, and boarding pass verifications."
              phase="Phase 07"
              schemaTable="TICKETS table"
            />
          }
        />
        <Route path="aade" element={<AadeDashboard />} />
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
        <Route
          path="flights"
          element={
            <ComingSoon
              moduleName="Terminal Flight Operations"
              description="Live runway dispatch, turnaround times, and airside movements."
              phase="Phase 07"
              schemaTable="FLIGHT_INSTANCES"
            />
          }
        />
        <Route
          path="gates"
          element={
            <ComingSoon
              moduleName="Gate & Stand Management"
              description="Aerobridge allocation, remote apron parking, and gate conflicts."
              phase="Phase 07"
              schemaTable="GATES & TERMINALS"
            />
          }
        />
        <Route
          path="checkin"
          element={
            <ComingSoon
              moduleName="Check-in Operations & Desks"
              description="Terminal counter assignments, passenger check-in intake, and boarding passes."
              phase="Phase 07"
              schemaTable="CHECK_IN table"
            />
          }
        />
        <Route
          path="baggage"
          element={
            <ComingSoon
              moduleName="Baggage Handling & Routing"
              description="Baggage sorting conveyors, tag scans, and claim carousel allocation."
              phase="Phase 07"
              schemaTable="BAGGAGE table"
            />
          }
        />
        <Route
          path="employees"
          element={
            <ComingSoon
              moduleName="Airport Employee Operations"
              description="Terminal staff shifts, security personnel rosters, and ramp teams."
              phase="Phase 07"
              schemaTable="EMPLOYEE_SHIFTS"
            />
          }
        />
        <Route path="aade" element={<AadeDashboard />} />
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
        <Route
          path="search"
          element={
            <ComingSoon
              moduleName="Search Flights"
              description="Live flight search across origin and destination airports with fare schedules."
              phase="Phase 07"
              schemaTable="FLIGHT_SCHEDULES"
            />
          }
        />
        <Route
          path="bookings"
          element={
            <ComingSoon
              moduleName="My Bookings & Reservations"
              description="Confirmed itineraries, booking references, and baggage allowances."
              phase="Phase 07"
              schemaTable="BOOKINGS table"
            />
          }
        />
        <Route
          path="tickets"
          element={
            <ComingSoon
              moduleName="My Tickets & Boarding Passes"
              description="Digital boarding passes, assigned seats, terminal gates, and QR passes."
              phase="Phase 07"
              schemaTable="TICKETS table"
            />
          }
        />
        <Route
          path="checkin"
          element={
            <ComingSoon
              moduleName="Online Web Check-in"
              description="Complete advance web check-in, select seats, and download passes."
              phase="Phase 07"
              schemaTable="CHECK_IN table"
            />
          }
        />
        <Route
          path="travel-info"
          element={
            <ComingSoon
              moduleName="Travel Information & Guidelines"
              description="Luggage rules, customs guidelines, and terminal security checkpoint advisories."
              phase="Phase 07"
              schemaTable="AIRPORT_INFO"
            />
          }
        />
        <Route
          path="profile"
          element={
            <ComingSoon
              moduleName="Passenger Profile & Account"
              description="Manage contact information, passport details, and travel preferences."
              phase="Phase 07"
              schemaTable="USERS & PASSENGERS"
            />
          }
        />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
