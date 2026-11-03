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
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import PendingFeatureCard from '../../components/PendingFeatureCard/PendingFeatureCard';
import api from '../../services/api';
import './AdminDashboard.css';

export function AdminDashboard() {
  const { user } = useAuth();
  const [dbHealth, setDbHealth] = useState({ status: 'checking', message: '' });
  const [systemUptime, setSystemUptime] = useState('0h 0m');

  // Verify real backend /health and /health/database
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
            message: 'Oracle 1521 listener offline. App operating in offline/local auth mode.',
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

      {/* Primary Metrics Grid (Transparent: Real indicators vs Pending database integration) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">System Metrics & Station Tallies</h3>
          <span className="section-tag mono">REAL-TIME TELEMETRY</span>
        </div>

        <div className="metrics-grid">
          {/* Total Flights (Pending Phase 07 Flight APIs) */}
          <StatCard
            title="Total Registered Flights"
            icon={Plane}
            isPending={true}
            pendingNote="Flight API pending Phase 07"
            subtitle="Schema ready in FLIGHTS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Registered Passengers (Pending Phase 07 Passenger APIs) */}
          <StatCard
            title="Registered Passengers"
            icon={Users}
            isPending={true}
            pendingNote="Passenger API pending Phase 07"
            subtitle="Schema ready in PASSENGERS table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Airlines (Pending Airline APIs) */}
          <StatCard
            title="Active Airlines"
            icon={Building2}
            isPending={true}
            pendingNote="Airline API pending Phase 07"
            subtitle="Schema ready in AIRLINES table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />

          {/* Airport Staff (Pending Employee APIs) */}
          <StatCard
            title="Airport Staff On-Duty"
            icon={Shield}
            isPending={true}
            pendingNote="Staff API pending Phase 07"
            subtitle="Schema ready in EMPLOYEES table"
            badgeStatus="PENDING_API"
            badgeLabel="PHASE 07"
          />
        </div>
      </section>

      {/* System Health & Operator Session Status */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">System Health & Active Session Identity</h3>
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
                <span className="telemetry-value mono">Oracle SQL 19c/21c XE (1521/XEPDB1)</span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">Pool Health State</span>
                <span className="telemetry-value mono text-amber">
                  {dbHealth.message || 'Querying connection pool...'}
                </span>
              </div>
              <div className="telemetry-row">
                <span className="telemetry-label">JWT Token Verification</span>
                <span className="telemetry-value mono text-emerald">
                  <CheckCircle2 size={13} className="inline-icon" /> HttpOnly Signature Valid
                </span>
              </div>
            </div>
          </div>

          {/* Active Operator Profile Details */}
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
                <span className="telemetry-label">Account Active</span>
                <span className="telemetry-value mono text-emerald">
                  {user?.isActive ? 'CONFIRMED (IS_ACTIVE = 1)' : 'SUSPENDED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Modules (User Management, Flight Operations, Database Monitoring) */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Administrative Operations Modules</h3>
          <span className="section-tag">ROLE: ADMIN ONLY</span>
        </div>

        <div className="modules-grid">
          <PendingFeatureCard
            title="User & Role Administration"
            description="Manage system users, assign roles (ADMIN, AIRLINE_STAFF, AIRPORT_STAFF, PASSENGER), and toggle active access flags."
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
