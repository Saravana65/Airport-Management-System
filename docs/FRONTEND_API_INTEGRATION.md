# Frontend API Integration Specification

## 1. Overview & Security Architecture

The frontend integrates directly with the Node.js Express backend created in Phase 04 and Phase 05.

### Security Directives
1. **No Tokens in LocalStorage**: To protect against Cross-Site Scripting (XSS) attacks, JWT tokens are maintained inside `HttpOnly` cookies set by the backend server.
2. **Session Persistence**: On page load or browser refresh, the React application queries `GET /api/auth/me`. The browser automatically attaches the `HttpOnly` cookie via `credentials: 'include'`.
3. **Backend Authority**: Frontend routing checks are purely an interface convenience; actual route and data protections are enforced by backend RBAC middleware (`authorizeRoles`).

---

## 2. Integrated Endpoints

### Authentication & Session Management

| Endpoint | Method | Payload / Headers | Client Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | `{ email, password }` | `authService.login()` | Validates credentials, sets `token` cookie, returns user object |
| `/api/auth/logout` | `POST` | `credentials: 'include'` | `authService.logout()` | Clears `token` cookie, resets client session |
| `/api/auth/me` | `GET` | `credentials: 'include'` | `authService.getProfile()` | Verifies cookie signature, returns user details |
| `/api/auth/change-password` | `PUT` | `{ currentPassword, newPassword }` | `authService.changePassword()` | Updates user password hash |

### System Telemetry & Health

| Endpoint | Method | Client Component | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | `Header.jsx` | Pinged to determine gateway connectivity (Online / Offline status pill) |
| `/api/health/database` | `GET` | `AdminDashboard.jsx` | Telemetry regarding Oracle XE pool connectivity |

---

## 3. Client API Wrapper (`src/services/api.js`)

The `api` module provides a standardized `fetch` wrapper:
- Injects `Content-Type: application/json` and `Accept: application/json`.
- Configures `credentials: 'include'` on all requests.
- Detects network connection failures (e.g., Node.js backend offline on port 5000) and transforms them into an `ApiError` with clear diagnostic advice.

```javascript
// Example Usage
import api from '../services/api';

try {
  const data = await api.get('/health');
} catch (error) {
  console.error(error.message); // "Unable to connect to Airport Operations Backend..."
}
```

---

## 4. Viva Defense & Examination Talking Points

1. **Why use HttpOnly cookies instead of localStorage?**
   - *Defense*: LocalStorage is readable by any JavaScript running in the browser, making it vulnerable to XSS token theft. HttpOnly cookies cannot be read by JavaScript, protecting the session token.
2. **How does the frontend know which dashboard to show?**
   - *Defense*: The `/dashboard` route uses an intelligent `RoleRedirector` component that inspects the authenticated `user.role` returned by `GET /api/auth/me` and routes to `/admin/dashboard`, `/airline/dashboard`, etc.
3. **What happens if a passenger types `/admin/dashboard` in the address bar?**
   - *Defense*: The `ProtectedRoute` component inspects `allowedRoles={['ADMIN']}`. Since the passenger's role does not match, the app immediately redirects them to `/unauthorized` (HTTP 403 Forbidden screen). Even if a malicious user bypasses frontend JavaScript, all backend `/api/admin/*` endpoints strictly reject requests with `403 Forbidden`.
