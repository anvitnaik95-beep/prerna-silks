const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
  try {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    console.warn('Could not set custom DNS servers:', err.message);
  }
}

const mongoose = require('mongoose');
const Setting = require('../models/Setting');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prerna_silks';

async function seedSettings() {
  const keys = {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_SECURE: process.env.SMTP_SECURE || 'false',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com',
    ADMIN_PHONE: process.env.ADMIN_PHONE || '7019461619',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_FROM_SMS: process.env.TWILIO_FROM_SMS || '',
    TWILIO_FROM_WHATSAPP: process.env.TWILIO_FROM_WHATSAPP || '+14155238886'
  };

  try {
    for (const [key, val] of Object.entries(keys)) {
      if (val) {
        await Setting.findOneAndUpdate(
          { setting_key: key },
          { setting_value: val.trim() },
          { upsert: true, new: true }
        );
      }
    }
    console.log('✅ SMTP/Twilio configuration synced with Database settings.');
  } catch (err) {
    console.error('Error syncing configurations to DB:', err.message);
  }
}

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully to Atlas Cloud!');
    await seedSettings();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Server cannot start without database. Exiting...');
    process.exit(1);
  }
}

module.exports = { testConnection };
