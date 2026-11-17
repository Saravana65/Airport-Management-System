import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import '../Login/Login.css';

/**
 * AEROVISION — User Registration Gateway
 * Clean Minimalist Register Card with 3D Commercial Airliner & Airport Airfield.
 */
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

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
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
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
      const result = await register(email.trim(), password);

      if (result.success) {
        navigate('/passenger/dashboard', { replace: true });
      } else {
        setFormError(result.error || 'Registration rejected.');
        if (result.status === 0 || result.error?.includes('Unable to connect')) {
          setIsNetworkError(true);
        }
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected registration error occurred.');
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

      {/* Main Centered Register Container */}
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="aero-form" noValidate>
            {/* Email Field */}
            <div className="aero-form-group">
              <label htmlFor="register-email" className="aero-form-label">
                <Mail size={12} />
                <span>Email</span>
              </label>
              <div className="aero-field-box">
                <span className="aero-field-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="aero-form-label">
                <Lock size={12} />
                <span>Password</span>
              </label>
              <div className="aero-field-box">
                <span className="aero-field-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading}
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div className="aero-form-group">
              <label htmlFor="register-confirm-password" className="aero-form-label">
                <Lock size={12} />
                <span>Confirm Password</span>
              </label>
              <div className="aero-field-box">
                <span className="aero-field-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  autoComplete="new-password"
                  className="aero-field-input mono"
                />
                <button
                  type="button"
                  className="aero-field-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Existing User Login Option */}
          <div className="aero-auth-switch">
            <span>Already have an account?</span>{' '}
            <Link to="/login" className="aero-auth-link">
              Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
