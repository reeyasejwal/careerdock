const mysql = require('mysql2/promise');

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

const uri = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl={"rejectUnauthorized":false}`;

console.log('[DB] Connecting via URI to:', `${DB_HOST}:${DB_PORT}/${DB_NAME}`);

const pool = mysql.createPool(uri);

pool.getConnection()
  .then(conn => {
    console.log('[DB] MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] MySQL connection FAILED — code:', err.code, '— message:', err.message);
  });

module.exports = pool;
