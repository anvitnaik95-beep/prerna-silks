const mongoose = require('mongoose');
const Order = require('./models/Order');
const { sendDeliveredNotification } = require('./services/notificationService');

async function processOrderLifecycles() {
  try {
    const activeOrders = await Order.find({
      status: { $nin: ['Cancelled', 'Delivered'] }
    }).populate('userId', 'name email phone');

    const now = Date.now();
    const PHASE_DURATION = 30 * 1000;

    for (const order of activeOrders) {
      const orderAge = now - new Date(order.created_at).getTime();
      let updated = false;

      if (orderAge >= 1 * PHASE_DURATION && order.status === 'Pending') {
        order.status = 'Confirmed';
        updated = true;
      }

      if (orderAge >= 2 * PHASE_DURATION && (order.status === 'Confirmed' || order.status === 'Pending')) {
        order.status = 'Dispatched';
        order.dispatched_at = new Date();
        if (!order.tracking_id) {
          order.tracking_id = 'XB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase();
        }
        updated = true;
      }

      if (orderAge >= 3 * PHASE_DURATION && (order.status === 'Dispatched' || order.status === 'Confirmed' || order.status === 'Pending')) {
        order.status = 'Shipped';
        updated = true;
      }

      if (orderAge >= 4 * PHASE_DURATION && (order.status === 'Shipped' || order.status === 'Dispatched')) {
        order.status = 'Delivered';
        updated = true;
      }

      // Only send notification on Delivered
      if (order.status === 'Delivered' && !order.notified_delivered) {
        order.notified_delivered = true;
        updated = true;
        const user = order.userId;
        const notifUser = { name: user?.name || 'Customer', email: user?.email || '', phone: user?.phone || '' };
        await sendDeliveredNotification(order, notifUser).catch(e => console.error('Delivered notification error:', e));
      }

      if (updated) {
        await order.save();
        console.log(`[Lifecycle] Order ${order._id} auto-updated. Status: ${order.status}`);
      }
    }
  } catch (error) {
    console.error('Error processing background order lifecycle:', error);
  }
}

function startBackgroundJobs() {
  console.log('Started background job for order automated lifecycles (every 10 seconds)');
  setInterval(processOrderLifecycles, 10 * 1000);
  processOrderLifecycles();
}

module.exports = { startBackgroundJobs };
