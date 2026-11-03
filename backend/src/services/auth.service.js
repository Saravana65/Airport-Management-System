/**
 * Authentication & User Management Service
 * Executes database operations with parameterized Oracle SQL and bind variables.
 */

const { oracledb } = require('../config/database');
const databaseService = require('./database.service');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.util');
const { VALID_ROLES } = require('../middleware/auth.middleware');

/**
 * Registers a new passenger account.
 */
async function registerUser(email, password, role = 'PASSENGER') {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check for existing user with this email
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

    // 2. Hash plaintext password with bcrypt
    const hashedPassword = await hashPassword(password);

    // 3. Insert into USERS table using Oracle bind variables
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

    // 4. Generate initial JWT token
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

/**
 * Authenticates user credentials and issues JWT token.
 */
async function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Look up user by email
    const result = await databaseService.execute(
        `SELECT USER_ID, EMAIL, PASSWORD_HASH, ROLE, IS_ACTIVE
         FROM USERS
         WHERE EMAIL = :email`,
        { email: normalizedEmail }
    );

    if (!result.rows || result.rows.length === 0) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }

    const user = result.rows[0];

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
    const result = await databaseService.execute(
        `SELECT USER_ID, EMAIL, ROLE, IS_ACTIVE, TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
         FROM USERS
         WHERE USER_ID = :userId`,
        { userId }
    );

    if (!result.rows || result.rows.length === 0) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const row = result.rows[0];
    return {
        userId: row.USER_ID,
        email: row.EMAIL,
        role: row.ROLE,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
    };
}

/**
 * Changes a user's password after verifying their current password.
 */
async function changePassword(userId, currentPassword, newPassword) {
    // 1. Retrieve current hash
    const result = await databaseService.execute(
        'SELECT PASSWORD_HASH FROM USERS WHERE USER_ID = :userId',
        { userId }
    );

    if (!result.rows || result.rows.length === 0) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const currentHash = result.rows[0].PASSWORD_HASH;

    // 2. Verify current password
    const isMatch = await comparePassword(currentPassword, currentHash);
    if (!isMatch) {
        const error = new Error('Current password is incorrect.');
        error.statusCode = 400;
        error.code = 'PASSWORD_MISMATCH';
        throw error;
    }

    // 3. Hash new password
    const newHashedPassword = await hashPassword(newPassword);

    // 4. Update password in database
    await databaseService.execute(
        'UPDATE USERS SET PASSWORD_HASH = :newHash WHERE USER_ID = :userId',
        {
            newHash: newHashedPassword,
            userId,
        },
        { autoCommit: true }
    );

    return true;
}

/**
 * Administrator: Retrieves all registered users.
 */
async function getAllUsers() {
    const result = await databaseService.execute(
        `SELECT USER_ID, EMAIL, ROLE, IS_ACTIVE, TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
         FROM USERS
         ORDER BY USER_ID ASC`
    );

    return result.rows.map(row => ({
        userId: row.USER_ID,
        email: row.EMAIL,
        role: row.ROLE,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
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

    const result = await databaseService.execute(
        `UPDATE USERS SET ROLE = :role WHERE USER_ID = :userId`,
        { role: newRole, userId: targetUserId },
        { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
        const error = new Error(`User with ID ${targetUserId} not found.`);
        error.statusCode = 404;
        throw error;
    }

    return await getUserProfile(targetUserId);
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

    const result = await databaseService.execute(
        `UPDATE USERS SET IS_ACTIVE = :status WHERE USER_ID = :userId`,
        { status: newStatus, userId: targetUserId },
        { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
        const error = new Error(`User with ID ${targetUserId} not found.`);
        error.statusCode = 404;
        throw error;
    }

    return await getUserProfile(targetUserId);
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
