import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ServerCrash,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import AirportHeroCanvas from '../../components/ThreeCanvas/AirportHeroCanvas';
import './Login.css';

/**
 * AEROVISION — Authentication Gateway
 * Clean Minimalist Login Card with 3D Commercial Airliner & Airport Airfield.
 */
export function Login() {
  const { login } = useAuth();
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
      setFormError('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setFormError('Password is required.');
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
        navigate(destination, { replace: true });
      } else {
        setFormError(result.error || 'Authentication rejected by security gateway.');
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

  return (
    <div className="aero-login-viewport">
      {/* 3D WebGL Commercial Airliner & Airport Airfield */}
      <div className="aero-login-3d-backdrop">
        <AirportHeroCanvas />
      </div>

      {/* Main Centered Login Container */}
      <main className="aero-login-main-container">
        <div className="aero-login-card">
          {/* Network Failure Banner */}
          {isNetworkError && (
            <div className="aero-alert-box aero-alert-error">
              <ServerCrash size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Backend Connection Unavailable</strong>
                <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
                  Cannot reach Node.js server at <code>http://localhost:5000</code>. Verify that backend is running.
                </p>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && !isNetworkError && (
            <div className="aero-alert-box aero-alert-warning">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{formError}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="aero-form" noValidate>
            {/* Email Field */}
            <div className="aero-form-group">
              <label htmlFor="user-email" className="aero-form-label">
                <Mail size={12} />
                <span>Email</span>
              </label>
              <div className="aero-field-box">
                <span className="aero-field-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  className="aero-field-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="aero-form-group">
              <label htmlFor="user-password" className="aero-form-label">
                <Lock size={12} />
                <span>Password</span>
              </label>
              <div className="aero-field-box">
                <span className="aero-field-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className="aero-field-input mono"
                />
                <button
                  type="button"
                  className="aero-field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="aero-submit-btn font-space"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="aero-pulse-dot" />
                  <span>LOGGING IN...</span>
                </>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>

          {/* New User Register Option */}
          <div className="aero-auth-switch">
            <span>Don't have an account?</span>{' '}
            <Link to="/register" className="aero-auth-link">
              Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
