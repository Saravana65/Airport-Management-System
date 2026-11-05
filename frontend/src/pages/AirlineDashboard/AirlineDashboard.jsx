import React, { useState, useEffect } from 'react';
import {
  Plane,
  Users,
  Ticket,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import operationsService from '../../services/operations.service';
import './AirlineDashboard.css';

export function AirlineDashboard({ initialTab = 'dispatch' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Live Module Data
  const [flights, setFlights] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modal State for Status Update
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [newStatus, setNewStatus] = useState('BOARDING');
  const [statusReason, setStatusReason] = useState('');

  // Form State for Scheduling New Flight
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlightData, setNewFlightData] = useState({
    flightNumber: '',
    originAirport: 'DEL',
    destAirport: 'BOM',
    scheduledDepartureTime: '10:00',
    scheduledArrivalTime: '12:15',
    baseFare: 4500,
  });

  const loadAirlineData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [flts, psgs, bks] = await Promise.all([
        operationsService.getFlights().catch(() => []),
        operationsService.getPassengers().catch(() => []),
        operationsService.getBookings().catch(() => []),
      ]);
      setFlights(flts);
      setPassengers(psgs);
      setBookings(bks);
    } catch (err) {
      setError(err.message || 'Failed to load carrier operational feeds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirlineData();
  }, []);

  const handleOpenStatusModal = (flight) => {
    setSelectedFlight(flight);
    setNewStatus(flight.status || 'BOARDING');
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedFlight) return;
    try {
      await operationsService.updateFlightStatus(
        selectedFlight.flightInstanceId,
        newStatus,
        statusReason || `Updated by dispatcher ${user?.email}`
      );
      setActionSuccess(`Flight ${selectedFlight.flightNumber} status transitioned to ${newStatus}!`);
      setStatusModalOpen(false);
      loadAirlineData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      await operationsService.createFlight(newFlightData);
      setActionSuccess(`Flight ${newFlightData.flightNumber.toUpperCase()} scheduled successfully!`);
      setNewFlightData({
        flightNumber: '',
        originAirport: 'DEL',
        destAirport: 'BOM',
        scheduledDepartureTime: '10:00',
        scheduledArrivalTime: '12:15',
        baseFare: 4500,
      });
      setShowAddFlight(false);
      loadAirlineData();
    } catch (err) {
      alert(`Flight creation failed: ${err.message}`);
    }
  };

  return (
    <div className="airline-dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner airline-banner">
        <div className="banner-left">
          <div className="banner-icon-box airline-icon-box">
            <Building2 size={24} className="banner-airline-icon" />
          </div>
          <div>
            <h2 className="banner-title">Airline Operations & Dispatch Desk</h2>
            <p className="banner-description">
              Carrier Dispatch console: Fleet management, scheduled departures, passenger manifests, and reservation management.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="AIRLINE_STAFF" label="AIRLINE DESK ONLINE" />
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="close-btn" onClick={() => setActionSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* 1. Core Carrier Metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Carrier Operations Overview</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadAirlineData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="metrics-grid">
          <DashboardCard
            title="Scheduled Flight Movements"
            icon={Plane}
            value={flights.length}
            subtitle="Active daily rotations"
            badgeStatus="ON_TIME"
            badgeLabel="DISPATCH"
          />

          <DashboardCard
            title="Passenger Manifest Records"
            icon={Users}
            value={passengers.length}
            subtitle="Verified travel identities"
            badgeStatus="ACTIVE"
            badgeLabel="VERIFIED"
          />

          <DashboardCard
            title="Issued Booking Records"
            icon={Ticket}
            value={bookings.length}
            subtitle="Confirmed reservation PNRs"
            badgeStatus="ACTIVE"
            badgeLabel="RESERVATIONS"
          />

          <DashboardCard
            title="On-Time Dispatch Rate"
            icon={Clock}
            value="96.4%"
            subtitle="Operational departures"
            badgeStatus="OPERATIONAL"
            badgeLabel="DISPATCH"
          />
        </div>
      </section>

      {/* 2. Carrier Operations Console Tabs */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Carrier Management Console</h3>
          <div className="console-tabs">
            <button
              className={`tab-btn ${activeTab === 'dispatch' ? 'active' : ''}`}
              onClick={() => setActiveTab('dispatch')}
            >
              <Plane size={14} />
              <span>Flight Dispatch Board ({flights.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'manifest' ? 'active' : ''}`}
              onClick={() => setActiveTab('manifest')}
            >
              <Users size={14} />
              <span>Passenger Manifest ({passengers.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Ticket size={14} />
              <span>Carrier Bookings ({bookings.length})</span>
            </button>
          </div>
        </div>

        <div className="operations-console-panel">
          {/* TAB 1: FLIGHT DISPATCH BOARD */}
          {activeTab === 'dispatch' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Live flight movements, departure sequencing, and air traffic status telemetry.
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddFlight(!showAddFlight)}
                >
                  <Plus size={14} />
                  <span>Schedule New Flight</span>
                </button>
              </div>

              {showAddFlight && (
                <form onSubmit={handleCreateFlight} className="inline-form-box">
                  <h4>Schedule New Commercial Flight</h4>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Flight Number (e.g. AI-984)"
                      value={newFlightData.flightNumber}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, flightNumber: e.target.value.toUpperCase() })
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Origin (e.g. DEL)"
                      maxLength={3}
                      value={newFlightData.originAirport}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, originAirport: e.target.value.toUpperCase() })
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Destination (e.g. BOM)"
                      maxLength={3}
                      value={newFlightData.destAirport}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, destAirport: e.target.value.toUpperCase() })
                      }
                      required
                    />
                    <input
                      type="time"
                      value={newFlightData.scheduledDepartureTime}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, scheduledDepartureTime: e.target.value })
                      }
                      required
                    />
                    <input
                      type="time"
                      value={newFlightData.scheduledArrivalTime}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, scheduledArrivalTime: e.target.value })
                      }
                      required
                    />
                    <input
                      type="number"
                      placeholder="Base Fare (₹)"
                      value={newFlightData.baseFare}
                      onChange={(e) =>
                        setNewFlightData({ ...newFlightData, baseFare: Number(e.target.value) })
                      }
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      Commit to Schedule
                    </button>
                  </div>
                </form>
              )}

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Flight #</th>
                      <th>Route</th>
                      <th>Departure / Arrival</th>
                      <th>Assigned Aircraft</th>
                      <th>Operational Status</th>
                      <th>Gate</th>
                      <th>Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((f) => (
                      <tr key={f.flightInstanceId || f.flightNumber}>
                        <td className="mono font-bold text-amber">{f.flightNumber}</td>
                        <td className="mono font-medium">
                          {f.originAirport} <ArrowRight size={12} className="inline-icon text-muted" /> {f.destAirport}
                        </td>
                        <td className="mono">
                          {f.scheduledDepartureTime} → {f.scheduledArrivalTime}
                        </td>
                        <td className="mono text-muted">{f.aircraftModel || 'Boeing 737'}</td>
                        <td>
                          <StatusBadge status={f.status} label={f.status} size="sm" />
                        </td>
                        <td className="mono text-white font-bold">{f.gateNumber || 'TBD'}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenStatusModal(f)}
                          >
                            <Edit3 size={13} />
                            <span>Update Status</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGER MANIFEST */}
          {activeTab === 'manifest' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Verified passenger identities and travel manifests (Masked for regulatory privacy).
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Passenger ID</th>
                      <th>Full Traveler Name</th>
                      <th>Passport (Masked)</th>
                      <th>Email Contact</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p) => (
                      <tr key={p.passengerId}>
                        <td className="mono">#{p.passengerId}</td>
                        <td className="font-medium text-white">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="mono text-amber font-bold">{p.passportNumber}</td>
                        <td className="mono text-muted">{p.email}</td>
                        <td className="mono">{p.phone || '--'}</td>
                        <td className="mono">{p.gender}</td>
                        <td>
                          <StatusBadge status="ACTIVE" label="VERIFIED" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CARRIER BOOKINGS */}
          {activeTab === 'bookings' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Issued e-ticket reservations, PNR references, and payment settlement audit trail.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>PNR Code</th>
                      <th>Date</th>
                      <th>Passenger(s)</th>
                      <th>Seats</th>
                      <th>Total Amount</th>
                      <th>Settlement</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.bookingId}>
                        <td className="mono font-bold text-amber">{b.bookingReference}</td>
                        <td className="mono text-muted">{b.bookingDate}</td>
                        <td>
                          {b.tickets?.map((t) => t.passengerName || 'Passenger').join(', ') || 'Traveler'}
                        </td>
                        <td className="mono font-bold text-white">
                          {b.tickets?.map((t) => `${t.seatNumber || 'Unassigned'} (${t.cabinClass})`).join(', ') || '--'}
                        </td>
                        <td className="mono font-bold text-emerald">₹{b.totalAmount}</td>
                        <td className="mono text-muted">{b.paymentStatus}</td>
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
        </div>
      </section>

      {/* DISPATCH STATUS UPDATE MODAL */}
      {statusModalOpen && selectedFlight && (
        <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Update Dispatch Status: <span className="mono text-amber">{selectedFlight.flightNumber}</span>
              </h3>
              <button className="modal-close" onClick={() => setStatusModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Flight Movement Route</label>
                  <p className="mono text-white">
                    {selectedFlight.originAirport} → {selectedFlight.destAirport} ({selectedFlight.scheduledDepartureTime})
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
                  Commit State Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AirlineDashboard;
