# Role-Based Access Control (RBAC) Matrix (Phase 07)

## Overview

The Airport Management System implements four distinct security personas enforced both server-side (via Express middleware guards `requireRole`) and client-side (via React `ProtectedRoute` components).

| Role ID | Persona Name | Primary Responsibility |
| :--- | :--- | :--- |
| `ADMIN` | System Administrator | Airport Authority command, facility registration, user roles & staff management |
| `AIRLINE_STAFF` | Carrier Dispatcher | Airline fleet operations, flight movement scheduling, carrier manifests |
| `AIRPORT_STAFF` | Ground Operations Lead | Aerobridge/gate allocation, baggage logistics, terminal check-in monitoring |
| `PASSENGER` | Traveler | Flight availability search, e-ticket reservations, web check-in & luggage tracking |

---

## Complete Role Access Matrix

| Module | Resource / Action | Endpoint | ADMIN | AIRLINE_STAFF | AIRPORT_STAFF | PASSENGER |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Auth** | Login & Logout | `POST /api/auth/login`, `logout` | ✅ | ✅ | ✅ | ✅ |
| **Auth** | Current Session | `GET /api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| **Auth** | Change Password | `POST /api/auth/change-password` | ✅ | ✅ | ✅ | ✅ |
| **Module 1** | View Airports | `GET /api/airports` | ✅ | ✅ | ✅ | ✅ |
| **Module 1** | Register Airport | `POST /api/airports` | ✅ | ❌ | ❌ | ❌ |
| **Module 1** | View Airlines | `GET /api/airlines` | ✅ | ✅ | ✅ | ✅ |
| **Module 1** | Register Airline | `POST /api/airlines` | ✅ | ❌ | ❌ | ❌ |
| **Module 1** | View Aircraft Fleet | `GET /api/aircraft` | ✅ | ✅ | ✅ | ✅ |
| **Module 1** | Register Aircraft | `POST /api/aircraft` | ✅ | ✅ (Own Carrier) | ❌ | ❌ |
| **Module 2** | Search Flights | `GET /api/flights` | ✅ | ✅ | ✅ | ✅ |
| **Module 2** | Schedule Flight Route | `POST /api/flights` | ✅ | ✅ (Own Carrier) | ❌ | ❌ |
| **Module 2** | Update Dispatch Status | `PATCH /api/flights/:id/status` | ✅ | ✅ | ✅ | ❌ |
| **Module 3** | View Passenger Manifest | `GET /api/passengers` | ✅ | ✅ (Masked) | ❌ | ❌ |
| **Module 3** | View Personal Profile | `GET /api/passengers/me` | ✅ | ✅ | ✅ | ✅ (Self Only) |
| **Module 3** | Register Profile | `POST /api/passengers` | ✅ | ✅ | ✅ | ✅ |
| **Module 4** | List Bookings | `GET /api/bookings` | ✅ (All) | ✅ (Carrier Flights) | ❌ | ✅ (Self Only) |
| **Module 4** | View Booking by ID | `GET /api/bookings/:id` | ✅ | ✅ (Carrier Flights) | ❌ | ✅ (Self Only) |
| **Module 4** | Create Reservation | `POST /api/bookings` | ✅ | ✅ | ❌ | ✅ |
| **Module 4** | Cancel Reservation | `PATCH /api/bookings/:id/cancel` | ✅ | ✅ | ❌ | ✅ (Self Only) |
| **Module 5** | Eligible Check-in Tickets | `GET /api/checkin/eligible` | ✅ | ✅ | ✅ | ✅ (Self Only) |
| **Module 5** | Overview Check-ins | `GET /api/checkin` | ✅ | ✅ | ✅ | ❌ |
| **Module 5** | Process Check-In | `POST /api/checkin` | ✅ | ✅ | ✅ | ✅ |
| **Module 6** | View Baggage Feed | `GET /api/baggage` | ✅ (All) | ✅ (Carrier) | ✅ (All) | ✅ (Self Only) |
| **Module 6** | Register Baggage | `POST /api/baggage` | ✅ | ✅ | ✅ | ❌ |
| **Module 6** | Update Baggage Status | `PATCH /api/baggage/:id/status` | ✅ | ❌ | ✅ | ❌ |
| **Module 7** | View Gates & Occupancy | `GET /api/gates` | ✅ | ✅ | ✅ | ✅ |
| **Module 7** | Register Gate | `POST /api/gates` | ✅ | ❌ | ✅ | ❌ |
| **Module 7** | Assign Gate to Flight | `POST /api/gates/assign` | ✅ | ❌ | ✅ | ❌ |
| **Module 8** | View Employees | `GET /api/employees` | ✅ | ❌ | ❌ | ❌ |
| **Module 8** | Register Employee | `POST /api/employees` | ✅ | ❌ | ❌ | ❌ |

---

## Security Verification Highlights

1. **Privilege Escalation Protection**: Public self-registration as `ADMIN`, `AIRLINE_STAFF`, or `AIRPORT_STAFF` is strictly rejected (`403 Forbidden`). Only `PASSENGER` accounts may be self-registered.
2. **Passenger Isolation**: Travelers querying `/api/bookings/:id` for an ID belonging to another passenger receive `403 Forbidden` (`Access denied. You cannot view other passengers' reservations.`).
3. **Data Masking Compliance**: Non-admin users querying passenger manifests receive masked passport numbers (e.g. `K9****01`), preventing unauthorized disclosure of traveler credentials.
