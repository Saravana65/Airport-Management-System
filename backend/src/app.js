/**
 * Express Application Configuration
 * Configures middleware, security policies, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { config } = require('./config/environment');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin || config.CORS_ORIGIN.indexOf(origin) !== -1 || config.CORS_ORIGIN.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy: Origin not allowed.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Request Logger (Development / Console)
if (!config.isProduction) {
    app.use(morgan('dev'));
}

// Body & Cookie Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// Mount API Routes
app.use(config.API_PREFIX, routes);

// Root path friendly redirect
app.get('/', (req, res) => {
    res.json({
        message: 'Airport Management System API Gateway',
        healthCheck: `${config.API_PREFIX}/health`,
        databaseHealth: `${config.API_PREFIX}/health/database`,
        documentation: 'docs/BACKEND_SETUP.md',
    });
});

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
