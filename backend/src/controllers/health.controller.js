/**
 * Health Check Controller
 * Provides diagnostics for Express server and Oracle database connectivity.
 */

const { successResponse } = require('../utils/response.util');
const databaseService = require('../services/database.service');
const { config } = require('../config/environment');

/**
 * Checks API server status
 * GET /api/health
 */
function getAppHealth(req, res) {
    const memoryUsage = process.memoryUsage();

    const healthData = {
        status: 'UP',
        service: 'Airport Management System API',
        environment: config.NODE_ENV,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            memoryMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
    };

    return successResponse(res, healthData, 'API service is running smoothly.');
}

/**
 * Checks Oracle database connection and measures round-trip query latency
 * GET /api/health/database
 */
async function getDatabaseHealth(req, res) {
    const dbTest = await databaseService.testConnection();

    if (dbTest.healthy) {
        return successResponse(
            res,
            {
                status: 'UP',
                dialect: 'Oracle SQL',
                targetHost: config.DB.connectString,
                latencyMs: dbTest.latencyMs,
                serverTime: dbTest.serverTime,
            },
            'Oracle database connection is healthy and responsive.',
            200
        );
    }

    // If database is not reachable, respond with 503 Service Unavailable
    return res.status(503).json({
        success: false,
        message: 'Oracle database connection is currently unavailable.',
        data: {
            status: 'DOWN',
            dialect: 'Oracle SQL',
            targetHost: config.DB.connectString,
            latencyMs: dbTest.latencyMs,
            reason: dbTest.error,
        },
        timestamp: new Date().toISOString(),
    });
}

module.exports = {
    getAppHealth,
    getDatabaseHealth,
};
