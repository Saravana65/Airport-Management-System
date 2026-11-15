/**
 * Administrator Controller
 * Endpoints restricted to ADMIN role for managing accounts, roles, and status.
 */

const authService = require('../services/auth.service');
const db = require('../services/database.service');
const { successResponse, errorResponse } = require('../utils/response.util');

/**
 * GET /api/admin/stats
 * Real-time operational statistics calculated dynamically from MySQL tables.
 */
async function getDashboardStats(req, res, next) {
    try {
        const sql = `
            SELECT
                (SELECT COUNT(*) FROM FLIGHT_INSTANCES) AS totalFlights,
                (SELECT COUNT(*) FROM PASSENGERS) AS totalPassengers,
                (SELECT COUNT(*) FROM BOOKINGS) AS totalBookings,
                (SELECT COUNT(*) FROM BOOKINGS WHERE STATUS = 'CONFIRMED') AS confirmedBookings,
                (SELECT COUNT(*) FROM BOOKINGS WHERE STATUS = 'CANCELLED') AS cancelledBookings,
                (SELECT COUNT(*) FROM CHECK_IN) AS checkedInPassengers,
                (SELECT COUNT(*) FROM FLIGHT_INSTANCES WHERE STATUS = 'DELAYED') AS delayedFlights,
                (
                    SELECT COALESCE(SUM(ac.TOTAL_SEATS), 0) - (
                        SELECT COUNT(*) 
                        FROM TICKETS t 
                        JOIN FLIGHT_INSTANCES fi2 ON t.FLIGHT_INSTANCE_ID = fi2.FLIGHT_INSTANCE_ID 
                        WHERE t.STATUS != 'CANCELLED' AND fi2.STATUS NOT IN ('CANCELLED', 'DEPARTED', 'ARRIVED')
                    )
                    FROM FLIGHT_INSTANCES fi
                    JOIN AIRCRAFT ac ON fi.AIRCRAFT_ID = ac.AIRCRAFT_ID
                    WHERE fi.STATUS NOT IN ('CANCELLED', 'DEPARTED', 'ARRIVED')
                ) AS availableSeats
        `;
        const result = await db.execute(sql);
        const stats = result.rows && result.rows[0] ? result.rows[0] : {};
        return successResponse(res, {
            totalFlights: Number(stats.totalFlights || 0),
            totalPassengers: Number(stats.totalPassengers || 0),
            totalBookings: Number(stats.totalBookings || 0),
            confirmedBookings: Number(stats.confirmedBookings || 0),
            cancelledBookings: Number(stats.cancelledBookings || 0),
            checkedInPassengers: Number(stats.checkedInPassengers || 0),
            delayedFlights: Number(stats.delayedFlights || 0),
            availableSeats: Number(stats.availableSeats || 0)
        }, 'Admin dashboard operational statistics retrieved.');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
    try {
        const users = await authService.getAllUsers();
        return successResponse(res, { users, total: users.length }, 'User directory retrieved.');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/users/:id/role
 */
async function updateUserRole(req, res, next) {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;

        if (!role) {
            return errorResponse(res, 'Field "role" is required.', 400);
        }

        const updatedUser = await authService.updateUserRole(targetUserId, role.toUpperCase(), req.user.userId);
        return successResponse(res, updatedUser, `User ${targetUserId} role updated to ${role.toUpperCase()}.`);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/users/:id/status
 */
async function updateUserStatus(req, res, next) {
    try {
        const targetUserId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return errorResponse(res, 'Field "status" (Y or N) is required.', 400);
        }

        const updatedUser = await authService.updateUserStatus(targetUserId, status.toUpperCase(), req.user.userId);
        return successResponse(
            res,
            updatedUser,
            `User ${targetUserId} status updated to ${status.toUpperCase() === 'Y' ? 'Active' : 'Deactivated'}.`
        );
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUsers,
    updateUserRole,
    updateUserStatus,
    getDashboardStats,
};
