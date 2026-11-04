import React from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';
import './DashboardCard.css';

/**
 * Reusable DashboardCard Component
 * Displays telemetry metrics, status indicators, and transparent "Data Integration Pending" notices.
 */
export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeStatus,
  badgeLabel,
  isPending = false,
  pendingNote = 'Data integration pending',
  trend,
}) {
  return (
    <div className={`dashboard-card ${isPending ? 'is-pending' : ''}`}>
      <div className="card-top-row">
        <span className="card-title">{title}</span>
        {Icon && (
          <div className="card-icon-container">
            <Icon size={18} className="card-icon" />
          </div>
        )}
      </div>

      <div className="card-metric-container">
        {isPending ? (
          <div className="pending-metric-box">
            <span className="pending-dash mono">--</span>
            <span className="pending-chip mono">{pendingNote}</span>
          </div>
        ) : (
          <div className="card-metric-val mono">{value}</div>
        )}
      </div>

      <div className="card-footer-row">
        {subtitle && <span className="card-subtitle">{subtitle}</span>}
        {badgeStatus && (
          <StatusBadge status={badgeStatus} label={badgeLabel} size="sm" />
        )}
      </div>
    </div>
  );
}

export default DashboardCard;
