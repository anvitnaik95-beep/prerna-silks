// Direct Gmail SMTP test
require('dotenv').config();
const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

console.log('=== GMAIL SMTP DIAGNOSTIC ===');
console.log('SMTP_USER:', SMTP_USER || 'MISSING!');
console.log('SMTP_PASS:', SMTP_PASS ? SMTP_PASS.substring(0, 4) + '...' : 'MISSING!');
console.log('ADMIN_EMAIL:', ADMIN_EMAIL || 'MISSING!');
console.log('');

if (!SMTP_USER || !SMTP_PASS) {
  console.log('FATAL: SMTP credentials missing from .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

async function test() {
  // Test 1: Verify connection
  console.log('--- Test 1: Verify SMTP Connection ---');
  try {
    await transporter.verify();
    console.log('SMTP Connection: SUCCESS! Gmail is ready to send.');
  } catch (err) {
    console.error('SMTP Connection: FAILED!');
    console.error('  Error:', err.message);
    console.error('  Code:', err.code);
    return;
  }

  // Test 2: Send test email
  console.log('\n--- Test 2: Sending Test Email ---');
  try {
    const info = await transporter.sendMail({
      from: `"Prerna Silks Portal" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: '[TEST] Prerna Silks Notification Test',
      text: 'If you received this email, the Gmail SMTP notification system is working correctly!\n\nThis is an automated test from the Prerna Silks server.'
    });
    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    console.log('\nCheck your inbox at:', ADMIN_EMAIL);
  } catch (err) {
    console.error('EMAIL FAILED!');
    console.error('  Error:', err.message);
    console.error('  Code:', err.code);
  }
}

test();
