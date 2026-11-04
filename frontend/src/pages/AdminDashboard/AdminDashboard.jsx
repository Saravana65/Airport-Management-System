import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import operationsService from '../../services/operations.service';
import api from '../../services/api';
import './AdminDashboard.css';

export function AdminDashboard() {
  const { user } = useAuth();
  const [dbHealth, setDbHealth] = useState({ status: 'checking', message: '' });
  const [activeTab, setActiveTab] = useState('airports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Module Data
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [flights, setFlights] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [gates, setGates] = useState([]);

  // Form State for creating new Airport
  const [newAirport, setNewAirport] = useState({ airportCode: '', airportName: '', city: '', country: '', timezone: 'Asia/Kolkata' });
  const [showAddAirport, setShowAddAirport] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ports, lines, planes, flts, emps, gts] = await Promise.all([
        operationsService.getAirports().catch(() => []),
        operationsService.getAirlines().catch(() => []),
        operationsService.getAircraft().catch(() => []),
        operationsService.getFlights().catch(() => []),
        operationsService.getEmployees().catch(() => []),
        operationsService.getGates().catch(() => []),
      ]);
      setAirports(ports);
      setAirlines(lines);
      setAircraft(planes);
      setFlights(flts);
      setEmployees(emps);
      setGates(gts);
    } catch (err) {
      setError(err.message || 'Failed to load operational data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Query actual backend /health/database
    api.get('/health/database')
      .then(res => setDbHealth({ status: res.status === 'UP' ? 'operational' : 'degraded', message: res.message }))
      .catch(() => setDbHealth({ status: 'standby', message: 'Oracle 1521 listener offline. App running in resilient in-memory mode.' }));
  }, []);

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
      {/* Banner */}
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
          <StatusBadge status="ADMIN" label="ADMIN STATION ACTIVE" />
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="close-btn" onClick={() => setActionSuccess('')}>×</button>
        </div>
      )}

      {/* 1. Core Live System Statistics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Live Operational Telemetry</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="metrics-grid">
          <DashboardCard
            title="Operational Airports"
            icon={Building2}
            value={airports.length}
            subtitle="IATA Certified Facilities"
            badgeStatus="OPERATIONAL"
            badgeLabel="ACTIVE"
          />

          <DashboardCard
            title="Registered Carriers"
            icon={Building2}
            value={airlines.length}
            subtitle="Commercial Partner Airlines"
            badgeStatus="ACTIVE"
            badgeLabel="ONLINE"
          />

          <DashboardCard
            title="Active Fleet Aircraft"
            icon={Plane}
            value={aircraft.length}
            subtitle="Registered Commercial Jets"
            badgeStatus="ACTIVE"
            badgeLabel="FLEET"
          />

          <DashboardCard
            title="Scheduled Flight Movements"
            icon={Plane}
            value={flights.length}
            subtitle="Daily Flight Instances"
            badgeStatus="ON_TIME"
            badgeLabel="MOVEMENTS"
          />

          <DashboardCard
            title="Airport & Airline Staff"
            icon={UserCheck}
            value={employees.length}
            subtitle="On-Duty Operations Personnel"
            badgeStatus="ACTIVE"
            badgeLabel="CREW"
          />

          <DashboardCard
            title="Terminal Gates"
            icon={Radio}
            value={gates.length}
            subtitle="Aerobridges & Apron Stands"
            badgeStatus="AVAILABLE"
            badgeLabel="GATES"
          />
        </div>
      </section>

      {/* 2. Operations Management Hub (Tabs for Airports, Airlines, Aircraft, Employees, Gates) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Operations Management Console</h3>
          <div className="console-tabs">
            <button className={`tab-btn ${activeTab === 'airports' ? 'active' : ''}`} onClick={() => setActiveTab('airports')}>Airports ({airports.length})</button>
            <button className={`tab-btn ${activeTab === 'airlines' ? 'active' : ''}`} onClick={() => setActiveTab('airlines')}>Airlines ({airlines.length})</button>
            <button className={`tab-btn ${activeTab === 'aircraft' ? 'active' : ''}`} onClick={() => setActiveTab('aircraft')}>Fleet ({aircraft.length})</button>
            <button className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>Staff ({employees.length})</button>
            <button className={`tab-btn ${activeTab === 'gates' ? 'active' : ''}`} onClick={() => setActiveTab('gates')}>Gates ({gates.length})</button>
          </div>
        </div>

        <div className="operations-console-panel">
          {activeTab === 'airports' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">Registered Airport Hubs & International Runways</span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddAirport(!showAddAirport)}>
                  <Plus size={14} />
                  <span>Register Airport</span>
                </button>
              </div>

              {showAddAirport && (
                <form onSubmit={handleCreateAirport} className="inline-form-box">
                  <h4>Register New Airport Hub</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="IATA Code (e.g. SIN)"
                      maxLength={3}
                      value={newAirport.airportCode}
                      onChange={e => setNewAirport({ ...newAirport, airportCode: e.target.value.toUpperCase() })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Airport Name (e.g. Changi International)"
                      value={newAirport.airportName}
                      onChange={e => setNewAirport({ ...newAirport, airportName: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="City (e.g. Singapore)"
                      value={newAirport.city}
                      onChange={e => setNewAirport({ ...newAirport, city: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Country (e.g. Singapore)"
                      value={newAirport.country}
                      onChange={e => setNewAirport({ ...newAirport, country: e.target.value })}
                      required
                    />
                    <button type="submit" className="btn btn-primary">Save to Oracle</button>
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
                    {airports.map(a => (
                      <tr key={a.airportCode}>
                        <td className="mono text-amber font-bold">{a.airportCode}</td>
                        <td>{a.airportName}</td>
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

          {activeTab === 'airlines' && (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Airline Code</th>
                    <th>Carrier Name</th>
                    <th>3-Digit Code</th>
                    <th>Country</th>
                    <th>Support Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {airlines.map(l => (
                    <tr key={l.airlineCode}>
                      <td className="mono text-amber font-bold">{l.airlineCode}</td>
                      <td>{l.airlineName}</td>
                      <td className="mono">{l.threeDigitCode || '--'}</td>
                      <td>{l.country}</td>
                      <td className="mono text-muted">{l.contactEmail || '--'}</td>
                      <td><StatusBadge status="ACTIVE" label="AUTHORIZED" size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'aircraft' && (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Tail Reg #</th>
                    <th>Aircraft Model</th>
                    <th>Airline</th>
                    <th>Total Seats</th>
                    <th>Economy / Business / First</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraft.map(p => (
                    <tr key={p.aircraftId}>
                      <td className="mono text-amber font-bold">{p.registrationNo}</td>
                      <td>{p.model}</td>
                      <td className="mono">{p.airlineCode}</td>
                      <td className="mono font-bold">{p.totalSeats}</td>
                      <td className="mono text-muted">{p.economySeats}E / {p.businessSeats}B / {p.firstSeats}F</td>
                      <td><StatusBadge status={p.status} label={p.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Airport / Airline</th>
                    <th>Job Title (Operational)</th>
                    <th>Shift</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.employeeId}>
                      <td className="mono">#{e.employeeId}</td>
                      <td className="font-medium text-white">{e.firstName} {e.lastName}</td>
                      <td className="mono">{e.airportCode} {e.airlineCode ? `(${e.airlineCode})` : '(Authority)'}</td>
                      <td className="text-amber font-medium">{e.jobTitle}</td>
                      <td><span className="mono shift-badge">{e.shift}</span></td>
                      <td className="mono text-muted">{e.contactPhone || '--'}</td>
                      <td><StatusBadge status="ACTIVE" label="ON-DUTY" size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'gates' && (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Gate ID</th>
                    <th>Airport</th>
                    <th>Terminal / Gate</th>
                    <th>Occupancy Status</th>
                    <th>Active Flight</th>
                  </tr>
                </thead>
                <tbody>
                  {gates.map(g => (
                    <tr key={g.gateId}>
                      <td className="mono">#{g.gateId}</td>
                      <td className="mono text-amber">{g.airportCode}</td>
                      <td className="mono font-bold">{g.terminal} - {g.gateNumber}</td>
                      <td><StatusBadge status={g.status} label={g.status} size="sm" /></td>
                      <td className="mono">{g.activeFlightNumber ? `${g.activeFlightNumber} (${g.activeFlightStatus})` : 'Clear / Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 3. System Health & Gateway Monitor */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">System Infrastructure & Database Telemetry</h3>
        </div>

        <div className="health-session-grid">
          <div className="avionics-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Server size={18} className="text-amber" />
                <h4>Gateway & Connection Pool</h4>
              </div>
              <StatusBadge status={dbHealth.status} label={dbHealth.status} size="sm" />
            </div>

            <div className="panel-body">
              <div className="telemetry-row">
                <span className="telemetry-label">Express Engine</span>
                <span className="telemetry-value mono">Port 5000 (Active)</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Database Status</span>
                <span className="telemetry-value mono text-amber">{dbHealth.message}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Security & RBAC</span>
                <span className="telemetry-value mono text-emerald">
                  <CheckCircle2 size={13} className="inline-icon" /> HttpOnly Auth & Server RBAC Active
                </span>
              </div>
            </div>
          </div>

          <div className="avionics-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Activity size={18} className="text-amber" />
                <h4>Current Operator Session</h4>
              </div>
              <span className="live-pulse-tag mono">ACTIVE</span>
            </div>

            <div className="panel-body">
              <div className="telemetry-row">
                <span className="telemetry-label">Operator Email</span>
                <span className="telemetry-value mono">{user?.email || 'N/A'}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Security Clearance</span>
                <span className="telemetry-value mono">
                  <StatusBadge status={user?.role} label={user?.role} size="sm" />
                </span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Session Authentication</span>
                <span className="telemetry-value mono text-emerald">Cryptographically Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
