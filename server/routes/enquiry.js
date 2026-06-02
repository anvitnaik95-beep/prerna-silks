const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getCollection = () => mongoose.connection.collection('enquiries');

async function sendWhatsApp(to, body) {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp] Skipped (not configured): would send to ${to}`);
    return false;
  }
  let normalized = to.replace(/[\s\-\(\)]/g, '');
  if (!normalized.startsWith('+')) normalized = '+91' + normalized.replace(/^0+/, '');
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: normalized, type: 'text', text: { preview_url: false, body } })
    });
    const data = await res.json();
    if (data.messages) return true;
    console.error('[WhatsApp] Send error:', JSON.stringify(data));
    return false;
  } catch (e) {
    console.error('[WhatsApp] Exception:', e.message);
    return false;
  }
}

// POST /api/enquiry/submit - Public: Submit B2B enquiry
router.post('/submit', async (req, res) => {
  try {
    const { name, phone, items, pincode, message } = req.body;
    if (!name || !phone || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Name, phone, and items are required' });
    }
    const enquiry = {
      name,
      phone,
      items,
      pincode: pincode || '',
      message: message || '',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await getCollection().insertOne(enquiry);

    // Auto-notify admin via WhatsApp (non-blocking)
    const itemList = items.map(i => `- ${i.name || i.product_name || 'Product'} x${i.quantity || 1}`).join('\n');
    const adminMsg = `New B2B Enquiry from ${name}\nPhone: ${phone}\n\nItems:\n${itemList}\n${pincode ? `Pincode: ${pincode}\n` : ''}${message ? `Message: ${message}` : ''}\n\nCheck admin panel: ${process.env.SITE_URL || 'https://prerna-silks-copy.onrender.com'}/admin/enquiries`;
    sendWhatsApp(process.env.ADMIN_PHONE || '917019461619', adminMsg).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', enquiryId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/enquiry - Admin: List all enquiries
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const enquiries = await getCollection().find().sort({ created_at: -1 }).toArray();
    // Populate with product names by looking up the products collection
    const productIds = [...new Set(enquiries.flatMap(e => e.items.map(i => i.productId || i.product_id || i)))];
    const products = productIds.length > 0
      ? await mongoose.connection.collection('products').find({ _id: { $in: productIds.map(id => {
          try { return new mongoose.Types.ObjectId(id); } catch { return id; }
        }) } }, { projection: { name: 1 } }).toArray()
      : [];
    const productMap = {};
    for (const p of products) productMap[p._id.toString()] = p.name;
    const enriched = enquiries.map(e => ({
      ...e,
      items: e.items.map(item => {
        const id = item.productId || item.product_id || item;
        return { ...item, product_name: productMap[id.toString ? id.toString() : id] || 'Unknown' };
      })
    }));
    res.json({ success: true, enquiries: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/enquiry/stats - Admin: Enquiry stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const collection = getCollection();
    const total = await collection.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await collection.countDocuments({ created_at: { $gte: todayStart } });
    const pending = await collection.countDocuments({ status: 'pending' });
    res.json({ success: true, stats: { total, today, pending } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/enquiry/:id/approve - Admin: Approve enquiry & create order with payment link
router.post('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const enquiry = await getCollection().findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');
    const trackingId = 'ENQ' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const paymentToken = crypto.randomBytes(16).toString('hex');

    // Look up prices for items that don't have one
    const enrichedItems = await Promise.all(enquiry.items.map(async (item) => {
      let price = Number(item.price) || 0;
      const prodId = item.productId || item.id;
      if (!price && prodId) {
        try {
          const prod = await Product.findById(prodId).lean();
          if (prod) price = prod.price || 0;
        } catch {}
      }
      return { ...item, price, product_name: item.name || item.product_name || 'Unknown' };
    }));
    const totalAmount = enrichedItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);

    // Try to link order to customer account by phone (match last 10 digits)
    let customerUserId = null;
    try {
      const phoneDigits = enquiry.phone.replace(/[^0-9]/g, '').slice(-10);
      console.log(`[Enquiry] Looking up user by phone ending in: ${phoneDigits}`);
      const customerUser = await User.findOne({ phone: { $regex: phoneDigits + '$' } });
      if (customerUser) {
        customerUserId = customerUser._id;
        console.log(`[Enquiry] Matched to user: ${customerUser.name} (${customerUser._id})`);
      } else {
        console.log(`[Enquiry] No user found with phone ending in: ${phoneDigits}`);
      }
    } catch (e) { console.error('[Enquiry] Phone lookup error:', e.message); }

    const order = new Order({
      userId: customerUserId,
      customer_name: enquiry.name,
      customer_phone: enquiry.phone,
      total_amount: totalAmount,
      subtotal: totalAmount,
      delivery_fee: 0,
      payment_method: 'Online Payment',
      payment_status: 'Unpaid',
      status: 'Pending',
      shipping_address: '',
      payment_token: paymentToken,
      tracking_id: trackingId,
      items: enrichedItems.map(item => {
        const pid = item.productId || item.id;
        return {
          productId: pid && mongoose.Types.ObjectId.isValid(pid)
            ? new mongoose.Types.ObjectId(pid) : new mongoose.Types.ObjectId(),
          product_name: item.product_name,
          price: Number(item.price) || 0,
          quantity: item.quantity || 1
        };
      })
    });

    await order.save();
    await getCollection().updateOne(
      { _id: enquiry._id },
      { $set: { status: 'approved', updated_at: new Date() } }
    );

    // Create notification for admin who approved (always visible)
    try {
      const adminNotif = await Notification.create({
        userId: req.user.userId,
        title: 'Enquiry Approved',
        message: `Approved enquiry from ${enquiry.name} for ${enquiry.items.map(i => i.name || i.product_name || 'items').join(', ')}. Payment link sent.`,
        type: 'approval',
        link: `/admin/enquiries`,
        read: false
      });
      console.log(`[Enquiry] Admin notification created: ${adminNotif._id}`);
    } catch (e) { console.error('[Enquiry] Admin notification error:', e.message); }

    // Create notification for customer if user exists with matching phone
    const paymentUrl = `${process.env.SITE_URL || 'https://prerna-silks-copy.onrender.com'}/pay-order/${paymentToken}`;
    try {
      const phoneDigits = enquiry.phone.replace(/[^0-9]/g, '').slice(-10);
      console.log(`[Enquiry] Creating notification - looking up user by phone ending in: ${phoneDigits}`);
      const customerUser = await User.findOne({ phone: { $regex: phoneDigits + '$' } });
      if (customerUser) {
        const notif = await Notification.create({
          userId: customerUser._id,
          title: 'Enquiry Approved',
          message: `Your enquiry for ${enquiry.items.map(i => i.name || i.product_name || 'items').join(', ')} has been approved! Click to complete payment.`,
          type: 'approval',
          link: `/my-payments`,
          read: false
        });
        console.log(`[Enquiry] Customer notification created: ${notif._id} for user ${customerUser._id}`);
      } else {
        console.log(`[Enquiry] No user found with phone ending in: ${phoneDigits} - customer notification not created`);
      }
    } catch (e) { console.error('[Enquiry] Notification creation error:', e.message); }

    // Send WhatsApp to customer about approval
    const whatsappBody = `Hi ${enquiry.name},\n\nYour enquiry with Prerna Silks has been approved!\n\nItems: ${enquiry.items.map(i => i.name).join(', ')}\nTotal: ₹${totalAmount.toLocaleString('en-IN')}\n\nPay here: ${paymentUrl}\n\nThank you for choosing Prerna Silks!`;
    sendWhatsApp(enquiry.phone, whatsappBody).catch(() => {});

    res.json({
      success: true,
      orderId: order.id,
      paymentToken,
      paymentUrl: `/pay-order/${paymentToken}`,
      message: 'Enquiry approved, payment link generated'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/enquiry/:id - Admin: Update enquiry status
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'contacted', 'approved', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const result = await getCollection().updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { status, updated_at: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/enquiry/:id - Admin: Delete enquiry
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await getCollection().deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/enquiry/clear-all - Admin: Delete all enquiries
router.delete('/clear-all', auth, adminOnly, async (req, res) => {
  try {
    const result = await getCollection().deleteMany({});
    res.json({ success: true, message: `${result.deletedCount} enquiries cleared` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
