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

// Build track order URL (replaces old map navigation URL)
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
function buildTrackOrderUrl(trackingId) {
  return `${SITE_URL}/track-order${trackingId ? `?trackId=${encodeURIComponent(trackingId)}` : ''}`;
}

/**
 * Normalize phone number to E.164 format for Twilio
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `+91${cleanPhone}`;
  } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    cleanPhone = `+${cleanPhone}`;
  } else if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`;
  }
  return cleanPhone;
}

/**
 * Automatically sends email notification to admin upon customer feedback
 */
async function sendAdminFeedbackEmail(feedback) {
  const starsStr = String.fromCharCode(9733).repeat(Math.round(feedback.rating)) + String.fromCharCode(9734).repeat(5 - Math.round(feedback.rating));
  const mailSubject = `[New Feedback] Rating: ${feedback.rating}/5 from ${feedback.name}`;
  const mailText = `New customer feedback has been received on the Prerna Silks platform.

From: ${feedback.name}
Email: ${feedback.email || 'Not provided'}
Rating: ${starsStr} (${feedback.rating}/5)

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
      console.log('Feedback email successfully sent to admin.');
    } catch (err) {
      console.error('Error sending feedback email to admin:', err.message);
    }
  } else {
    console.log('SMTP credentials not configured. E-mail outputted to console log only.');
  }
}

/**
 * Send SMS to a phone number
 */
async function sendSMS(client, toPhone, message) {
  const cleanPhone = normalizePhone(toPhone);
  if (!cleanPhone) {
    console.log('No valid phone number provided for SMS.');
    return false;
  }

  if (!TWILIO_FROM_SMS) {
    console.log('TWILIO_FROM_SMS not configured. Skipping SMS.');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: TWILIO_FROM_SMS,
      to: cleanPhone
    });
    console.log(`SMS successfully sent to ${cleanPhone}`);
    return true;
  } catch (err) {
    console.error(`\n❌ [SMS FAILED] To: ${cleanPhone}`);
    console.error(`   Error Code: ${err.code || 'N/A'}`);
    console.error(`   Reason: ${err.message}`);
    if (err.code === 21608 || err.code === 21211 || err.code === 21614) {
      console.error(`   ⚠️  This number is not verified on your Twilio Trial account.`);
      console.error(`   Fix: Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified and add this number.`);
    }
    return false;
  }
}

/**
 * Send WhatsApp message to a phone number
 */
async function sendWhatsApp(client, toPhone, message) {
  const cleanPhone = normalizePhone(toPhone);
  if (!cleanPhone) {
    console.log('No valid phone number provided for WhatsApp.');
    return false;
  }

  try {
    const whatsappFrom = TWILIO_FROM_WHATSAPP.startsWith('whatsapp:') ? TWILIO_FROM_WHATSAPP : `whatsapp:${TWILIO_FROM_WHATSAPP}`;
    const whatsappTo = `whatsapp:${cleanPhone}`;

    await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });
    console.log(`WhatsApp message successfully sent to ${cleanPhone}`);
    return true;
  } catch (err) {
    console.error(`\n❌ [WHATSAPP FAILED] To: whatsapp:${cleanPhone}`);
    console.error(`   Error Code: ${err.code || 'N/A'}`);
    console.error(`   Reason: ${err.message}`);
    if (err.code === 21608 || err.code === 21211 || err.code === 63007) {
      console.error(`   ⚠️  This number hasn't joined the Twilio WhatsApp Sandbox.`);
      console.error(`   Fix: The recipient must send 'join <your-sandbox-keyword>' to +14155238886 on WhatsApp first.`);
    }
    return false;
  }
}

/**
 * Automatically sends SMS and WhatsApp order confirmation alerts to the customer.
 * Also sends notification to admin.
 */
async function sendOrderSMSAndWhatsApp(order, items, user) {
  const itemsList = items.map((it, i) => `${i+1}. ${it.product_name} (x${it.quantity})`).join('\n');
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();

  // WhatsApp Message to Customer
  const whatsappMsg = `Order Confirmed - Prerna Silks

Hello ${user.name}! Your order has been placed successfully.

Order ID: ${orderId}
Payment: ${order.payment_method} (${order.payment_status})
Shipping Address: ${order.shipping_address}
Delivery via: India Post

Items:
${itemsList}

Total Amount: Rs. ${totalStr}
Estimated Delivery: ${deliveryDate}

Track your order here:
${trackUrl}

Thank you for shopping with us! For help, contact us at +91 ${ADMIN_PHONE}.`;

  // SMS Message to Customer
  const smsMsg = `Prerna Silks: Order Confirmed! ID: ${orderId}, Total: Rs. ${totalStr}. Delivery via India Post. Est: ${deliveryDate}. Track: ${trackUrl}`;

  // Admin notification message
  const adminMsg = `New Order Alert - Prerna Silks

Order ID: ${orderId}
Customer: ${user.name}
Phone: ${user.phone || 'N/A'}
Amount: Rs. ${totalStr}
Payment: ${order.payment_method} (${order.payment_status})
Address: ${order.shipping_address}

Items:
${itemsList}

Please dispatch the order from the admin portal.`;

  console.log('\n--- [Automatic Customer Notifications] ---');
  console.log(`To Customer Phone: ${user.phone}`);
  console.log(`\n--- SMS Content ---\n${smsMsg}`);
  console.log(`\n--- WhatsApp Content ---\n${whatsappMsg}`);
  console.log('------------------------------------------\n');

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('Twilio credentials not configured in .env. Notification outputted to console log only.');
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  // Send to customer if phone provided
  if (user.phone) {
    await sendSMS(client, user.phone, smsMsg);
    await sendWhatsApp(client, user.phone, whatsappMsg);
  } else {
    console.log('Customer phone number not provided. Skipping customer SMS/WhatsApp alerts.');
  }

  // Send admin notification via SMS and WhatsApp
  if (ADMIN_PHONE) {
    const adminSms = `[ADMIN ALERT] New Order! ID: ${orderId}, Customer: ${user.name}, Amount: Rs. ${totalStr}. Check portal.`;
    await sendSMS(client, ADMIN_PHONE, adminSms);
    await sendWhatsApp(client, ADMIN_PHONE, adminMsg);
  }
}

/**
 * Send dispatch notification with tracking ID and estimated delivery.
 * Called when admin changes order status to "Dispatched".
 */
async function sendDispatchNotification(order, user) {
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  
  // Calculate estimated delivery based on shipping distance (postal service ~5-10 days)
  let estDelivery = order.estimated_delivery;
  if (!estDelivery) {
    estDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const deliveryDate = new Date(estDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // WhatsApp dispatch message
  const whatsappMsg = `Order Dispatched - Prerna Silks

Hello ${user.name}! Your order has been dispatched.

Order ID: ${orderId}
Tracking ID: ${order.tracking_id || 'Will be updated shortly'}
Delivery Service: India Post
Estimated Delivery: ${deliveryDate}
Total Amount: Rs. ${totalStr}

Track your order here:
${trackUrl}

Your order is on its way! For help, contact us at +91 ${ADMIN_PHONE}.`;

  // SMS dispatch message
  const smsMsg = `Prerna Silks: Order ${orderId} dispatched via India Post! Tracking: ${order.tracking_id || 'N/A'}. Est Delivery: ${deliveryDate}. Track: ${trackUrl}`;

  console.log('\n--- [Dispatch Notifications] ---');
  console.log(`To Customer: ${user.phone || user.email}`);
  console.log(`SMS: ${smsMsg}`);
  console.log(`WhatsApp: ${whatsappMsg}`);
  console.log('--------------------------------\n');

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('Twilio credentials not configured. Dispatch notification logged to console only.');
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  if (user.phone) {
    await sendSMS(client, user.phone, smsMsg);
    await sendWhatsApp(client, user.phone, whatsappMsg);
  }
}

/**
 * Send delivered notification
 */
async function sendDeliveredNotification(order, user) {
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  
  const whatsappMsg = `Order Delivered - Prerna Silks

Hello ${user.name}! Good news, your order has been successfully delivered.

Order ID: ${orderId}
Tracking ID: ${order.tracking_id || 'N/A'}

Thank you for shopping with Prerna Silks! We hope you love your new saree.

Track history:
${trackUrl}`;

  const smsMsg = `Prerna Silks: Good news! Your order ${orderId} has been successfully delivered. Thank you for shopping with us! Track history: ${trackUrl}`;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return;
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  if (user.phone) {
    await sendSMS(client, user.phone, smsMsg);
    await sendWhatsApp(client, user.phone, whatsappMsg);
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp,
  sendDispatchNotification,
  sendDeliveredNotification
};
