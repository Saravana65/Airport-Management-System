# Airport Management System — Frontend Client

A modern, responsive, aviation-inspired Operations Control Center dashboard built with **React.js**, **Vite**, **React Router v6**, and **Lucide Icons**.

---

## 1. Overview & Technology Stack

- **Framework**: React 18
- **Build Tool / Bundler**: Vite 5
- **Routing**: React Router DOM (v6)
- **Styling**: Pure Modular CSS with Aviation Design Tokens (`variables.css`)
- **Icons**: Lucide React
- **Authentication Strategy**: Secure HttpOnly Session Cookies & In-Memory AuthContext

---

## 2. Design System: Aviation Operations Control Theme

The user interface follows an air-traffic operations room aesthetic:
- **Canvas / Surfaces**: Charcoal and nocturnal near-black (`#090D16`, `#0F172A`, `#151F32`)
- **Accents**: Aviation Amber (`#F59E0B`) and Safety Orange (`#FF7849`)
- **Operational Indicators**: Radar Emerald (`#10B981`), Telemetry Blue (`#38BDF8`), Alert Red (`#EF4444`)
- **Typography**: High-legibility sans-serif (`Inter`) and monospace flight telemetry (`JetBrains Mono`)

---

## 3. Role-Based Navigation & Dashboards

The application implements tailored experiences across four distinct station roles:

| Role | Station Description | Navigation Links |
| :--- | :--- | :--- |
| **ADMIN** | Command & Control Center | Overview, User Management, Flight Operations, Database Monitor, System Logs |
| **AIRLINE_STAFF** | Carrier Dispatch & Fleet Desk | Airline Overview, Flight Schedules, Passenger List, Booking Records, Fleet Status |
| **AIRPORT_STAFF** | Terminal Ground & Apron Ops | Airport Operations, Today's Flights, Gate Allocation, Check-in Desks, Baggage Routing |
| **PASSENGER** | Passenger Travel & Self-Service | My Travel Hub, Search Flights, My Bookings, Boarding Passes, Web Check-in, Travel Advisory |

---

## 4. Getting Started

### Prerequisites
- Node.js (v18+ or v20+ LTS recommended)
- npm or pnpm

### Installation
Navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```

### Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Default configuration:
```env
# Proxy route to Node.js backend
VITE_API_URL=/api
VITE_APP_TITLE="Airport Management System"
```

### Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### Running Automated Frontend Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```
Production assets will be emitted to `frontend/dist/`.

---

## 5. Security & Authentication Flow

1. **Station Sign-in (`POST /api/auth/login`)**:
   - Operator enters credentials.
   - The backend validates the password against bcrypt hashes and issues a cryptographically signed JWT in a secure, `HttpOnly` cookie.
2. **Session Persistence (`GET /api/auth/me`)**:
   - On page refresh, `AuthContext` requests `/api/auth/me` with `credentials: 'include'`.
   - The browser automatically transmits the `HttpOnly` cookie.
   - Raw JWT tokens are **never** stored in vulnerable `localStorage`.
3. **Route Protection (`ProtectedRoute`)**:
   - Validates that the active session exists and matches the required station role.
   - Unauthorized attempts redirect to `/unauthorized` (HTTP 403 screen).
4. **Sign-out (`POST /api/auth/logout`)**:
   - Clears the cookie on the server and resets client state.
