import React from 'react';
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
  Activity,
  Users,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import './AirportDashboard.css';

export function AirportDashboard() {
  const { user } = useAuth();

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
              Terminal coordination, aerobridge and gate assignments, passenger check-in desks, and baggage conveyance routing.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="AIRPORT_STAFF" label="TERMINAL GROUND OPS ONLINE" />
        </div>
      </div>

      {/* 1. Terminal Resource Metrics: Today's flight ops, Gate allocation, Check-in activity, Baggage status */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Ground Operations Resource Metrics</h3>
          <span className="section-tag mono">GROUND RESOURCE TELEMETRY</span>
        </div>

        <div className="metrics-grid">
          {/* Today's Flight Operations */}
          <DashboardCard
            title="Today's Flight Operations"
            icon={Plane}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Scheduled arrivals & departures"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Gate Allocation Overview */}
          <DashboardCard
            title="Gate Allocation Overview"
            icon={DoorOpen}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Registered in GATES table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Check-in Activity */}
          <DashboardCard
            title="Check-in Activity & Desks"
            icon={ShieldCheck}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Tracked in CHECK_IN table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Baggage Status */}
          <DashboardCard
            title="Baggage Handling Status"
            icon={Luggage}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Tracked in BAGGAGE table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* 2. Airport Operational Summary Panel */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Airport Operational Summary</h3>
          <span className="section-tag mono">TERMINAL STATUS</span>
        </div>

        <div className="ground-ops-panel">
          <div className="ground-panel-header">
            <div className="panel-tab active">
              <Plane size={15} />
              <span>Departures & Airside</span>
            </div>
            <div className="panel-tab">
              <Plane size={15} style={{ transform: 'rotate(90deg)' }} />
              <span>Arrivals & Baggage Reclaim</span>
            </div>
          </div>

          <div className="ground-panel-body">
            <div className="ground-empty-state">
              <Radio size={32} className="empty-radio-icon text-amber" />
              <h4 className="empty-title">Runway & Gate Dispatch Stream Pending</h4>
              <p className="empty-desc">
                Airport operations schemas (<code>GATES</code>, <code>FLIGHTS</code>, <code>CHECK_IN</code>, and <code>BAGGAGE</code>) are verified in Oracle SQL. Live airside dispatch streams will link to this table in Phase 07.
              </p>
              <div className="empty-badge-wrap">
                <span className="status-badge status-pending_api size-sm">
                  <span className="status-dot"></span>
                  <span>DATA INTEGRATION PENDING</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Navigation Modules */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Ground Operations Control Modules</h3>
          <span className="section-tag">ROLE: AIRPORT_STAFF</span>
        </div>

        <div className="modules-grid">
          <PendingFeatureCard
            title="Gate & Stand Management"
            description="Assign aerobridges and remote aprons to arriving aircraft. Monitor gate occupancy and turnaround intervals."
            modulePhase="Phase 07"
            icon={DoorOpen}
            actionLabel="View Gate Schema Specs"
            onAction={() => alert('Gate Management endpoints will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Check-in & Desk Operations"
            description="Open and close terminal check-in desks, verify boarding documents, assign seat allocations, and issue boarding passes."
            modulePhase="Phase 07"
            icon={ShieldCheck}
            actionLabel="View Check-in System Plan"
            onAction={() => alert('Check-in Operations endpoints will be implemented in Phase 07.')}
          />

          <PendingFeatureCard
            title="Baggage Handling & Carousel Routing"
            description="Track checked bags via barcode tags, assign baggage reclaim carousels, and manage security screening flags."
            modulePhase="Phase 07"
            icon={Luggage}
            actionLabel="View Baggage Routing Specs"
            onAction={() => alert('Baggage Management endpoints will be implemented in Phase 07.')}
          />
        </div>
      </section>
    </div>
  );
}

export default AirportDashboard;
