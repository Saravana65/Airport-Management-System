/**
 * Authentication Routes
 * /api/auth endpoints for user session and profile operations.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
    authenticateUser,
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
} = require('../middleware/auth.middleware');

// Public Routes
router.post('/register', validateRegisterInput, authController.register);
router.post('/login', validateLoginInput, authController.login);
router.post('/logout', authController.logout);

// Protected Routes (Requires valid JWT)
router.get('/me', authenticateUser, authController.getMe);
router.put('/change-password', authenticateUser, validateChangePasswordInput, authController.changePassword);

module.exports = router;
