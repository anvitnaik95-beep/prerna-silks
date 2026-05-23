const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const { sendOrderSMSAndWhatsApp, sendDispatchNotification, sendShippedNotification, sendDeliveredNotification } = require('./services/notificationService');

// 30 seconds per phase transition
const PHASE_DURATION = 30 * 1000;

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

      // Phase 1: Confirmed (after 30 seconds)
      if (orderAge >= PHASE_DURATION && order.status === 'Pending') {
        order.status = 'Confirmed';
        updated = true;
      }

      // Send confirmation backup alert if transitioned or not yet notified
      if (order.status === 'Confirmed' && !order.notified_confirmed) {
        order.notified_confirmed = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        await sendOrderSMSAndWhatsApp(order, order.items, notifUser).catch(e => console.error(e));
      }

      // Phase 2: Dispatched (after 60 seconds)
      if (orderAge >= 2 * PHASE_DURATION && (order.status === 'Confirmed' || order.status === 'Pending')) {
        order.status = 'Dispatched';
        order.dispatched_at = new Date();
        updated = true;
      }

      // Send dispatch alert
      if (order.status === 'Dispatched' && !order.notified_dispatched) {
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

      // Phase 3: Shipped (after 90 seconds)
      if (orderAge >= 3 * PHASE_DURATION && (order.status === 'Dispatched' || order.status === 'Confirmed' || order.status === 'Pending')) {
        order.status = 'Shipped';
        updated = true;
      }

      // Send shipped alert
      if (order.status === 'Shipped' && !order.notified_shipped) {
        order.notified_shipped = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        await sendShippedNotification(order, notifUser).catch(e => console.error(e));
      }

      // Phase 4: Delivered (after 120 seconds)
      if (orderAge >= 4 * PHASE_DURATION && (order.status === 'Shipped' || order.status === 'Dispatched')) {
        order.status = 'Delivered';
        updated = true;
      }

      // Send delivery alert
      if (order.status === 'Delivered' && !order.notified_delivered) {
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

// Start the periodic checking (every 10 seconds)
function startBackgroundJobs() {
  console.log('Started background job for order automated lifecycles (every 10 seconds)');
  setInterval(processOrderLifecycles, 10 * 1000);
  // Run once immediately on startup
  processOrderLifecycles();
}

module.exports = { startBackgroundJobs };
