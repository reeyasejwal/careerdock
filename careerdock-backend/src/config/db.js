const mysql = require('mysql2/promise');

const port = parseInt(process.env.DB_PORT, 10);
if (!port) console.error('[DB] WARNING: DB_PORT is not set or invalid, got:', process.env.DB_PORT);

// Aiven requires SSL. If DB_CA_CERT is pasted from an env-var dashboard it may
// arrive with literal \n instead of real newlines — unescape before passing to TLS.
const rawCert = process.env.DB_CA_CERT;
const sslOptions = rawCert
  ? { ca: rawCert.replace(/\\n/g, '\n'), rejectUnauthorized: true }
  : { rejectUnauthorized: false };

console.log('[DB] SSL mode:', rawCert ? 'CA cert (rejectUnauthorized: true)' : 'no cert (rejectUnauthorized: false)');
console.log('[DB] Connecting to:', process.env.DB_HOST, 'port:', port, 'db:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslOptions,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(conn => {
    console.log('[DB] MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] MySQL connection FAILED — code:', err.code, '— message:', err.message);
  });

module.exports = pool;
