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
  User,
  Info,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import './PassengerDashboard.css';

export function PassengerDashboard() {
  const { user } = useAuth();

  return (
    <div className="passenger-dashboard-container">
      {/* 1. Welcome Section */}
      <div className="dashboard-welcome-banner passenger-banner">
        <div className="banner-left">
          <div className="banner-icon-box passenger-icon-box">
            <Compass size={24} className="banner-passenger-icon" />
          </div>
          <div>
            <h2 className="banner-title">Welcome to Passenger Flight & Travel Hub</h2>
            <p className="banner-description">
              Logged in as <span className="mono text-white">{user?.email || 'Passenger'}</span>. Manage your flight itineraries, e-tickets, web check-in, and departure alerts.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="PASSENGER" label="PASSENGER PORTAL ACTIVE" />
        </div>
      </div>

      {/* 2. Flight Search Quick Bar */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Search Flights & Availability</h3>
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

      {/* 3. Core Passenger Sections: Upcoming Trips, Booking Information, Check-in Status, Travel Updates */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">My Travel Overview</h3>
          <span className="section-tag mono">PASSENGER ITINERARY</span>
        </div>

        <div className="metrics-grid">
          {/* Upcoming Trips */}
          <DashboardCard
            title="Upcoming Trips & Flights"
            icon={Calendar}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Referenced by PASSENGER_ID"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Booking Information */}
          <DashboardCard
            title="Confirmed Bookings & Tickets"
            icon={Ticket}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Linked to BOOKINGS & TICKETS"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Check-in Status */}
          <DashboardCard
            title="Web Check-in Status"
            icon={ShieldCheck}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Opens 24 hours prior to departure"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Travel Updates */}
          <DashboardCard
            title="Travel Updates & Advisories"
            icon={Bell}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Linked to NOTIFICATIONS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* 4. Passenger Self-Service Modules */}
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
