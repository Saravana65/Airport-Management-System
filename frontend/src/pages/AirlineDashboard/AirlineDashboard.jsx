import React from 'react';
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
  FileSpreadsheet,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import './AirlineDashboard.css';

export function AirlineDashboard() {
  const { user } = useAuth();

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
              Fleet management, scheduled departures, passenger manifests, and reservation management portal.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="AIRLINE_STAFF" label="AIRLINE DESK ONLINE" />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Airline Overview Metrics</h3>
          <span className="section-tag mono">CARRIER TELEMETRY</span>
        </div>

        <div className="metrics-grid">
          <StatCard
            title="Scheduled Airline Flights"
            icon={Plane}
            isPending={true}
            pendingNote="Flight schedule API pending Phase 07"
            subtitle="Tied to AIRLINE_ID foreign key"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Active Fleet Aircraft"
            icon={Building2}
            isPending={true}
            pendingNote="Fleet API pending Phase 07"
            subtitle="Registered in AIRCRAFTS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Booked Passengers"
            icon={Users}
            isPending={true}
            pendingNote="Manifest API pending Phase 07"
            subtitle="Tracked in BOOKINGS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          <StatCard
            title="Confirmed Tickets"
            icon={Ticket}
            isPending={true}
            pendingNote="Ticketing API pending Phase 07"
            subtitle="Tracked in TICKETS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* Flight Status Overview (Table layout ready for Phase 07 integration) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Carrier Flight Status Overview</h3>
          <span className="section-tag mono">DISPATCH BOARD</span>
        </div>

        <div className="dispatch-board-panel">
          <div className="dispatch-table-header">
            <div className="table-col col-flight">Flight Code</div>
            <div className="table-col col-route">Origin & Destination</div>
            <div className="table-col col-time">Std / Sta</div>
            <div className="table-col col-gate">Assigned Gate</div>
            <div className="table-col col-status">Operational Status</div>
          </div>

          <div className="dispatch-empty-state">
            <Clock size={32} className="empty-clock-icon text-amber" />
            <h4 className="empty-title">Flight Status Feed Awaiting API Integration</h4>
            <p className="empty-desc">
              The Oracle <code>FLIGHTS</code> and <code>FLIGHT_STATUS_HISTORY</code> schema tables are implemented in the database. Live departure and arrival telemetry will populate here once Phase 07 Flight Operations APIs are connected.
            </p>
            <div className="empty-badge-wrap">
              <span className="status-badge status-pending_api size-sm">
                <span className="status-dot"></span>
                <span>SCHEMA READY • BACKEND API PENDING</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Modules */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Carrier Operational Management Modules</h3>
          <span className="section-tag">ROLE: AIRLINE_STAFF</span>
        </div>

        <div className="modules-grid">
          <PendingFeatureCard
            title="Flight Management & Dispatch"
            description="Create new flight numbers, assign aircraft models, set departure/arrival slots, and transmit updates to air traffic dispatch."
            modulePhase="Phase 07"
            icon={Plane}
            actionLabel="View Flight Dispatch Specs"
            onAction={() => alert('Flight Management endpoints will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Passenger Manifest & Information"
            description="Inspect passenger booking details, special assistance requests, verified passport documents, and boarding eligibility."
            modulePhase="Phase 07"
            icon={Users}
            actionLabel="View Manifest Structure"
            onAction={() => alert('Passenger Manifest endpoints will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Booking & Reservation Records"
            description="Review passenger PNRs, manage fare class allocations, handle seat assignments, and process refund cancellations."
            modulePhase="Phase 07"
            icon={Ticket}
            actionLabel="View Booking Architecture"
            onAction={() => alert('Booking Management endpoints will be implemented in Phase 07.')}
          />
        </div>
      </section>
    </div>
  );
}

export default AirlineDashboard;
