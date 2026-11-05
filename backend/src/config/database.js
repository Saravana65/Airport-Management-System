/**
 * Oracle Database Connection Pool Manager
 * Utilizes the official node-oracledb driver in default Thin Mode.
 * Thin Mode communicates directly over TCP/IP without requiring Oracle Instant Client.
 */

const oracledb = require('oracledb');
const net = require('net');
const { config } = require('./environment');

// Configure global oracledb properties
// Return rows as JavaScript Objects rather than index-based Arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Automatically commit is managed per transaction or set explicitly
oracledb.autoCommit = false;

let pool = null;

/**
 * Checks if the Oracle host port is reachable before attempting pool creation.
 * Prevents native driver connection hangs and crash conditions on Windows Node.js.
 */
function isOraclePortReachable(connectString, timeoutMs = 800) {
    return new Promise((resolve) => {
        try {
            const hostPortPart = (connectString || '').split('/')[0];
            const [host = 'localhost', portStr = '1521'] = hostPortPart.split(':');
            const port = parseInt(portStr, 10) || 1521;

            const socket = new net.Socket();
            socket.setTimeout(timeoutMs);

            const cleanUp = () => {
                socket.removeAllListeners();
                socket.destroy();
            };

            socket.once('connect', () => {
                cleanUp();
                resolve(true);
            });

            socket.once('error', () => {
                cleanUp();
                resolve(false);
            });

            socket.once('timeout', () => {
                cleanUp();
                resolve(false);
            });

            socket.connect(port, host);
        } catch (e) {
            resolve(false);
        }
    });
}

/**
 * Initializes the Oracle Connection Pool
 * @returns {Promise<oracledb.Pool|null>}
 */
async function initializePool() {
    if (pool) {
        return pool;
    }

    try {
        console.log('[Database] Checking Oracle connectivity...');
        console.log(`[Database] Target Host/Connect String: ${config.DB.connectString}`);
        console.log(`[Database] User: ${config.DB.user}`);

        const isReachable = await isOraclePortReachable(config.DB.connectString);
        if (!isReachable) {
            console.warn(`[Database] Oracle listener at ${config.DB.connectString} is offline or unreachable.`);
            console.warn('[Database] Operating in resilient in-memory operational mode with complete seed dataset.');
            pool = null;
            return null;
        }

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
