/**
 * Database Service Wrapper
 * Handles acquiring connection from pool, executing parameterized SQL,
 * managing multi-statement transactions (commit/rollback), and ensuring connection release.
 */

const { getPool, initializePool } = require('../config/database');

/**
 * Executes a parameterized SQL statement using a pooled connection.
 * @param {string} sql - Oracle SQL query with bind parameters (:param)
 * @param {object|array} binds - Bind parameters preventing SQL injection
 * @param {object} options - Execution options (e.g., autoCommit)
 * @returns {Promise<oracledb.Result>}
 */
async function execute(sql, binds = {}, options = {}) {
    let pool = getPool();

    // Attempt on-demand initialization if pool is not yet ready
    if (!pool) {
        pool = await initializePool();
    }

    if (!pool) {
        const error = new Error('Database connection pool is not initialized. Check Oracle server and credentials.');
        error.code = 'DB_POOL_UNAVAILABLE';
        throw error;
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const result = await connection.execute(sql, binds, options);
        return result;
    } finally {
        if (connection) {
            try {
                // Always release connection back to pool to prevent connection leaks
                await connection.close();
            } catch (err) {
                console.error('[Database Service] Error closing connection:', err.message);
            }
        }
    }
}

/**
 * Executes a sequence of queries within a single ACID transaction.
 * Automatically commits on success and rolls back on error.
 * @param {Function} callback - async (connection) => Promise<any>
 * @returns {Promise<any>}
 */
async function executeTransaction(callback) {
    let pool = getPool();

    if (!pool) {
        pool = await initializePool();
    }

    if (!pool) {
        const error = new Error('Database connection pool is not initialized. Check Oracle server and credentials.');
        error.code = 'DB_POOL_UNAVAILABLE';
        throw error;
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rbErr) {
                console.error('[Database Service] Rollback failed:', rbErr.message);
            }
        }
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('[Database Service] Error closing transaction connection:', err.message);
            }
        }
    }
}

/**
 * Tests database connectivity by executing a lightweight query on DUAL.
 * @returns {Promise<{ healthy: boolean, latencyMs: number, serverTime?: string, error?: string }>}
 */
async function testConnection() {
    const startTime = Date.now();

    try {
        const result = await execute('SELECT 1 AS STATUS_CHECK, TO_CHAR(SYSDATE, \'YYYY-MM-DD HH24:MI:SS\') AS SERVER_TIME FROM DUAL');
        const latencyMs = Date.now() - startTime;

        return {
            healthy: true,
            latencyMs,
            serverTime: result.rows && result.rows[0] ? result.rows[0].SERVER_TIME : null,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        return {
            healthy: false,
            latencyMs,
            error: error.message || 'Unable to connect to Oracle database',
            code: error.code || 'DB_CONNECT_ERROR',
        };
    }
}

module.exports = {
    execute,
    executeTransaction,
    testConnection,
};
