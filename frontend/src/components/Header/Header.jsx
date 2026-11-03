import React, { useState, useEffect } from 'react';
import { Menu, Activity, Radio, Clock, Shield } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Header.css';

export function Header({ title, onToggleMobileSidebar }) {
  const { user } = useAuth();
  const [time, setTime] = useState({
    utc: '',
    local: '',
  });
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Aviation Clock: Updates every second with UTC and Local time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        utc: now.toISOString().substring(11, 19) + ' UTC',
        local: now.toLocaleTimeString([], { hour12: false }) + ' LCL',
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll backend health once on mount to show connection state
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        await api.get('/health');
        if (isMounted) setBackendStatus('online');
      } catch (err) {
        if (isMounted) setBackendStatus('offline');
      }
    }

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="ams-header">
      <div className="header-left">
        {/* Mobile Hamburger Toggle */}
        <button
          className="header-mobile-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-breadcrumbs">
          <span className="system-tag">AMS • OPS</span>
          <span className="crumb-separator">/</span>
          <h1 className="header-title">{title || 'Control Dashboard'}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Live Aviation Clock */}
        <div className="aviation-clock mono">
          <Clock size={14} className="clock-icon" />
          <span className="utc-time">{time.utc || '00:00:00 UTC'}</span>
          <span className="clock-separator">•</span>
          <span className="lcl-time">{time.local || '00:00:00 LCL'}</span>
        </div>

        {/* Backend Connection Indicator */}
        <div
          className={`backend-status-pill ${backendStatus}`}
          title={
            backendStatus === 'online'
              ? 'Backend API Gateway: Online & Connected'
              : backendStatus === 'offline'
              ? 'Backend API Gateway: Offline or Unreachable (Check Port 5000)'
              : 'Checking API Connection...'
          }
        >
          <div className="status-indicator-dot"></div>
          <span className="status-indicator-text mono">
            {backendStatus === 'online'
              ? 'API ONLINE'
              : backendStatus === 'offline'
              ? 'API OFFLINE'
              : 'CHECKING'}
          </span>
        </div>

        {/* User Role Mini-Badge */}
        {user && (
          <div className="header-user-tag mono">
            <Shield size={13} className="role-shield-icon" />
            <span>{user.role}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
