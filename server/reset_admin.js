const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function resetPasswords() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prerna_silks',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Reset Admin
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'admin@prernasilks.com']);
    console.log('Admin (admin@prernasilks.com) password set to: admin123');

    // Reset User
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'anvitnaik95@gmail.com']);
    console.log('User (anvitnaik95@gmail.com) password set to: admin123');

  } catch (error) {
    console.error('Error resetting passwords:', error.message);
  } finally {
    await pool.end();
  }
}

resetPasswords();
