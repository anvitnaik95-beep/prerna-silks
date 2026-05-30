const mongoose = require('mongoose');
const Order = require('./models/Order');
const Wishlist = require('./models/Wishlist');
const Product = require('./models/Product');
const User = require('./models/User');
const { sendDeliveredNotification, sendWhatsAppMessage } = require('./services/notificationService');

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

async function processWishlistReminders() {
  try {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const wishlistItems = await Wishlist.find({}).populate('productId').populate('userId', 'name email phone');

    const groupedByUser = {};
    for (const item of wishlistItems) {
      if (!item.productId || !item.userId) continue;
      const age = now - new Date(item.created_at).getTime();
      if (age < SEVEN_DAYS_MS) continue;
      if (!groupedByUser[item.userId._id]) {
        groupedByUser[item.userId._id] = { user: item.userId, items: [] };
      }
      groupedByUser[item.userId._id].items.push(item.productId);
    }

    for (const [, { user, items }] of Object.entries(groupedByUser)) {
      if (!user.phone) continue;
      const productNames = items.slice(0, 3).map(p => p.name).join(', ');
      const remainder = items.length > 3 ? ` and ${items.length - 3} more` : '';
      const msg = `Dear ${user.name},\n\nYou have items in your Prerna Silks wishlist that you haven't purchased yet: ${productNames}${remainder}.\n\nDon't miss out! Visit us now to complete your order.`;

      await sendWhatsAppMessage(user.phone, msg);
      console.log(`[Wishlist Reminder] WhatsApp sent to ${user.phone} for ${items.length} items`);
    }
  } catch (error) {
    console.error('Error processing wishlist reminders:', error);
  }
}

function startBackgroundJobs() {
  console.log('Started background job for order automated lifecycles (every 10 seconds)');
  setInterval(processOrderLifecycles, 10 * 1000);
  processOrderLifecycles();

  console.log('Started background job for wishlist reminders (every 6 hours)');
  setInterval(processWishlistReminders, 6 * 60 * 60 * 1000);
  processWishlistReminders();
}

module.exports = { startBackgroundJobs };
