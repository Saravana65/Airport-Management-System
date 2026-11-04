/**
 * Frontend Verification & Architecture Test Suite
 * Validates frontend contracts, navigation schemas, and integration points with Phase 05 backend.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');

describe('Phase 06 Frontend Verification Suite', () => {

  test('1. Production Build & Bundler Artifacts Exist', () => {
    const distPath = path.join(FRONTEND_ROOT, 'dist');
    assert.strictEqual(fs.existsSync(distPath), true, 'dist/ directory must exist');
    assert.strictEqual(fs.existsSync(path.join(distPath, 'index.html')), true, 'dist/index.html must exist');
    
    const assetsDir = path.join(distPath, 'assets');
    assert.strictEqual(fs.existsSync(assetsDir), true, 'dist/assets directory must exist');
    const assetFiles = fs.readdirSync(assetsDir);
    assert.ok(assetFiles.some(f => f.endsWith('.js')), 'JavaScript bundle must be generated');
    assert.ok(assetFiles.some(f => f.endsWith('.css')), 'CSS bundle must be generated');
  });

  test('2. Key Source Architecture Files Exist', () => {
    const requiredFiles = [
      'src/main.jsx',
      'src/App.jsx',
      'src/services/api.js',
      'src/services/auth.service.js',
      'src/context/AuthContext.jsx',
      'src/hooks/useAuth.js',
      'src/routes/AppRoutes.jsx',
      'src/layouts/DashboardLayout.jsx',
      'src/components/Sidebar/Sidebar.jsx',
      'src/components/Header/Header.jsx',
      'src/components/ProtectedRoute/ProtectedRoute.jsx',
      'src/components/DashboardCard/DashboardCard.jsx',
      'src/components/StatCard/StatCard.jsx',
      'src/components/StatusBadge/StatusBadge.jsx',
      'src/components/PendingFeatureCard/PendingFeatureCard.jsx',
      'src/pages/Login/Login.jsx',
      'src/pages/AdminDashboard/AdminDashboard.jsx',
      'src/pages/AirlineDashboard/AirlineDashboard.jsx',
      'src/pages/AirportDashboard/AirportDashboard.jsx',
      'src/pages/PassengerDashboard/PassengerDashboard.jsx',
      'src/pages/ComingSoon/ComingSoon.jsx',
      'src/pages/Unauthorized/Unauthorized.jsx',
      'src/pages/NotFound/NotFound.jsx',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(FRONTEND_ROOT, relPath);
      assert.strictEqual(fs.existsSync(fullPath), true, `Required file ${relPath} must exist`);
    }
  });

  test('3. API Service Endpoint Contract Matches Phase 05 Backend', () => {
    const authServiceSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/services/auth.service.js'),
      'utf8'
    );

    assert.ok(authServiceSource.includes("'/auth/login'"), 'Must call /auth/login endpoint');
    assert.ok(authServiceSource.includes("'/auth/logout'"), 'Must call /auth/logout endpoint');
    assert.ok(authServiceSource.includes("'/auth/me'"), 'Must call /auth/me endpoint');
    assert.ok(authServiceSource.includes("'/auth/change-password'"), 'Must call /auth/change-password endpoint');
  });

  test('4. API Client Enforces HttpOnly Cookie Transmissions', () => {
    const apiSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/services/api.js'),
      'utf8'
    );

    assert.ok(
      apiSource.includes("credentials: 'include'"),
      "API client must specify credentials: 'include' to transmit session cookies"
    );
    assert.ok(
      !apiSource.includes('localStorage.setItem'),
      'Must NOT store JWT tokens in localStorage for security'
    );
  });

  test('5. Role Navigation Structure Implemented for All 4 Roles', () => {
    const sidebarSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/components/Sidebar/Sidebar.jsx'),
      'utf8'
    );

    assert.ok(sidebarSource.includes("'ADMIN'"), 'Must include ADMIN role navigation');
    assert.ok(sidebarSource.includes("'AIRLINE_STAFF'"), 'Must include AIRLINE_STAFF role navigation');
    assert.ok(sidebarSource.includes("'AIRPORT_STAFF'"), 'Must include AIRPORT_STAFF role navigation');
    assert.ok(sidebarSource.includes("'PASSENGER'"), 'Must include PASSENGER role navigation');

    // Admin nav items
    assert.ok(sidebarSource.includes('/admin/users'), 'Admin must have User Management');
    assert.ok(sidebarSource.includes('/admin/flights'), 'Admin must have Flight Management');
    assert.ok(sidebarSource.includes('/admin/airports'), 'Admin must have Airport Management');
    assert.ok(sidebarSource.includes('/admin/airlines'), 'Admin must have Airline Management');
    assert.ok(sidebarSource.includes('/admin/employees'), 'Admin must have Employee Management');
    assert.ok(sidebarSource.includes('/admin/database'), 'Admin must have Database Monitoring');
    assert.ok(sidebarSource.includes('/admin/settings'), 'Admin must have System Settings');

    // Airline nav items
    assert.ok(sidebarSource.includes('/airline/my-airline'), 'Airline staff must have My Airline');
    assert.ok(sidebarSource.includes('/airline/flights'), 'Airline staff must have Flight Management');
    assert.ok(sidebarSource.includes('/airline/passengers'), 'Airline staff must have Passenger Management');
    assert.ok(sidebarSource.includes('/airline/bookings'), 'Airline staff must have Booking Management');
    assert.ok(sidebarSource.includes('/airline/tickets'), 'Airline staff must have Ticket Information');

    // Airport nav items
    assert.ok(sidebarSource.includes('/airport/flights'), 'Airport staff must have Flight Operations');
    assert.ok(sidebarSource.includes('/airport/gates'), 'Airport staff must have Gate Management');
    assert.ok(sidebarSource.includes('/airport/checkin'), 'Airport staff must have Check-in Operations');
    assert.ok(sidebarSource.includes('/airport/baggage'), 'Airport staff must have Baggage Management');
    assert.ok(sidebarSource.includes('/airport/employees'), 'Airport staff must have Employee Operations');

    // Passenger nav items
    assert.ok(sidebarSource.includes('/passenger/search'), 'Passenger must have Search Flights');
    assert.ok(sidebarSource.includes('/passenger/bookings'), 'Passenger must have My Bookings');
    assert.ok(sidebarSource.includes('/passenger/tickets'), 'Passenger must have My Tickets');
    assert.ok(sidebarSource.includes('/passenger/checkin'), 'Passenger must have Web Check-in');
    assert.ok(sidebarSource.includes('/passenger/travel-info'), 'Passenger must have Travel Information');
    assert.ok(sidebarSource.includes('/passenger/profile'), 'Passenger must have My Profile');
  });

  test('6. Route Protection and Unauthorized Handling', () => {
    const routesSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/routes/AppRoutes.jsx'),
      'utf8'
    );

    assert.ok(routesSource.includes('<ProtectedRoute allowedRoles={[\'ADMIN\']}>'), 'Admin routes must be protected');
    assert.ok(routesSource.includes('<ProtectedRoute allowedRoles={[\'AIRLINE_STAFF\']}>'), 'Airline routes must be protected');
    assert.ok(routesSource.includes('<ProtectedRoute allowedRoles={[\'AIRPORT_STAFF\']}>'), 'Airport routes must be protected');
    assert.ok(routesSource.includes('<ProtectedRoute allowedRoles={[\'PASSENGER\']}>'), 'Passenger routes must be protected');
    assert.ok(routesSource.includes('/unauthorized'), 'Unauthorized route must be registered');
  });

  test('7. Phase 07 Operations Service Contract & Dashboard Integration', () => {
    const opsServiceSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/services/operations.service.js'),
      'utf8'
    );
    assert.ok(opsServiceSource.includes('getAirports'), 'operationsService must provide getAirports');
    assert.ok(opsServiceSource.includes('getFlights'), 'operationsService must provide getFlights');
    assert.ok(opsServiceSource.includes('getBookings'), 'operationsService must provide getBookings');
    assert.ok(opsServiceSource.includes('getBaggage'), 'operationsService must provide getBaggage');
    assert.ok(opsServiceSource.includes('getGates'), 'operationsService must provide getGates');

    const adminSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/pages/AdminDashboard/AdminDashboard.jsx'),
      'utf8'
    );
    const airlineSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/pages/AirlineDashboard/AirlineDashboard.jsx'),
      'utf8'
    );
    const airportSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/pages/AirportDashboard/AirportDashboard.jsx'),
      'utf8'
    );
    const passengerSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/pages/PassengerDashboard/PassengerDashboard.jsx'),
      'utf8'
    );

    assert.ok(
      adminSource.includes('operationsService'),
      'Admin dashboard must integrate with operationsService'
    );
    assert.ok(
      airlineSource.includes('operationsService'),
      'Airline dashboard must integrate with operationsService'
    );
    assert.ok(
      airportSource.includes('operationsService'),
      'Airport dashboard must integrate with operationsService'
    );
    assert.ok(
      passengerSource.includes('operationsService'),
      'Passenger dashboard must integrate with operationsService'
    );
  });

  test('8. Phase 08 Autonomous Airport Data Engine (AADE) Integration', () => {
    const aadeServicePath = path.join(FRONTEND_ROOT, 'src/services/aade.service.js');
    assert.strictEqual(fs.existsSync(aadeServicePath), true, 'aade.service.js must exist');
    const aadeServiceSource = fs.readFileSync(aadeServicePath, 'utf8');

    assert.ok(aadeServiceSource.includes('getStatus'), 'aadeService must have getStatus');
    assert.ok(aadeServiceSource.includes('getHealth'), 'aadeService must have getHealth');
    assert.ok(aadeServiceSource.includes('runCycle'), 'aadeService must have runCycle');
    assert.ok(aadeServiceSource.includes('getAlerts'), 'aadeService must have getAlerts');
    assert.ok(aadeServiceSource.includes('getConflicts'), 'aadeService must have getConflicts');
    assert.ok(aadeServiceSource.includes('getUtilization'), 'aadeService must have getUtilization');
    assert.ok(aadeServiceSource.includes('getRecommendations'), 'aadeService must have getRecommendations');
    assert.ok(aadeServiceSource.includes('getApprovals'), 'aadeService must have getApprovals');
    assert.ok(aadeServiceSource.includes('approveAction'), 'aadeService must have approveAction');
    assert.ok(aadeServiceSource.includes('rejectAction'), 'aadeService must have rejectAction');
    assert.ok(aadeServiceSource.includes('getAuditLogs'), 'aadeService must have getAuditLogs');

    const aadeDashboardPath = path.join(FRONTEND_ROOT, 'src/pages/AadeDashboard/AadeDashboard.jsx');
    assert.strictEqual(fs.existsSync(aadeDashboardPath), true, 'AadeDashboard.jsx must exist');

    const sidebarSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/components/Sidebar/Sidebar.jsx'),
      'utf8'
    );
    assert.ok(sidebarSource.includes('Autonomous Data Engine'), 'Sidebar must include Autonomous Data Engine link');

    const routesSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/routes/AppRoutes.jsx'),
      'utf8'
    );
    assert.ok(routesSource.includes('AadeDashboard'), 'AppRoutes must include AadeDashboard');
  });

  test('9. Phase 09 Multi-Language Algorithms & Java OOP Services Integration', () => {
    const integrationServicePath = path.join(FRONTEND_ROOT, 'src/services/integration.service.js');
    assert.strictEqual(fs.existsSync(integrationServicePath), true, 'integration.service.js must exist');
    const integrationSource = fs.readFileSync(integrationServicePath, 'utf8');

    assert.ok(integrationSource.includes('getStatus'), 'integrationService must have getStatus');
    assert.ok(integrationSource.includes('getGateAllocation'), 'integrationService must have getGateAllocation');
    assert.ok(integrationSource.includes('getRunwayQueue'), 'integrationService must have getRunwayQueue');
    assert.ok(integrationSource.includes('getBaggageRouting'), 'integrationService must have getBaggageRouting');
    assert.ok(integrationSource.includes('getJavaBookings'), 'integrationService must have getJavaBookings');
    assert.ok(integrationSource.includes('calculatePricing'), 'integrationService must have calculatePricing');
    assert.ok(integrationSource.includes('transitionJavaBooking'), 'integrationService must have transitionJavaBooking');

    const algoDashboardPath = path.join(FRONTEND_ROOT, 'src/pages/AlgorithmsDashboard/AlgorithmsDashboard.jsx');
    assert.strictEqual(fs.existsSync(algoDashboardPath), true, 'AlgorithmsDashboard.jsx must exist');

    const sidebarSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/components/Sidebar/Sidebar.jsx'),
      'utf8'
    );
    assert.ok(sidebarSource.includes('C & Java Algorithms'), 'Sidebar must include C & Java Algorithms link');

    const routesSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/routes/AppRoutes.jsx'),
      'utf8'
    );
    assert.ok(routesSource.includes('AlgorithmsDashboard'), 'AppRoutes must include AlgorithmsDashboard');
  });
});
