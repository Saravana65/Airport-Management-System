# Frontend Design & Architecture Specification

## 1. Architectural Principles

The Airport Management System (AMS) frontend is designed as a mission-critical **Aviation Operations Control Center (OCC)**. Instead of a generic university CRUD interface, it mirrors real-world flight operations rooms (Air Traffic Control, airline dispatch centers, and airport terminal command rooms).

### Core Design Philosophy
1. **Low Cognitive Load & High Contrast**: Dark aviation charcoal backgrounds reduce glare during continuous monitoring.
2. **Standardized Aviation Color System**:
   - `Amber (#F59E0B)` / `Safety Orange (#FF7849)`: Primary alerts, system focus, active selection.
   - `Emerald (#10B981)`: Operational, online, on-schedule.
   - `Blue (#38BDF8)`: Carrier telemetry, radar data.
   - `Red (#EF4444)`: Ground stop, flight cancellation, access forbidden.
3. **Monospaced Telemetry (JetBrains Mono)**: Flight numbers (`AI-101`), gate IDs (`G-14`), UTC time stamps, and internal IDs are displayed with tabular monospaced numbers.
4. **Transparent Feature Readiness**: Planned modules for future phases are clearly labeled as "Data integration pending (Phase 07)" rather than fabricating false mock data.

---

## 2. Component Hierarchy

```
App
 └── BrowserRouter
      └── AuthProvider (In-Memory AuthContext)
           └── AppRoutes
                ├── /login (Login Screen with Radar Backdrop)
                ├── /unauthorized (403 Access Forbidden Page)
                ├── /dashboard (Intelligent Role-Based Dispatcher)
                │
                └── ProtectedRoute (Role Guard)
                     └── DashboardLayout
                          ├── Sidebar (Collapsible, Role Nav, User Badge)
                          ├── Header (Aviation Clock, API Status, Breadcrumbs)
                          └── <Outlet />
                               ├── AdminDashboard
                               ├── AirlineDashboard
                               ├── AirportDashboard
                               └── PassengerDashboard
```

---

## 3. Role-Based Navigation Matrix

The navigation system strictly surfaces modules assigned to the user's operational clearance:

| Navigation Item | ADMIN | AIRLINE_STAFF | AIRPORT_STAFF | PASSENGER |
| :--- | :---: | :---: | :---: | :---: |
| **Overview Dashboard** | Yes | Yes | Yes | Yes |
| **User & Role Management** | Yes | - | - | - |
| **Flight Operations / Schedules** | Yes | Yes | Yes | Search only |
| **Database & Trigger Monitor** | Yes | - | - | - |
| **Passenger Manifest / List** | - | Yes | - | - |
| **Booking & Reservations** | - | Yes | - | My Bookings |
| **Fleet & Aircraft** | - | Yes | - | - |
| **Gate & Aerobridge Allocation** | - | - | Yes | View only |
| **Check-in Counters** | - | - | Yes | Web Check-in |
| **Baggage Reclaim & Routing** | - | - | Yes | My Baggage |
| **Digital Boarding Passes** | - | - | - | Yes |

---

## 4. Responsive Breakpoints

- **Desktop (≥ 993px)**:
  - Sidebar fixed left (260px expanded, 76px collapsed).
  - Multi-column telemetry grids (up to 4 columns).
  - Real-time UTC + Local aviation clock displayed in header.
- **Tablet / Mobile (≤ 992px)**:
  - Sidebar transforms into an off-canvas drawer with semi-transparent backdrop blur.
  - Hamburger toggle in header opens drawer.
  - Metrics cards collapse into single/dual column flows.
  - Tables collapse gracefully with horizontal scroll wrappers.
