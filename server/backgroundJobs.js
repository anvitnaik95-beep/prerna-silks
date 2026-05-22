const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const { sendOrderSMSAndWhatsApp, sendDispatchNotification, sendDeliveredNotification } = require('./services/notificationService');

// 1 minute in milliseconds for rapid testing/observation
const ONE_MINUTE = 60 * 1000;

async function processOrderLifecycles() {
  try {
    // Find active orders that are not fully delivered or cancelled
    const activeOrders = await Order.find({ 
      status: { $nin: ['Cancelled', 'Delivered'] } 
    }).populate('userId', 'name email phone');

    const now = Date.now();

    for (const order of activeOrders) {
      const orderAge = now - new Date(order.created_at).getTime();
      let updated = false;

      // 1. CONFIRMED (Immediately on creation)
      if (order.status === 'Pending') {
        order.status = 'Confirmed';
        updated = true;
      }
      
      if (!order.notified_confirmed) {
        order.notified_confirmed = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        // Send confirmed notification
        await sendOrderSMSAndWhatsApp(order, order.items, notifUser).catch(e => console.error(e));
      }

      // 2. DISPATCHED (After 1 minute)
      if (orderAge >= ONE_MINUTE && (order.status === 'Confirmed' || order.status === 'Pending')) {
        order.status = 'Dispatched';
        order.dispatched_at = new Date();
        updated = true;
      }

      if (order.status === 'Dispatched' && !order.notified_dispatched && orderAge >= ONE_MINUTE) {
        order.notified_dispatched = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        // Generate tracking ID if empty
        if (!order.tracking_id) {
          order.tracking_id = 'XB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase();
        }
        await sendDispatchNotification(order, notifUser).catch(e => console.error(e));
      }

      // 3. DELIVERED (After 2 minutes)
      if (orderAge >= 2 * ONE_MINUTE && order.status === 'Dispatched') {
        order.status = 'Delivered';
        updated = true;
      }

      if (order.status === 'Delivered' && !order.notified_delivered && orderAge >= 2 * ONE_MINUTE) {
        order.notified_delivered = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        await sendDeliveredNotification(order, notifUser).catch(e => console.error(e));
      }

      if (updated) {
        await order.save();
        console.log(`[Lifecycle] Order ${order._id} automatically updated. Status: ${order.status}`);
      }
    }
  } catch (error) {
    console.error('Error processing background order lifecycle:', error);
  }
}

// Start the periodic checking
function startBackgroundJobs() {
  console.log('Started background job for order automated lifecycles (every 1 minute)');
  setInterval(processOrderLifecycles, 60 * 1000);
  // Run once immediately on startup
  processOrderLifecycles();
}

module.exports = { startBackgroundJobs };
