import React from 'react';
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
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import './PassengerDashboard.css';

export function PassengerDashboard() {
  const { user } = useAuth();

  return (
    <div className="passenger-dashboard-container">
      {/* Banner */}
      <div className="dashboard-welcome-banner passenger-banner">
        <div className="banner-left">
          <div className="banner-icon-box passenger-icon-box">
            <Compass size={24} className="banner-passenger-icon" />
          </div>
          <div>
            <h2 className="banner-title">Passenger Flight & Travel Portal</h2>
            <p className="banner-description">
              Search available flights, access your e-tickets, complete web check-in, and monitor live departure gates.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="PASSENGER" label="PASSENGER PORTAL ACTIVE" />
        </div>
      </div>

      {/* Flight Search Quick Bar (UI Layout ready for Phase 07 search API) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Flight Search & Availability</h3>
          <span className="section-tag mono">INSTANT LOOKUP</span>
        </div>

        <div className="flight-search-bar">
          <div className="search-input-group">
            <span className="search-label">From (Departure City / Airport)</span>
            <input
              type="text"
              placeholder="e.g. DEL (Indira Gandhi Intl)"
              className="search-field"
              disabled
            />
          </div>

          <div className="search-input-group">
            <span className="search-label">To (Arrival City / Airport)</span>
            <input
              type="text"
              placeholder="e.g. BOM (Chhatrapati Shivaji Intl)"
              className="search-field"
              disabled
            />
          </div>

          <div className="search-input-group date-group">
            <span className="search-label">Travel Date</span>
            <input
              type="date"
              className="search-field"
              disabled
            />
          </div>

          <button
            className="btn btn-primary search-action-btn"
            onClick={() => alert('Flight Search endpoint will be active in Phase 07.')}
          >
            <Search size={16} />
            <span>Search Flights</span>
          </button>
        </div>
        <span className="search-footnote mono">
          * Flight search query engine is connected to the Oracle <code>AIRPORTS</code> and <code>FLIGHTS</code> schema in Phase 07.
        </span>
      </section>

      {/* Passenger Overview Cards */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">My Travel Overview</h3>
          <span className="section-tag mono">PASSENGER ITINERARY</span>
        </div>

        <div className="metrics-grid">
          <StatCard
            title="My Upcoming Bookings"
            icon={Calendar}
            isPending={true}
            pendingNote="Bookings API pending Phase 07"
            subtitle="Referenced by PASSENGER_ID"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Issued Boarding Passes"
            icon={Ticket}
            isPending={true}
            pendingNote="Ticketing API pending Phase 07"
            subtitle="Linked to TICKETS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Web Check-in Status"
            icon={ShieldCheck}
            isPending={true}
            pendingNote="Check-in API pending Phase 07"
            subtitle="Valid within 24h of departure"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Registered Baggage Items"
            icon={Luggage}
            isPending={true}
            pendingNote="Baggage API pending Phase 07"
            subtitle="Linked to BAGGAGE table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* Navigation Modules (My Bookings, Tickets, Check-in, Travel Info) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Passenger Self-Service Modules</h3>
          <span className="section-tag">ROLE: PASSENGER</span>
        </div>

        <div className="modules-grid">
          <PendingFeatureCard
            title="My Bookings & Itinerary"
            description="View your confirmed flight reservations, check baggage allowance limits, and download invoice receipts."
            modulePhase="Phase 07"
            icon={Calendar}
            actionLabel="View Booking Architecture"
            onAction={() => alert('My Bookings endpoint will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Digital Boarding Pass & Ticket"
            description="View barcode-ready electronic boarding passes, seat number allocations, terminal gates, and boarding groups."
            modulePhase="Phase 07"
            icon={Ticket}
            actionLabel="View Boarding Pass Specs"
            onAction={() => alert('Digital Boarding Pass endpoint will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Online Web Check-in"
            description="Select seats with interactive cabin maps, verify passenger health and customs declarations, and save PDF passes."
            modulePhase="Phase 07"
            icon={ShieldCheck}
            actionLabel="View Web Check-in Specs"
            onAction={() => alert('Web Check-in endpoint will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Live Travel Advisory & Alerts"
            description="Real-time terminal gate change notifications, weather delay advisories, and security checkpoint wait times."
            modulePhase="Phase 07"
            icon={Bell}
            actionLabel="View Notification Architecture"
            onAction={() => alert('Live Notifications will connect to NOTIFICATIONS table in Phase 07.')}
          />
        </div>
      </section>
    </div>
  );
}

export default PassengerDashboard;
