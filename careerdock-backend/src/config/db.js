const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// ── Diagnostics ────────────────────────────────────────────────────────────────
const pkgPath = path.join(__dirname, '../../node_modules/mysql2/package.json');
const mysql2Version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
console.log('[DB] mysql2 version (node_modules):', mysql2Version);

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_CA_CERT } = process.env;
const port = parseInt(DB_PORT, 10);

console.log('[DB] DB_HOST     :', typeof DB_HOST,    '|', DB_HOST);
console.log('[DB] DB_PORT     :', typeof DB_PORT,    '| raw:', DB_PORT, '| parsed:', port, '| isNaN:', isNaN(port));
console.log('[DB] DB_USER     :', typeof DB_USER,    '|', DB_USER);
console.log('[DB] DB_PASSWORD :', typeof DB_PASSWORD, '| length:', DB_PASSWORD?.length ?? 'undefined');
console.log('[DB] DB_NAME     :', typeof DB_NAME,    '|', DB_NAME);
console.log('[DB] DB_CA_CERT  :', typeof DB_CA_CERT, '| set:', !!DB_CA_CERT);
// ──────────────────────────────────────────────────────────────────────────────

const sslOptions = DB_CA_CERT
  ? { ca: DB_CA_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true }
  : { rejectUnauthorized: false };

const pool = mysql.createPool({
  host: DB_HOST,
  port,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
