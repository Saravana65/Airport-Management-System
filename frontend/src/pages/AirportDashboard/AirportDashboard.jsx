import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plane,
  ShieldCheck,
  Luggage,
  Clock,
  Radio,
  DoorOpen,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Activity,
  Users,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import operationsService from '../../services/operations.service';
import './AirportDashboard.css';

export function AirportDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('gates');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Live Module Data
  const [gates, setGates] = useState([]);
  const [flights, setFlights] = useState([]);
  const [baggage, setBaggage] = useState([]);
  const [checkins, setCheckins] = useState([]);

  // Gate Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [selectedFlightInstanceId, setSelectedFlightInstanceId] = useState('');

  // Baggage Register Modal
  const [showAddBaggage, setShowAddBaggage] = useState(false);
  const [newBaggage, setNewBaggage] = useState({ ticketId: 1, weightKg: 18.5 });

  const loadAirportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gts, flts, bags, chks] = await Promise.all([
        operationsService.getGates().catch(() => []),
        operationsService.getFlights().catch(() => []),
        operationsService.getBaggage().catch(() => []),
        operationsService.getCheckIns().catch(() => []),
      ]);
      setGates(gts);
      setFlights(flts);
      setBaggage(bags);
      setCheckins(chks);
    } catch (err) {
      setError(err.message || 'Failed to load ground telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirportData();
  }, []);

  const handleOpenAssignModal = (gate) => {
    setSelectedGate(gate);
    setSelectedFlightInstanceId(flights[0]?.flightInstanceId || '');
    setAssignModalOpen(true);
  };

  const handleAssignGate = async (e) => {
    e.preventDefault();
    if (!selectedGate || !selectedFlightInstanceId) return;
    try {
      await operationsService.assignGate({
        gateId: selectedGate.gateId,
        flightInstanceId: parseInt(selectedFlightInstanceId, 10),
      });
      setActionSuccess(`Gate ${selectedGate.terminal}-${selectedGate.gateNumber} successfully assigned!`);
      setAssignModalOpen(false);
      loadAirportData();
    } catch (err) {
      alert(`Gate Assignment Failed: ${err.message}`);
    }
  };

  const handleAdvanceBaggage = async (bag) => {
    const nextStatusMap = {
      'REGISTERED': 'CHECKED_IN',
      'CHECKED_IN': 'SECURITY_CLEARED',
      'SECURITY_CLEARED': 'LOADED',
      'LOADED': 'IN_TRANSIT',
      'IN_TRANSIT': 'CLAIM_READY',
      'CLAIM_READY': 'COLLECTED',
    };
    const nextStatus = nextStatusMap[bag.status] || 'COLLECTED';
    try {
      await operationsService.updateBaggageStatus(bag.baggageId, nextStatus, 'Carousel-04');
      setActionSuccess(`Baggage ${bag.tagNumber} advanced to ${nextStatus}!`);
      loadAirportData();
    } catch (err) {
      alert(`Baggage status update failed: ${err.message}`);
    }
  };

  const availableGatesCount = gates.filter((g) => g.status === 'AVAILABLE').length;

  return (
    <div className="airport-dashboard-container">
      {/* Banner */}
      <div className="dashboard-welcome-banner airport-banner">
        <div className="banner-left">
          <div className="banner-icon-box airport-icon-box">
            <Building2 size={24} className="banner-airport-icon" />
          </div>
          <div>
            <h2 className="banner-title">Airport Terminal & Ground Operations</h2>
            <p className="banner-description">
              Terminal coordination, aerobridge gate scheduling, conveyor baggage logistics, and check-in desk telemetry.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="AIRPORT_STAFF" label="TERMINAL GROUND OPS ONLINE" />
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

      {/* 1. Terminal Resource Metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Ground Operations Resource Metrics</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadAirportData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Operations</span>
          </button>
        </div>

        <div className="metrics-grid">
          <DashboardCard
            title="Available Aerobridge Gates"
            icon={DoorOpen}
            value={`${availableGatesCount} / ${gates.length}`}
            subtitle="Apron & terminal stands"
            badgeStatus="AVAILABLE"
            badgeLabel="STANDS"
          />

          <DashboardCard
            title="Today's Airside Movements"
            icon={Plane}
            value={flights.length}
            subtitle="Scheduled arrivals & departures"
            badgeStatus="ON_TIME"
            badgeLabel="AIRSIDE"
          />

          <DashboardCard
            title="Baggage Handling Units"
            icon={Luggage}
            value={baggage.length}
            subtitle="Active conveyor barcodes"
            badgeStatus="ACTIVE"
            badgeLabel="LOGISTICS"
          />

          <DashboardCard
            title="Terminal Check-in Desks"
            icon={ShieldCheck}
            value={checkins.length}
            subtitle="Boarding passes verified"
            badgeStatus="OPERATIONAL"
            badgeLabel="DISPATCH"
          />
        </div>
      </section>

      {/* 2. Operations Console Tabs */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Ground Control Management Console</h3>
          <div className="console-tabs">
            <button
              className={`tab-btn ${activeTab === 'gates' ? 'active' : ''}`}
              onClick={() => setActiveTab('gates')}
            >
              <DoorOpen size={14} />
              <span>Gate Allocations ({gates.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'baggage' ? 'active' : ''}`}
              onClick={() => setActiveTab('baggage')}
            >
              <Luggage size={14} />
              <span>Baggage Conveyance ({baggage.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'checkins' ? 'active' : ''}`}
              onClick={() => setActiveTab('checkins')}
            >
              <ShieldCheck size={14} />
              <span>Check-in Audit Stream ({checkins.length})</span>
            </button>
          </div>
        </div>

        <div className="operations-console-panel">
          {/* TAB 1: GATES */}
          {activeTab === 'gates' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Aerobridges, terminal stands, and occupancy conflict-free scheduling engine.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Gate ID</th>
                      <th>Airport</th>
                      <th>Terminal & Gate</th>
                      <th>Occupancy Status</th>
                      <th>Assigned Flight</th>
                      <th>Airside Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gates.map((g) => (
                      <tr key={g.gateId}>
                        <td className="mono">#{g.gateId}</td>
                        <td className="mono text-amber font-bold">{g.airportCode}</td>
                        <td className="mono font-bold text-white">
                          Terminal {g.terminal} • Stand {g.gateNumber}
                        </td>
                        <td>
                          <StatusBadge status={g.status} label={g.status} size="sm" />
                        </td>
                        <td className="mono">
                          {g.activeFlightNumber ? (
                            <span className="text-white font-medium">
                              {g.activeFlightNumber} ({g.activeFlightStatus})
                            </span>
                          ) : (
                            <span className="text-muted">Unassigned / Clear</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenAssignModal(g)}
                          >
                            <DoorOpen size={13} />
                            <span>Assign Flight</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: BAGGAGE */}
          {activeTab === 'baggage' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Barcoded baggage logistics, conveyor routing, and security scanning progression.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Tag Number</th>
                      <th>Flight #</th>
                      <th>Passenger</th>
                      <th>Weight</th>
                      <th>Current Status</th>
                      <th>Claim Carousel</th>
                      <th>Conveyor Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baggage.map((b) => (
                      <tr key={b.baggageId}>
                        <td className="mono font-bold text-amber">{b.tagNumber}</td>
                        <td className="mono font-medium text-white">{b.flightNumber || 'AI-101'}</td>
                        <td>{b.passengerName || 'Traveler'}</td>
                        <td className="mono">{b.weightKg} kg</td>
                        <td>
                          <StatusBadge status={b.status} label={b.status} size="sm" />
                        </td>
                        <td className="mono text-muted">{b.claimCarousel || 'Carousel-01'}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAdvanceBaggage(b)}
                          >
                            <TrendingUp size={13} />
                            <span>Advance Pipeline</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CHECKINS */}
          {activeTab === 'checkins' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Live counter check-in records, digital boarding passes, and seat allocations.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Boarding Pass #</th>
                      <th>Passenger</th>
                      <th>Flight</th>
                      <th>Assigned Seat</th>
                      <th>Cabin</th>
                      <th>Gate</th>
                      <th>Check-In Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((c) => (
                      <tr key={c.checkInId}>
                        <td className="mono font-bold text-amber">{c.boardingPassNumber}</td>
                        <td className="font-medium text-white">{c.passengerName || 'Traveler'}</td>
                        <td className="mono">{c.flightNumber}</td>
                        <td className="mono font-bold text-white">{c.seatNumber}</td>
                        <td className="mono text-muted">{c.cabinClass || 'ECONOMY'}</td>
                        <td className="mono font-bold text-emerald">{c.gateNumber || 'Gate 14A'}</td>
                        <td className="mono text-muted">{c.checkInTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ASSIGN GATE MODAL */}
      {assignModalOpen && selectedGate && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Assign Flight to Stand:{' '}
                <span className="mono text-amber">
                  {selectedGate.terminal}-{selectedGate.gateNumber}
                </span>
              </h3>
              <button className="modal-close" onClick={() => setAssignModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAssignGate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Selected Aerobridge Gate</label>
                  <p className="mono text-white">
                    {selectedGate.airportCode} • Terminal {selectedGate.terminal} (Gate {selectedGate.gateNumber})
                  </p>
                </div>

                <div className="form-group">
                  <label>Select Scheduled Flight Instance</label>
                  <select
                    value={selectedFlightInstanceId}
                    onChange={(e) => setSelectedFlightInstanceId(e.target.value)}
                    required
                  >
                    {flights.map((f) => (
                      <option key={f.flightInstanceId} value={f.flightInstanceId}>
                        {f.flightNumber} ({f.originAirport} → {f.destAirport} at {f.scheduledDepartureTime})
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mono text-muted" style={{ fontSize: '11px' }}>
                  * The Oracle Gate Conflict Detection engine automatically checks for overlapping departure windows.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Gate Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AirportDashboard;
