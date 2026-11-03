import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plane,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ServerCrash,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import './Login.css';

export function Login() {
  const { login, error: contextError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Intended route or fallback to role dashboard router
  const destination = location.state?.from?.pathname || '/dashboard';

  // Client-side form validation
  const validateForm = () => {
    if (!email.trim()) {
      setFormError('Operational station email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid station email address.');
      return false;
    }
    if (!password) {
      setFormError('Security access password is required.');
      return false;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setFormError('');
    setIsNetworkError(false);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        // Successful login: navigate to destination or role dashboard
        navigate(destination, { replace: true });
      } else {
        setFormError(result.error);
        if (result.status === 0 || result.error?.includes('Unable to connect')) {
          setIsNetworkError(true);
        }
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected authentication error occurred.');
      setIsNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for presentation / viva demo
  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFormError('');
    setIsNetworkError(false);
  };

  return (
    <div className="login-viewport">
      {/* Background Radar Animation Grid */}
      <div className="login-backdrop-grid"></div>
      <div className="radar-circle-bg"></div>

      <div className="login-container">
        {/* Card Header & Branding */}
        <div className="login-card-header">
          <div className="brand-badge">
            <Plane size={24} className="brand-plane-icon" />
          </div>
          <h1 className="login-title">AERO•OPS GATEWAY</h1>
          <p className="login-subtitle">
            Airport Operations & Flight Management Control System
          </p>
        </div>

        {/* Network / Connection Failure Banner */}
        {isNetworkError && (
          <div className="login-alert-banner alert-danger">
            <ServerCrash size={18} className="alert-icon" />
            <div className="alert-body">
              <strong>Backend Connection Unavailable</strong>
              <p>
                Cannot reach Node.js server at <code>http://localhost:5000</code>. Verify that backend is running (<code>npm run dev</code>).
              </p>
            </div>
          </div>
        )}

        {/* Credentials / Validation Error Banner */}
        {formError && !isNetworkError && (
          <div className="login-alert-banner alert-warning">
            <AlertTriangle size={18} className="alert-icon" />
            <div className="alert-body">
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Real Backend Authentication Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="station-email" className="form-label">
              Station User / Operator Email
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="station-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@airport.com"
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input with Visibility Toggle */}
          <div className="form-group">
            <label htmlFor="station-password" className="form-label">
              Station Access Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="station-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border animate-spin"></span>
                <span>Authenticating with Node.js Gateway...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Initialize Station Session</span>
              </>
            )}
          </button>
        </form>

        {/* Viva / Faculty Presentation Quick-Fill Helper */}
        <div className="login-demo-helper">
          <div className="demo-helper-header">
            <Info size={14} className="demo-info-icon" />
            <span>Viva / Faculty Demo Station Roles</span>
          </div>
          <div className="demo-pill-group">
            <button
              type="button"
              className="demo-pill pill-admin"
              onClick={() => fillCredentials('admin@airport.com', 'Admin@12345')}
              title="Click to fill ADMIN credentials"
            >
              ADMIN
            </button>
            <button
              type="button"
              className="demo-pill pill-airline"
              onClick={() => fillCredentials('staff@airline.com', 'Airline@12345')}
              title="Click to fill AIRLINE_STAFF credentials"
            >
              AIRLINE_STAFF
            </button>
            <button
              type="button"
              className="demo-pill pill-airport"
              onClick={() => fillCredentials('ops@airport.com', 'Airport@12345')}
              title="Click to fill AIRPORT_STAFF credentials"
            >
              AIRPORT_STAFF
            </button>
            <button
              type="button"
              className="demo-pill pill-passenger"
              onClick={() => fillCredentials('passenger@gmail.com', 'Pass@12345')}
              title="Click to fill PASSENGER credentials"
            >
              PASSENGER
            </button>
          </div>
          <p className="demo-note">
            Note: Authentication is strictly validated against the backend database.
          </p>
        </div>

        {/* Security Notice */}
        <div className="login-security-notice">
          <CheckCircle2 size={12} className="security-check-icon" />
          <span>Encrypted with bcrypt & HttpOnly JWT tokens</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
