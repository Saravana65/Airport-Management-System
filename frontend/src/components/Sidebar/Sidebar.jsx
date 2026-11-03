import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Plane,
  LayoutDashboard,
  Users,
  Calendar,
  Database,
  Terminal,
  Building2,
  Ticket,
  Luggage,
  ShieldCheck,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileText,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatusBadge from '../StatusBadge/StatusBadge';
import './Sidebar.css';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation schemas by role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'User Management', to: '/admin/users', icon: Users },
          { label: 'Flight Operations', to: '/admin/flights', icon: Plane },
          { label: 'Database Monitor', to: '/admin/database', icon: Database },
          { label: 'System Logs', to: '/admin/logs', icon: Terminal },
        ];
      case 'AIRLINE_STAFF':
        return [
          { label: 'Airline Overview', to: '/airline/dashboard', icon: LayoutDashboard },
          { label: 'Flight Schedules', to: '/airline/flights', icon: Plane },
          { label: 'Passenger List', to: '/airline/passengers', icon: Users },
          { label: 'Booking Records', to: '/airline/bookings', icon: Ticket },
          { label: 'Fleet Status', to: '/airline/fleet', icon: Building2 },
        ];
      case 'AIRPORT_STAFF':
        return [
          { label: 'Airport Operations', to: '/airport/dashboard', icon: LayoutDashboard },
          { label: "Today's Flights", to: '/airport/flights', icon: Plane },
          { label: 'Gate Allocation', to: '/airport/gates', icon: Building2 },
          { label: 'Check-in Desks', to: '/airport/checkin', icon: ShieldCheck },
          { label: 'Baggage Routing', to: '/airport/baggage', icon: Luggage },
        ];
      case 'PASSENGER':
        return [
          { label: 'My Travel Hub', to: '/passenger/dashboard', icon: LayoutDashboard },
          { label: 'Search Flights', to: '/passenger/search', icon: Search },
          { label: 'My Bookings', to: '/passenger/bookings', icon: Calendar },
          { label: 'Boarding Passes', to: '/passenger/tickets', icon: Ticket },
          { label: 'Web Check-in', to: '/passenger/checkin', icon: ShieldCheck },
          { label: 'Travel Advisory', to: '/passenger/alerts', icon: FileText },
        ];
      default:
        return [
          { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`ams-sidebar ${collapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-container">
              <Plane className="brand-plane-icon" size={22} />
              <div className="brand-radar-pulse"></div>
            </div>
            {!collapsed && (
              <div className="brand-text-container">
                <span className="brand-title">AERO•OPS</span>
                <span className="brand-subtitle">Airport Control System</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Role Identity Indicator */}
        {!collapsed && user && (
          <div className="sidebar-role-banner">
            <span className="role-label-tag">Active Station</span>
            <StatusBadge status={user.role} label={user.role.replace('_', ' ')} size="sm" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="nav-item">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="nav-icon" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                    {item.to.includes('database') && !collapsed && (
                      <Radio size={12} className="nav-sub-icon text-amber" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Identity & Logout at bottom */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="user-avatar-circle">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="user-details">
                <span className="user-email" title={user?.email}>
                  {user?.email || 'Authenticated User'}
                </span>
                <span className="user-id-tag mono">
                  ID: #{user?.userId || '00'}
                </span>
              </div>
            )}
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out of Station"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
