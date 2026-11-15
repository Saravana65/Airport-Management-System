import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Users,
  Building2,
  Shield,
  Activity,
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
      const [ports, lines, planes, flts, emps, gts, usrRes] = await Promise.all([
        operationsService.getAirports().catch(() => []),
        operationsService.getAirlines().catch(() => []),
        operationsService.getAircraft().catch(() => []),
        operationsService.getFlights().catch(() => []),
        operationsService.getEmployees().catch(() => []),
        operationsService.getGates().catch(() => []),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
      ]);
      setAirports(ports);
      setAirlines(lines);
      setAircraft(planes);
      setFlights(flts);
      setEmployees(emps);
      setGates(gts);
      setUsersList(usrRes?.data?.users || usrRes?.users || []);
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
          className={`admin-nav-pill ${activeTab === 'flights' ? 'active' : ''}`}
          onClick={() => handleTabChange('flights')}
        >
          <Plane size={15} />
          <span>Flights</span>
          <span className="pill-count">{flights.length}</span>
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
        <button
          className={`admin-nav-pill ${activeTab === 'gates' ? 'active' : ''}`}
          onClick={() => handleTabChange('gates')}
        >
          <Radio size={15} />
          <span>Gates</span>
          <span className="pill-count">{gates.length}</span>
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
              <h3 className="section-title">Live Operational Telemetry</h3>
            </div>

            <div className="metrics-grid">
              <DashboardCard
                title="Operational Airports"
                icon={Building2}
                value={airports.length}
                subtitle="IATA Certified Facilities"
                badgeStatus="OPERATIONAL"
                badgeLabel="ACTIVE"
                onClick={() => handleTabChange('airports')}
              />

              <DashboardCard
                title="Registered Carriers"
                icon={Building2}
                value={airlines.length}
                subtitle="Commercial Partner Airlines"
                badgeStatus="ACTIVE"
                badgeLabel="ONLINE"
                onClick={() => handleTabChange('airlines')}
              />

              <DashboardCard
                title="Active Fleet Aircraft"
                icon={Plane}
                value={aircraft.length}
                subtitle="Registered Commercial Jets"
                badgeStatus="ACTIVE"
                badgeLabel="FLEET"
                onClick={() => handleTabChange('flights')}
              />

              <DashboardCard
                title="Scheduled Flight Movements"
                icon={Plane}
                value={flights.length}
                subtitle="Daily Flight Instances"
                badgeStatus="ON_TIME"
                badgeLabel="MOVEMENTS"
                onClick={() => handleTabChange('flights')}
              />

              <DashboardCard
                title="Airport & Airline Staff"
                icon={UserCheck}
                value={employees.length}
                subtitle="On-Duty Operations Personnel"
                badgeStatus="ACTIVE"
                badgeLabel="CREW"
                onClick={() => handleTabChange('employees')}
              />

              <DashboardCard
                title="Terminal Gates"
                icon={Radio}
                value={gates.length}
                subtitle="Aerobridges & Apron Stands"
                badgeStatus="AVAILABLE"
                badgeLabel="GATES"
                onClick={() => handleTabChange('gates')}
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
      {activeTab === 'flights' && (
        <div className="admin-view-container">
          <UltraQualityDataTable
            title="Commercial Flight Schedules & Fleet Monitoring"
            subtitle="Search scheduled routes, check live departure gates, track delays, and manage real-time status"
            embedded={true}
          />
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
    </div>
  );
}

export default AdminDashboard;
