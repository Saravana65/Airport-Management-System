import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Users,
  Building2,
  Shield,
  Activity,
  Ticket,
  Database,
  Radio,
  Server,
  Terminal,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  UserCheck,
  Plus,
  RefreshCw,
  Search,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import UltraQualityDataTable from '../../components/ui/ultra-quality-data-table';
import operationsService from '../../services/operations.service';
import api from '../../services/api';
import './AdminDashboard.css';

export function AdminDashboard({ initialTab = 'overview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbHealth, setDbHealth] = useState({ status: 'checking', message: '' });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Module Data
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [flights, setFlights] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [gates, setGates] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalPassengers: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    checkedInPassengers: 0,
    delayedFlights: 0,
    availableSeats: 0,
  });

  // Flight Status Modal State for Admin Dispatch
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [newStatus, setNewStatus] = useState('BOARDING');
  const [statusReason, setStatusReason] = useState('');
  const [estimatedDeparture, setEstimatedDeparture] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');

  // Form State for creating new Airport
  const [newAirport, setNewAirport] = useState({
    airportCode: '',
    airportName: '',
    city: '',
    country: '',
    timezone: 'Asia/Kolkata',
  });
  const [showAddAirport, setShowAddAirport] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ports, lines, planes, flts, emps, gts, usrRes, bks, statsRes] = await Promise.all([
        operationsService.getAirports().catch(() => []),
        operationsService.getAirlines().catch(() => []),
        operationsService.getAircraft().catch(() => []),
        operationsService.getFlights().catch(() => []),
        operationsService.getEmployees().catch(() => []),
        operationsService.getGates().catch(() => []),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
        operationsService.getBookings().catch(() => []),
        operationsService.getAdminStats().catch(() => null),
      ]);
      setAirports(ports);
      setAirlines(lines);
      setAircraft(planes);
      setFlights(flts);
      setEmployees(emps);
      setGates(gts);
      setUsersList(usrRes?.data?.users || usrRes?.users || []);
      setBookingsList(bks);
      if (statsRes) {
        setStats({
          totalFlights: statsRes.totalFlights ?? flts.length,
          totalPassengers: statsRes.totalPassengers ?? 0,
          totalBookings: statsRes.totalBookings ?? bks.length,
          confirmedBookings: statsRes.confirmedBookings ?? bks.filter(b => b.status === 'CONFIRMED').length,
          cancelledBookings: statsRes.cancelledBookings ?? bks.filter(b => b.status === 'CANCELLED').length,
          checkedInPassengers: statsRes.checkedInPassengers ?? 0,
          delayedFlights: statsRes.delayedFlights ?? flts.filter(f => f.status === 'DELAYED').length,
          availableSeats: statsRes.availableSeats ?? 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load operational data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadData();
    api.get('/health/database')
      .then(res => setDbHealth({ status: res.status === 'UP' ? 'operational' : 'degraded', message: res.message }))
      .catch(() => setDbHealth({ status: 'standby', message: 'Oracle listener offline. Resilient in-memory mode active.' }));
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/admin/dashboard');
    else navigate(`/admin/${tab}`);
  };

  const handleOpenStatusModal = (flight) => {
    setSelectedFlight(flight);
    setNewStatus(flight.status || 'BOARDING');
    setStatusReason(flight.remarks || '');
    const toInputFormat = (dt) => {
      if (!dt) return '';
      const s = dt.replace(' ', 'T');
      return s.length >= 16 ? s.substring(0, 16) : s;
    };
    setEstimatedDeparture(toInputFormat(flight.estimatedDeparture || flight.scheduledDeparture));
    setEstimatedArrival(toInputFormat(flight.estimatedArrival || flight.scheduledArrival));
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedFlight) return;
    try {
      await operationsService.updateFlightStatus(
        selectedFlight.flightInstanceId,
        newStatus,
        statusReason || `Updated by Administrator ${user?.email}`,
        {
          estimatedDeparture: estimatedDeparture ? estimatedDeparture.replace('T', ' ') + (estimatedDeparture.length === 16 ? ':00' : '') : null,
          estimatedArrival: estimatedArrival ? estimatedArrival.replace('T', ' ') + (estimatedArrival.length === 16 ? ':00' : '') : null,
        }
      );
      setActionSuccess(`Flight ${selectedFlight.flightNumber} status and estimated timings successfully saved!`);
      setStatusModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCreateAirport = async (e) => {
    e.preventDefault();
    try {
      await operationsService.createAirport(newAirport);
      setActionSuccess(`Airport ${newAirport.airportCode.toUpperCase()} successfully registered!`);
      setNewAirport({ airportCode: '', airportName: '', city: '', country: '', timezone: 'Asia/Kolkata' });
      setShowAddAirport(false);
      loadData();
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* 1. Sleek Navigation Tabs */}
      <nav className="admin-nav-bar" aria-label="Admin Navigation">
        <button
          className={`admin-nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <Activity size={15} />
          <span>Overview</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'flights' || activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('flights')}
        >
          <Plane size={15} />
          <span>Flights</span>
          <span className="pill-count">{flights.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'bookings' || activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          <Ticket size={15} />
          <span>Bookings & Tickets</span>
          <span className="pill-count">{bookingsList.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'airports' ? 'active' : ''}`}
          onClick={() => handleTabChange('airports')}
        >
          <Building2 size={15} />
          <span>Airports</span>
          <span className="pill-count">{airports.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'airlines' ? 'active' : ''}`}
          onClick={() => handleTabChange('airlines')}
        >
          <Briefcase size={15} />
          <span>Airlines</span>
          <span className="pill-count">{airlines.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'gates' ? 'active' : ''}`}
          onClick={() => handleTabChange('gates')}
        >
          <Radio size={15} />
          <span>Gates</span>
          <span className="pill-count">{gates.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <Users size={15} />
          <span>Users</span>
          <span className="pill-count">{usersList.length}</span>
        </button>
        <button
          className={`admin-nav-pill ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => handleTabChange('employees')}
        >
          <UserCheck size={15} />
          <span>Staff</span>
          <span className="pill-count">{employees.length}</span>
        </button>
      </nav>

      {/* Global Action Success Banner */}
      {actionSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="close-btn" onClick={() => setActionSuccess('')}>×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW ONLY (Metrics cards appear ONLY here) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="admin-view-container">
          {/* Welcome Banner */}
          <div className="dashboard-welcome-banner">
            <div className="banner-left">
              <div className="banner-icon-box">
                <Shield size={24} className="banner-shield-icon" />
              </div>
              <div>
                <h2 className="banner-title">Administrator Command & Control Center</h2>
                <p className="banner-description">
                  Centralized airport authority platform: System monitoring, user roles, security authorization, and operations management.
                </p>
              </div>
            </div>
            <div className="banner-right">
              <button className="btn btn-secondary btn-sm" onClick={loadData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>

          {/* Core Live System Statistics (EXCLUSIVE TO OVERVIEW) */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Live Operational Database Telemetry</h3>
              <span className="telemetry-pill">MySQL 8.0 Real-Time Queries</span>
            </div>

            <div className="metrics-grid">
              <DashboardCard
                title="Total Flights"
                icon={Plane}
                value={stats.totalFlights}
                subtitle="All Flight Instances in DB"
                badgeStatus="ACTIVE"
                badgeLabel="FLIGHTS"
                onClick={() => handleTabChange('flights')}
              />

              <DashboardCard
                title="Total Passengers"
                icon={Users}
                value={stats.totalPassengers}
                subtitle="Registered Passenger Profiles"
                badgeStatus="OPERATIONAL"
                badgeLabel="PASSENGERS"
                onClick={() => handleTabChange('users')}
              />

              <DashboardCard
                title="Total Bookings"
                icon={Ticket}
                value={stats.totalBookings}
                subtitle="Reservations in Database"
                badgeStatus="ACTIVE"
                badgeLabel="BOOKINGS"
                onClick={() => handleTabChange('bookings')}
              />

              <DashboardCard
                title="Confirmed Bookings"
                icon={CheckCircle2}
                value={stats.confirmedBookings}
                subtitle="Active Confirmed Tickets"
                badgeStatus="CONFIRMED"
                badgeLabel="CONFIRMED"
                onClick={() => handleTabChange('bookings')}
              />

              <DashboardCard
                title="Cancelled Bookings"
                icon={AlertCircle}
                value={stats.cancelledBookings}
                subtitle="Released Inventory Bookings"
                badgeStatus="CANCELLED"
                badgeLabel="CANCELLED"
                onClick={() => handleTabChange('bookings')}
              />

              <DashboardCard
                title="Checked-in Passengers"
                icon={UserCheck}
                value={stats.checkedInPassengers}
                subtitle="Boarding Passes Issued"
                badgeStatus="ACTIVE"
                badgeLabel="CHECKED-IN"
                onClick={() => handleTabChange('bookings')}
              />

              <DashboardCard
                title="Delayed Flights"
                icon={Clock}
                value={stats.delayedFlights}
                subtitle="Flights Delayed in System"
                badgeStatus={stats.delayedFlights > 0 ? "DELAYED" : "ON_TIME"}
                badgeLabel="DELAYED"
                onClick={() => handleTabChange('flights')}
              />

              <DashboardCard
                title="Available Seats"
                icon={Layers}
                value={stats.availableSeats}
                subtitle="Live Unallocated Aircraft Seats"
                badgeStatus="AVAILABLE"
                badgeLabel="SEATS"
                onClick={() => handleTabChange('flights')}
              />
            </div>
          </section>

          {/* Quick Flights Overview Preview */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Active Flights Snapshot</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('flights')}>
                <span>View Full Flight Board</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Flight #</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Gate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.slice(0, 5).map((f) => (
                    <tr key={f.flightInstanceId || f.flightNumber}>
                      <td className="mono font-bold text-navy">{f.flightNumber}</td>
                      <td className="mono">{f.originAirport} → {f.destAirport}</td>
                      <td className="mono text-muted">{f.scheduledDeparture ? new Date(f.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}</td>
                      <td className="mono">{f.gateNumber || 'Assigned'}</td>
                      <td><StatusBadge status={f.status} label={f.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLIGHT MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {(activeTab === 'flights' || activeTab === 'search') && (
        <div className="admin-view-container">
          <UltraQualityDataTable
            title="Commercial Flight Schedules & Fleet Monitoring"
            subtitle="Search scheduled routes, check live departure gates, track delays, and manage real-time status"
            embedded={true}
            onSelectFlight={(f) => handleOpenStatusModal(f)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BOOKINGS & TICKETS MANAGEMENT (DIRECT VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {(activeTab === 'bookings' || activeTab === 'tickets') && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">Passenger Bookings & Electronic Tickets</h2>
              <p className="admin-view-subtitle">
                System-wide reservations, PNR references, passenger manifests, issued tickets, and payment settlement audit trail.
              </p>
            </div>
            <div className="admin-header-actions" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search PNR, flight, traveler..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                }}
              />
              <button className="btn btn-secondary btn-sm" onClick={loadData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>PNR Reference</th>
                  <th>Booking Date</th>
                  <th>Passenger(s)</th>
                  <th>Flight / Route</th>
                  <th>Seat & Class</th>
                  <th>Ticket #</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingsList
                  .filter((b) => {
                    if (!bookingSearch) return true;
                    const q = bookingSearch.toLowerCase();
                    const pnr = (b.bookingReference || '').toLowerCase();
                    const flt = (b.flightNumber || b.tickets?.[0]?.flightNumber || '').toLowerCase();
                    const psg = (b.tickets?.map((t) => t.passengerName).join(' ') || '').toLowerCase();
                    return pnr.includes(q) || flt.includes(q) || psg.includes(q);
                  })
                  .map((b) => (
                    <tr key={b.bookingId}>
                      <td className="mono font-bold text-navy">{b.bookingReference}</td>
                      <td className="mono text-muted">{b.bookingDate}</td>
                      <td className="font-medium">
                        {b.tickets?.map((t) => t.passengerName || 'Passenger').join(', ') || 'Traveler'}
                      </td>
                      <td className="mono font-bold">
                        {b.flightNumber || b.tickets?.[0]?.flightNumber || 'FLT'}
                      </td>
                      <td className="mono text-navy font-medium">
                        {b.tickets?.map((t) => `${t.seatNumber || 'Unassigned'} (${t.cabinClass || 'ECONOMY'})`).join(', ') || '--'}
                      </td>
                      <td className="mono text-muted">
                        {b.tickets?.map((t) => t.ticketNumber).join(', ') || `TKT-${b.bookingId}`}
                      </td>
                      <td className="mono font-bold text-emerald">₹{b.totalAmount}</td>
                      <td>
                        <StatusBadge
                          status={b.paymentStatus === 'COMPLETED' ? 'CONFIRMED' : b.paymentStatus}
                          label={b.paymentStatus}
                          size="sm"
                        />
                      </td>
                      <td>
                        <StatusBadge status={b.status} label={b.status} size="sm" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AIRPORT MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'airports' && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">Airport Facilities Management</h2>
              <p className="admin-view-subtitle">
                Registered airport hubs, international runways, IATA codes, and facility timezones.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddAirport(!showAddAirport)}>
              <Plus size={14} />
              <span>Register New Airport</span>
            </button>
          </div>

          {showAddAirport && (
            <form onSubmit={handleCreateAirport} className="inline-form-box">
              <h4>Register New Airport Facility</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="IATA Code (e.g. SIN)"
                  maxLength={3}
                  value={newAirport.airportCode}
                  onChange={(e) => setNewAirport({ ...newAirport, airportCode: e.target.value.toUpperCase() })}
                  required
                />
                <input
                  type="text"
                  placeholder="Airport Name (e.g. Changi International)"
                  value={newAirport.airportName}
                  onChange={(e) => setNewAirport({ ...newAirport, airportName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="City (e.g. Singapore)"
                  value={newAirport.city}
                  onChange={(e) => setNewAirport({ ...newAirport, city: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Country (e.g. Singapore)"
                  value={newAirport.country}
                  onChange={(e) => setNewAirport({ ...newAirport, country: e.target.value })}
                  required
                />
                <button type="submit" className="btn btn-primary">Save Facility</button>
              </div>
            </form>
          )}

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>IATA Code</th>
                  <th>Airport Name</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Timezone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {airports.map((a) => (
                  <tr key={a.airportCode}>
                    <td className="mono font-bold text-navy">{a.airportCode}</td>
                    <td className="font-medium">{a.airportName}</td>
                    <td>{a.city}</td>
                    <td>{a.country}</td>
                    <td className="mono text-muted">{a.timezone}</td>
                    <td><StatusBadge status="ACTIVE" label="OPERATIONAL" size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AIRLINE MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'airlines' && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">Commercial Airline Carriers</h2>
              <p className="admin-view-subtitle">
                Authorized partner airlines, accounting codes, sovereign registration, and operations contact emails.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Airline Code</th>
                  <th>Carrier Name</th>
                  <th>3-Digit Accounting Code</th>
                  <th>Country</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {airlines.map((l) => (
                  <tr key={l.airlineCode}>
                    <td className="mono font-bold text-navy">{l.airlineCode}</td>
                    <td className="font-medium">{l.airlineName}</td>
                    <td className="mono">{l.threeDigitCode || '--'}</td>
                    <td>{l.country}</td>
                    <td className="mono text-muted">{l.contactEmail || '--'}</td>
                    <td><StatusBadge status="ACTIVE" label="AUTHORIZED" size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USER MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">User Account & Role Management</h2>
              <p className="admin-view-subtitle">
                System user directory, role-based access clearances, and account security statuses.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.userId}>
                    <td className="mono font-bold text-navy">#{u.userId}</td>
                    <td className="font-medium">{u.email}</td>
                    <td><StatusBadge status={u.role} label={u.role} size="sm" /></td>
                    <td>
                      <StatusBadge
                        status={u.isActive === 'Y' ? 'ACTIVE' : 'INACTIVE'}
                        label={u.isActive === 'Y' ? 'ACTIVE' : 'DEACTIVATED'}
                        size="sm"
                      />
                    </td>
                    <td className="mono text-muted">{u.createdAt || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: EMPLOYEE MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">Airport & Airline Staff Directory</h2>
              <p className="admin-view-subtitle">
                Operational personnel, job duties, active shift schedules, and duty station hubs.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Assigned Hub / Carrier</th>
                  <th>Operational Job Title</th>
                  <th>Duty Shift</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.employeeId}>
                    <td className="mono font-bold text-navy">#{e.employeeId}</td>
                    <td className="font-medium">{e.firstName} {e.lastName}</td>
                    <td className="mono">{e.airportCode} {e.airlineCode ? `(${e.airlineCode})` : '(Airport Authority)'}</td>
                    <td className="font-medium text-navy">{e.jobTitle}</td>
                    <td><span className="mono shift-badge">{e.shift}</span></td>
                    <td className="mono text-muted">{e.contactPhone || '--'}</td>
                    <td><StatusBadge status="ACTIVE" label="ON-DUTY" size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GATE MANAGEMENT (DIRECT TABLE VIEW, NO TELEMETRY CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'gates' && (
        <div className="admin-view-container">
          <div className="admin-view-header">
            <div>
              <h2 className="admin-view-title">Terminal Gates & Aerobridges</h2>
              <p className="admin-view-subtitle">
                Aerobridge stands, gate availability, and real-time aircraft docking status.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Gate ID</th>
                  <th>Airport Hub</th>
                  <th>Terminal / Gate</th>
                  <th>Occupancy Status</th>
                  <th>Docked Flight</th>
                </tr>
              </thead>
              <tbody>
                {gates.map((g) => (
                  <tr key={g.gateId}>
                    <td className="mono font-bold text-navy">#{g.gateId}</td>
                    <td className="mono font-medium">{g.airportCode}</td>
                    <td className="mono font-bold text-navy">{g.terminal} - {g.gateNumber}</td>
                    <td><StatusBadge status={g.status} label={g.status} size="sm" /></td>
                    <td className="mono">{g.activeFlightNumber ? `${g.activeFlightNumber} (${g.activeFlightStatus})` : 'Available / Clear'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN FLIGHT STATUS & TIMETABLE DISPATCH MODAL */}
      {statusModalOpen && selectedFlight && (
        <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Flight Operations Dispatch: <span className="mono text-navy">{selectedFlight.flightNumber}</span>
              </h3>
              <button className="modal-close" onClick={() => setStatusModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Flight Movement Route</label>
                  <p className="mono text-navy">
                    {selectedFlight.originAirport} → {selectedFlight.destAirport} (Scheduled: {selectedFlight.scheduledDepartureTime || selectedFlight.scheduledDeparture})
                  </p>
                </div>

                <div className="form-group">
                  <label>Operational Status State Transition</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="SCHEDULED">SCHEDULED (Normal)</option>
                    <option value="BOARDING">BOARDING (Gate Active)</option>
                    <option value="DEPARTED">DEPARTED (Airborne)</option>
                    <option value="ARRIVED">ARRIVED (Touchdown)</option>
                    <option value="DELAYED">DELAYED (Holding Pattern)</option>
                    <option value="CANCELLED">CANCELLED (Grounded)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Manual Estimated Departure Time</label>
                  <input
                    type="datetime-local"
                    value={estimatedDeparture}
                    onChange={(e) => setEstimatedDeparture(e.target.value)}
                  />
                  <small style={{ color: '#64748B', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    Overrides automated calculation and recalculates delay duration
                  </small>
                </div>

                <div className="form-group">
                  <label>Manual Estimated Arrival Time</label>
                  <input
                    type="datetime-local"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                  />
                  <small style={{ color: '#64748B', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    Projected arrival timestamp
                  </small>
                </div>

                <div className="form-group">
                  <label>Operational Remarks / Air Traffic Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Runway congestion or weather delay"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Dispatch Timetable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
