/**
 * Authentication & Authorization Middleware
 * Validates JWT tokens, enforces Role-Based Access Control (RBAC), and sanitizes inputs.
 */

const { verifyToken } = require('../utils/auth.util');
const { errorResponse } = require('../utils/response.util');

const VALID_ROLES = ['ADMIN', 'AIRLINE_STAFF', 'AIRPORT_STAFF', 'PASSENGER'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware: Verifies JWT token from Authorization header or HTTP-only cookie.
 */
function authenticateUser(req, res, next) {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // 2. Check signed or unsigned cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return errorResponse(res, 'Authentication required. No authorization token provided.', 401);
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Session expired. Please log in again.', 401, { code: 'TOKEN_EXPIRED' });
        }
        return errorResponse(res, 'Invalid authorization token.', 401, { code: 'TOKEN_INVALID' });
    }
}

/**
 * Middleware: Role-Based Access Control (RBAC) Guard
 * Restricts route access to specified roles.
 * @param {...string} allowedRoles - Array of permitted roles (e.g., 'ADMIN', 'AIRPORT_STAFF')
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return errorResponse(res, 'Access denied. User role not identified.', 403);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return errorResponse(
                res,
                `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
                403,
                { requiredRoles: allowedRoles, currentRole: req.user.role }
            );
        }

        next();
    };
}

/**
 * Middleware: Validates user registration payload and prevents privilege escalation.
 */
function validateRegisterInput(req, res, next) {
    const { email, password, role } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
        return errorResponse(res, 'Please provide a valid email address.', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long.', 400);
    }

    // Security Guard: Prevent public privilege escalation
    // Public registration can only create PASSENGER accounts.
    if (role && role !== 'PASSENGER') {
        return errorResponse(
            res,
            'Privilege Escalation Blocked: Public registration is restricted to PASSENGER accounts. Administrative roles must be assigned by an Administrator.',
            403,
            { code: 'PRIVILEGE_ESCALATION_ATTEMPT' }
        );
    }

    next();
}

/**
 * Middleware: Validates login payload
 */
function validateLoginInput(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
    }

    next();
}

/**
 * Middleware: Validates password change payload
 */
function validateChangePasswordInput(req, res, next) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Both currentPassword and newPassword are required.', 400);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return errorResponse(res, 'New password must be at least 6 characters long.', 400);
    }

    if (currentPassword === newPassword) {
        return errorResponse(res, 'New password cannot be the same as your current password.', 400);
    }

    next();
}

module.exports = {
    authenticateUser,
    authorizeRoles,
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
    VALID_ROLES,
};
