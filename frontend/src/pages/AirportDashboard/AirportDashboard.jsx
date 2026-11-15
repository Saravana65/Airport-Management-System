import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import UltraQualityDataTable from '../../components/ui/ultra-quality-data-table';
import operationsService from '../../services/operations.service';
import './AirportDashboard.css';

export function AirportDashboard({ initialTab = 'overview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/airport/dashboard');
    else navigate(`/airport/${tab}`);
  };

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
      {/* 1. Sleek Navigation Tabs */}
      <nav className="airport-nav-bar" aria-label="Airport Staff Navigation">
        <button
          className={`airport-nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <Activity size={15} />
          <span>Overview</span>
        </button>
        <button
          className={`airport-nav-pill ${activeTab === 'gates' ? 'active' : ''}`}
          onClick={() => handleTabChange('gates')}
        >
          <DoorOpen size={15} />
          <span>Gate Management</span>
          <span className="pill-count">{gates.length}</span>
        </button>
        <button
          className={`airport-nav-pill ${activeTab === 'flights' ? 'active' : ''}`}
          onClick={() => handleTabChange('flights')}
        >
          <Plane size={15} />
          <span>Flight Operations</span>
          <span className="pill-count">{flights.length}</span>
        </button>
        <button
          className={`airport-nav-pill ${activeTab === 'checkin' || activeTab === 'checkins' ? 'active' : ''}`}
          onClick={() => handleTabChange('checkin')}
        >
          <ShieldCheck size={15} />
          <span>Check-In Operations</span>
          <span className="pill-count">{checkins.length}</span>
        </button>
        <button
          className={`airport-nav-pill ${activeTab === 'baggage' ? 'active' : ''}`}
          onClick={() => handleTabChange('baggage')}
        >
          <Luggage size={15} />
          <span>Baggage Management</span>
          <span className="pill-count">{baggage.length}</span>
        </button>
      </nav>

      {/* Global Alerts */}
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

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (Resource Metrics Appear ONLY Here) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="airport-view-container">
          {/* Welcome Banner */}
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
              <button className="btn btn-secondary btn-sm" onClick={loadAirportData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Operations</span>
              </button>
            </div>
          </div>

          {/* Ground Operations Resource Metrics (EXCLUSIVE TO OVERVIEW) */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Ground Operations Resource Metrics</h3>
            </div>

            <div className="metrics-grid">
              <DashboardCard
                title="Available Aerobridge Gates"
                icon={DoorOpen}
                value={`${availableGatesCount} / ${gates.length}`}
                subtitle="Apron & terminal stands"
                badgeStatus="AVAILABLE"
                badgeLabel="STANDS"
                onClick={() => handleTabChange('gates')}
              />

              <DashboardCard
                title="Today's Airside Movements"
                icon={Plane}
                value={flights.length}
                subtitle="Scheduled arrivals & departures"
                badgeStatus="ON_TIME"
                badgeLabel="AIRSIDE"
                onClick={() => handleTabChange('flights')}
              />

              <DashboardCard
                title="Baggage Handling Units"
                icon={Luggage}
                value={baggage.length}
                subtitle="Active conveyor barcodes"
                badgeStatus="ACTIVE"
                badgeLabel="LOGISTICS"
                onClick={() => handleTabChange('baggage')}
              />

              <DashboardCard
                title="Terminal Check-in Desks"
                icon={ShieldCheck}
                value={checkins.length}
                subtitle="Boarding passes verified"
                badgeStatus="OPERATIONAL"
                badgeLabel="DISPATCH"
                onClick={() => handleTabChange('checkin')}
              />
            </div>
          </section>

          {/* Quick Gates Stand Overview */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Terminal Aerobridge Status</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('gates')}>
                <span>Manage All Gates</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Gate #</th>
                    <th>Airport Hub</th>
                    <th>Terminal</th>
                    <th>Status</th>
                    <th>Active Flight</th>
                  </tr>
                </thead>
                <tbody>
                  {gates.slice(0, 5).map((g) => (
                    <tr key={g.gateId}>
                      <td className="mono font-bold text-navy">{g.terminal}-{g.gateNumber}</td>
                      <td className="mono">{g.airportCode}</td>
                      <td>Terminal {g.terminal}</td>
                      <td><StatusBadge status={g.status} label={g.status} size="sm" /></td>
                      <td className="mono">{g.activeFlightNumber ? `${g.activeFlightNumber} (${g.activeFlightStatus})` : 'Clear / Ready'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GATE MANAGEMENT (DIRECT VIEW, NO METRICS CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'gates' && (
        <div className="airport-view-container">
          <div className="airport-view-header">
            <div>
              <h2 className="airport-view-title">Terminal Gate Allocations & Aerobridges</h2>
              <p className="airport-view-subtitle">
                Assign flight arrivals and departures to terminal aerobridge docking stands.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadAirportData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Gates</span>
            </button>
          </div>

          <div className="gates-board-grid">
            {gates.map((g) => (
              <div key={g.gateId} className={`gate-stand-card status-${g.status.toLowerCase()}`}>
                <div className="gate-stand-top">
                  <div className="gate-id-badge">
                    <span className="gate-terminal">{g.terminal}</span>
                    <span className="gate-no">{g.gateNumber}</span>
                  </div>
                  <StatusBadge status={g.status} label={g.status} size="sm" />
                </div>

                <div className="gate-stand-body">
                  <div className="gate-meta-row">
                    <span className="meta-label">Airport:</span>
                    <span className="mono font-bold">{g.airportCode}</span>
                  </div>
                  <div className="gate-meta-row">
                    <span className="meta-label">Active Flight:</span>
                    <span className="mono font-bold text-navy">
                      {g.activeFlightNumber || 'None / Clear'}
                    </span>
                  </div>
                  {g.activeFlightStatus && (
                    <div className="gate-meta-row">
                      <span className="meta-label">Flight Status:</span>
                      <StatusBadge status={g.activeFlightStatus} label={g.activeFlightStatus} size="sm" />
                    </div>
                  )}
                </div>

                <div className="gate-stand-footer">
                  <button
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => handleOpenAssignModal(g)}
                  >
                    <span>Assign Flight</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FLIGHT OPERATIONS (DIRECT VIEW, NO METRICS CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'flights' && (
        <div className="airport-view-container">
          <UltraQualityDataTable
            title="Airside Flight Tracking & Movement Board"
            subtitle="Live departure monitoring, inbound arrivals, gate docking, and operational delays"
            embedded={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CHECK-IN OPERATIONS (DIRECT VIEW, NO METRICS CARDS) */}
      {/* ========================================================================= */}
      {(activeTab === 'checkin' || activeTab === 'checkins') && (
        <div className="airport-view-container">
          <div className="airport-view-header">
            <div>
              <h2 className="airport-view-title">Passenger Check-In Operations</h2>
              <p className="airport-view-subtitle">
                Live stream of web check-ins, counter verifications, and issued boarding passes.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadAirportData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Stream</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Check-In ID</th>
                  <th>Boarding Pass Code</th>
                  <th>Ticket Reference</th>
                  <th>Assigned Seat</th>
                  <th>Boarding Aerobridge</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checkins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                      No active check-in events recorded for current shift.
                    </td>
                  </tr>
                ) : (
                  checkins.map((chk) => (
                    <tr key={chk.checkinId}>
                      <td className="mono">#{chk.checkinId}</td>
                      <td className="mono font-bold text-navy">{chk.boardingPassCode}</td>
                      <td className="mono">Ticket #{chk.ticketId}</td>
                      <td className="mono font-bold text-emerald">{chk.seatNumber || 'Assigned'}</td>
                      <td className="mono">{chk.gateId ? `Gate ID ${chk.gateId}` : 'Main Concourse'}</td>
                      <td><StatusBadge status={chk.status} label={chk.status} size="sm" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BAGGAGE MANAGEMENT (DIRECT VIEW, NO METRICS CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'baggage' && (
        <div className="airport-view-container">
          <div className="airport-view-header">
            <div>
              <h2 className="airport-view-title">Baggage Handling & Reclaim Carousels</h2>
              <p className="airport-view-subtitle">
                Barcode RFID telemetry, weight scale screening, conveyor loading, and carousel claim status.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadAirportData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Logistics</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Baggage Tag #</th>
                  <th>Associated Ticket</th>
                  <th>Weight (kg)</th>
                  <th>Reclaim Carousel</th>
                  <th>Handling Status</th>
                  <th>Logistics Action</th>
                </tr>
              </thead>
              <tbody>
                {baggage.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                      No checked luggage units registered for current shift.
                    </td>
                  </tr>
                ) : (
                  baggage.map((b) => (
                    <tr key={b.baggageId}>
                      <td className="mono font-bold text-navy">{b.tagNumber}</td>
                      <td className="mono">Ticket #{b.ticketId}</td>
                      <td className="mono font-bold">{b.weightKg} kg</td>
                      <td className="mono text-muted">{b.carouselNumber || 'Carousel-04'}</td>
                      <td><StatusBadge status={b.status} label={b.status} size="sm" /></td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAdvanceBaggage(b)}
                          title="Advance baggage to next handling stage"
                        >
                          <TrendingUp size={13} />
                          <span>Advance Status</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GATE ASSIGNMENT MODAL */}
      {/* ========================================================================= */}
      {assignModalOpen && selectedGate && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Assign Flight to Gate {selectedGate.terminal}-{selectedGate.gateNumber}
              </h3>
              <button className="modal-close" onClick={() => setAssignModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAssignGate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Scheduled Flight</label>
                  <select
                    value={selectedFlightInstanceId}
                    onChange={(e) => setSelectedFlightInstanceId(e.target.value)}
                    required
                  >
                    {flights.map((flt) => (
                      <option key={flt.flightInstanceId} value={flt.flightInstanceId}>
                        {flt.flightNumber} ({flt.originAirport} → {flt.destAirport}) - Status: {flt.status}
                      </option>
                    ))}
                  </select>
                </div>
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
                  Confirm Gate Docking
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
