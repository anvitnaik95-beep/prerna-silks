const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkSettings() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: 'Anvit@123',
    database: process.env.DB_NAME || 'prerna_silks',
    port: Number(process.env.DB_PORT) || 3306
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL!');
    
    const [columns] = await connection.query('DESCRIBE settings;');
    console.log('Columns in "settings" table:', columns.map(c => c.Field));
    
    const [rows] = await connection.query('SELECT * FROM settings;');
    console.log('Settings Rows:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('❌ MySQL Query Error:', error);
  }
}

checkSettings();
