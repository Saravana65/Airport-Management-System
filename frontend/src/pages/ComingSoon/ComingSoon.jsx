import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Lock,
  ArrowLeft,
  Database,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import './ComingSoon.css';

export function ComingSoon({
  moduleName = 'Operational Module',
  description = 'Detailed operational interface and backend API integration are scheduled for the next development phase.',
  phase = 'Phase 07',
  schemaTable = 'SCHEMA TABLE VERIFIED',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'AIRLINE_STAFF':
        navigate('/airline/dashboard');
        break;
      case 'AIRPORT_STAFF':
        navigate('/airport/dashboard');
        break;
      case 'PASSENGER':
        navigate('/passenger/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        {/* Radar Icon & Badge */}
        <div className="coming-soon-icon-box">
          <Layers size={36} className="coming-soon-icon" />
          <div className="coming-soon-pulse"></div>
        </div>

        <div className="status-pill-wrap">
          <StatusBadge status="PENDING_API" label="INTEGRATION PENDING" size="md" />
          <span className="phase-chip mono">{phase} ROADMAP</span>
        </div>

        <h2 className="coming-soon-title">{moduleName}</h2>
        <p className="coming-soon-desc">{description}</p>

        {/* Technical Status Specifications */}
        <div className="tech-readiness-grid">
          <div className="readiness-item">
            <Database size={16} className="readiness-icon text-amber" />
            <div className="readiness-content">
              <span className="readiness-label">Oracle SQL Schema</span>
              <span className="readiness-val mono text-emerald">
                <CheckCircle2 size={12} className="inline-check" /> {schemaTable}
              </span>
            </div>
          </div>

          <div className="readiness-item">
            <Clock size={16} className="readiness-icon text-amber" />
            <div className="readiness-content">
              <span className="readiness-label">REST API Integration</span>
              <span className="readiness-val mono text-amber">
                Scheduled for {phase}
              </span>
            </div>
          </div>
        </div>

        {/* Return Button */}
        <button
          className="btn btn-primary return-btn"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Return to Station Overview</span>
        </button>
      </div>
    </div>
  );
}

export default ComingSoon;
