const sgMail = require('@sendgrid/mail');

const SITE_URL = process.env.SITE_URL || 'https://prerna-silks.onrender.com';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'anvitnaik95@gmail.com';
const FROM_EMAIL = process.env.SENDGRID_FROM || ADMIN_EMAIL;

function buildTrackOrderUrl(trackingId) {
  return `${SITE_URL}/track-order${trackingId ? `?trackId=${encodeURIComponent(trackingId)}` : ''}`;
}

function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    return true;
  }
  return false;
}

const WA_API_VERSION = 'v22.0';

async function sendWhatsAppMessage(to, body) {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp] Skipped (not configured): would send to ${to}`);
    return false;
  }
  let normalized = to.replace(/[\s\-\(\)]/g, '');
  if (!normalized.startsWith('+')) {
    normalized = '+91' + normalized.replace(/^0+/, '');
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalized,
        type: 'text',
        text: { preview_url: false, body }
      })
    });
    const data = await res.json();
    if (data.messages && data.messages[0]) {
      console.log(`[WhatsApp] Sent to ${normalized}, msg ID: ${data.messages[0].id}`);
      return true;
    }
    console.error('[WhatsApp] Error sending to', normalized, ':', JSON.stringify(data.error || data));
    return false;
  } catch (err) {
    console.error('[WhatsApp] Error sending to', normalized, ':', err.message);
    return false;
  }
}

async function sendWhatsAppTemplate(to, templateName, params) {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp] Template skipped (not configured): would send ${templateName} to ${to}`);
    return false;
  }
  let normalized = to.replace(/[\s\-\(\)]/g, '');
  if (!normalized.startsWith('+')) {
    normalized = '+91' + normalized.replace(/^0+/, '');
  }
  try {
    const components = [{
      type: 'body',
      parameters: params.map(p => ({ type: 'text', text: p }))
    }];
    const res = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalized,
        type: 'template',
        template: { name: templateName, language: { code: 'en_US' }, components }
      })
    });
    const data = await res.json();
    if (data.messages && data.messages[0]) {
      console.log(`[WhatsApp] Template ${templateName} sent to ${normalized}, msg ID: ${data.messages[0].id}`);
      return true;
    }
    console.error('[WhatsApp] Template error:', JSON.stringify(data.error || data));
    return false;
  } catch (err) {
    console.error('[WhatsApp] Template error:', err.message);
    return false;
  }
}

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

  console.log(`\n[Feedback Email] To: ${ADMIN_EMAIL} | Subject: ${mailSubject}`);
  if (initSendGrid()) {
    try {
      await sgMail.send({
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
        subject: mailSubject,
        text: mailText
      });
      console.log('Feedback email sent to admin.');
    } catch (err) {
      console.error('Error sending feedback email:', err.message);
    }
  } else {
    console.log('SendGrid not configured. Will notify via WhatsApp instead.');
  }

  // Also send WhatsApp notification to admin (works if WA env vars are set)
  const adminPhone = process.env.ADMIN_PHONE || '7019461619';
  const waMsg = `New Feedback from ${feedback.name}\nRating: ${feedback.rating}/5\n${feedback.email ? `Email: ${feedback.email}\n` : ''}Message: ${feedback.message}`;
  await sendWhatsAppMessage(adminPhone, waMsg);
}

async function sendOrderSMSAndWhatsApp(order, items, user) {
  const itemsList = items.map((it, i) => `${i+1}. ${it.product_name} (x${it.quantity})`).join('\n');
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');
  const totalStr = order.total_amount.toLocaleString('en-IN');
  const deliveryDate = new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();

  console.log(`\n[Order Notification] #${orderId} | To: ${user.email || 'no email'} | ${user.phone || 'no phone'}`);

  // Email via SendGrid
  if (user.email && initSendGrid()) {
    try {
      await sgMail.send({
        to: user.email,
        from: FROM_EMAIL,
        subject: `Order Confirmed! - Prerna Silks (Order #${orderId})`,
        text: `Dear ${user.name},\n\nYour order has been placed successfully!\n\nOrder Details:\nOrder ID: #${orderId}\nPayment Method: ${order.payment_method}\nShipping Address: ${order.shipping_address}\nTotal Amount: Rs. ${totalStr}\nEstimated Delivery: ${deliveryDate}\n\nTrack your order here: ${trackUrl}\n\nThank you for shopping with Prerna Silks!\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email] Confirmation sent to ${user.email}`);
    } catch (err) {
      console.error('Error sending confirmation email:', err.message);
    }
  }

  // WhatsApp via Cloud API
  if (user.phone) {
    const msg = `Dear ${user.name},\n\nYour order has been placed successfully!\n\nOrder ID: #${orderId}\nTotal Amount: Rs. ${totalStr}\nEstimated Delivery: ${deliveryDate}\n\nTrack: ${trackUrl}\n\nThank you for shopping with Prerna Silks!`;
    await sendWhatsAppMessage(user.phone, msg);
  }
}

async function sendDeliveredNotification(order, user) {
  const orderId = String(order.id || order._id).slice(-8).toUpperCase();
  const trackUrl = buildTrackOrderUrl(order.tracking_id || '');

  console.log(`\n[Delivery Notification] #${orderId} | To: ${user.email || 'no email'} | ${user.phone || 'no phone'}`);

  // Email via SendGrid
  if (user.email && initSendGrid()) {
    try {
      await sgMail.send({
        to: user.email,
        from: FROM_EMAIL,
        subject: `Delivered! - Prerna Silks Order #${orderId}`,
        text: `Dear ${user.name},\n\nGood news! Your order has been successfully delivered.\n\nOrder ID: #${orderId}\n\nWe hope you love your new saree! Thank you for choosing Prerna Silks.\n\nBest Regards,\nPrerna Silks Team`
      });
      console.log(`[Email] Delivery notice sent to ${user.email}`);
    } catch (err) {
      console.error('Error sending delivery email:', err.message);
    }
  }

  // WhatsApp via Cloud API
  if (user.phone) {
    const msg = `Dear ${user.name},\n\nGood news! Your order has been successfully delivered.\n\nOrder ID: #${orderId}\n\nWe hope you love your new saree! Thank you for choosing Prerna Silks.`;
    await sendWhatsAppMessage(user.phone, msg);
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp,
  sendDeliveredNotification,
  sendWhatsAppMessage
};
