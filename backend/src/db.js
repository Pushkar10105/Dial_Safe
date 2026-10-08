const { Pool } = require('pg');
const config = require('./config');

let pool = null;
let isConfigured = false;

if (config.databaseUrl) {
  const needsSsl = config.databaseUrl.includes('sslmode=require') || 
                   config.nodeEnv === 'production' || 
                   !config.databaseUrl.includes('localhost');

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
  });

  isConfigured = true;
} else {
  console.warn('[DB WARNING] DATABASE_URL is not set. Database operations will fail until DATABASE_URL is configured.');
}

async function query(text, params) {
  if (!pool || !isConfigured) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env');
  }
  return pool.query(text, params);
}

async function checkConnection() {
  if (!pool || !isConfigured) {
    return false;
  }
  try {
    const res = await pool.query('SELECT 1 AS alive');
    return res.rows.length > 0;
  } catch (err) {
    console.error('[DB] Connection check failed:', err.message);
    return false;
  }
}

async function close() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  pool,
  query,
  checkConnection,
  close,
  isConfigured: () => isConfigured
};
