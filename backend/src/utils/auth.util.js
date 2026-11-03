/**
 * Authentication Utilities
 * Handles bcrypt password hashing and jsonwebtoken (JWT) issuance/verification.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt with salt rounds
 * @param {string} password - Raw plaintext password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a valid non-empty string');
    }
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a candidate password against a stored bcrypt hash
 * @param {string} candidatePassword - Password to test
 * @param {string} hashedPassword - Stored hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(candidatePassword, hashedPassword) {
    if (!candidatePassword || !hashedPassword) {
        return false;
    }
    return await bcrypt.compare(candidatePassword, hashedPassword);
}

/**
 * Generates a signed JWT with user metadata
 * @param {object} payload - { userId, email, role }
 * @returns {string} - Signed JWT token
 */
function generateToken(payload) {
    return jwt.sign(
        {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        },
        config.JWT_SECRET,
        {
            expiresIn: config.JWT_EXPIRES_IN,
        }
    );
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token - Signed JWT string
 * @returns {object} - Decoded token payload
 */
function verifyToken(token) {
    return jwt.verify(token, config.JWT_SECRET);
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
};
