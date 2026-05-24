const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Setting = require('../models/Setting');

const SITE_URL = process.env.SITE_URL || 'https://prerna-silks.onrender.com';
function buildTrackOrderUrl(trackingId) {
  return `${SITE_URL}/track-order${trackingId ? `?trackId=${encodeURIComponent(trackingId)}` : ''}`;
}

async function loadConfig() {
  const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL', 'ADMIN_PHONE'];
  
  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com',
    ADMIN_PHONE: process.env.ADMIN_PHONE || '7019461619',
    SMS_PROVIDER: process.env.SMS_PROVIDER || '',
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || ''
  };

  try {
    const dbSettings = await Setting.find({ setting_key: { $in: keys } });
    for (const s of dbSettings) {
      if (s.setting_value) {
        if (s.setting_key === 'SMTP_PORT') {
          config.SMTP_PORT = parseInt(s.setting_value);
        } else if (s.setting_key === 'SMTP_SECURE') {
          config.SMTP_SECURE = s.setting_value === 'true';
        } else {
          config[s.setting_key] = s.setting_value;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching settings from database:', err.message);
  }

  return config;
}

async function getTransporterAndConfig() {
  const config = await loadConfig();
  let transporter = null;
  if (config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS }
    });
  }
  return { transporter, config };
}

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return null;
}

async function sendSMS(phone, message) {
  const { config } = await getTransporterAndConfig();
  const cleanPhone = formatPhone(phone);
  if (!cleanPhone) {
    console.log('No valid phone number. Skipping SMS.');
    return false;
  }

  if (config.SMS_PROVIDER === 'fast2sms' && config.FAST2SMS_API_KEY) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${config.FAST2SMS_API_KEY}&sender_id=FSTSMS&message=${encodeURIComponent(message)}&language=english&route=q&numbers=${cleanPhone}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.return === true) {
        console.log(`SMS sent to ${cleanPhone} via Fast2SMS`);
        return true;
      }
      console.error(`Fast2SMS error: ${data.message || 'Unknown'}`);
      return false;
    } catch (err) {
      console.error(`Fast2SMS request failed: ${err.message}`);
      return false;
    }
  }

  console.log(`[SMS Log] To: ${cleanPhone}`);
  console.log(`   Message: "${message}"`);
  console.log('   SMS_PROVIDER not configured. Set SMS_PROVIDER=fast2sms and FAST2SMS_API_KEY to send live SMS.');
  return false;
}

async function sendAdminFeedbackEmail(feedback) {
  const starsStr = String.fromCharCode(9733).repeat(Math.round(feedback.rating)) + String.fromCharCode(9734).repeat(5 - Math.round(feedback.rating));
  const { transporter, config } = await getTransporterAndConfig();
  const mailSubject = `[New Feedback] Rating: ${feedback.rating}/5 from ${feedback.name}`;
  const mailText = `New customer feedback has been received on the Prerna Silks platform.

From: ${feedback.name}
Email: ${feedback.email || 'Not provided'}
Rating: ${starsStr} (${feedback.rating}/5)

Message:
"${feedback.message}"

Date: ${new Date(feedback.created_at || Date.now()).toLocaleString('en-IN')}`;

  console.log('\n--- [Automatic Email to Admin] ---');
  console.log(`To: ${config.ADMIN_EMAIL}`);
  console.log(`Subject: ${mailSubject}`);
  console.log(`Content:\n${mailText}`);
  console.log('----------------------------------\n');

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks Portal" <${config.SMTP_USER}>`,
        to: config.ADMIN_EMAIL,
        subject: mailSubject,
        text: mailText
      });
      console.log('Feedback email successfully sent to admin.');
    } catch (err) {
      console.error('Error sending feedback email to admin:', err.message);
    }
  } else {
    console.log('SMTP credentials not configured. E-mail outputted to console log only.');
  }
}

async function sendOrderSMSAndWhatsApp(order, items, user) {
  const { transporter, config } = await getTransporterAndConfig();
  const itemsList = items.map((it, i) => `${i+1}. ${it.product_name} (x${it.quantity})`).join('\n');
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();

  console.log('\n--- [Notification Config Check] ---');
  console.log(`SMTP configured: ${!!transporter}, User email: ${user.email || 'MISSING'}`);
  console.log(`SMS provider: ${config.SMS_PROVIDER || 'not set'}, Phone: ${user.phone || 'MISSING'}`);
  console.log(`Admin email: ${config.ADMIN_EMAIL}`);
  console.log('-----------------------------------\n');

  const smsMsg = `Prerna Silks: Order Confirmed! ID: ${orderId}, Total: Rs. ${totalStr}. Delivery via XpressBees. Est: ${deliveryDate}. Track: ${trackUrl}`;

  console.log('\n--- [Automatic Customer Notifications] ---');
  console.log(`To Customer Phone: ${user.phone}`);
  console.log(`\n--- SMS Content ---\n${smsMsg}`);
  console.log('------------------------------------------\n');

  if (transporter && user.email) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks" <${config.SMTP_USER}>`,
        to: user.email,
        subject: `Order Confirmed! - Prerna Silks (Order #${orderId})`,
        text: `Dear ${user.name},\n\nYour order has been placed successfully!\n\nOrder Details:\nOrder ID: #${orderId}\nPayment Method: ${order.payment_method}\nShipping Address: ${order.shipping_address}\nTotal Amount: Rs. ${totalStr}\nEstimated Delivery: ${deliveryDate}\n\nTrack your order here: ${trackUrl}\n\nThank you for shopping with Prerna Silks!\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email Success] Confirmation email sent to customer: ${user.email}`);
    } catch (emailErr) {
      console.error('Error sending order confirmation email:', emailErr.message);
    }
  }

  if (user.phone) {
    await sendSMS(user.phone, smsMsg);
  } else {
    console.log('Customer phone number not provided. Skipping SMS alert.');
  }
}

async function sendDeliveredNotification(order, user) {
  const { transporter, config } = await getTransporterAndConfig();
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const smsMsg = `Prerna Silks: Good news! Your order ${orderId} has been successfully delivered. Thank you for shopping with us! Track history: ${trackUrl}`;

  if (transporter && user.email) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks" <${config.SMTP_USER}>`,
        to: user.email,
        subject: `Delivered! - Prerna Silks Order #${orderId}`,
        text: `Dear ${user.name},\n\nGood news! Your order has been successfully delivered.\n\nOrder Details:\nOrder ID: #${orderId}\n\nWe hope you love your new saree! Thank you for choosing Prerna Silks.\n\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email Success] Delivery email sent to customer: ${user.email}`);
    } catch (emailErr) {
      console.error('Error sending delivery email:', emailErr.message);
    }
  }

  if (user.phone) {
    await sendSMS(user.phone, smsMsg);
  } else {
    console.log('Customer phone not provided. Skipping delivery SMS.');
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp,
  sendDeliveredNotification
};
