import React from 'react';
import './StatusBadge.css';

export function StatusBadge({ status, label, size = 'md' }) {
  const normalizedStatus = (status || 'DEFAULT').toUpperCase().replace(/[\s-]/g, '_');
  const displayLabel = label || status || 'UNKNOWN';

  return (
    <span className={`status-badge status-${normalizedStatus.toLowerCase()} size-${size}`}>
      <span className="status-dot"></span>
      <span className="status-label">{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
