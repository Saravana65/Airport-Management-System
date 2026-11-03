/**
 * Oracle Database Connection Pool Manager
 * Utilizes the official node-oracledb driver in default Thin Mode.
 * Thin Mode communicates directly over TCP/IP without requiring Oracle Instant Client.
 */

const oracledb = require('oracledb');
const { config } = require('./environment');

// Configure global oracledb properties
// Return rows as JavaScript Objects rather than index-based Arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Automatically commit is managed per transaction or set explicitly
oracledb.autoCommit = false;

let pool = null;

/**
 * Initializes the Oracle Connection Pool
 * @returns {Promise<oracledb.Pool>}
 */
async function initializePool() {
    if (pool) {
        return pool;
    }

    try {
        console.log('[Database] Initializing Oracle connection pool...');
        console.log(`[Database] Target Host/Connect String: ${config.DB.connectString}`);
        console.log(`[Database] User: ${config.DB.user}`);

        pool = await oracledb.createPool({
            user: config.DB.user,
            password: config.DB.password,
            connectString: config.DB.connectString,
            poolMin: config.DB.poolMin,
            poolMax: config.DB.poolMax,
            poolIncrement: config.DB.poolIncrement,
            poolTimeout: config.DB.poolTimeout,
            poolAlias: 'default',
        });

        console.log('[Database] Oracle connection pool created successfully.');
        console.log(`[Database] Pool limits: Min ${config.DB.poolMin}, Max ${config.DB.poolMax}`);
        return pool;
    } catch (error) {
        console.error('[Database] Failed to initialize Oracle connection pool:', error.message);
        pool = null;
        // Do not throw here so server can still boot up in degraded mode and report health status
        return null;
    }
}

/**
 * Retrieves the active pool instance
 * @returns {oracledb.Pool|null}
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
            console.log('[Database] Closing Oracle connection pool...');
            await pool.close(10); // 10-second drain timeout
            pool = null;
            console.log('[Database] Oracle connection pool closed.');
        } catch (error) {
            console.error('[Database] Error while closing connection pool:', error.message);
        }
    }
}

module.exports = {
    oracledb,
    initializePool,
    getPool,
    closePool,
};
