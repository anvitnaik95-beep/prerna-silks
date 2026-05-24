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
  if (!initSendGrid()) {
    console.log('SendGrid not configured. Email output logged above.');
    return;
  }
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

  // WhatsApp — placeholder for Cloud API integration
  if (user.phone) {
    console.log(`[WhatsApp] Would send to ${user.phone} once WhatsApp Cloud API is configured.`);
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

  // WhatsApp — placeholder for Cloud API integration
  if (user.phone) {
    console.log(`[WhatsApp] Would notify ${user.phone} once WhatsApp Cloud API is configured.`);
  }
}

module.exports = {
  sendAdminFeedbackEmail,
  sendOrderSMSAndWhatsApp,
  sendDeliveredNotification
};
