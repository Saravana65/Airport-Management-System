/**
 * Database Service Wrapper
 * Handles acquiring connection from MySQL pool, converting parameterized SQL,
 * executing queries, managing transactions, and releasing connections safely.
 */

const { getPool, initializePool } = require('../config/database');

/**
 * Converts Oracle SQL syntax and bind parameters (:param) to MySQL ? placeholders
 * and extracts the corresponding values in order.
 */
function convertOracleSqlToMySQL(sql, binds) {
    let convertedSql = sql;
    const params = [];

    // Replace Oracle date/time functions
    convertedSql = convertedSql.replace(/TO_CHAR\s*\(\s*SYSDATE\s*,\s*'YYYY-MM-DD HH24:MI:SS'\s*\)/gi, "DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')");
    convertedSql = convertedSql.replace(/TO_CHAR\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*'YYYY-MM-DD HH24:MI:SS'\s*\)/gi, "DATE_FORMAT($1, '%Y-%m-%d %H:%i:%s')");
    convertedSql = convertedSql.replace(/\bSYSDATE\b/gi, 'NOW()');
    convertedSql = convertedSql.replace(/\bSYSTIMESTAMP\b/gi, 'CURRENT_TIMESTAMP');

    // Handle Oracle "RETURNING ... INTO ..." clause
    let hasReturningOutId = false;
    convertedSql = convertedSql.replace(/\s+RETURNING\s+[A-Za-z0-9_]+\s+INTO\s+:([A-Za-z0-9_]+)/gi, (match, paramName) => {
        hasReturningOutId = paramName;
        return '';
    });

    if (Array.isArray(binds)) {
        return { convertedSql, params: binds, hasReturningOutId };
    }

    if (binds && typeof binds === 'object') {
        // Find all :paramName placeholders and replace with ?
        convertedSql = convertedSql.replace(/:([A-Za-z0-9_]+)/g, (match, paramName) => {
            if (hasReturningOutId && paramName === hasReturningOutId) {
                return '';
            }
            if (paramName in binds) {
                const val = binds[paramName];
                // Ignore Oracle BIND_OUT object descriptors
                if (val && typeof val === 'object' && val.dir !== undefined) {
                    return '';
                }
                params.push(val);
                return '?';
            }
            params.push(null);
            return '?';
        });
    }

    return { convertedSql, params, hasReturningOutId };
}

/**
 * Executes a parameterized SQL statement using a pooled MySQL connection.
 * @param {string} sql - SQL query (supports MySQL ? or named :param syntax)
 * @param {object|array} binds - Bind parameters
 * @param {object} options - Execution options
 * @returns {Promise<object>}
 */
async function execute(sql, binds = {}, options = {}) {
    let pool = getPool();

    if (!pool) {
        pool = await initializePool();
    }

    if (!pool) {
        const error = new Error('Database connection pool is not initialized. Check MySQL server and credentials.');
        error.code = 'DB_POOL_UNAVAILABLE';
        throw error;
    }

    const { convertedSql, params } = convertOracleSqlToMySQL(sql, binds);

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows, fields] = await connection.query(convertedSql, params);

        const isSelect = Array.isArray(rows);
        const rowsAffected = rows && typeof rows.affectedRows === 'number' ? rows.affectedRows : (isSelect ? rows.length : 0);
        const insertId = rows && rows.insertId ? rows.insertId : null;

        return {
            rows: isSelect ? rows : [],
            rowsAffected,
            insertId,
            outBinds: insertId ? { out_id: [insertId] } : {},
            fields,
        };
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('[Database Service] Error releasing MySQL connection:', err.message);
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
        const error = new Error('Database connection pool is not initialized. Check MySQL server and credentials.');
        error.code = 'DB_POOL_UNAVAILABLE';
        throw error;
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Wrap connection with helper query method for convenience
        const wrappedConnection = {
            rawConnection: connection,
            execute: async (sql, binds = {}) => {
                const { convertedSql, params } = convertOracleSqlToMySQL(sql, binds);
                const [rows, fields] = await connection.query(convertedSql, params);
                const isSelect = Array.isArray(rows);
                return {
                    rows: isSelect ? rows : [],
                    rowsAffected: rows?.affectedRows || (isSelect ? rows.length : 0),
                    insertId: rows?.insertId || null,
                    outBinds: rows?.insertId ? { out_id: [rows.insertId] } : {},
                    fields,
                };
            },
            query: (...args) => connection.query(...args),
        };

        const result = await callback(wrappedConnection);
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
                connection.release();
            } catch (err) {
                console.error('[Database Service] Error releasing transaction connection:', err.message);
            }
        }
    }
}

/**
 * Tests database connectivity by executing a lightweight query on MySQL.
 * @returns {Promise<{ healthy: boolean, latencyMs: number, serverTime?: string, error?: string }>}
 */
async function testConnection() {
    const startTime = Date.now();

    try {
        const result = await execute("SELECT 1 AS STATUS_CHECK, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS SERVER_TIME");
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
            error: error.message || 'Unable to connect to MySQL database',
            code: error.code || 'DB_CONNECT_ERROR',
        };
    }
}

module.exports = {
    execute,
    executeTransaction,
    testConnection,
    convertOracleSqlToMySQL,
};
