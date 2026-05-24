

// ============================================================
// Express Server - Entry Point
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Diagnostic endpoint - tests SendGrid + WhatsApp
app.get('/api/test-email', async (req, res) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM || process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com';
  const waPhoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const waAccessToken = process.env.WA_ACCESS_TOKEN;

  // Test SendGrid
  let emailResult;
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(apiKey);
    await sgMail.send({ to: adminEmail, from: fromEmail, subject: 'SendGrid Test - Prerna Silks', text: 'Test from Render!' });
    emailResult = { success: true, message: 'Email sent!' };
  } catch (err) {
    emailResult = { success: false, message: err.message };
  }

  // Test WhatsApp
  let waResult = null;
  if (waPhoneNumberId && waAccessToken) {
    try {
      const testNumber = req.query.to || '+917019461619';
      const res2 = await fetch(`https://graph.facebook.com/v22.0/${waPhoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waAccessToken}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: testNumber, type: 'text', text: { preview_url: false, body: 'Test from Prerna Silks server!' } })
      });
      const data = await res2.json();
      waResult = { success: !!data.messages, response: data };
    } catch (err) {
      waResult = { success: false, error: err.message };
    }
  }

  res.json({ email: emailResult, whatsapp: waResult, waConfigured: !!waPhoneNumberId && !!waAccessToken, adminEmail });
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
    { key: 'SENDGRID_API_KEY', label: 'SendGrid API Key', required: false },
    { key: 'ADMIN_EMAIL', label: 'Admin Email', required: true },
    { key: 'ADMIN_PHONE', label: 'Admin Phone', required: true },
  ];
  const missing = checks.filter(c => !process.env[c.key]);
  if (missing.length) {
    console.warn('\n\u{26A0}\u{FE0F}  Notification Configuration Warnings:');
    missing.forEach(c => console.warn(`   - ${c.label} (${c.key}) is not set in environment`));
    if (missing.some(c => c.key === 'SENDGRID_API_KEY')) {
      console.warn('   \u{1F4E7} Email notifications will be disabled until SendGrid API key is set.');
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
