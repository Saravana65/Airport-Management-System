/**
 * 404 Route Not Found Middleware
 * Intercepts requests to unregistered endpoints.
 */

const { errorResponse } = require('../utils/response.util');

function notFoundHandler(req, res, next) {
    return errorResponse(
        res,
        `Resource not found: ${req.method} ${req.originalUrl}`,
        404
    );
}

module.exports = notFoundHandler;
