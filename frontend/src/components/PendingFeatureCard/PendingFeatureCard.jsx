import React from 'react';
import { Layers, ChevronRight, Lock } from 'lucide-react';
import './PendingFeatureCard.css';

export function PendingFeatureCard({
  title,
  description,
  modulePhase = 'Phase 07',
  icon: Icon = Layers,
  actionLabel = 'Explore Module Spec',
  onAction,
}) {
  return (
    <div className="pending-feature-card">
      <div className="pending-card-top">
        <div className="pending-card-icon-box">
          <Icon size={20} className="pending-card-icon" />
        </div>
        <span className="pending-phase-badge">
          <Lock size={12} />
          {modulePhase} Roadmap
        </span>
      </div>

      <div className="pending-card-content">
        <h3 className="pending-card-title">{title}</h3>
        <p className="pending-card-desc">{description}</p>
      </div>

      <div className="pending-card-footer">
        <span className="pending-status-note">Database Schema Ready • API Pending</span>
        {onAction && (
          <button className="pending-card-action-btn" onClick={onAction}>
            <span>{actionLabel}</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PendingFeatureCard;
