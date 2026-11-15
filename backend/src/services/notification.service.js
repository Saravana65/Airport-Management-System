/**
 * Notification Service
 * Handles in-app operational and passenger notifications stored in MySQL.
 * Strictly scoped to authenticated user ownership.
 */

const db = require('./database.service');

const VALID_NOTIFICATION_TYPES = ['FLIGHT_DELAY', 'GATE_CHANGE', 'BOARDING', 'CHECKIN_REMINDER', 'SYSTEM'];

function normalizeNotificationType(type) {
    if (!type) return 'SYSTEM';
    const t = String(type).toUpperCase().trim();
    if (t === 'DELAY' || t === 'FLIGHT_DELAY') return 'FLIGHT_DELAY';
    if (t === 'GATE_UPDATE' || t === 'GATE_CHANGE') return 'GATE_CHANGE';
    if (t === 'BOARDING') return 'BOARDING';
    if (t === 'CHECKIN' || t === 'CHECKIN_REMINDER') return 'CHECKIN_REMINDER';
    if (VALID_NOTIFICATION_TYPES.includes(t)) return t;
    return 'SYSTEM';
}

/**
 * Creates a notification record in MySQL.
 */
async function createNotification({ userId, title, message, type = 'SYSTEM' }) {
    if (!userId || !title || !message) {
        return null;
    }

    const normalizedType = normalizeNotificationType(type);

    try {
        const sql = `
            INSERT INTO notifications (USER_ID, TITLE, MESSAGE, NOTIFICATION_TYPE, IS_READ, CREATED_AT)
            VALUES (?, ?, ?, ?, 'N', NOW())
        `;
        const res = await db.execute(sql, [userId, title, message, normalizedType]);
        return {
            notificationId: res.insertId,
            userId,
            title,
            message,
            type: normalizedType,
            isRead: 'N',
            createdAt: new Date().toISOString()
        };
    } catch (err) {
        console.error('[NotificationService] Failed to insert notification:', err.message);
        return null;
    }
}

/**
 * Retrieves notifications for a specific authenticated user.
 */
async function getUserNotifications(user) {
    if (!user || !user.userId) return [];

    const sql = `
        SELECT 
            NOTIFICATION_ID as notificationId,
            USER_ID as userId,
            TITLE as title,
            MESSAGE as message,
            NOTIFICATION_TYPE as type,
            IS_READ as isRead,
            DATE_FORMAT(CREATED_AT, '%Y-%m-%d %H:%i:%s') as createdAt
        FROM notifications
        WHERE USER_ID = ?
        ORDER BY CREATED_AT DESC, NOTIFICATION_ID DESC
        LIMIT 50
    `;

    try {
        const res = await db.execute(sql, [user.userId]);
        return res.rows || [];
    } catch (err) {
        console.error('[NotificationService] Failed to fetch notifications:', err.message);
        return [];
    }
}

/**
 * Marks a single notification as read, ensuring ownership check.
 */
async function markAsRead(notificationId, user) {
    if (!user || !user.userId || !notificationId) {
        const err = new Error('Invalid notification parameters.');
        err.statusCode = 400;
        throw err;
    }

    const checkSql = `SELECT USER_ID as userId FROM notifications WHERE NOTIFICATION_ID = ?`;
    const checkRes = await db.execute(checkSql, [notificationId]);

    if (!checkRes.rows.length) {
        const err = new Error('Notification not found.');
        err.statusCode = 404;
        throw err;
    }

    if (checkRes.rows[0].userId !== user.userId && user.role !== 'ADMIN') {
        const err = new Error('Access denied. You cannot modify other users’ notifications.');
        err.statusCode = 403;
        throw err;
    }

    const updateSql = `UPDATE notifications SET IS_READ = 'Y' WHERE NOTIFICATION_ID = ?`;
    await db.execute(updateSql, [notificationId]);
    return { notificationId: parseInt(notificationId, 10), isRead: 'Y' };
}

/**
 * Marks all notifications for a user as read.
 */
async function markAllAsRead(user) {
    if (!user || !user.userId) {
        const err = new Error('User authentication required.');
        err.statusCode = 401;
        throw err;
    }

    const updateSql = `UPDATE notifications SET IS_READ = 'Y' WHERE USER_ID = ? AND IS_READ = 'N'`;
    await db.execute(updateSql, [user.userId]);
    return { success: true };
}

/**
 * Broadcasts a notification to all passengers with active tickets on a flight instance.
 */
async function notifyFlightPassengers(flightInstanceId, { title, message, type = 'FLIGHT_STATUS' }) {
    if (!flightInstanceId || !title || !message) return 0;

    try {
        const sql = `
            SELECT DISTINCT b.USER_ID as userId
            FROM TICKETS t
            JOIN BOOKINGS b ON t.BOOKING_ID = b.BOOKING_ID
            WHERE t.FLIGHT_INSTANCE_ID = ?
              AND t.STATUS != 'CANCELLED'
              AND b.STATUS != 'CANCELLED'
              AND b.USER_ID IS NOT NULL
        `;
        const res = await db.execute(sql, [flightInstanceId]);
        const userIds = res.rows.map(r => r.userId);

        for (const uid of userIds) {
            await createNotification({
                userId: uid,
                title,
                message,
                type
            });
        }
        return userIds.length;
    } catch (err) {
        console.error('[NotificationService] notifyFlightPassengers error:', err.message);
        return 0;
    }
}

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    notifyFlightPassengers
};
