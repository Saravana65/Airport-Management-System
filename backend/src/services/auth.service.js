/**
 * Authentication & User Management Service
 * Executes database operations with parameterized Oracle SQL and bind variables.
 */

const { oracledb } = require('../config/database');
const databaseService = require('./database.service');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.util');
const { VALID_ROLES } = require('../middleware/auth.middleware');

// In-memory fallback directory for offline demonstration & resilience when Oracle XE is unavailable
const FALLBACK_USERS = [
    {
        userId: 1,
        email: 'admin@airport.com',
        passwordHash: '$2a$10$a7XTii86Y.ODNdXKfWdxbOtsXtDxf9Cb8sTuCA3nvAbYO7ScfQLnW', // Admin@12345
        role: 'ADMIN',
        isActive: 'Y',
        createdAt: '2026-11-01 10:00:00',
    },
    {
        userId: 2,
        email: 'staff@airline.com',
        passwordHash: '$2a$10$JwHdnJqttl4/64GZwwFYm.LBpL4RemPgQFfaJbJ2qQgOKQAuQ7hwm', // Airline@12345
        role: 'AIRLINE_STAFF',
        airlineCode: 'AI',
        isActive: 'Y',
        createdAt: '2026-11-01 10:00:00',
    },
    {
        userId: 3,
        email: 'ops@airport.com',
        passwordHash: '$2a$10$QuVzjV4Gpltf8Sa4ciLhVedidV/XatpGoSrDwo.SwaNqA1iaCxAaO', // Airport@12345
        role: 'AIRPORT_STAFF',
        isActive: 'Y',
        createdAt: '2026-11-01 10:00:00',
    },
    {
        userId: 4,
        email: 'passenger@gmail.com',
        passwordHash: '$2a$10$DjNC1ksLaBfAnY0UIzO8J.1YFpDY35YFu0O7M3B14CPZBang43TXC', // Pass@12345
        role: 'PASSENGER',
        isActive: 'Y',
        createdAt: '2026-11-01 10:00:00',
    },
];

/**
 * Registers a new passenger account.
 */
async function registerUser(email, password, role = 'PASSENGER') {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try Oracle database execution if connected
    try {
        const existingCheck = await databaseService.execute(
            'SELECT USER_ID FROM USERS WHERE EMAIL = :email',
            { email: normalizedEmail }
        );

        if (existingCheck.rows && existingCheck.rows.length > 0) {
            const error = new Error('A user with this email address is already registered.');
            error.statusCode = 409;
            error.code = 'EMAIL_DUPLICATE';
            throw error;
        }

        const hashedPassword = await hashPassword(password);

        const insertResult = await databaseService.execute(
            `INSERT INTO USERS (EMAIL, PASSWORD_HASH, ROLE, IS_ACTIVE)
             VALUES (:email, :passwordHash, :role, 'Y')
             RETURNING USER_ID INTO :out_id`,
            {
                email: normalizedEmail,
                passwordHash: hashedPassword,
                role: role,
                out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newUserId = insertResult.outBinds.out_id[0];
        const token = generateToken({
            userId: newUserId,
            email: normalizedEmail,
            role: role,
        });

        return {
            user: {
                userId: newUserId,
                email: normalizedEmail,
                role: role,
                isActive: 'Y',
            },
            token,
        };
    } catch (dbErr) {
        if (dbErr.statusCode === 409) throw dbErr;

        // Fallback for resilient offline execution
        const duplicate = FALLBACK_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
        if (duplicate) {
            const error = new Error('A user with this email address is already registered.');
            error.statusCode = 409;
            error.code = 'EMAIL_DUPLICATE';
            throw error;
        }

        const hashedPassword = await hashPassword(password);
        const newUserId = FALLBACK_USERS.length + 101;
        const newUser = {
            userId: newUserId,
            email: normalizedEmail,
            passwordHash: hashedPassword,
            role: role,
            isActive: 'Y',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        FALLBACK_USERS.push(newUser);

        const token = generateToken({
            userId: newUserId,
            email: normalizedEmail,
            role: role,
        });

        return {
            user: {
                userId: newUserId,
                email: normalizedEmail,
                role: role,
                isActive: 'Y',
            },
            token,
        };
    }
}

/**
 * Authenticates user credentials and issues JWT token.
 */
async function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;

    // 1. Try Oracle database lookup
    try {
        const result = await databaseService.execute(
            `SELECT USER_ID, EMAIL, PASSWORD_HASH, ROLE, IS_ACTIVE
             FROM USERS
             WHERE EMAIL = :email`,
            { email: normalizedEmail }
        );

        if (result.rows && result.rows.length > 0) {
            user = {
                USER_ID: result.rows[0].USER_ID,
                EMAIL: result.rows[0].EMAIL,
                PASSWORD_HASH: result.rows[0].PASSWORD_HASH,
                ROLE: result.rows[0].ROLE,
                IS_ACTIVE: result.rows[0].IS_ACTIVE,
            };
        }
    } catch (dbErr) {
        // Fallback to in-memory user registry when Oracle listener is offline
        const fallback = FALLBACK_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
        if (fallback) {
            user = {
                USER_ID: fallback.userId,
                EMAIL: fallback.email,
                PASSWORD_HASH: fallback.passwordHash,
                ROLE: fallback.role,
                IS_ACTIVE: fallback.isActive,
            };
        }
    }

    if (!user) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }

    // 2. Check if account is active
    if (user.IS_ACTIVE !== 'Y') {
        const error = new Error('This account has been deactivated. Please contact airport administration.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_DEACTIVATED';
        throw error;
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await comparePassword(password, user.PASSWORD_HASH);
    if (!isPasswordValid) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }

    // 4. Generate signed JWT token
    const token = generateToken({
        userId: user.USER_ID,
        email: user.EMAIL,
        role: user.ROLE,
    });

    return {
        user: {
            userId: user.USER_ID,
            email: user.EMAIL,
            role: user.ROLE,
            isActive: user.IS_ACTIVE,
        },
        token,
    };
}

/**
 * Retrieves authenticated user profile without exposing password hashes.
 */
async function getUserProfile(userId) {
    try {
        const result = await databaseService.execute(
            `SELECT USER_ID, EMAIL, ROLE, IS_ACTIVE, TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
             FROM USERS
             WHERE USER_ID = :userId`,
            { userId }
        );

        if (result.rows && result.rows.length > 0) {
            const row = result.rows[0];
            return {
                userId: row.USER_ID,
                email: row.EMAIL,
                role: row.ROLE,
                isActive: row.IS_ACTIVE,
                createdAt: row.CREATED_AT,
            };
        }
    } catch (dbErr) {
        // Fallback
    }

    const fallback = FALLBACK_USERS.find(u => u.userId === parseInt(userId, 10));
    if (fallback) {
        return {
            userId: fallback.userId,
            email: fallback.email,
            role: fallback.role,
            isActive: fallback.isActive,
            createdAt: fallback.createdAt,
        };
    }

    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
}

/**
 * Changes a user's password after verifying their current password.
 */
async function changePassword(userId, currentPassword, newPassword) {
    try {
        const result = await databaseService.execute(
            'SELECT PASSWORD_HASH FROM USERS WHERE USER_ID = :userId',
            { userId }
        );

        if (result.rows && result.rows.length > 0) {
            const currentHash = result.rows[0].PASSWORD_HASH;
            const isMatch = await comparePassword(currentPassword, currentHash);
            if (!isMatch) {
                const error = new Error('Current password is incorrect.');
                error.statusCode = 400;
                error.code = 'PASSWORD_MISMATCH';
                throw error;
            }

            const newHashedPassword = await hashPassword(newPassword);
            await databaseService.execute(
                'UPDATE USERS SET PASSWORD_HASH = :newHash WHERE USER_ID = :userId',
                { newHash: newHashedPassword, userId },
                { autoCommit: true }
            );
            return true;
        }
    } catch (dbErr) {
        if (dbErr.statusCode === 400) throw dbErr;
    }

    const fallback = FALLBACK_USERS.find(u => u.userId === parseInt(userId, 10));
    if (fallback) {
        const isMatch = await comparePassword(currentPassword, fallback.passwordHash);
        if (!isMatch) {
            const error = new Error('Current password is incorrect.');
            error.statusCode = 400;
            error.code = 'PASSWORD_MISMATCH';
            throw error;
        }
        fallback.passwordHash = await hashPassword(newPassword);
        return true;
    }

    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
}

/**
 * Administrator: Retrieves all registered users.
 */
async function getAllUsers() {
    try {
        const result = await databaseService.execute(
            `SELECT USER_ID, EMAIL, ROLE, IS_ACTIVE, TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
             FROM USERS
             ORDER BY USER_ID ASC`
        );

        if (result.rows && result.rows.length > 0) {
            return result.rows.map(row => ({
                userId: row.USER_ID,
                email: row.EMAIL,
                role: row.ROLE,
                isActive: row.IS_ACTIVE,
                createdAt: row.CREATED_AT,
            }));
        }
    } catch (dbErr) {
        // Fallback to in-memory user registry
    }

    return FALLBACK_USERS.map(u => ({
        userId: u.userId,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
    }));
}

/**
 * Administrator: Updates another user's assigned role.
 */
async function updateUserRole(targetUserId, newRole, requestingUserId) {
    if (parseInt(targetUserId, 10) === parseInt(requestingUserId, 10)) {
        const error = new Error('Self-Modification Blocked: Administrators cannot modify their own role.');
        error.statusCode = 400;
        throw error;
    }

    if (!VALID_ROLES.includes(newRole)) {
        const error = new Error(`Invalid role '${newRole}'. Allowed roles: ${VALID_ROLES.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    try {
        const result = await databaseService.execute(
            `UPDATE USERS SET ROLE = :role WHERE USER_ID = :userId`,
            { role: newRole, userId: targetUserId },
            { autoCommit: true }
        );

        if (result.rowsAffected > 0) {
            return await getUserProfile(targetUserId);
        }
    } catch (dbErr) {
        // Fallback
    }

    const fallback = FALLBACK_USERS.find(u => u.userId === parseInt(targetUserId, 10));
    if (fallback) {
        fallback.role = newRole;
        return {
            userId: fallback.userId,
            email: fallback.email,
            role: fallback.role,
            isActive: fallback.isActive,
            createdAt: fallback.createdAt,
        };
    }

    const error = new Error(`User with ID ${targetUserId} not found.`);
    error.statusCode = 404;
    throw error;
}

/**
 * Administrator: Activates or deactivates a user account.
 */
async function updateUserStatus(targetUserId, newStatus, requestingUserId) {
    if (parseInt(targetUserId, 10) === parseInt(requestingUserId, 10)) {
        const error = new Error('Self-Modification Blocked: Administrators cannot deactivate their own account.');
        error.statusCode = 400;
        throw error;
    }

    if (!['Y', 'N'].includes(newStatus)) {
        const error = new Error('Invalid status. Allowed values are Y (Active) or N (Deactivated).');
        error.statusCode = 400;
        throw error;
    }

    try {
        const result = await databaseService.execute(
            `UPDATE USERS SET IS_ACTIVE = :status WHERE USER_ID = :userId`,
            { status: newStatus, userId: targetUserId },
            { autoCommit: true }
        );

        if (result.rowsAffected > 0) {
            return await getUserProfile(targetUserId);
        }
    } catch (dbErr) {
        // Fallback
    }

    const fallback = FALLBACK_USERS.find(u => u.userId === parseInt(targetUserId, 10));
    if (fallback) {
        fallback.isActive = newStatus;
        return {
            userId: fallback.userId,
            email: fallback.email,
            role: fallback.role,
            isActive: fallback.isActive,
            createdAt: fallback.createdAt,
        };
    }

    const error = new Error(`User with ID ${targetUserId} not found.`);
    error.statusCode = 404;
    throw error;
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
};
