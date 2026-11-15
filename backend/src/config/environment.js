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

    // MySQL Database Connection
    DB: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'airport_management_db',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
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
        warnings.push('DB_PASSWORD is not set in environment. MySQL database operations may fail authentication.');
    }
    if (!process.env.DB_NAME) {
        warnings.push('DB_NAME is not set. Defaulting to airport_management_db.');
    }
    return warnings;
}

module.exports = {
    config: environment,
    validateConfig
};
