/**
 * MySQL Database Connection Pool Manager
 * Utilizes the official mysql2/promise driver with connection pooling.
 */

const mysql = require('mysql2/promise');
const { config } = require('./environment');

let pool = null;

/**
 * Initializes the MySQL Connection Pool
 * @returns {Promise<mysql.Pool|null>}
 */
async function initializePool() {
    if (pool) {
        return pool;
    }

    try {
        console.log('[Database] Initializing MySQL connection pool...');
        console.log(`[Database] Target Host: ${config.DB.host}:${config.DB.port}`);
        console.log(`[Database] User: ${config.DB.user}`);
        console.log(`[Database] Database: ${config.DB.database}`);

        pool = mysql.createPool({
            host: config.DB.host,
            port: config.DB.port,
            user: config.DB.user,
            password: config.DB.password,
            database: config.DB.database,
            connectionLimit: config.DB.connectionLimit,
            waitForConnections: config.DB.waitForConnections,
            queueLimit: config.DB.queueLimit,
            enableKeepAlive: config.DB.enableKeepAlive,
            keepAliveInitialDelay: config.DB.keepAliveInitialDelay,
        });

        // Test connectivity
        const connection = await pool.getConnection();
        console.log('[Database] MySQL connection pool created and verified successfully.');
        connection.release();

        return pool;
    } catch (error) {
        console.error('[Database] Failed to initialize MySQL connection pool:', error.message);
        pool = null;
        return null;
    }
}

/**
 * Retrieves the active pool instance
 * @returns {mysql.Pool|null}
 */
function getPool() {
    return pool;
}

/**
 * Closes the connection pool gracefully on application shutdown
 */
async function closePool() {
    if (pool) {
        try {
            console.log('[Database] Closing MySQL connection pool...');
            await pool.end();
            pool = null;
            console.log('[Database] MySQL connection pool closed.');
        } catch (error) {
            console.error('[Database] Error while closing connection pool:', error.message);
        }
    }
}

module.exports = {
    initializePool,
    getPool,
    closePool,
};
