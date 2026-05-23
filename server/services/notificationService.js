const nodemailer = require('nodemailer');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Setting = require('../models/Setting');

// Build track order URL
const SITE_URL = process.env.SITE_URL || 'https://prerna-silks.onrender.com';
function buildTrackOrderUrl(trackingId) {
  return `${SITE_URL}/track-order${trackingId ? `?trackId=${encodeURIComponent(trackingId)}` : ''}`;
}

async function loadConfig() {
  const keys = [
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS',
    'ADMIN_EMAIL', 'ADMIN_PHONE', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_SMS', 'TWILIO_FROM_WHATSAPP'
  ];
  
  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
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
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  }
  return { transporter, config };
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
 * Send SMS to a phone number
 */
async function sendSMS(client, fromSms, toPhone, message) {
  const cleanPhone = normalizePhone(toPhone);
  if (!cleanPhone) {
    console.log('No valid phone number provided for SMS.');
    return false;
  }

  if (!fromSms) {
    console.log('fromSms not configured. Skipping SMS.');
    return false;
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromSms,
      to: cleanPhone
    });
    console.log(`SMS successfully sent to ${cleanPhone} (SID: ${result.sid})`);
    return true;
  } catch (err) {
    console.error(`\n[SMS FAILED] To: ${cleanPhone}`);
    console.error(`   Error Code: ${err.code || 'N/A'}`);
    console.error(`   Reason: ${err.message}`);
    console.warn(`[SMS Fallback Log] For Customer ${cleanPhone}:`);
    console.warn(`   MESSAGE: "${message}"`);
    return false;
  }
}

/**
 * Send WhatsApp message to a phone number
 */
async function sendWhatsApp(client, fromWa, toPhone, message) {
  const cleanPhone = normalizePhone(toPhone);
  if (!cleanPhone) {
    console.log('No valid phone number provided for WhatsApp.');
    return false;
  }

  if (!fromWa) {
    console.log('fromWa not configured. Skipping WhatsApp.');
    return false;
  }

  try {
    const whatsappFrom = fromWa.startsWith('whatsapp:') ? fromWa : `whatsapp:${fromWa}`;
    const whatsappTo = `whatsapp:${cleanPhone}`;

    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });
    console.log(`WhatsApp message successfully sent to ${cleanPhone} (SID: ${result.sid})`);
    return true;
  } catch (err) {
    console.error(`\n[WHATSAPP FAILED] To: whatsapp:${cleanPhone}`);
    console.error(`   Error Code: ${err.code || 'N/A'}`);
    console.error(`   Reason: ${err.message}`);
    console.warn(`[WhatsApp Fallback Log] For Customer ${cleanPhone}:`);
    console.warn(`   MESSAGE: "${message}"`);
    return false;
  }
}

/**
 * Automatically sends email notification to admin upon customer feedback
 */
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

/**
 * Automatically sends SMS and WhatsApp order confirmation alerts to the customer.
 * Also sends notification to admin.
 */
async function sendOrderSMSAndWhatsApp(order, items, user) {
  const { transporter, config } = await getTransporterAndConfig();
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
Delivery via: XpressBees

Items:
${itemsList}

Total Amount: Rs. ${totalStr}
Estimated Delivery: ${deliveryDate}

Track your order here:
${trackUrl}

Thank you for shopping with us! For help, contact us at +91 ${config.ADMIN_PHONE}.`;

  // SMS Message to Customer
  const smsMsg = `Prerna Silks: Order Confirmed! ID: ${orderId}, Total: Rs. ${totalStr}. Delivery via XpressBees. Est: ${deliveryDate}. Track: ${trackUrl}`;

  // Admin notification message
  const adminMsg = `New Order Alert - Prerna Silks

Order ID: ${orderId}
Customer: ${user.name}
Phone: ${user.phone || 'N/A'}
Amount: Rs. ${totalStr}
Payment: ${order.payment_method} (${order.payment_status})
Address: ${order.shipping_address}

Items:
${itemsList}`;

  console.log('\n--- [Automatic Customer Notifications] ---');
  console.log(`To Customer Phone: ${user.phone}`);
  console.log(`\n--- SMS Content ---\n${smsMsg}`);
  console.log(`\n--- WhatsApp Content ---\n${whatsappMsg}`);
  console.log('------------------------------------------\n');

  // Send emails via SMTP
  if (transporter) {
    try {
      // 1. Send confirmation email to Customer
      if (user.email) {
        await transporter.sendMail({
          from: `"Prerna Silks" <${config.SMTP_USER}>`,
          to: user.email,
          subject: `Order Confirmed! - Prerna Silks (Order #${orderId})`,
          text: `Dear ${user.name},\n\nYour order has been placed successfully!\n\nOrder Details:\nOrder ID: #${orderId}\nPayment Method: ${order.payment_method}\nShipping Address: ${order.shipping_address}\nTotal Amount: Rs. ${totalStr}\nEstimated Delivery: ${deliveryDate}\n\nTrack your order here: ${trackUrl}\n\nThank you for shopping with Prerna Silks!\nBest Regards,\nPrerna Silks Team`
        });
        console.log(`[Email Success] Confirmation email sent to customer: ${user.email}`);
      }
      
      // 2. Send alert email to Admin
      await transporter.sendMail({
        from: `"Prerna Silks Portal" <${config.SMTP_USER}>`,
        to: config.ADMIN_EMAIL,
        subject: `[NEW ORDER] Order #${orderId} placed by ${user.name}`,
        text: `New order received!\n\nCustomer: ${user.name}\nEmail: ${user.email || 'N/A'}\nPhone: ${user.phone || 'N/A'}\n\nOrder Details:\nOrder ID: #${orderId}\nPayment Method: ${order.payment_method}\nShipping Address: ${order.shipping_address}\nTotal Amount: Rs. ${totalStr}\n\nItems:\n${itemsList}\n\nPlease prepare the order for dispatch.`
      });
      console.log(`[Email Success] Admin order alert email sent to: ${config.ADMIN_EMAIL}`);
    } catch (emailErr) {
      console.error('Error sending order emails:', emailErr.message);
    }
  } else {
    console.log('SMTP credentials not configured. Skipping automated email notifications.');
  }

  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
    console.log('Twilio credentials not configured. Notification outputted to console log only.');
    return;
  }

  const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  // Send to customer if phone provided
  if (user.phone) {
    await sendSMS(client, config.TWILIO_FROM_SMS, user.phone, smsMsg);
    await sendWhatsApp(client, config.TWILIO_FROM_WHATSAPP, user.phone, whatsappMsg);
  } else {
    console.log('Customer phone number not provided. Skipping customer SMS/WhatsApp alerts.');
  }

  // Send admin notification via SMS and WhatsApp
  if (config.ADMIN_PHONE) {
    const adminSms = `[ADMIN ALERT] New Order! ID: ${orderId}, Customer: ${user.name}, Amount: Rs. ${totalStr}. Check portal.`;
    await sendSMS(client, config.TWILIO_FROM_SMS, config.ADMIN_PHONE, adminSms);
    await sendWhatsApp(client, config.TWILIO_FROM_WHATSAPP, config.ADMIN_PHONE, adminMsg);
  }
}

/**
 * Send dispatch notification with tracking ID and estimated delivery.
 */
async function sendDispatchNotification(order, user) {
  const { transporter, config } = await getTransporterAndConfig();
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  
  let estDelivery = order.estimated_delivery;
  if (!estDelivery) {
    estDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  }
  const deliveryDate = new Date(estDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const whatsappMsg = `Order Dispatched - Prerna Silks

Hello ${user.name}! Your order has been dispatched.

Order ID: ${orderId}
Tracking ID: ${order.tracking_id || 'Will be updated shortly'}
Delivery Service: XpressBees
Estimated Delivery: ${deliveryDate}
Total Amount: Rs. ${totalStr}

Track your order here:
${trackUrl}

Your order is on its way! For help, contact us at +91 ${config.ADMIN_PHONE}.`;

  const smsMsg = `Prerna Silks: Order ${orderId} dispatched via XpressBees! Tracking: ${order.tracking_id || 'N/A'}. Est Delivery: ${deliveryDate}. Track: ${trackUrl}`;

  console.log('\n--- [Dispatch Notifications] ---');
  console.log(`To Customer: ${user.phone || user.email}`);
  console.log(`SMS: ${smsMsg}`);
  console.log(`WhatsApp: ${whatsappMsg}`);
  console.log('--------------------------------\n');

  // Send dispatch email to Customer via SMTP
  if (transporter && user.email) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks" <${config.SMTP_USER}>`,
        to: user.email,
        subject: `Your Prerna Silks Order Has Been Dispatched! (Order #${orderId})`,
        text: `Dear ${user.name},\n\nExciting news! Your order has been dispatched via XpressBees.\n\nOrder Details:\nOrder ID: #${orderId}\nTracking ID: ${order.tracking_id}\nDelivery Service: XpressBees\nEstimated Delivery: ${deliveryDate}\nTotal Amount: Rs. ${totalStr}\n\nTrack your order live here: ${trackUrl}\n\nThank you for shopping with us!\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email Success] Dispatch email sent to customer: ${user.email}`);
    } catch (emailErr) {
      console.error('Error sending dispatch email:', emailErr.message);
    }
  }

  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
    console.log('Twilio credentials not configured. Dispatch notification logged to console only.');
    return;
  }

  const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  if (user.phone) {
    await sendSMS(client, config.TWILIO_FROM_SMS, user.phone, smsMsg);
    await sendWhatsApp(client, config.TWILIO_FROM_WHATSAPP, user.phone, whatsappMsg);
  }
}

/**
 * Send shipped notification with tracking ID
 */
async function sendShippedNotification(order, user) {
  const { transporter, config } = await getTransporterAndConfig();
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  
  let estDelivery = order.estimated_delivery;
  if (!estDelivery) {
    estDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  }
  const deliveryDate = new Date(estDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const whatsappMsg = `Order Shipped & In-Transit - Prerna Silks\n\nHello ${user.name}! Your order has been shipped and is currently in transit.\n\nOrder ID: ${orderId}\nTracking ID: ${order.tracking_id || 'XB' + Date.now().toString(36).toUpperCase()}\nDelivery Partner: XpressBees\nEstimated Delivery: ${deliveryDate}\n\nTrack your order here:\n${trackUrl}\n\nThank you for choosing Prerna Silks!`;

  const smsMsg = `Prerna Silks: Order ${orderId} has been shipped via XpressBees! Tracking ID: ${order.tracking_id || 'N/A'}. Track: ${trackUrl}`;

  console.log('\n--- [Shipped Notifications] ---');
  console.log(`To Customer: ${user.phone || user.email}`);
  console.log(`SMS: ${smsMsg}`);
  console.log(`WhatsApp: ${whatsappMsg}`);
  console.log('--------------------------------\n');

  // Send shipped email to Customer via SMTP
  if (transporter && user.email) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks" <${config.SMTP_USER}>`,
        to: user.email,
        subject: `Your Prerna Silks Order Has Been Shipped! (Order #${orderId})`,
        text: `Dear ${user.name},\n\nGood news! Your order has been shipped via XpressBees and is currently in transit.\n\nOrder Details:\nOrder ID: #${orderId}\nTracking ID: ${order.tracking_id}\nEstimated Delivery: ${deliveryDate}\nTotal Amount: Rs. ${totalStr}\n\nTrack your live shipment here: ${trackUrl}\n\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email Success] Shipped email sent to customer: ${user.email}`);
    } catch (emailErr) {
      console.error('Error sending shipped email:', emailErr.message);
    }
  }

  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
    console.log('Twilio credentials not configured. Shipped notification logged to console only.');
    return;
  }

  const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  if (user.phone) {
    await sendSMS(client, config.TWILIO_FROM_SMS, user.phone, smsMsg);
    await sendWhatsApp(client, config.TWILIO_FROM_WHATSAPP, user.phone, whatsappMsg);
  }
}

/**
 * Send delivered notification
 */
async function sendDeliveredNotification(order, user) {
  const { transporter, config } = await getTransporterAndConfig();
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  
  const whatsappMsg = `Order Delivered - Prerna Silks\n\nHello ${user.name}! Good news, your order has been successfully delivered.\n\nOrder ID: ${orderId}\nTracking ID: ${order.tracking_id || 'N/A'}\n\nThank you for shopping with Prerna Silks! We hope you love your new saree.\n\nTrack history:\n${trackUrl}`;

  const smsMsg = `Prerna Silks: Good news! Your order ${orderId} has been successfully delivered. Thank you for shopping with us! Track history: ${trackUrl}`;

  // Send delivered email to Customer via SMTP
  if (transporter && user.email) {
    try {
      await transporter.sendMail({
        from: `"Prerna Silks" <${config.SMTP_USER}>`,
        to: user.email,
        subject: `Delivered! - Prerna Silks Order #${orderId}`,
        text: `Dear ${user.name},\n\nGood news! Your order has been successfully delivered.\n\nOrder Details:\nOrder ID: #${orderId}\nTracking ID: ${order.tracking_id || 'N/A'}\n\nWe hope you love your new saree! Thank you for choosing Prerna Silks.\n\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email Success] Delivery email sent to customer: ${user.email}`);
    } catch (emailErr) {
      console.error('Error sending delivery email:', emailErr.message);
    }
  }

  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) return;
  const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  if (user.phone) {
    await sendSMS(client, config.TWILIO_FROM_SMS, user.phone, smsMsg);
    await sendWhatsApp(client, config.TWILIO_FROM_WHATSAPP, user.phone, whatsappMsg);
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp,
  sendDispatchNotification,
  sendShippedNotification,
  sendDeliveredNotification
};
