/**
 * Administrator User Management Routes
 * /api/admin endpoints strictly protected by authenticateUser and authorizeRoles('ADMIN').
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

// Apply Admin RBAC Guard to all endpoints in this router
router.use(authenticateUser);
router.use(authorizeRoles('ADMIN'));

// Administrative Operations
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
