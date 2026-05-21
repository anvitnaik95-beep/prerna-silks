const nodemailer = require('nodemailer');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@prernasilks.com';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '7019461619';

// Twilio Credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_SMS = process.env.TWILIO_FROM_SMS; // e.g. '+1234567890'
const TWILIO_FROM_WHATSAPP = process.env.TWILIO_FROM_WHATSAPP || '+14155238886'; // default Twilio sandbox number

// Nodemailer SMTP Transporter
// Configure using SMTP credentials or falls back to standard log message
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  }
};

let transporter;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport(smtpConfig);
}

/**
 * Extracts a coordinate pair or URL from address if present, otherwise uses full address.
 * Helper to build Google Maps navigation URL from customer's address to Prerna Silks CBT Hubli Karnataka.
 */
function buildNavigationUrl(address) {
  const mapLinkRegex = /(https?:\/\/(?:www\.)?(?:google\.[a-z.]+|goo\.gl)\/maps\S*|https?:\/\/maps\.app\.goo\.gl\/\S+)/i;
  const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  
  let origin = address.trim();
  const urlMatch = address.match(mapLinkRegex);
  if (urlMatch) {
    origin = urlMatch[0];
  } else {
    const coordMatch = address.match(coordRegex);
    if (coordMatch) {
      origin = `${coordMatch[1]},${coordMatch[2]}`;
    }
  }
  
  const destination = 'Prerna Silks CBT Hubli Karnataka';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
}

/**
 * Automatically sends email notification to admin upon customer feedback
 */
async function sendAdminFeedbackEmail(feedback) {
  const stars = '★'.repeat(Math.round(feedback.rating)) + '☆'.repeat(5 - Math.round(feedback.rating));
  const mailSubject = `[New Feedback] Rating: ${feedback.rating}/5 from ${feedback.name}`;
  const mailText = `New customer feedback has been received on the Prerna Silks platform.

From: ${feedback.name}
Email: ${feedback.email || 'Not provided'}
Rating: ${stars} (${feedback.rating}/5)

Message:
"${feedback.message}"

Date: ${new Date(feedback.created_at || Date.now()).toLocaleString('en-IN')}`;

  console.log('\n--- [Automatic Email to Admin] ---');
  console.log(`To: ${ADMIN_EMAIL}`);
  console.log(`Subject: ${mailSubject}`);
  console.log(`Content:\n${mailText}`);
  console.log('----------------------------------\n');

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks Portal" <${smtpConfig.auth.user}>`,
        to: ADMIN_EMAIL,
        subject: mailSubject,
        text: mailText
      });
      console.log('✅ Feedback email successfully sent to admin.');
    } catch (err) {
      console.error('❌ Error sending feedback email to admin:', err.message);
    }
  } else {
    console.log('ℹ️ SMTP credentials not configured. E-mail outputted to console log only.');
  }
}

/**
 * Automatically sends SMS and WhatsApp order confirmation alerts to the customer.
 */
async function sendOrderSMSAndWhatsApp(order, items, user) {
  const itemsList = items.map((it, i) => `${i+1}. ${it.product_name} (x${it.quantity})`).join('\n');
  const navUrl = buildNavigationUrl(order.shipping_address);
  const totalStr = order.total_amount.toLocaleString('en-IN');
  const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // 1. WhatsApp Message Text (No emojis, includes route link)
  const whatsappMsg = `Order Confirmed - Prerna Silks

Hello ${user.name}! Your order has been placed successfully.

Order ID: ${order.id || order._id}
Payment: ${order.payment_method} (${order.payment_status})
Shipping Address: ${order.shipping_address}

Items:
${itemsList}

Total Amount: Rs. ${totalStr}
Estimated Delivery: ${deliveryDate}

Real-time Navigation Route to Prerna Silks CBT Hubli Shop:
${navUrl}

Thank you for shopping with us! For help, contact us at +91 ${ADMIN_PHONE}.`;

  // 2. SMS Message Text (Shorter for SMS limits, includes route link)
  const smsMsg = `Order Confirmed at Prerna Silks! Order ID: ${String(order.id || order._id).slice(-8).toUpperCase()}, Total: Rs. ${totalStr}. Est Delivery: ${deliveryDate}. Navigate to Prerna Silks: ${navUrl}`;

  console.log('\n--- [Automatic Customer Notifications] ---');
  console.log(`To Customer Phone: ${user.phone}`);
  console.log(`\n--- SMS Content ---\n${smsMsg}`);
  console.log(`\n--- WhatsApp Content ---\n${whatsappMsg}`);
  console.log('------------------------------------------\n');

  if (!user.phone) {
    console.log('ℹ️ Customer phone number not provided. Skipping automatic SMS/WhatsApp alerts.');
    return;
  }

  // Normalize customer phone number to E.164 format (needs a + prefix)
  let cleanPhone = user.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `+91${cleanPhone}`;
  } else if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`;
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Send SMS
    if (TWILIO_FROM_SMS) {
      try {
        await client.messages.create({
          body: smsMsg,
          from: TWILIO_FROM_SMS,
          to: cleanPhone
        });
        console.log('✅ Order confirmation SMS successfully sent to customer.');
      } catch (err) {
        console.error('❌ Error sending SMS to customer:', err.message);
      }
    } else {
      console.log('ℹ️ TWILIO_FROM_SMS not configured. Skipping SMS.');
    }

    // Send WhatsApp
    try {
      // Twilio WhatsApp expects the numbers formatted as 'whatsapp:+1234567890'
      const whatsappFrom = TWILIO_FROM_WHATSAPP.startsWith('whatsapp:') ? TWILIO_FROM_WHATSAPP : `whatsapp:${TWILIO_FROM_WHATSAPP}`;
      const whatsappTo = `whatsapp:${cleanPhone}`;

      await client.messages.create({
        body: whatsappMsg,
        from: whatsappFrom,
        to: whatsappTo
      });
      console.log('✅ Order confirmation WhatsApp message successfully sent to customer.');
    } catch (err) {
      console.error('❌ Error sending WhatsApp to customer:', err.message);
    }
  } else {
    console.log('ℹ️ Twilio credentials not configured in .env. Notification outputted to console log only.');
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp
};
