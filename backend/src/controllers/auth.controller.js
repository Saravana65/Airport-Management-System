/**
 * Authentication Controller
 * Handles HTTP requests for registration, login, logout, profile, and password updates.
 */

const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response.util');
const { config } = require('../config/environment');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 Hours
};

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.registerUser(email, password, 'PASSENGER');

        // Set secure HTTP-only cookie
        res.cookie('token', result.token, COOKIE_OPTIONS);

        return successResponse(
            res,
            result,
            'Account registration successful.',
            201
        );
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);

        // Set secure HTTP-only cookie
        res.cookie('token', result.token, COOKIE_OPTIONS);

        return successResponse(
            res,
            result,
            'Login successful. Welcome back.',
            200
        );
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'strict' : 'lax',
    });

    return successResponse(
        res,
        { loggedOut: true },
        'You have been logged out successfully.'
    );
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
    try {
        const profile = await authService.getUserProfile(req.user.userId);
        return successResponse(res, profile, 'Profile retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.userId, currentPassword, newPassword);

        return successResponse(
            res,
            { changed: true },
            'Password updated successfully.'
        );
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout,
    getMe,
    changePassword,
};
