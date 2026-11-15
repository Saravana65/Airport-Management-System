import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import './DashboardLayout.css';

export function DashboardLayout({ title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Derive title dynamically from pathname for clear, distinct header breadcrumbs
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Admin routes
    if (path === '/admin/dashboard' || path === '/admin') return 'Admin Dashboard Overview';
    if (path.includes('/admin/flights') || path.includes('/admin/search')) return 'Flight Schedules & Monitoring';
    if (path.includes('/admin/bookings') || path.includes('/admin/tickets')) return 'Passenger Bookings & Tickets';
    if (path.includes('/admin/airports')) return 'Airport Facilities Management';
    if (path.includes('/admin/airlines')) return 'Commercial Airline Carriers';
    if (path.includes('/admin/gates')) return 'Terminal Gates & Aerobridges';
    if (path.includes('/admin/users')) return 'User Account & Security Directory';
    if (path.includes('/admin/employees')) return 'Staff & Workforce Management';
    if (path.includes('/admin/settings')) return 'System Settings';

    // Airline routes
    if (path === '/airline/dashboard' || path === '/airline') return 'Airline Carrier Dashboard';
    if (path.includes('/airline/flights')) return 'Flight Schedules & Dispatch';
    if (path.includes('/airline/passengers')) return 'Passenger Manifest Directory';
    if (path.includes('/airline/bookings')) return 'Carrier Bookings & Tickets';

    // Airport routes
    if (path === '/airport/dashboard' || path === '/airport') return 'Airport Ground Operations';
    if (path.includes('/airport/gates')) return 'Terminal Gate Allocations';
    if (path.includes('/airport/flights')) return 'Flight Movement Operations';
    if (path.includes('/airport/checkin')) return 'Check-In Desks & Audit Stream';
    if (path.includes('/airport/baggage')) return 'Baggage Handling & Logistics';

    // Passenger routes
    if (path === '/passenger/dashboard' || path === '/passenger') return 'Passenger Travel Portal';
    if (path.includes('/passenger/search') || path.includes('/passenger/flights')) return 'Flight Search & Reservations';
    if (path.includes('/passenger/bookings')) return 'My Bookings';
    if (path.includes('/passenger/tickets')) return 'My Electronic Tickets';
    if (path.includes('/passenger/checkin')) return 'Online Web Check-In & Boarding Pass';
    if (path.includes('/passenger/baggage')) return 'Baggage Tracking';
    if (path.includes('/passenger/travel-info')) return 'Travel Guidelines & Information';
    if (path.includes('/passenger/profile')) return 'My Account Profile';

    if (title) return title;
    return 'Airport Management System';
  };

  return (
    <div className={`ams-layout-container ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="ams-main-wrapper">
        <Header
          title={getPageTitle()}
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
        />
        <main className="ams-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
