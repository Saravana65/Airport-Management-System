import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import './DashboardLayout.css';

export function DashboardLayout({ title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Derive title from pathname if not explicitly passed
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/admin')) return 'Administrator Command Center';
    if (path.includes('/airline')) return 'Airline Operations Portal';
    if (path.includes('/airport')) return 'Airport Ground & Gate Operations';
    if (path.includes('/passenger')) return 'Passenger Flight & Service Portal';
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
