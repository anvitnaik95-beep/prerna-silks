

// ============================================================
// Express Server - Entry Point
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads like images/PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/settings', require('./routes/settings'));

// Test endpoint - checks SMTP config and sends test email
app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const adminEmail = process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com';
  if (!user || !pass) {
    return res.json({ success: false, message: 'SMTP_USER or SMTP_PASS not set', smtpUser: !!user, smtpPass: !!pass });
  }
  try {
    const t = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: false, auth: { user, pass } });
    await t.sendMail({ from: `"Prerna Silks" <${user}>`, to: adminEmail, subject: 'SMTP Test - Prerna Silks', text: 'If you see this, SMTP is working on Render!' });
    t.close();
    res.json({ success: true, message: 'Test email sent!', smtpUser: user, adminEmail });
  } catch (err) {
    res.json({ success: false, message: err.message, smtpUser: !!user, smtpPass: !!pass, smtpHost, smtpPort });
  }
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

const { startBackgroundJobs } = require('./backgroundJobs');

// Startup notification config diagnostic
function checkNotificationConfig() {
  const checks = [
    { key: 'SMTP_USER', label: 'SMTP Username', required: false },
    { key: 'SMTP_PASS', label: 'SMTP Password', required: false },
    { key: 'ADMIN_EMAIL', label: 'Admin Email', required: true },
    { key: 'ADMIN_PHONE', label: 'Admin Phone', required: true },
  ];
  const missing = checks.filter(c => !process.env[c.key]);
  if (missing.length) {
    console.warn('\n\u{26A0}\u{FE0F}  Notification Configuration Warnings:');
    missing.forEach(c => console.warn(`   - ${c.label} (${c.key}) is not set in environment`));
    if (missing.some(c => c.key.startsWith('SMTP'))) {
      console.warn('   \u{1F4E7} Email notifications will be disabled until set.');
    }
    console.warn('   Set these in your Render dashboard or .env file.\n');
  } else {
    console.log('\u{2705} Email configuration is complete.\n');
  }
}

testConnection().then(() => {
  checkNotificationConfig();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API at http://localhost:${PORT}/api\n`);
    startBackgroundJobs();
  });
});
