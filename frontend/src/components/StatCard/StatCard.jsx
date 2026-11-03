import React from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';
import './StatCard.css';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeStatus,
  badgeLabel,
  isPending = false,
  pendingNote = 'Data integration pending (Phase 07)',
}) {
  return (
    <div className={`stat-card ${isPending ? 'is-pending' : ''}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrapper">
            <Icon size={18} className="stat-card-icon" />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        {isPending ? (
          <div className="stat-card-pending-badge">
            <span className="pending-indicator">--</span>
            <span className="pending-text">{pendingNote}</span>
          </div>
        ) : (
          <div className="stat-card-value mono">{value}</div>
        )}
      </div>

      <div className="stat-card-footer">
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
        {badgeStatus && (
          <StatusBadge status={badgeStatus} label={badgeLabel} size="sm" />
        )}
      </div>
    </div>
  );
}

export default StatCard;
