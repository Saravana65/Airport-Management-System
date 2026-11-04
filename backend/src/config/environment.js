/**
 * Environment Configuration & Validation
 * Loads variables from .env and provides type-safe defaults for the application.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const environment = {
    // Server
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_PREFIX: process.env.API_PREFIX || '/api',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
        : ['http://localhost:3000', 'http://localhost:5173'],

    // JWT & Cookie Security
    JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_airport_jwt_secret_key_12345',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_fallback_cookie_secret_key_12345',

    // Oracle Database Connection
    DB: {
        user: process.env.DB_USER || 'airport_admin',
        password: process.env.DB_PASSWORD || '',
        connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1',
        poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
        poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 2,
        poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT, 10) || 60,
    },

    // Autonomous Airport Data Engine (AADE) Configuration
    AADE_INTERVAL_MS: parseInt(process.env.AADE_INTERVAL_MS, 10) || 60000,

    // Helper: Is production environment
    isProduction: process.env.NODE_ENV === 'production',
};

// Validate critical configurations
function validateConfig() {
    const warnings = [];
    if (!process.env.DB_PASSWORD) {
        warnings.push('DB_PASSWORD is not set in environment. Oracle database operations may fail authentication.');
    }
    if (!process.env.DB_CONNECT_STRING) {
        warnings.push('DB_CONNECT_STRING is not set. Defaulting to localhost:1521/XEPDB1.');
    }
    return warnings;
}

module.exports = {
    config: environment,
    validateConfig
};
