/**
 * Notification Controller
 * Scoped to authenticated user.
 */

const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getNotifications(req, res, next) {
    try {
        const notifications = await notificationService.getUserNotifications(req.user);
        const unreadCount = notifications.filter(n => n.isRead === 'N').length;
        return successResponse(
            res,
            { notifications, unreadCount, total: notifications.length },
            'Notifications retrieved successfully.'
        );
    } catch (err) {
        next(err);
    }
}

async function markNotificationAsRead(req, res, next) {
    try {
        const { id } = req.params;
        const result = await notificationService.markAsRead(id, req.user);
        return successResponse(res, result, 'Notification marked as read.');
    } catch (err) {
        next(err);
    }
}

async function markAllNotificationsAsRead(req, res, next) {
    try {
        const result = await notificationService.markAllAsRead(req.user);
        return successResponse(res, result, 'All notifications marked as read.');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
