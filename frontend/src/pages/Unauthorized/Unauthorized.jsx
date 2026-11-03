import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Terminal } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import './Unauthorized.css';

export function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'AIRLINE_STAFF':
        navigate('/airline/dashboard', { replace: true });
        break;
      case 'AIRPORT_STAFF':
        navigate('/airport/dashboard', { replace: true });
        break;
      case 'PASSENGER':
        navigate('/passenger/dashboard', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="unauthorized-viewport">
      <div className="unauthorized-card">
        <div className="unauthorized-icon-box">
          <ShieldAlert size={36} className="unauthorized-icon" />
        </div>

        <div className="unauthorized-badge mono">
          <span>HTTP 403 • ACCESS FORBIDDEN</span>
        </div>

        <h1 className="unauthorized-title">Restricted Airspace / Station Privilege</h1>

        <p className="unauthorized-description">
          Your active station identity does not possess authorization privileges for this requested operational sector. Airport security policy restricts administrative and operational controls strictly to designated personnel.
        </p>

        {user && (
          <div className="unauthorized-user-box">
            <div className="user-box-row">
              <span className="box-label">Active User:</span>
              <span className="box-val mono">{user.email}</span>
            </div>
            <div className="user-box-row">
              <span className="box-label">Current Role:</span>
              <StatusBadge status={user.role} label={user.role} size="sm" />
            </div>
          </div>
        )}

        <div className="unauthorized-actions">
          <button className="btn btn-primary" onClick={handleReturnToDashboard}>
            <ArrowLeft size={16} />
            <span>Return to Authorized Station</span>
          </button>

          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Switch Station Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
