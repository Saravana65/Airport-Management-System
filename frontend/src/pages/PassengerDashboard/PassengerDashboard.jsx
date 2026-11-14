import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Shield,
  Layers,
  Lock,
  Plus,
  FileText,
  Sparkles,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { UltraQualityDataTable } from '../../components/ui/ultra-quality-data-table';
import operationsService from '../../services/operations.service';
import './PassengerDashboard.css';

export function PassengerDashboard({ initialTab = 'overview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Synchronize internal state when route prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Tab switch handler with route synchronization
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'overview') {
      navigate('/passenger/dashboard');
    } else {
      navigate(`/passenger/${tabKey}`);
    }
  };

  // Live Module Data
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [eligibleTickets, setEligibleTickets] = useState([]);
  const [myBaggage, setMyBaggage] = useState([]);
  const [activeBoardingPass, setActiveBoardingPass] = useState(null);

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
      handleTabChange('bookings');
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

  return (
    <div className="passenger-portal-wrapper">
      {/* 1. Global Action Alerts */}
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

      {/* 2. Sleek Passenger Service Navigation Bar */}
      <div className="passenger-service-nav">
        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <Compass size={15} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'search' || activeTab === 'flights' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
        >
          <Plane size={15} />
          <span>Flight Status & Booking</span>
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          <Ticket size={15} />
          <span>My Bookings</span>
          {bookings.length > 0 && <span className="pill-count">{bookings.length}</span>}
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => handleTabChange('tickets')}
        >
          <FileText size={15} />
          <span>My Tickets</span>
          {eligibleTickets.length > 0 && <span className="pill-count">{eligibleTickets.length}</span>}
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => handleTabChange('checkin')}
        >
          <ShieldCheck size={15} />
          <span>Web Check-In</span>
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'baggage' ? 'active' : ''}`}
          onClick={() => handleTabChange('baggage')}
        >
          <Luggage size={15} />
          <span>Baggage Tracking</span>
          {myBaggage.length > 0 && <span className="pill-count">{myBaggage.length}</span>}
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'travel-info' ? 'active' : ''}`}
          onClick={() => handleTabChange('travel-info')}
        >
          <Info size={15} />
          <span>Travel Guidelines</span>
        </button>

        <button
          type="button"
          className={`passenger-nav-pill ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <User size={15} />
          <span>My Profile</span>
        </button>
      </div>

      {/* 3. DEDICATED VIEW SECTIONS */}

      {/* TAB A: TRAVELER OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Welcome, Traveler</h2>
              <p className="passenger-view-subtitle">
                Logged in as <span className="mono font-bold text-navy">{user?.email || 'Passenger'}</span>. Here is your current travel itinerary and readiness summary.
              </p>
            </div>
            <div className="passenger-header-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('search')}>
                <Plane size={14} />
                <span>Book a Flight</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={loadPassengerData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="metrics-grid">
            <DashboardCard
              title="Confirmed Bookings"
              icon={Ticket}
              value={bookings.length}
              subtitle="Active flight reservations"
              badgeStatus="ACTIVE"
              badgeLabel="RESERVATIONS"
              onClick={() => handleTabChange('bookings')}
            />
            <DashboardCard
              title="Web Check-In Ready"
              icon={ShieldCheck}
              value={eligibleTickets.length}
              subtitle="Tickets ready for boarding pass"
              badgeStatus="OPERATIONAL"
              badgeLabel="CHECK-IN"
              onClick={() => handleTabChange('checkin')}
            />
            <DashboardCard
              title="Tracked Luggage"
              icon={Luggage}
              value={myBaggage.length}
              subtitle="Registered barcode units"
              badgeStatus="ACTIVE"
              badgeLabel="LUGGAGE"
              onClick={() => handleTabChange('baggage')}
            />
            <DashboardCard
              title="Flight Network"
              icon={Plane}
              value={flights.length}
              subtitle="Destinations currently active"
              badgeStatus="ON_TIME"
              badgeLabel="NETWORK"
              onClick={() => handleTabChange('search')}
            />
          </div>

          {/* Latest Reservation Feature Card */}
          {bookings.length > 0 ? (
            <div className="passenger-featured-card">
              <div className="featured-card-header">
                <div className="featured-badge">NEXT CONFIRMED FLIGHT</div>
                <span className="mono font-bold text-navy">PNR: {bookings[0].bookingReference}</span>
              </div>
              <div className="featured-card-body">
                <div className="featured-route">
                  <div className="featured-station">
                    <span className="iata">{bookings[0].tickets?.[0]?.origin || 'DEL'}</span>
                    <span className="station-name">Origin Airport</span>
                  </div>
                  <div className="featured-transit">
                    <Plane size={22} />
                    <div className="route-line"></div>
                    <span className="transit-mode">Non-Stop Corridor</span>
                  </div>
                  <div className="featured-station" style={{ textAlign: 'right' }}>
                    <span className="iata">{bookings[0].tickets?.[0]?.destination || 'BOM'}</span>
                    <span className="station-name">Destination Airport</span>
                  </div>
                </div>
                <div className="featured-meta-grid">
                  <div>
                    <span className="meta-label">Flight #</span>
                    <span className="meta-val">{bookings[0].tickets?.[0]?.flightNumber}</span>
                  </div>
                  <div>
                    <span className="meta-label">Assigned Seat</span>
                    <span className="meta-val text-emerald">{bookings[0].tickets?.[0]?.seatNumber || '14A'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Cabin Class</span>
                    <span className="meta-val">{bookings[0].tickets?.[0]?.cabinClass || 'ECONOMY'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Total Paid</span>
                    <span className="meta-val text-emerald">₹{bookings[0].totalAmount || '4500'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Status</span>
                    <StatusBadge status={bookings[0].status} label={bookings[0].status} size="sm" />
                  </div>
                </div>
              </div>
              <div className="featured-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => handleTabChange('bookings')}>
                  View All Bookings ({bookings.length})
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('checkin')}>
                  Proceed to Web Check-In
                </button>
              </div>
            </div>
          ) : (
            <div className="passenger-empty-hero">
              <Plane size={44} className="empty-hero-icon" />
              <h3 className="empty-hero-title">Ready for Your Next Journey?</h3>
              <p className="empty-hero-desc">
                Browse our real-time flight schedules, check live gate assignments, and book commercial tickets in seconds.
              </p>
              <button className="btn btn-primary" onClick={() => handleTabChange('search')}>
                <Search size={15} />
                <span>Search Scheduled Flights</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB B: FLIGHT STATUS & BOOKING (ULTRA QUALITY TABLE) */}
      {(activeTab === 'search' || activeTab === 'flights') && (
        <div className="passenger-view-container">
          <UltraQualityDataTable
            title="Commercial Flight Status & Reservations"
            subtitle="Search scheduled routes, monitor terminal gate assignments, check live delays, and reserve tickets"
            embedded={true}
            onBookFlight={(f) => handleOpenBookModal(f)}
          />
        </div>
      )}

      {/* TAB C: MY BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">My Bookings & Reservations</h2>
              <p className="passenger-view-subtitle">
                Your confirmed flight reservations, electronic tickets, and passenger PNR references.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('search')}>
              <Plus size={14} />
              <span>Book Another Flight</span>
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="passenger-empty-hero">
              <Ticket size={40} className="empty-hero-icon" />
              <h3 className="empty-hero-title">No Confirmed Bookings Yet</h3>
              <p className="empty-hero-desc">
                You have not reserved any flights under your account. Browse available flights and book your first journey!
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('search')}>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.bookingId}>
                      <td className="mono font-bold text-navy">{b.bookingReference}</td>
                      <td className="mono text-muted">{b.bookingDate}</td>
                      <td>
                        {b.tickets?.map((t) => (
                          <div key={t.ticketId} className="mono font-medium text-navy">
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
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTabChange('tickets')}
                            title="View electronic ticket"
                          >
                            <FileText size={13} />
                            <span>Ticket</span>
                          </button>
                          {b.status === 'CONFIRMED' ? (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancelBooking(b.bookingId, b.bookingReference)}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="mono text-muted" style={{ fontSize: '12px' }}>Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB D: MY TICKETS */}
      {activeTab === 'tickets' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">My Electronic Tickets (E-Tickets)</h2>
              <p className="passenger-view-subtitle">
                Official electronic travel credentials ready for airport security checks and web check-in.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('search')}>
              <Plus size={14} />
              <span>Book New Flight</span>
            </button>
          </div>

          {eligibleTickets.length === 0 ? (
            <div className="passenger-empty-hero">
              <FileText size={40} className="empty-hero-icon" />
              <h3 className="empty-hero-title">No Electronic Tickets Found</h3>
              <p className="empty-hero-desc">
                Book a flight first to receive your official electronic ticket and passenger reservation record.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('search')}>
                Find Flights
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Ticket Number</th>
                    <th>Flight #</th>
                    <th>Travel Corridor</th>
                    <th>Assigned Seat</th>
                    <th>Passenger Name</th>
                    <th>Ticket Status</th>
                    <th>Next Step</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleTickets.map((t) => (
                    <tr key={t.ticketId}>
                      <td className="mono font-bold text-navy">{t.ticketNumber}</td>
                      <td className="mono font-semibold">{t.flightNumber}</td>
                      <td className="mono">
                        {t.origin} <ArrowRight size={12} className="inline-icon text-muted" /> {t.destination}
                      </td>
                      <td className="mono font-bold text-emerald">{t.seatNumber}</td>
                      <td>{t.passengerName || user?.name || 'Traveler'}</td>
                      <td>
                        <StatusBadge status="ACTIVE" label="ISSUED & VALID" size="sm" />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCheckInTicket(t)}
                        >
                          <ShieldCheck size={13} />
                          <span>Generate Boarding Pass</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB E: WEB CHECK-IN & BOARDING PASS */}
      {activeTab === 'checkin' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Web Check-In Desk</h2>
              <p className="passenger-view-subtitle">
                Select your confirmed ticket to verify security clearance and generate your official digital boarding pass.
              </p>
            </div>
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
                    <div className="pass-field-value text-navy">{activeBoardingPass.boardingPassNumber}</div>
                  </div>
                  <div>
                    <div className="pass-field-label">Passenger Name</div>
                    <div className="pass-field-value">{activeBoardingPass.passengerName || user?.name || 'Traveler'}</div>
                  </div>
                  <div>
                    <div className="pass-field-label">Flight Number</div>
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
                    SCAN AT SECURITY & AEROBRIDGE CHECKPOINT
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
                      <td className="mono font-bold text-navy">{t.ticketNumber}</td>
                      <td className="mono">{t.flightNumber}</td>
                      <td className="mono">
                        {t.origin} → {t.destination}
                      </td>
                      <td className="mono font-bold text-navy">{t.seatNumber}</td>
                      <td>{t.passengerName || user?.name || 'Traveler'}</td>
                      <td>
                        <StatusBadge status="ACTIVE" label="READY" size="sm" />
                      </td>
                      <td>
                        <button
                          type="button"
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

      {/* TAB F: BAGGAGE TRACKING */}
      {activeTab === 'baggage' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Baggage Tracking Station</h2>
              <p className="passenger-view-subtitle">
                Live RFID scan telemetry, baggage weight clearance, and carousel allocation for your checked luggage.
              </p>
            </div>
          </div>

          {myBaggage.length === 0 ? (
            <div className="passenger-empty-hero">
              <Luggage size={40} className="empty-hero-icon" />
              <h3 className="empty-hero-title">No Checked Baggage on File</h3>
              <p className="empty-hero-desc">
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
                      <td className="mono font-bold text-navy">{b.tagNumber}</td>
                      <td className="mono">{b.flightNumber || 'AI-101'}</td>
                      <td className="mono font-bold text-navy">{b.weightKg} kg</td>
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

      {/* TAB G: TRAVEL GUIDELINES */}
      {activeTab === 'travel-info' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Travel Guidelines & Airport Advisories</h2>
              <p className="passenger-view-subtitle">
                Essential terminal protocols, baggage allowances, and checkpoint timelines for smooth travel.
              </p>
            </div>
          </div>

          <div className="guidelines-grid">
            <div className="guideline-card">
              <div className="guideline-icon-box">
                <Luggage size={22} />
              </div>
              <h4 className="guideline-title">Baggage Allowances</h4>
              <p className="guideline-desc">
                Carry-on baggage is limited to <strong>7.0 kg</strong> per traveler. Checked baggage allowance is standard at <strong>25.0 kg</strong> per ticket. Excess baggage requires counter clearance.
              </p>
            </div>

            <div className="guideline-card">
              <div className="guideline-icon-box">
                <Clock size={22} />
              </div>
              <h4 className="guideline-title">Boarding & Gate Timelines</h4>
              <p className="guideline-desc">
                Aerobridge gates close strictly <strong>25 minutes prior</strong> to scheduled departure. Boarding begins 45 minutes before departure. Please be present at your designated gate on time.
              </p>
            </div>

            <div className="guideline-card">
              <div className="guideline-icon-box">
                <ShieldCheck size={22} />
              </div>
              <h4 className="guideline-title">Security & Dangerous Goods</h4>
              <p className="guideline-desc">
                Lithium-ion power banks and spare batteries must be carried exclusively in hand luggage. Liquids over 100ml are strictly prohibited through TSA and airport security screening.
              </p>
            </div>

            <div className="guideline-card">
              <div className="guideline-icon-box">
                <Compass size={22} />
              </div>
              <h4 className="guideline-title">Terminal Navigation & Amenities</h4>
              <p className="guideline-desc">
                Terminal 2 hosts commercial non-stop international flights. Duty-free shopping, foreign exchange, premium lounges, and ground transit taxis are accessible on Level 1.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB H: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Passenger Profile & Account Security</h2>
              <p className="passenger-view-subtitle">
                Your authenticated traveler credentials, verified biometric profile, and security settings.
              </p>
            </div>
          </div>

          <div className="passenger-profile-card">
            <div className="profile-top-section">
              <div className="profile-avatar-circle">
                <User size={34} />
              </div>
              <div>
                <h3 className="profile-full-name">{user?.name || 'Verified Traveler'}</h3>
                <p className="profile-user-email">{user?.email || 'passenger@gmail.com'}</p>
                <div className="profile-badge-row">
                  <span className="profile-pill-badge blue">STATION: PASSENGER</span>
                  <span className="profile-pill-badge emerald">STATUS: ACTIVE</span>
                  <span className="profile-pill-badge gold">TIER: SKYPRIORITY</span>
                </div>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="info-item-label">Authentication Mode</span>
                <span className="info-item-value">JWT Bearer (HttpOnly Transmissions)</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Session Lifetime</span>
                <span className="info-item-value">24 Hours Active Expiration</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Confirmed Reservations</span>
                <span className="info-item-value font-bold text-navy">{bookings.length} Flights Booked</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Checked Baggage Units</span>
                <span className="info-item-value font-bold text-navy">{myBaggage.length} Registered Units</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Security Screening</span>
                <span className="info-item-value text-emerald font-medium">Biometric Gate Clearance Enabled</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Relational Record</span>
                <span className="info-item-value mono">PASSENGERS Table (Oracle Linked)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOOK FLIGHT MODAL */}
      {bookModalOpen && selectedFlight && (
        <div className="modal-overlay" onClick={() => setBookModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Reserve Flight: <span className="mono text-navy">{selectedFlight.flightNumber}</span>
              </h3>
              <button className="modal-close" onClick={() => setBookModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Journey Corridor</label>
                  <p className="mono font-bold text-navy" style={{ fontSize: '15px' }}>
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
                  <label>Preferred Seat Selection</label>
                  <input
                    type="text"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 14A, 12B"
                    required
                  />
                  <span className="mono text-muted" style={{ fontSize: '11px' }}>
                    * The Oracle duplicate seat prevention engine validates seat allocation in real time.
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
