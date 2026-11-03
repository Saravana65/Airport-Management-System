import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bg-canvas)',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '36px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--amber-primary)',
        }}>
          <Compass size={28} />
        </div>

        <span className="mono" style={{ fontSize: '12px', color: 'var(--amber-primary)', fontWeight: 600 }}>
          404 • UNCHARTED AIRSPACE
        </span>

        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Waypoint Not Found</h1>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          The requested operational navigational waypoint does not exist or has been relocated by air traffic operations.
        </p>

        <button
          className="btn btn-primary"
          style={{ marginTop: '8px', width: '100%' }}
          onClick={() => navigate('/dashboard')}
        >
          <Home size={16} />
          <span>Return to Flight Station</span>
        </button>
      </div>
    </div>
  );
}

export default NotFound;
