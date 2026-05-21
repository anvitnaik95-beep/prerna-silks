const mysql = require('mysql2');
require('dotenv').config({ path: './.env' });

async function checkDB() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prerna_silks',
    port: process.env.DB_PORT || 3306,
  }).promise();

  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in DB:', users);
    
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in DB:', tables);
  } catch (error) {
    console.error('Error checking DB:', error.message);
  } finally {
    await pool.end();
  }
}

checkDB();
