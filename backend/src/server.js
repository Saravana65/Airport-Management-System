/**
 * Application Entry Point
 * Initializes database pool, boots the Express HTTP server, and manages graceful shutdowns.
 */

const app = require('./app');
const { config, validateConfig } = require('./config/environment');
const { initializePool, closePool } = require('./config/database');
const engineService = require('./services/aade/engine.service');

async function startServer() {
    console.log('================================================================');
    console.log('   AIRPORT MANAGEMENT SYSTEM - BACKEND INITIALIZATION');
    console.log('================================================================');

    // 1. Validate Environment Configurations
    const warnings = validateConfig();
    if (warnings.length > 0) {
        console.warn('[Config Warning] Configuration notices:');
        warnings.forEach(w => console.warn(`  - ${w}`));
    }

    // 2. Initialize Oracle Connection Pool
    const pool = await initializePool();
    if (pool) {
        console.log('[Startup] Database connection pool ready for queries.');
    } else {
        console.warn('[Startup] Server starting with database pool offline. (Check Oracle connection)');
    }

    // 3. Start HTTP Server
    const server = app.listen(config.PORT, () => {
        console.log('----------------------------------------------------------------');
        console.log(`[Server] Application running in ${config.NODE_ENV} mode.`);
        console.log(`[Server] Listening on port: ${config.PORT}`);
        console.log(`[Server] Base API URL: http://localhost:${config.PORT}${config.API_PREFIX}`);
        console.log(`[Server] Health Check: http://localhost:${config.PORT}${config.API_PREFIX}/health`);
        console.log(`[Server] Database Check: http://localhost:${config.PORT}${config.API_PREFIX}/health/database`);
        console.log(`[Server] AADE Engine: http://localhost:${config.PORT}${config.API_PREFIX}/aade/status`);
        console.log('----------------------------------------------------------------');

        // Start Autonomous Airport Data Engine
        engineService.startEngine(config.AADE_INTERVAL_MS);
    });

    // 4. Graceful Shutdown Handlers
    async function gracefulShutdown(signal) {
        console.log(`\n[Shutdown] Received ${signal}. Closing server gracefully...`);

        // Stop AADE background scheduler
        engineService.stopEngine();

        server.close(async () => {
            console.log('[Shutdown] HTTP server closed.');
            await closePool();
            console.log('[Shutdown] Exiting process cleanly.');
            process.exit(0);
        });

        // Force shutdown if connections do not close in 10 seconds
        setTimeout(() => {
            console.error('[Shutdown] Forced shutdown after timeout.');
            process.exit(1);
        }, 10000);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
        console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('[Uncaught Exception]:', error.message);
    });
}

startServer();
