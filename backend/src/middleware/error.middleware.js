/**
 * Centralized Error-Handling Middleware
 * Formats uncaught application errors into standardized JSON responses.
 */

const { config } = require('../config/environment');

function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

    const statusCode = err.statusCode || (err.code === 'DB_POOL_UNAVAILABLE' ? 503 : 500);

    // Provide safe, user-friendly message without leaking database passwords
    let safeMessage = err.message || 'An unexpected server error occurred.';
    if (safeMessage.includes('password') || safeMessage.includes('credentials')) {
        safeMessage = 'Database authentication failure. Please check server configuration.';
    }

    const response = {
        success: false,
        message: safeMessage,
        code: err.code || 'SERVER_ERROR',
        timestamp: new Date().toISOString(),
    };

    // Include stack trace only in development mode
    if (!config.isProduction && err.stack) {
        response.stack = err.stack;
    }

    return res.status(statusCode).json(response);
}

module.exports = errorHandler;
