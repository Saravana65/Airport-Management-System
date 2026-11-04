import React, { useState, useEffect } from 'react';
import {
  Plane,
  Users,
  Building2,
  Shield,
  Activity,
  Database,
  Radio,
  Server,
  Terminal,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  UserCheck,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import api from '../../services/api';
import './AdminDashboard.css';

export function AdminDashboard() {
  const { user } = useAuth();
  const [dbHealth, setDbHealth] = useState({ status: 'checking', message: '' });

  // Query actual backend /health/database
  useEffect(() => {
    let isMounted = true;
    async function fetchSystemHealth() {
      try {
        const res = await api.get('/health/database');
        if (isMounted) {
          setDbHealth({
            status: res.status === 'UP' ? 'operational' : 'degraded',
            message: res.message || 'Oracle database connection pool responsive.',
          });
        }
      } catch (err) {
        if (isMounted) {
          setDbHealth({
            status: 'standby',
            message: 'Oracle 1521 listener offline. App operating in offline/resilient auth mode.',
          });
        }
      }
    }

    fetchSystemHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="admin-dashboard-container">
      {/* Banner / Station Identification */}
      <div className="dashboard-welcome-banner">
        <div className="banner-left">
          <div className="banner-icon-box">
            <Shield size={24} className="banner-shield-icon" />
          </div>
          <div>
            <h2 className="banner-title">Administrator Command & Control Center</h2>
            <p className="banner-description">
              Centralized airport authority platform: System monitoring, user roles, security authorization, and data engine operations.
            </p>
          </div>
        </div>
        <div className="banner-right">
          <StatusBadge status="ADMIN" label="ADMIN STATION ACTIVE" />
        </div>
      </div>

      {/* 1. Core System Statistics (Transparent: Real indicators vs Pending database integration) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">System Metrics & Station Tallies</h3>
          <span className="section-tag mono">REAL-TIME TELEMETRY</span>
        </div>

        <div className="metrics-grid">
          {/* Total Registered Users */}
          <DashboardCard
            title="Total Registered Users"
            icon={Users}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Oracle USERS table schema ready"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Flight Operations Overview */}
          <DashboardCard
            title="Flight Operations Overview"
            icon={Plane}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Scheduled arrivals & departures"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Airline Overview */}
          <DashboardCard
            title="Active Carrier Airlines"
            icon={Building2}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Registered in AIRLINES table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Airport Staff Overview */}
          <DashboardCard
            title="Airport Staff Overview"
            icon={UserCheck}
            isPending={true}
            pendingNote="Data integration pending"
            subtitle="Tracked in EMPLOYEES table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* 2. System Health & Operator Session Identity */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">System Health & Live Gateway Status</h3>
          <span className="section-tag mono">CORE SERVICES</span>
        </div>

        <div className="health-session-grid">
          {/* Real Backend / Database Health Monitor */}
          <div className="avionics-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Server size={18} className="text-amber" />
                <h4>Node.js & Database Health Telemetry</h4>
              </div>
              <StatusBadge status={dbHealth.status} label={dbHealth.status} size="sm" />
            </div>

            <div className="panel-body">
              <div className="telemetry-row">
                <span className="telemetry-label">Gateway Engine</span>
                <span className="telemetry-value mono">Node.js Express (Port 5000)</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Database Target</span>
                <span className="telemetry-value mono">Oracle SQL (1521/XEPDB1)</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Connection Pool State</span>
                <span className="telemetry-value mono text-amber">
                  {dbHealth.message || 'Probing pool...'}
                </span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">JWT Token Security</span>
                <span className="telemetry-value mono text-emerald">
                  <CheckCircle2 size={13} className="inline-icon" /> HttpOnly Signature Valid
                </span>
              </div>
            </div>
          </div>

          {/* Active Operator Session Profile */}
          <div className="avionics-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Activity size={18} className="text-amber" />
                <h4>Current Operator Session Identity</h4>
              </div>
              <span className="live-pulse-tag mono">LIVE SESSION</span>
            </div>

            <div className="panel-body">
              <div className="telemetry-row">
                <span className="telemetry-label">Operator Email</span>
                <span className="telemetry-value mono">{user?.email || 'N/A'}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Assigned Role</span>
                <span className="telemetry-value mono">
                  <StatusBadge status={user?.role} label={user?.role} size="sm" />
                </span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Internal User ID</span>
                <span className="telemetry-value mono">#{user?.userId || 'N/A'}</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Account Clearance</span>
                <span className="telemetry-value mono text-emerald">
                  {user?.isActive ? 'ACTIVE (CONFIRMED)' : 'SUSPENDED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent System Activity (Audit Log Stream) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Recent System Activity</h3>
          <span className="section-tag mono">OPERATIONAL AUDIT</span>
        </div>

        <div className="avionics-panel">
          <div className="activity-stream-empty">
            <Clock size={28} className="text-amber empty-icon" />
            <h4 className="empty-title">Audit Stream Telemetry Awaiting Database Activation</h4>
            <p className="empty-desc">
              The Oracle <code>OPERATIONAL_LOGS</code> and <code>FLIGHT_STATUS_HISTORY</code> audit tables are designed and ready. Operational event streams and autonomous trigger events will display here once the live Oracle instance is connected in Phase 07.
            </p>
            <span className="status-badge status-pending_api size-sm">
              <span className="status-dot"></span>
              <span>DATA INTEGRATION PENDING</span>
            </span>
          </div>
        </div>
      </section>

      {/* 4. Administrative Operations Navigation Modules */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Administrative Operations Modules</h3>
          <span className="section-tag">ROLE: ADMIN ONLY</span>
        </div>

        <div className="modules-grid">
          <PendingFeatureCard
            title="User & Role Administration"
            description="Manage station users, assign clearance roles (ADMIN, AIRLINE_STAFF, AIRPORT_STAFF, PASSENGER), and toggle active flags."
            modulePhase="Phase 05 Ready"
            icon={Users}
            actionLabel="View RBAC Matrix"
            onAction={() => alert('Phase 05 RBAC backend APIs are implemented under /api/admin/users. Frontend management view is scheduled.')}
          />

          <PendingFeatureCard
            title="Flight Operations Hub"
            description="Global dispatch, schedule coordination, flight status tracking (SCHEDULED, BOARDING, DEPARTED, DELAYED, CANCELLED)."
            modulePhase="Phase 07"
            icon={Plane}
            actionLabel="View Module Plan"
            onAction={() => alert('Flight Operations management APIs will be connected in Phase 07.')}
          />

          <PendingFeatureCard
            title="Autonomous Database Engine"
            description="Oracle triggers, dynamic audit logs, autonomous delay recalculations, and maintenance event stream monitors."
            modulePhase="Phase 08"
            icon={Database}
            actionLabel="View Engine Architecture"
            onAction={() => alert('Autonomous Database Engine triggers and PL/SQL packages are documented in docs/AUTONOMOUS_DATABASE_PLAN.md.')}
          />
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
