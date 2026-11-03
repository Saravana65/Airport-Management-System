/**
 * Administrator Controller
 * Endpoints restricted to ADMIN role for managing accounts, roles, and status.
 */

const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response.util');

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
};
