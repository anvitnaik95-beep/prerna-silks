const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '',
      database: process.env.DB_NAME,
    });
    const [rows] = await pool.query('SELECT * FROM users WHERE email = "admin@prernasilks.com"');
    console.log('Admin user:', rows);
    pool.end();
  } catch(e) {
    console.error(e);
  }
}
run();
