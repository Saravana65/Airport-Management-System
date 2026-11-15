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
  Printer,
  Zap,
  Check,
  ChevronRight,
  MapPin,
  Download,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { UltraQualityDataTable } from '../../components/ui/ultra-quality-data-table';
import operationsService from '../../services/operations.service';
import './PassengerDashboard.css';

// Aircraft Seat Layout Definition (Rows 10 to 18, Seats A, B, C, D)
const SEAT_ROWS = [10, 11, 12, 14, 15, 16, 17, 18];
const SEAT_COLS_LEFT = ['A', 'B'];
const SEAT_COLS_RIGHT = ['C', 'D'];
const DEFAULT_OCCUPIED_SEATS = ['10B', '11C', '14D', '15A', '17B'];

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
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Booking Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [bookingSeat, setBookingSeat] = useState('12A');
  const [bookingBaggageCount, setBookingBaggageCount] = useState(1);
  const [occupiedFlightSeats, setOccupiedFlightSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);

  // Passenger Details Form State
  const [passengerFirstName, setPassengerFirstName] = useState('');
  const [passengerLastName, setPassengerLastName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerDob, setPassengerDob] = useState('1995-05-15');
  const [passengerGender, setPassengerGender] = useState('M');

  // Post-Booking Confirmation Modal State
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Interactive Real-Time Web Check-In State
  const [checkingInTicket, setCheckingInTicket] = useState(null);
  const [selectedCheckInSeat, setSelectedCheckInSeat] = useState('12A');
  const [checkInBaggageCount, setCheckInBaggageCount] = useState(1);
  const [checkInBaggageWeight, setCheckInBaggageWeight] = useState(15.0);
  const [safetyDeclared, setSafetyDeclared] = useState(false);
  const [checkInSearchPnr, setCheckInSearchPnr] = useState('');

  // Passenger Baggage Management State
  const [bagFilterSearch, setBagFilterSearch] = useState('');
  const [showAddBagModal, setShowAddBagModal] = useState(false);
  const [addBagTicketId, setAddBagTicketId] = useState('');
  const [addBagWeight, setAddBagWeight] = useState(15.0);
  const [addBagType, setAddBagType] = useState('CHECKED_LUGGAGE');
  const [addBagDesc, setAddBagDesc] = useState('Standard rolling suitcase');
  const [addBagSubmitting, setAddBagSubmitting] = useState(false);
  const [addBagError, setAddBagError] = useState('');

  const loadPassengerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [flts, bks, elig, bags, notifRes] = await Promise.all([
        operationsService.getFlights().catch(() => []),
        operationsService.getBookings().catch(() => []),
        operationsService.getEligibleTickets().catch(() => []),
        operationsService.getBaggage().catch(() => []),
        operationsService.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);
      setFlights(flts);
      setBookings(bks);
      setEligibleTickets(elig);
      setMyBaggage(bags);
      if (notifRes) {
        const notifList = notifRes.notifications || notifRes || [];
        setNotifications(Array.isArray(notifList) ? notifList : []);
        setUnreadNotificationsCount(
          notifRes.unreadCount ?? (Array.isArray(notifList) ? notifList.filter(n => n.isRead === 'N').length : 0)
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load traveler portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengerData();
  }, []);

  // 1. OPEN FLIGHT BOOKING MODAL
  const handleOpenBookModal = (flight) => {
    if (flight.status === 'CANCELLED') {
      alert(`Cannot book flight ${flight.flightNumber}: Flight is CANCELLED.`);
      return;
    }
    if (flight.availableSeats === 0) {
      alert(`Cannot book flight ${flight.flightNumber}: Flight is fully booked with 0 available seats.`);
      return;
    }

    setSelectedFlight(flight);
    setCabinClass('ECONOMY');
    setBookingBaggageCount(1);

    const nameParts = (user?.name || '').trim().split(' ');
    setPassengerFirstName(nameParts[0] || 'Traveler');
    setPassengerLastName(nameParts.slice(1).join(' ') || 'Passenger');
    setPassengerEmail(user?.email || 'passenger@airport.com');
    setPassengerPhone(user?.phone || '9876543210');
    setPassengerDob('1995-05-15');
    setPassengerGender('M');

    setSeatLoading(true);
    setOccupiedFlightSeats([]);
    setBookingSeat('12A');

    operationsService.getFlightSeats(flight.flightInstanceId)
      .then((res) => {
        const occ = (res.occupiedSeats || []).map((s) => s.toUpperCase());
        setOccupiedFlightSeats(occ);
        const candidateRows = [10, 11, 12, 14, 15, 16, 17, 18];
        const candidateCols = ['A', 'B', 'C', 'D'];
        let picked = '12A';
        for (const r of candidateRows) {
          for (const c of candidateCols) {
            const s = `${r}${c}`;
            if (!occ.includes(s)) {
              picked = s;
              break;
            }
          }
          if (picked !== '12A' || !occ.includes('12A')) break;
        }
        setBookingSeat(picked);
      })
      .catch((err) => {
        console.warn('Seat map fetch note:', err);
      })
      .finally(() => {
        setSeatLoading(false);
      });

    setBookModalOpen(true);
  };

  // 2. CONFIRM BOOKING RESERVATION
  const handleConfirmBooking = async (e, instantCheckIn = false) => {
    if (e) e.preventDefault();
    if (!selectedFlight) return;

    if (!passengerFirstName.trim() || !passengerLastName.trim()) {
      alert('Passenger first and last name are required.');
      return;
    }
    if (!passengerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerEmail.trim())) {
      alert('A valid email address is required.');
      return;
    }
    if (!passengerPhone.trim() || passengerPhone.trim().length < 7) {
      alert('A valid phone number (at least 7 digits) is required.');
      return;
    }
    if (!bookingSeat.trim()) {
      alert('Please select a seat.');
      return;
    }
    if (occupiedFlightSeats.includes(bookingSeat.trim().toUpperCase())) {
      alert(`Seat ${bookingSeat.toUpperCase()} is already booked. Please choose another seat.`);
      return;
    }

    try {
      setLoading(true);
      // Step 1: Create Booking & Issue Ticket via ACID transaction
      const result = await operationsService.createBooking({
        flightInstanceId: selectedFlight.flightInstanceId,
        cabinClass,
        seatNumber: bookingSeat.trim().toUpperCase(),
        firstName: passengerFirstName.trim(),
        lastName: passengerLastName.trim(),
        email: passengerEmail.trim(),
        phone: passengerPhone.trim(),
        dateOfBirth: passengerDob,
        gender: passengerGender,
      });

      const issuedTicket = result.ticket;
      const bookingRef = result.booking.bookingReference;

      // Register Baggage if selected
      if (bookingBaggageCount > 0 && issuedTicket?.ticketId) {
        try {
          await operationsService.registerBaggage({
            ticketId: issuedTicket.ticketId,
            weightKg: 15.0 * bookingBaggageCount,
          });
        } catch (bErr) {
          console.warn('Optional baggage registration note:', bErr);
        }
      }

      setBookModalOpen(false);
      await loadPassengerData();

      if (instantCheckIn && issuedTicket?.ticketId) {
        // Step 2: Instant Web Check-In & Boarding Pass Issuance
        const checkInRes = await operationsService.processCheckIn({
          ticketId: issuedTicket.ticketId,
          seatNumber: bookingSeat.trim().toUpperCase(),
        });

        const bpData = checkInRes.checkIn || checkInRes;
        setActiveBoardingPass({
          ...bpData,
          boardingPassNumber: bpData.boardingPassCode,
          passengerName: `${passengerFirstName} ${passengerLastName}`,
          flightNumber: selectedFlight.flightNumber,
          flightDate: selectedFlight.flightDate || 'Today',
          origin: selectedFlight.originAirport,
          destination: selectedFlight.destAirport,
          originCity: selectedFlight.originCity,
          destCity: selectedFlight.destCity,
          seatNumber: bookingSeat.trim().toUpperCase(),
          cabinClass: cabinClass.toUpperCase(),
          gateNumber: selectedFlight.gate || selectedFlight.departureGate || 'T2-G01',
          terminal: selectedFlight.terminal || 'T2',
          pnr: bookingRef,
          ticketNumber: issuedTicket.ticketNumber,
        });

        setActionSuccess(
          `Instant Web Check-In Complete! Flight booked and Boarding Pass issued for PNR ${bookingRef}.`
        );
        handleTabChange('checkin');
      } else {
        // Prompt with Option to Proceed to Check-In or View Bookings
        setConfirmedBookingData({
          booking: result.booking,
          ticket: issuedTicket,
          flight: selectedFlight,
          seat: bookingSeat.trim().toUpperCase(),
          passenger: {
            name: `${passengerFirstName} ${passengerLastName}`,
            email: passengerEmail,
            phone: passengerPhone,
          },
          cabinClass,
        });
        setActionSuccess(`Reservation confirmed with PNR ${bookingRef}`);
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. START CHECK-IN FOR A SPECIFIC TICKET
  const handleStartTicketCheckIn = (ticket) => {
    setCheckingInTicket(ticket);
    setSelectedCheckInSeat(ticket.seatNumber || '12A');
    setCheckInBaggageCount(1);
    setCheckInBaggageWeight(15.0);
    setSafetyDeclared(false);
    setActiveBoardingPass(null);

    if (ticket.flightInstanceId) {
      operationsService.getFlightSeats(ticket.flightInstanceId)
        .then((res) => {
          const occ = (res.occupiedSeats || []).map((s) => s.toUpperCase());
          const otherOccupied = occ.filter((s) => s !== (ticket.seatNumber || '').toUpperCase());
          setOccupiedFlightSeats(otherOccupied);
        })
        .catch(() => {});
    }

    handleTabChange('checkin');
  };

  // 4. CONFIRM REAL-TIME WEB CHECK-IN & ISSUE BOARDING PASS
  const handleConfirmWebCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!checkingInTicket) return;

    if (!safetyDeclared) {
      alert('Please accept the civil aviation dangerous goods safety declaration to proceed.');
      return;
    }

    try {
      setLoading(true);
      // Process Check-In API
      const result = await operationsService.processCheckIn({
        ticketId: checkingInTicket.ticketId,
        seatNumber: selectedCheckInSeat,
      });

      // Register Checked Baggage if selected
      let bagTagCode = null;
      if (checkInBaggageCount > 0) {
        try {
          const bagResult = await operationsService.registerBaggage({
            ticketId: checkingInTicket.ticketId,
            weightKg: checkInBaggageWeight,
          });
          bagTagCode = bagResult.tagNumber || `BAG-${checkingInTicket.flightNumber}-001`;
        } catch (bErr) {
          console.warn('Baggage tagging note:', bErr.message);
        }
      }

      const bp = result.boardingPass || {
        ...result.checkIn,
        boardingPassNumber: result.checkIn?.boardingPassCode,
        passengerName: checkingInTicket.passengerName || user?.name || 'Verified Traveler',
        flightNumber: checkingInTicket.flightNumber,
        flightDate: checkingInTicket.flightDate || 'Today',
        origin: checkingInTicket.origin,
        destination: checkingInTicket.destination,
        seatNumber: selectedCheckInSeat,
        cabinClass: checkingInTicket.cabinClass || 'ECONOMY',
        gateNumber: checkingInTicket.gate || 'Not assigned yet',
        terminal: checkingInTicket.terminal || 'Not assigned yet',
        pnr: checkingInTicket.bookingReference,
        ticketNumber: checkingInTicket.ticketNumber,
      };

      setActiveBoardingPass({
        ...bp,
        pnr: bp.pnr || checkingInTicket.bookingReference,
        ticketNumber: bp.ticketNumber || checkingInTicket.ticketNumber,
        gateNumber: bp.gate || bp.gateNumber || 'Not assigned yet',
        terminal: bp.terminal || 'Not assigned yet',
        bagTagCode,
      });

      setActionSuccess(`Boarding Pass issued successfully for ${checkingInTicket.flightNumber}! Seat: ${selectedCheckInSeat}.`);
      setCheckingInTicket(null);
      await loadPassengerData();
    } catch (err) {
      alert(`Check-In Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. CANCEL BOOKING (OPEN MODAL)
  const handleOpenCancelModal = (booking) => {
    if (booking.status === 'CANCELLED') {
      alert('This booking is already cancelled.');
      return;
    }
    setCancelTargetBooking(booking);
    setCancelError('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelTargetBooking) return;
    setCancelSubmitting(true);
    setCancelError('');
    try {
      await operationsService.cancelBooking(cancelTargetBooking.bookingId);
      setActionSuccess(`Reservation ${cancelTargetBooking.bookingReference} has been cancelled and seat inventory released.`);
      setCancelModalOpen(false);
      setCancelTargetBooking(null);
      await loadPassengerData();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleCancelBooking = (bookingId, pnr) => {
    const booking = bookings.find(b => b.bookingId === bookingId) || { bookingId, bookingReference: pnr };
    handleOpenCancelModal(booking);
  };

  // 6. NOTIFICATION HANDLERS
  const handleMarkAsRead = async (notificationId) => {
    try {
      await operationsService.markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: 'Y' } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Mark as read note:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await operationsService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 'Y' })));
      setUnreadNotificationsCount(0);
      setActionSuccess('All notifications marked as read.');
    } catch (err) {
      console.warn('Mark all read note:', err.message);
    }
  };

  // Trigger browser print for boarding pass
  const handlePrintBoardingPass = () => {
    window.print();
  };

  // Confirmed tickets eligible for baggage registration
  const confirmedTicketsForBaggage = [];
  (bookings || []).forEach(b => {
    if (b.status === 'CONFIRMED' || b.status === 'ISSUED') {
      (b.tickets || []).forEach(t => {
        if (t.status !== 'CANCELLED') {
          confirmedTicketsForBaggage.push({
            ticketId: t.ticketId,
            ticketNumber: t.ticketNumber,
            pnr: b.bookingReference,
            flightNumber: t.flightNumber || b.flightNumber || 'Scheduled Flight',
            passengerName: t.passengerName || 'Passenger',
            seatNumber: t.seatNumber || 'Unassigned',
            cabinClass: t.cabinClass || 'ECONOMY',
          });
        }
      });
    }
  });

  const handleOpenAddBagModal = () => {
    setAddBagTicketId(confirmedTicketsForBaggage[0]?.ticketId || '');
    setAddBagWeight(15.0);
    setAddBagType('CHECKED_LUGGAGE');
    setAddBagDesc('Standard rolling suitcase');
    setAddBagError('');
    setShowAddBagModal(true);
  };

  const handleRegisterPassengerBag = async (e) => {
    e.preventDefault();
    setAddBagError('');
    if (!addBagTicketId) {
      setAddBagError('Please select a confirmed booking ticket for baggage registration.');
      return;
    }
    const weight = parseFloat(addBagWeight);
    if (isNaN(weight) || weight <= 0 || weight > 60) {
      setAddBagError('Baggage weight must be between 0.1 kg and 60.0 kg.');
      return;
    }
    setAddBagSubmitting(true);
    try {
      const res = await operationsService.registerBaggage({
        ticketId: parseInt(addBagTicketId, 10),
        weightKg: weight,
        baggageType: addBagType,
        description: addBagDesc,
      });
      setActionSuccess(`Baggage registered successfully with tag ${res.tagNumber || 'BAG-AMS'}!`);
      setShowAddBagModal(false);
      const bags = await operationsService.getBaggage();
      setMyBaggage(bags || []);
    } catch (err) {
      setAddBagError(err.message || 'Failed to register baggage.');
    } finally {
      setAddBagSubmitting(false);
    }
  };

  const filteredMyBaggage = (myBaggage || []).filter(b => {
    if (!bagFilterSearch.trim()) return true;
    const q = bagFilterSearch.toLowerCase().trim();
    return (
      b.tagNumber?.toLowerCase().includes(q) ||
      b.flightNumber?.toLowerCase().includes(q) ||
      b.bookingReference?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  // Filtered check-in tickets by PNR
  const displayedCheckInTickets = eligibleTickets.filter((t) => {
    if (!checkInSearchPnr) return true;
    const q = checkInSearchPnr.toLowerCase();
    return (
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
      (t.flightNumber && t.flightNumber.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q))
    );
  });

  return (
    <div className="passenger-portal-wrapper">
      {/* Global Alerts */}
      {actionSuccess && (
        <div className="alert-banner alert-success no-print">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="close-btn" onClick={() => setActionSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error no-print">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Modern Passenger Navigation Bar */}
      <div className="passenger-service-nav no-print">
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
          <span>Flight Booking & Schedules</span>
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
          {eligibleTickets.length > 0 && <span className="pill-count active-pulse">{eligibleTickets.length}</span>}
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
          className={`passenger-nav-pill ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => handleTabChange('notifications')}
        >
          <Bell size={15} />
          <span>Notifications</span>
          {unreadNotificationsCount > 0 && <span className="pill-count active-pulse">{unreadNotificationsCount}</span>}
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

      {/* ========================================================================= */}
      {/* TAB 1: TRAVELER OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Welcome, Traveler</h2>
              <p className="passenger-view-subtitle">
                Signed in as <span className="mono font-bold text-navy">{user?.email || 'Passenger'}</span>. Here is your current travel readiness.
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

          {/* Quick Metrics */}
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
              title="Ready for Web Check-In"
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
              subtitle="Commercial routes available"
              badgeStatus="ON_TIME"
              badgeLabel="NETWORK"
              onClick={() => handleTabChange('search')}
            />
          </div>

          {/* Featured Itinerary or Quick Booking Action */}
          {bookings.length > 0 ? (
            <div className="passenger-featured-card">
              <div className="featured-card-header">
                <div className="featured-badge">NEXT CONFIRMED ITINERARY</div>
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
                    <span className="meta-label">Total Amount</span>
                    <span className="meta-val text-emerald">₹{bookings[0].totalAmount || '4500'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Reservation Status</span>
                    <StatusBadge status={bookings[0].status} label={bookings[0].status} size="sm" />
                  </div>
                </div>
              </div>
              <div className="featured-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => handleTabChange('bookings')}>
                  View All Bookings ({bookings.length})
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('checkin')}>
                  <ShieldCheck size={14} />
                  <span>Proceed to Web Check-In & Boarding Pass</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="passenger-empty-hero">
              <Plane size={44} className="empty-hero-icon" />
              <h3 className="empty-hero-title">Ready for Your Next Journey?</h3>
              <p className="empty-hero-desc">
                Browse our real-time commercial flight schedules, monitor live gate allocations, and book tickets instantly with Web Check-In ready.
              </p>
              <button className="btn btn-primary" onClick={() => handleTabChange('search')}>
                <Plane size={15} />
                <span>Search Scheduled Flights & Book</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLIGHT BOOKING & LIVE FLIGHT SCHEDULES SITE */}
      {/* ========================================================================= */}
      {(activeTab === 'search' || activeTab === 'flights') && (
        <div className="passenger-view-container">
          <UltraQualityDataTable
            title="Commercial Flight Schedules & Instant Booking"
            subtitle="Search scheduled routes, check live departure gates, track delays, and reserve tickets with real-time web check-in"
            embedded={true}
            onBookFlight={(f) => handleOpenBookModal(f)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY BOOKINGS */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">My Confirmed Reservations</h2>
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
                    <th>Check-In / Actions</th>
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
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              const t = b.tickets?.[0];
                              if (t) handleStartTicketCheckIn(t);
                              else handleTabChange('checkin');
                            }}
                            title="Perform Web Check-In & Issue Boarding Pass"
                          >
                            <ShieldCheck size={13} />
                            <span>Web Check-In</span>
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

      {/* ========================================================================= */}
      {/* TAB 4: MY TICKETS */}
      {/* ========================================================================= */}
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
                Find Flights & Book
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
                    <th>Web Check-In</th>
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
                          onClick={() => handleStartTicketCheckIn(t)}
                        >
                          <ShieldCheck size={13} />
                          <span>Check In & Get Boarding Pass</span>
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

      {/* ========================================================================= */}
      {/* TAB 5: ACTUAL REAL-TIME WEB CHECK-IN DESK & BOARDING PASS */}
      {/* ========================================================================= */}
      {activeTab === 'checkin' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header no-print">
            <div>
              <h2 className="passenger-view-title">Airline Web Check-In Portal</h2>
              <p className="passenger-view-subtitle">
                Select your flight ticket, choose your aircraft seat on the live cabin map, declare baggage, and generate your official digital boarding pass.
              </p>
            </div>
            {activeBoardingPass && (
              <div className="passenger-header-actions">
                <button className="btn btn-primary btn-sm" onClick={handlePrintBoardingPass}>
                  <Printer size={14} />
                  <span>Print Boarding Pass</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setActiveBoardingPass(null);
                    setCheckingInTicket(null);
                  }}
                >
                  Check In Another Ticket
                </button>
              </div>
            )}
          </div>

          {/* VIEW 1: ACTIVE DIGITAL BOARDING PASS (REAL-TIME DISPLAY) */}
          {activeBoardingPass && (
            <div className="boarding-pass-print-wrapper">
              {/* Mandatory Demo Disclaimer Notice */}
              <div
                className="bp-demo-notice-banner no-print"
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  color: '#92400E',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                ⚠️ DIGITAL DEMO BOARDING-PASS PREVIEW — For demonstration and simulation purposes only. Not an official airline or airport travel document.
              </div>

              <div className="digital-boarding-pass-modern">
                {/* Boarding Pass Header Ribbon */}
                <div className="bp-header-bar">
                  <div className="bp-airline-brand">
                    <Plane size={22} className="bp-plane-icon" />
                    <div>
                      <span className="bp-airline-title">{activeBoardingPass.airlineName || 'COMMERCIAL AIRWAYS'}</span>
                      <span className="bp-pass-type">ELECTRONIC BOARDING PASS (DEMO PREVIEW)</span>
                    </div>
                  </div>
                  <div className="bp-status-tag">
                    <ShieldCheck size={14} />
                    <span>{activeBoardingPass.checkInStatus || 'CHECKED_IN'}</span>
                  </div>
                </div>

                {/* Corridor Banner */}
                <div className="bp-corridor-banner">
                  <div className="bp-city-block">
                    <span className="bp-city-iata">{activeBoardingPass.origin || 'DEL'}</span>
                    <span className="bp-city-name">{activeBoardingPass.originCity || 'Origin'}</span>
                  </div>
                  <div className="bp-flight-transit">
                    <span className="bp-flight-num">{activeBoardingPass.flightNumber}</span>
                    <div className="bp-transit-arrow">
                      <div className="bp-dot start"></div>
                      <div className="bp-line"></div>
                      <Plane size={16} style={{ transform: 'rotate(90deg)' }} />
                      <div className="bp-line"></div>
                      <div className="bp-dot end"></div>
                    </div>
                    <span className="bp-flight-mode">NON-STOP FLIGHT</span>
                  </div>
                  <div className="bp-city-block text-right">
                    <span className="bp-city-iata">{activeBoardingPass.destination || 'BOM'}</span>
                    <span className="bp-city-name">{activeBoardingPass.destCity || 'Destination'}</span>
                  </div>
                </div>

                {/* 6-Quadrant Critical Travel Data Grid */}
                <div className="bp-details-grid">
                  <div className="bp-cell">
                    <span className="bp-cell-label">Passenger Name</span>
                    <span className="bp-cell-val font-bold">{activeBoardingPass.passengerName || 'Verified Traveler'}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Assigned Seat</span>
                    <span className="bp-cell-val font-bold text-emerald">{activeBoardingPass.seatNumber}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Terminal / Gate</span>
                    <span className="bp-cell-val font-bold text-navy">
                      {activeBoardingPass.gateNumber || activeBoardingPass.gate || (activeBoardingPass.terminal && activeBoardingPass.terminal !== 'Not assigned yet' ? `Terminal ${activeBoardingPass.terminal}` : 'Not assigned yet')}
                    </span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Boarding Time</span>
                    <span className="bp-cell-val font-bold text-navy">{activeBoardingPass.boardingTime || '45 mins prior to departure'}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Cabin Class</span>
                    <span className="bp-cell-val">{activeBoardingPass.cabinClass || 'ECONOMY'}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">PNR Reference</span>
                    <span className="bp-cell-val mono font-bold text-navy">{activeBoardingPass.pnr || 'PNR-CONFIRMED'}</span>
                  </div>
                </div>

                {/* Second Row: E-Ticket Number and Travel Date */}
                <div className="bp-details-grid" style={{ marginTop: '8px', borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                  <div className="bp-cell">
                    <span className="bp-cell-label">E-Ticket Number</span>
                    <span className="bp-cell-val mono">{activeBoardingPass.ticketNumber || '--'}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Departure Date & Time</span>
                    <span className="bp-cell-val">{activeBoardingPass.flightDate || activeBoardingPass.departureDate || 'Scheduled Date'} · {activeBoardingPass.departureTime || 'Scheduled'}</span>
                  </div>
                  <div className="bp-cell">
                    <span className="bp-cell-label">Check-In Status</span>
                    <span className="bp-cell-val font-bold text-emerald">{activeBoardingPass.checkInStatus || 'CHECKED_IN'}</span>
                  </div>
                </div>

                {/* Baggage Tag Notice if baggage registered */}
                {activeBoardingPass.bagTagCode && (
                  <div className="bp-baggage-notice">
                    <Luggage size={16} />
                    <span>Checked Baggage Registered: <strong>{activeBoardingPass.bagTagCode}</strong> (RFID Tag Activated)</span>
                  </div>
                )}

                {/* Barcode & Security Clearance Footer */}
                <div className="bp-barcode-footer">
                  <div className="bp-barcode-strip">
                    <span className="bp-simulated-barcode">|||| ||| | ||||| || |||||| | ||| || |||| | ||||| |||</span>
                    <span className="bp-barcode-num">{activeBoardingPass.boardingPassNumber}</span>
                  </div>
                  <div className="bp-qr-box">
                    <QrCode size={52} />
                    <span className="bp-qr-note">GATE SCAN</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Below Boarding Pass */}
              <div className="bp-action-bar no-print">
                <button type="button" className="btn btn-primary" onClick={handlePrintBoardingPass}>
                  <Printer size={15} />
                  <span>Print Boarding Pass Preview</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleTabChange('baggage')}
                >
                  <Luggage size={15} />
                  <span>Track Baggage Tag</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setActiveBoardingPass(null);
                    setCheckingInTicket(null);
                  }}
                >
                  Return to Check-In Desk
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: INTERACTIVE REAL-TIME CHECK-IN WORKSPACE (SEAT MAP & BAGGAGE) */}
          {!activeBoardingPass && checkingInTicket && (
            <div className="checkin-interactive-workspace">
              {/* Ticket Summary Header */}
              <div className="checkin-flight-summary-card">
                <div className="summary-left">
                  <div className="summary-plane-icon">
                    <Plane size={24} />
                  </div>
                  <div>
                    <h3 className="summary-flight-title">
                      Web Check-In for Flight {checkingInTicket.flightNumber}
                    </h3>
                    <p className="summary-flight-route">
                      {checkingInTicket.origin} → {checkingInTicket.destination} | Ticket #{checkingInTicket.ticketNumber}
                    </p>
                  </div>
                </div>
                <div className="summary-right">
                  <span className="passenger-name-tag">Passenger: {checkingInTicket.passengerName || user?.email}</span>
                </div>
              </div>

              {/* Real-Time Aircraft Seat Map Picker */}
              <div className="checkin-seat-picker-card">
                <div className="seat-picker-header">
                  <div>
                    <h4 className="picker-title">Select Your Airplane Seat (Live Cabin Map)</h4>
                    <p className="picker-subtitle">
                      Commercial Jetliner Boeing 737 / Airbus A320 Configuration (2x2 Aisle Corridor)
                    </p>
                  </div>
                  <div className="seat-selection-badge">
                    <span>Selected Seat:</span>
                    <strong className="text-emerald">{selectedCheckInSeat}</strong>
                  </div>
                </div>

                {/* Seat Map Legend */}
                <div className="seat-map-legend">
                  <div className="legend-item">
                    <div className="legend-box available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box selected"></div>
                    <span>Your Selection</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box occupied">X</div>
                    <span>Occupied</span>
                  </div>
                </div>

                {/* Cabin Layout */}
                <div className="airplane-fuselage">
                  <div className="airplane-nose">
                    <Compass size={18} />
                    <span>COCKPIT & FORWARD GALLEY</span>
                  </div>

                  <div className="airplane-cabin-grid">
                    <div className="cabin-col-labels">
                      <span>Seat A (Window)</span>
                      <span>Seat B (Aisle)</span>
                      <span className="aisle-label">AISLE</span>
                      <span>Seat C (Aisle)</span>
                      <span>Seat D (Window)</span>
                    </div>

                    {SEAT_ROWS.map((row) => (
                      <div key={`row-${row}`} className="cabin-row">
                        <span className="row-num">{row}</span>

                        {/* Left Side (Seats A, B) */}
                        <div className="seat-pair left">
                          {SEAT_COLS_LEFT.map((col) => {
                            const seatCode = `${row}${col}`;
                            const isOccupied = occupiedFlightSeats.includes(seatCode);
                            const isSelected = selectedCheckInSeat === seatCode;

                            return (
                              <button
                                key={seatCode}
                                type="button"
                                disabled={isOccupied}
                                className={`seat-map-btn ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : 'available'}`}
                                onClick={() => setSelectedCheckInSeat(seatCode)}
                                title={isOccupied ? `Seat ${seatCode} Occupied` : `Select Seat ${seatCode}`}
                              >
                                {isSelected ? <Check size={12} /> : isOccupied ? '✕' : seatCode}
                              </button>
                            );
                          })}
                        </div>

                        {/* Center Aisle */}
                        <div className="aisle-spacer">
                          <span className="aisle-dot">•</span>
                        </div>

                        {/* Right Side (Seats C, D) */}
                        <div className="seat-pair right">
                          {SEAT_COLS_RIGHT.map((col) => {
                            const seatCode = `${row}${col}`;
                            const isOccupied = occupiedFlightSeats.includes(seatCode);
                            const isSelected = selectedCheckInSeat === seatCode;

                            return (
                              <button
                                key={seatCode}
                                type="button"
                                disabled={isOccupied}
                                className={`seat-map-btn ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : 'available'}`}
                                onClick={() => setSelectedCheckInSeat(seatCode)}
                                title={isOccupied ? `Seat ${seatCode} Occupied` : `Select Seat ${seatCode}`}
                              >
                                {isSelected ? <Check size={12} /> : isOccupied ? '✕' : seatCode}
                              </button>
                            );
                          })}
                        </div>

                        <span className="row-num">{row}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Baggage & Hazardous Goods Declaration */}
              <div className="checkin-declarations-card">
                <h4 className="decl-title">Baggage Intake & Security Declaration</h4>

                {/* Baggage Selection Group */}
                <div className="baggage-options-row">
                  <div
                    className={`baggage-option-card ${checkInBaggageCount === 0 ? 'active' : ''}`}
                    onClick={() => {
                      setCheckInBaggageCount(0);
                      setCheckInBaggageWeight(0);
                    }}
                  >
                    <Luggage size={20} />
                    <span className="bag-label">Cabin Bag Only</span>
                    <span className="bag-sub">Free 7.0 kg</span>
                  </div>

                  <div
                    className={`baggage-option-card ${checkInBaggageCount === 1 ? 'active' : ''}`}
                    onClick={() => {
                      setCheckInBaggageCount(1);
                      setCheckInBaggageWeight(15.0);
                    }}
                  >
                    <Luggage size={20} />
                    <span className="bag-label">1 Checked Luggage</span>
                    <span className="bag-sub">Standard 15.0 kg</span>
                  </div>

                  <div
                    className={`baggage-option-card ${checkInBaggageCount === 2 ? 'active' : ''}`}
                    onClick={() => {
                      setCheckInBaggageCount(2);
                      setCheckInBaggageWeight(25.0);
                    }}
                  >
                    <Luggage size={20} />
                    <span className="bag-label">2 Checked Luggage</span>
                    <span className="bag-sub">Extended 25.0 kg</span>
                  </div>
                </div>

                {/* Dangerous Goods Declaration Checkbox */}
                <div className="safety-declaration-box">
                  <label className="safety-checkbox-label">
                    <input
                      type="checkbox"
                      checked={safetyDeclared}
                      onChange={(e) => setSafetyDeclared(e.target.checked)}
                    />
                    <span>
                      I declare that I am <strong>not carrying any prohibited hazardous substances</strong>, flammable aerosols, fireworks, or spare loose lithium-ion power banks in checked baggage in compliance with ICAO/TSA civil aviation safety regulations.
                    </span>
                  </label>
                </div>

                {/* Complete Check-In Action Button */}
                <div className="checkin-submit-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCheckingInTicket(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    disabled={!safetyDeclared || loading}
                    onClick={handleConfirmWebCheckIn}
                  >
                    <ShieldCheck size={16} />
                    <span>Complete Web Check-In & Issue Boarding Pass (Seat {selectedCheckInSeat})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: TICKET LIST READY FOR WEB CHECK-IN */}
          {!activeBoardingPass && !checkingInTicket && (
            <div className="checkin-ticket-selection-view">
              {/* PNR Search Box */}
              <div className="checkin-search-bar">
                <div className="search-box-left">
                  <Search size={18} className="text-muted" />
                  <input
                    type="text"
                    placeholder="Retrieve by PNR, Ticket Number, or Flight (e.g. AI2014 or BOM)..."
                    value={checkInSearchPnr}
                    onChange={(e) => setCheckInSearchPnr(e.target.value)}
                    className="checkin-search-input"
                  />
                </div>
                {checkInSearchPnr && (
                  <button className="btn-clear" onClick={() => setCheckInSearchPnr('')}>
                    Clear
                  </button>
                )}
              </div>

              {/* Tickets Table */}
              {displayedCheckInTickets.length === 0 ? (
                <div className="passenger-empty-hero">
                  <ShieldCheck size={44} className="empty-hero-icon" />
                  <h3 className="empty-hero-title">No Tickets Awaiting Web Check-In</h3>
                  <p className="empty-hero-desc">
                    All your confirmed bookings have either been checked in or no tickets are currently issued. Book your next flight to initiate web check-in.
                  </p>
                  <button className="btn btn-primary" onClick={() => handleTabChange('search')}>
                    <Plane size={15} />
                    <span>Browse & Book Flights</span>
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
                        <th>Preferred Seat</th>
                        <th>Passenger Name</th>
                        <th>Check-In Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedCheckInTickets.map((t) => (
                        <tr key={t.ticketId}>
                          <td className="mono font-bold text-navy">{t.ticketNumber}</td>
                          <td className="mono font-semibold">{t.flightNumber}</td>
                          <td className="mono">
                            {t.origin} <ArrowRight size={12} className="inline-icon text-muted" /> {t.destination}
                          </td>
                          <td className="mono font-bold text-emerald">{t.seatNumber || 'Unassigned'}</td>
                          <td>{t.passengerName || user?.name || 'Traveler'}</td>
                          <td>
                            <StatusBadge status="OPERATIONAL" label="CHECK-IN OPEN" size="sm" />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStartTicketCheckIn(t)}
                            >
                              <ShieldCheck size={13} />
                              <span>Start Web Check-In</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BAGGAGE TRACKING & REGISTRATION */}
      {/* ========================================================================= */}
      {activeTab === 'baggage' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Baggage Tracking & Registration</h2>
              <p className="passenger-view-subtitle">
                Live RFID scan telemetry, baggage weight clearance, and claim carousel allocation for your checked luggage.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddBagModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Add Baggage to Booking</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadPassengerData}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Demo Baggage Allowance Advisory Card */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
            border: '1px solid #BFDBFE',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <AlertCircle size={20} color="#1D4ED8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E40AF', marginBottom: '2px' }}>
                DEMO BAGGAGE ALLOWANCE ADVISORY
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                Standard complimentary allowance is <strong>1 checked bag up to 15.0 kg</strong> for Economy and <strong>2 checked bags up to 25.0 kg</strong> for Business. All baggage policies, excess weight charges, and conveyor routings are for academic simulation only.
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by tag #, flight #, PNR, or status..."
                value={bagFilterSearch}
                onChange={(e) => setBagFilterSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {filteredMyBaggage.length === 0 ? (
            <div className="passenger-empty-hero">
              <Luggage size={40} className="empty-hero-icon" />
              <h3 className="empty-hero-title">
                {myBaggage.length === 0 ? 'No Checked Baggage on File' : 'No Baggage Matching Filter'}
              </h3>
              <p className="empty-hero-desc">
                {myBaggage.length === 0
                  ? 'Your checked luggage units will appear here once registered online or at the airport check-in counter.'
                  : 'Try adjusting your search criteria.'}
              </p>
              {confirmedTicketsForBaggage.length > 0 && myBaggage.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenAddBagModal}
                  style={{ marginTop: '12px' }}
                >
                  <Plus size={14} /> Register Baggage Now
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Baggage Tag #</th>
                    <th>Booking PNR</th>
                    <th>Flight Corridor</th>
                    <th>Weight (kg)</th>
                    <th>Claim Carousel</th>
                    <th>Handling Status</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMyBaggage.map((b) => (
                    <tr key={b.baggageId}>
                      <td className="mono font-bold text-navy">{b.tagNumber}</td>
                      <td className="mono font-semibold" style={{ color: '#0F766E' }}>
                        {b.bookingReference || 'N/A'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.flightNumber || 'Scheduled'}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {b.originAirport && b.destAirport ? `${b.originAirport} → ${b.destAirport}` : 'Confirmed Route'}
                        </div>
                      </td>
                      <td className="mono font-bold text-navy">{b.weightKg} kg</td>
                      <td className="mono text-muted">{b.carouselNumber || 'Pending Allocation'}</td>
                      <td>
                        <StatusBadge status={b.status} label={b.status} size="sm" />
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748B' }}>
                        {b.createdAt || 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: FLIGHT & OPERATIONAL NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="passenger-view-container">
          <div className="passenger-view-header">
            <div>
              <h2 className="passenger-view-title">Flight & Operational Notifications</h2>
              <p className="passenger-view-subtitle">
                Real-time alerts stored in MySQL for booking confirmations, status changes, delays, gate reassignments, and web check-in.
              </p>
            </div>
            <div className="passenger-header-actions">
              {unreadNotificationsCount > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={handleMarkAllAsRead}>
                  <CheckCircle2 size={14} />
                  <span>Mark All as Read</span>
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={loadPassengerData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="passenger-empty-hero">
              <Bell size={40} className="empty-hero-icon" />
              <h3 className="empty-hero-title">No Notifications Yet</h3>
              <p className="empty-hero-desc">
                You will receive real-time notifications here when you book a flight, check in, or when flight status/gate updates occur.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Notification Title</th>
                    <th>Message Details</th>
                    <th>Received At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.notificationId} style={{ background: n.isRead === 'N' ? '#F0F9FF' : 'transparent' }}>
                      <td>
                        <span className={`profile-pill-badge ${
                          n.type === 'BOOKING' ? 'emerald' :
                          n.type === 'CANCELLATION' ? 'red' :
                          n.type === 'CHECKIN' ? 'blue' :
                          n.type === 'DELAY' ? 'gold' : 'blue'
                        }`}>
                          {n.type}
                        </span>
                      </td>
                      <td className="font-semibold text-navy">
                        {n.title}
                      </td>
                      <td style={{ fontSize: '13px', color: '#334155', maxWidth: '380px' }}>
                        {n.message}
                      </td>
                      <td className="mono text-muted" style={{ fontSize: '12px' }}>
                        {n.createdAt}
                      </td>
                      <td>
                        {n.isRead === 'N' ? (
                          <span className="profile-pill-badge gold" style={{ fontSize: '11px' }}>UNREAD</span>
                        ) : (
                          <span className="profile-pill-badge emerald" style={{ fontSize: '11px' }}>READ</span>
                        )}
                      </td>
                      <td>
                        {n.isRead === 'N' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleMarkAsRead(n.notificationId)}
                          >
                            Mark Read
                          </button>
                        ) : (
                          <span className="mono text-muted" style={{ fontSize: '12px' }}>✓ Read</span>
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

      {/* ========================================================================= */}
      {/* TAB 7: TRAVEL GUIDELINES */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* TAB 8: MY PROFILE */}
      {/* ========================================================================= */}
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
                <span className="info-item-value">Secure Login (Session Protected)</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Session Status</span>
                <span className="info-item-value">Active</span>
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
                <span className="info-item-label">Travel Status</span>
                <span className="info-item-value text-emerald font-medium">Ready to Travel</span>
              </div>
              <div className="profile-info-item">
                <span className="info-item-label">Account Type</span>
                <span className="info-item-value">Registered Passenger</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FLIGHT BOOKING MODAL (WITH INSTANT CHECK-IN BUTTON) */}
      {/* ========================================================================= */}
      {bookModalOpen && selectedFlight && (
        <div className="modal-overlay" onClick={() => setBookModalOpen(false)}>
          <div className="modal-card booking-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Book Flight: <span className="mono text-navy">{selectedFlight.flightNumber}</span>
              </h3>
              <button className="modal-close" onClick={() => setBookModalOpen(false)}>×</button>
            </div>

            <form onSubmit={(e) => handleConfirmBooking(e, false)}>
              <div className="modal-body">
                {/* Flight Route Banner */}
                <div className="modal-route-banner">
                  <div className="modal-station">
                    <span className="iata">{selectedFlight.originAirport}</span>
                    <span className="city">{selectedFlight.originCity || 'Origin'}</span>
                  </div>
                  <div className="modal-transit">
                    <Plane size={20} />
                    <span>Non-Stop Flight</span>
                  </div>
                  <div className="modal-station text-right">
                    <span className="iata">{selectedFlight.destAirport}</span>
                    <span className="city">{selectedFlight.destCity || 'Destination'}</span>
                  </div>
                </div>

                {/* Passenger Information Form */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Passenger Information
                  </h4>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>First Name <span style={{ color: '#EF4444' }}>*</span></label>
                      <input
                        type="text"
                        value={passengerFirstName}
                        onChange={(e) => setPassengerFirstName(e.target.value)}
                        placeholder="e.g. John"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                      <input
                        type="text"
                        value={passengerLastName}
                        onChange={(e) => setPassengerLastName(e.target.value)}
                        placeholder="e.g. Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder="passenger@example.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone <span style={{ color: '#EF4444' }}>*</span></label>
                      <input
                        type="tel"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                      <input
                        type="date"
                        value={passengerDob}
                        onChange={(e) => setPassengerDob(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={passengerGender}
                        onChange={(e) => setPassengerGender(e.target.value)}
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Travel Class & Baggage Section */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Travel Class & Baggage
                  </h4>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Cabin Class Selection</label>
                      <select
                        value={cabinClass}
                        onChange={(e) => {
                          const newClass = e.target.value;
                          setCabinClass(newClass);
                          if (newClass === 'BUSINESS') {
                            setBookingSeat('02A');
                          } else if (newClass === 'FIRST') {
                            setBookingSeat('01A');
                          } else {
                            setBookingSeat('12A');
                          }
                        }}
                        required
                      >
                        <option value="ECONOMY">Economy Class (1.0x Base Fare)</option>
                        <option value="BUSINESS">Business Class (2.5x Base Fare)</option>
                        <option value="FIRST">First Class Suite (4.0x Base Fare)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Checked Luggage Allocation</label>
                      <select
                        value={bookingBaggageCount}
                        onChange={(e) => setBookingBaggageCount(Number(e.target.value))}
                      >
                        <option value={0}>0 Checked Bags (Carry-on 7kg only)</option>
                        <option value={1}>1 Checked Bag (15 kg allowance included)</option>
                        <option value={2}>2 Checked Bags (25 kg allowance included)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interactive Seat Selection Section */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      3. Interactive Seat Selection
                    </h4>
                    <span className="mono" style={{ fontSize: '12px', background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '4px', fontWeight: 700 }}>
                      Selected Seat: {bookingSeat || 'None'}
                    </span>
                  </div>

                  {seatLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                      Checking live seat availability in MySQL...
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                      {/* Seat Map Grid */}
                      <div className="seat-map-grid" style={{ maxWidth: '340px', margin: '0 auto' }}>
                        {(cabinClass === 'BUSINESS' || cabinClass === 'FIRST'
                          ? [1, 2, 3, 4]
                          : [10, 11, 12, 14, 15, 16, 17]
                        ).map((row) => (
                          <div key={row} className="seat-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="seat-row-label mono" style={{ width: '24px', fontSize: '11px', color: '#64748B', textAlign: 'right', fontWeight: 600 }}>
                              {row < 10 ? `0${row}` : row}
                            </span>
                            {['A', 'B'].map((col) => {
                              const sCode = `${row < 10 ? `0${row}` : row}${col}`;
                              const isOccupied = occupiedFlightSeats.includes(sCode);
                              const isSelected = bookingSeat === sCode;
                              return (
                                <button
                                  key={sCode}
                                  type="button"
                                  disabled={isOccupied}
                                  className={`seat-map-btn ${isSelected ? 'selected' : isOccupied ? 'occupied' : 'available'}`}
                                  onClick={() => setBookingSeat(sCode)}
                                  title={isOccupied ? `Seat ${sCode} (Booked)` : `Seat ${sCode} (Available)`}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: isOccupied ? 'not-allowed' : 'pointer',
                                    background: isSelected ? '#2563EB' : isOccupied ? '#CBD5E1' : '#FFFFFF',
                                    color: isSelected ? '#FFFFFF' : isOccupied ? '#94A3B8' : '#1E293B',
                                    border: isSelected ? '2px solid #1D4ED8' : isOccupied ? '1px solid #CBD5E1' : '1.5px solid #94A3B8',
                                  }}
                                >
                                  {isOccupied ? '✕' : sCode}
                                </button>
                              );
                            })}
                            <div className="seat-aisle" style={{ width: '18px', textAlign: 'center', fontSize: '10px', color: '#94A3B8' }}>
                              |
                            </div>
                            {['C', 'D'].map((col) => {
                              const sCode = `${row < 10 ? `0${row}` : row}${col}`;
                              const isOccupied = occupiedFlightSeats.includes(sCode);
                              const isSelected = bookingSeat === sCode;
                              return (
                                <button
                                  key={sCode}
                                  type="button"
                                  disabled={isOccupied}
                                  className={`seat-map-btn ${isSelected ? 'selected' : isOccupied ? 'occupied' : 'available'}`}
                                  onClick={() => setBookingSeat(sCode)}
                                  title={isOccupied ? `Seat ${sCode} (Booked)` : `Seat ${sCode} (Available)`}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: isOccupied ? 'not-allowed' : 'pointer',
                                    background: isSelected ? '#2563EB' : isOccupied ? '#CBD5E1' : '#FFFFFF',
                                    color: isSelected ? '#FFFFFF' : isOccupied ? '#94A3B8' : '#1E293B',
                                    border: isSelected ? '2px solid #1D4ED8' : isOccupied ? '1px solid #CBD5E1' : '1.5px solid #94A3B8',
                                  }}
                                >
                                  {isOccupied ? '✕' : sCode}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px', color: '#64748B' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '12px', height: '12px', background: '#FFFFFF', border: '1px solid #94A3B8', borderRadius: '3px' }}></span>
                          Available
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '12px', height: '12px', background: '#2563EB', borderRadius: '3px' }}></span>
                          Selected
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '12px', height: '12px', background: '#CBD5E1', borderRadius: '3px' }}></span>
                          Occupied
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fare Summary Breakdown */}
                <div className="booking-fare-summary" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginTop: '16px' }}>
                  <div className="fare-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Base Fare (Economy Tariff):</span>
                    <span className="mono font-bold">
                      ₹{selectedFlight.baseFare != null ? Number(selectedFlight.baseFare).toLocaleString() : '--'}
                    </span>
                  </div>
                  <div className="fare-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Selected Cabin Multiplier:</span>
                    <span className="mono font-bold text-navy">
                      {cabinClass === 'BUSINESS' ? '2.5x (Business Class)' : cabinClass === 'FIRST' ? '4.0x (First Class Suite)' : '1.0x (Standard Economy)'}
                    </span>
                  </div>
                  <div className="fare-row" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '15px' }}>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>Estimated Total Fare:</span>
                    <span className="fare-total mono font-bold text-emerald" style={{ fontSize: '18px', color: '#059669' }}>
                      ₹{Math.round((Number(selectedFlight.baseFare) || 0) * (cabinClass === 'BUSINESS' ? 2.5 : cabinClass === 'FIRST' ? 4.0 : 1.0)).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                    * Base Fare is retrieved directly from MySQL database. ACID transaction commits booking and ticket atomically.
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookModalOpen(false)}
                >
                  Cancel
                </button>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-secondary" disabled={loading}>
                    Book Reservation Only
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={loading}
                    onClick={(e) => handleConfirmBooking(e, true)}
                    title="Book ticket and instantly issue digital Boarding Pass"
                  >
                    <Zap size={14} />
                    <span>Instant Book & Web Check-In</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. POST-BOOKING CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmedBookingData && (
        <div className="modal-overlay" onClick={() => setConfirmedBookingData(null)}>
          <div className="modal-card post-booking-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="post-booking-icon" style={{ textAlign: 'center', marginBottom: '12px' }}>
              <CheckCircle2 size={48} className="text-emerald" style={{ color: '#10B981', margin: '0 auto' }} />
            </div>
            <h3 className="post-booking-title" style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Flight Reservation Confirmed!
            </h3>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', marginBottom: '16px' }}>
              Your electronic ticket and reservation have been permanently committed to MySQL.
            </p>

            {/* Receipt Summary Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #CBD5E1' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Booking Reference (PNR)</span>
                <span className="mono font-bold" style={{ fontSize: '15px', color: '#1E40AF', letterSpacing: '0.05em' }}>
                  {confirmedBookingData.booking.bookingReference}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>E-Ticket Number:</span>
                <span className="mono font-medium">{confirmedBookingData.ticket?.ticketNumber}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Passenger Name:</span>
                <span style={{ fontWeight: 600 }}>
                  {confirmedBookingData.passenger?.name || `${passengerFirstName} ${passengerLastName}`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Flight Route:</span>
                <span className="mono font-bold">
                  {confirmedBookingData.flight.flightNumber} ({confirmedBookingData.flight.originAirport} → {confirmedBookingData.flight.destAirport})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Travel Date & Time:</span>
                <span>{confirmedBookingData.flight.flightDate || 'Today'} · {confirmedBookingData.flight.scheduledDepartureTime || 'On Schedule'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Allocated Seat:</span>
                <span className="mono font-bold text-navy" style={{ color: '#1D4ED8' }}>
                  {confirmedBookingData.seat} ({confirmedBookingData.cabinClass || 'ECONOMY'})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>Total Amount Paid:</span>
                <span className="mono font-bold" style={{ color: '#059669', fontSize: '16px' }}>
                  ₹{Number(confirmedBookingData.booking.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="post-booking-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const t = confirmedBookingData.ticket;
                  setConfirmedBookingData(null);
                  handleStartTicketCheckIn(t);
                }}
              >
                <ShieldCheck size={16} />
                <span>Proceed to Web Check-In & Boarding Pass</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setConfirmedBookingData(null);
                  handleTabChange('bookings');
                }}
              >
                View in My Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSENGER ADD BAGGAGE MODAL */}
      {/* ========================================================================= */}
      {showAddBagModal && (
        <div className="modal-overlay" onClick={() => setShowAddBagModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Luggage size={18} color="#2563EB" />
                <span>Add Checked Baggage</span>
              </h3>
              <button className="modal-close" onClick={() => setShowAddBagModal(false)}>×</button>
            </div>

            <form onSubmit={handleRegisterPassengerBag}>
              <div className="modal-body">
                {addBagError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '14px',
                  }}>
                    {addBagError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Confirmed Flight Ticket *
                  </label>
                  {confirmedTicketsForBaggage.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#DC2626', padding: '8px 0' }}>
                      No eligible confirmed booking tickets found. Please book a flight first.
                    </div>
                  ) : (
                    <select
                      value={addBagTicketId}
                      onChange={(e) => setAddBagTicketId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    >
                      {confirmedTicketsForBaggage.map((t) => (
                        <option key={t.ticketId} value={t.ticketId}>
                          PNR: {t.pnr} | Flight {t.flightNumber} | Seat {t.seatNumber} ({t.passengerName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Baggage Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="60"
                      value={addBagWeight}
                      onChange={(e) => setAddBagWeight(parseFloat(e.target.value) || 0)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Allowed: 0.1 - 60.0 kg</span>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Baggage Category
                    </label>
                    <select
                      value={addBagType}
                      onChange={(e) => setAddBagType(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    >
                      <option value="CHECKED_LUGGAGE">Standard Checked Luggage</option>
                      <option value="FRAGILE">Fragile / Priority Tag</option>
                      <option value="SPORTS_EQUIPMENT">Sports / Musical Equipment</option>
                      <option value="CABIN_EXCESS">Cabin Excess Drop</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Item Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Navy blue hard-shell suitcase with TSA lock"
                    value={addBagDesc}
                    onChange={(e) => setAddBagDesc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{
                  background: '#F1F5F9',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}>
                  RFID tracking tag will be automatically generated and linked to your passenger reservation in MySQL.
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddBagModal(false)}
                  disabled={addBagSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addBagSubmitting || confirmedTicketsForBaggage.length === 0}
                >
                  {addBagSubmitting ? 'Registering...' : 'Register Baggage Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCELLATION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancelModalOpen && cancelTargetBooking && (
        <div className="modal-overlay" onClick={() => !cancelSubmitting && setCancelModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #FEE2E2', background: '#FEF2F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="#DC2626" />
                <h3 className="modal-title" style={{ color: '#991B1B' }}>
                  Cancel Reservation Confirmation
                </h3>
              </div>
              <button
                className="modal-close"
                disabled={cancelSubmitting}
                onClick={() => setCancelModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {cancelError && (
                <div className="alert-banner alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={15} />
                  <span>{cancelError}</span>
                </div>
              )}

              <p style={{ fontSize: '14px', color: '#1E293B', marginBottom: '16px', lineHeight: '1.5' }}>
                Are you sure you want to cancel booking PNR <strong className="mono text-navy">{cancelTargetBooking.bookingReference}</strong>?
              </p>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>PNR Reference</span>
                    <strong className="mono text-navy">{cancelTargetBooking.bookingReference}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Booking Status</span>
                    <strong style={{ color: '#059669' }}>{cancelTargetBooking.status}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Flight</span>
                    <strong className="mono">{cancelTargetBooking.tickets?.[0]?.flightNumber || 'Scheduled Flight'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Seat Released</span>
                    <strong className="mono text-emerald">{cancelTargetBooking.tickets?.[0]?.seatNumber || 'Allocated Seat'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Route</span>
                    <span>{cancelTargetBooking.tickets?.[0]?.origin || '---'} → {cancelTargetBooking.tickets?.[0]?.destination || '---'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Paid Amount</span>
                    <strong className="mono">₹{cancelTargetBooking.totalAmount || 0}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#92400E', lineHeight: '1.4' }}>
                <strong>Important Policy:</strong> This cancellation is permanent. Your ticket will be marked <code>CANCELLED</code> in MySQL and the seat will be released back to the airline inventory immediately. No real monetary refund is processed in this system.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={cancelSubmitting}
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={cancelSubmitting}
                onClick={handleConfirmCancelBooking}
              >
                {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PassengerDashboard;
