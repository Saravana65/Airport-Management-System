import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  Ticket,
  Calendar,
  ShieldCheck,
  Luggage,
  Clock,
  Compass,
  AlertCircle,
  Bell,
  ArrowRight,
  User,
  Info,
  CheckCircle2,
  RefreshCw,
  XCircle,
  CreditCard,
  QrCode,
  Tag,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import operationsService from '../../services/operations.service';
import './PassengerDashboard.css';

export function PassengerDashboard({ initialTab = 'bookings' }) {
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
  const [bookings, setBookings] = useState([]);
  const [eligibleTickets, setEligibleTickets] = useState([]);
  const [myBaggage, setMyBaggage] = useState([]);
  const [activeBoardingPass, setActiveBoardingPass] = useState(null);

  // Search filter
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  // Booking Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [seatNumber, setSeatNumber] = useState('14A');

  const loadPassengerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [flts, bks, elig, bags] = await Promise.all([
        operationsService.getFlights().catch(() => []),
        operationsService.getBookings().catch(() => []),
        operationsService.getEligibleTickets().catch(() => []),
        operationsService.getBaggage().catch(() => []),
      ]);
      setFlights(flts);
      setBookings(bks);
      setEligibleTickets(elig);
      setMyBaggage(bags);
    } catch (err) {
      setError(err.message || 'Failed to load traveler portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengerData();
  }, []);

  const handleOpenBookModal = (flight) => {
    setSelectedFlight(flight);
    setSeatNumber(`${Math.floor(10 + Math.random() * 20)}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`);
    setBookModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedFlight) return;
    try {
      const result = await operationsService.createBooking({
        flightInstanceId: selectedFlight.flightInstanceId,
        cabinClass,
        seatNumber,
      });
      setActionSuccess(
        `Flight booked successfully! PNR: ${result.booking.bookingReference} (Seat ${seatNumber}).`
      );
      setBookModalOpen(false);
      loadPassengerData();
      setActiveTab('bookings');
    } catch (err) {
      alert(`Booking Failed: ${err.message}`);
    }
  };

  const handleCancelBooking = async (bookingId, pnr) => {
    if (!window.confirm(`Are you sure you want to cancel booking PNR: ${pnr}?`)) return;
    try {
      await operationsService.cancelBooking(bookingId);
      setActionSuccess(`Reservation ${pnr} has been cancelled and seat released.`);
      loadPassengerData();
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleCheckInTicket = async (ticket) => {
    try {
      const result = await operationsService.processCheckIn({
        ticketId: ticket.ticketId,
        seatNumber: ticket.seatNumber || '12B',
      });
      setActiveBoardingPass(result.checkIn || result);
      setActionSuccess(`Web check-in confirmed! Boarding pass issued.`);
      loadPassengerData();
      setActiveTab('checkin');
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    }
  };

  // Filtered flights for search bar
  const filteredFlights = flights.filter((f) => {
    const matchFrom = !searchFrom || f.originAirport.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo || f.destAirport.toLowerCase().includes(searchTo.toLowerCase());
    return matchFrom && matchTo;
  });

  return (
    <div className="passenger-dashboard-container">
      {/* 1. Welcome Section */}
      <div className="dashboard-welcome-banner passenger-banner">
        <div className="banner-left">
          <div className="banner-icon-box passenger-icon-box">
            <Compass size={24} className="banner-passenger-icon" />
          </div>
          <div>
            <h2 className="banner-title">Passenger Flight & Travel Hub</h2>
            <p className="banner-description">
              Logged in as <span className="mono text-white">{user?.email || 'Passenger'}</span>. Manage your flight itineraries, e-tickets, web check-in, and departure alerts.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="PASSENGER" label="PASSENGER PORTAL ACTIVE" />
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

      {/* 2. Flight Search Quick Bar */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Search Commercial Flights</h3>
          <span className="section-tag mono">LIVE FLIGHT INVENTORY</span>
        </div>

        <div className="flight-search-bar">
          <div className="search-input-group">
            <span className="search-label">From (Origin Airport)</span>
            <input
              type="text"
              placeholder="e.g. DEL or BOM"
              className="search-field"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
            />
          </div>

          <div className="search-input-group">
            <span className="search-label">To (Destination Airport)</span>
            <input
              type="text"
              placeholder="e.g. BOM or JFK"
              className="search-field"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary search-action-btn"
            onClick={() => setActiveTab('search')}
          >
            <Search size={16} />
            <span>Find Flights ({filteredFlights.length})</span>
          </button>
        </div>
      </section>

      {/* 3. Core Passenger Metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">My Travel Summary</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadPassengerData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Itinerary</span>
          </button>
        </div>

        <div className="metrics-grid">
          <DashboardCard
            title="Confirmed Bookings"
            icon={Ticket}
            value={bookings.length}
            subtitle="Linked to your user profile"
            badgeStatus="ACTIVE"
            badgeLabel="RESERVATIONS"
          />

          <DashboardCard
            title="Eligible for Web Check-In"
            icon={ShieldCheck}
            value={eligibleTickets.length}
            subtitle="Tickets ready for boarding pass"
            badgeStatus="OPERATIONAL"
            badgeLabel="CHECK-IN"
          />

          <DashboardCard
            title="Registered Baggage Units"
            icon={Luggage}
            value={myBaggage.length}
            subtitle="Tracked with barcode tags"
            badgeStatus="ACTIVE"
            badgeLabel="LUGGAGE"
          />

          <DashboardCard
            title="Flight Network"
            icon={Plane}
            value={flights.length}
            subtitle="Destinations available"
            badgeStatus="ON_TIME"
            badgeLabel="NETWORK"
          />
        </div>
      </section>

      {/* 4. Passenger Self-Service Tabs */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Passenger Travel Services</h3>
          <div className="console-tabs">
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Ticket size={14} />
              <span>My Bookings ({bookings.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={14} />
              <span>Available Flights ({filteredFlights.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'checkin' ? 'active' : ''}`}
              onClick={() => setActiveTab('checkin')}
            >
              <ShieldCheck size={14} />
              <span>Web Check-In ({eligibleTickets.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'baggage' ? 'active' : ''}`}
              onClick={() => setActiveTab('baggage')}
            >
              <Luggage size={14} />
              <span>Baggage Tracking ({myBaggage.length})</span>
            </button>
          </div>
        </div>

        <div className="operations-console-panel">
          {/* TAB 1: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Your confirmed flight reservations, electronic tickets, and booking references.
                </span>
              </div>

              {bookings.length === 0 ? (
                <div className="activity-stream-empty">
                  <Ticket size={32} className="empty-icon text-amber" />
                  <h4 className="empty-title">No Confirmed Bookings Yet</h4>
                  <p className="empty-desc">
                    You have not reserved any flights under your account. Browse available flights and book your first journey!
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('search')}
                  >
                    Browse Available Flights
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>PNR Reference</th>
                        <th>Booking Date</th>
                        <th>Flight & Route</th>
                        <th>Seat / Class</th>
                        <th>Total Paid</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.bookingId}>
                          <td className="mono font-bold text-amber">{b.bookingReference}</td>
                          <td className="mono text-muted">{b.bookingDate}</td>
                          <td>
                            {b.tickets?.map((t) => (
                              <div key={t.ticketId} className="mono font-medium text-white">
                                {t.flightNumber} ({t.origin} → {t.destination})
                              </div>
                            ))}
                          </td>
                          <td className="mono">
                            {b.tickets?.map((t) => `${t.seatNumber || 'Assigned'} (${t.cabinClass})`).join(', ') || '--'}
                          </td>
                          <td className="mono font-bold text-emerald">₹{b.totalAmount}</td>
                          <td>
                            <StatusBadge status={b.status} label={b.status} size="sm" />
                          </td>
                          <td>
                            {b.status === 'CONFIRMED' ? (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancelBooking(b.bookingId, b.bookingReference)}
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="mono text-muted">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH & BOOK FLIGHTS */}
          {activeTab === 'search' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Showing {filteredFlights.length} available commercial flights ready for immediate reservation.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Flight #</th>
                      <th>Origin → Destination</th>
                      <th>Departure / Arrival</th>
                      <th>Aircraft</th>
                      <th>Base Fare</th>
                      <th>Status</th>
                      <th>Booking Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map((f) => (
                      <tr key={f.flightInstanceId || f.flightNumber}>
                        <td className="mono font-bold text-amber">{f.flightNumber}</td>
                        <td className="mono font-medium text-white">
                          {f.originAirport} <ArrowRight size={12} className="inline-icon text-muted" /> {f.destAirport}
                        </td>
                        <td className="mono">
                          {f.scheduledDepartureTime} - {f.scheduledArrivalTime}
                        </td>
                        <td className="mono text-muted">{f.aircraftModel || 'Boeing 737'}</td>
                        <td className="mono font-bold text-emerald">₹{f.baseFare || 4500}</td>
                        <td>
                          <StatusBadge status={f.status} label={f.status} size="sm" />
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenBookModal(f)}
                          >
                            <CreditCard size={13} />
                            <span>Book Flight</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: WEB CHECK-IN */}
          {activeTab === 'checkin' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Web check-in desk: Select your confirmed ticket to generate your digital boarding pass.
                </span>
              </div>

              {activeBoardingPass && (
                <div style={{ marginBottom: '24px' }}>
                  <div className="digital-boarding-pass">
                    <div className="pass-header">
                      <div className="pass-airline">
                        <Plane size={18} />
                        <span>OFFICIAL DIGITAL BOARDING PASS</span>
                      </div>
                      <StatusBadge status="ACTIVE" label="BOARDING AUTHORIZED" size="sm" />
                    </div>

                    <div className="pass-body">
                      <div>
                        <div className="pass-field-label">Boarding Pass #</div>
                        <div className="pass-field-value text-amber">{activeBoardingPass.boardingPassNumber}</div>
                      </div>
                      <div>
                        <div className="pass-field-label">Passenger</div>
                        <div className="pass-field-value">{activeBoardingPass.passengerName || user?.name || 'Traveler'}</div>
                      </div>
                      <div>
                        <div className="pass-field-label">Flight</div>
                        <div className="pass-field-value">{activeBoardingPass.flightNumber || 'AI-101'}</div>
                      </div>
                      <div>
                        <div className="pass-field-label">Assigned Seat</div>
                        <div className="pass-field-value text-emerald">{activeBoardingPass.seatNumber || '14A'}</div>
                      </div>
                      <div>
                        <div className="pass-field-label">Departure Gate</div>
                        <div className="pass-field-value">{activeBoardingPass.gateNumber || 'Gate 14A'}</div>
                      </div>
                    </div>

                    <div className="pass-barcode-bar">
                      <span className="simulated-barcode">||| | | |||| | ||| |||| | | ||</span>
                      <span className="mono text-muted" style={{ fontSize: '11px' }}>
                        SCAN AT SECURITY & AEROBRIDGE
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Ticket Number</th>
                      <th>Flight</th>
                      <th>Route</th>
                      <th>Seat</th>
                      <th>Passenger</th>
                      <th>Status</th>
                      <th>Check-In Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted" style={{ padding: '24px' }}>
                          No tickets currently awaiting check-in. Book a flight first!
                        </td>
                      </tr>
                    ) : (
                      eligibleTickets.map((t) => (
                        <tr key={t.ticketId}>
                          <td className="mono font-bold text-amber">{t.ticketNumber}</td>
                          <td className="mono">{t.flightNumber}</td>
                          <td className="mono">
                            {t.origin} → {t.destination}
                          </td>
                          <td className="mono font-bold text-white">{t.seatNumber}</td>
                          <td>{t.passengerName}</td>
                          <td>
                            <StatusBadge status="ACTIVE" label="ISSUED" size="sm" />
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleCheckInTicket(t)}
                            >
                              <ShieldCheck size={13} />
                              <span>Generate Boarding Pass</span>
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

          {/* TAB 4: BAGGAGE TRACKING */}
          {activeTab === 'baggage' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Live conveyor and carousel telemetry for your registered checked baggage.
                </span>
              </div>

              {myBaggage.length === 0 ? (
                <div className="activity-stream-empty">
                  <Luggage size={32} className="empty-icon text-amber" />
                  <h4 className="empty-title">No Checked Baggage on File</h4>
                  <p className="empty-desc">
                    Your checked luggage will appear here once tagged at airport ground check-in.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Baggage Tag #</th>
                        <th>Flight #</th>
                        <th>Weight (kg)</th>
                        <th>Conveyor / Reclaim Carousel</th>
                        <th>Live Tracking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBaggage.map((b) => (
                        <tr key={b.baggageId}>
                          <td className="mono font-bold text-amber">{b.tagNumber}</td>
                          <td className="mono">{b.flightNumber || 'AI-101'}</td>
                          <td className="mono font-bold text-white">{b.weightKg} kg</td>
                          <td className="mono text-muted">{b.claimCarousel || 'Carousel-04'}</td>
                          <td>
                            <StatusBadge status={b.status} label={b.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BOOK FLIGHT MODAL */}
      {bookModalOpen && selectedFlight && (
        <div className="modal-overlay" onClick={() => setBookModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Reserve Flight: <span className="mono text-amber">{selectedFlight.flightNumber}</span>
              </h3>
              <button className="modal-close" onClick={() => setBookModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Journey Route</label>
                  <p className="mono text-white">
                    {selectedFlight.originAirport} → {selectedFlight.destAirport} ({selectedFlight.scheduledDepartureTime})
                  </p>
                </div>

                <div className="form-group">
                  <label>Cabin Class Selection</label>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value)}
                    required
                  >
                    <option value="ECONOMY">Economy Class (Standard Fare)</option>
                    <option value="BUSINESS">Business Class (2.5x Base Fare)</option>
                    <option value="FIRST">First Class (4.0x Luxury Suite)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preferred Seat Number</label>
                  <input
                    type="text"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 14A, 12B"
                    required
                  />
                  <span className="mono text-muted" style={{ fontSize: '11px' }}>
                    * The Oracle duplicate seat prevention engine validates seat availability in real time.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Reservation & Issue PNR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PassengerDashboard;
