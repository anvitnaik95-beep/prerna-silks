// Razorpay Payment & Orders Routes (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { sendOrderSMSAndWhatsApp, sendDispatchNotification } = require('../services/notificationService');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '7019461619';

// Helper: Format date for display
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Helper: Generate tracking ID for postal service
function generateTrackingId() {
  const prefix = 'PS'; // Postal Service
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Helper: Estimate delivery based on basic address distance heuristic
function estimateDelivery(shippingAddress) {
  const address = (shippingAddress || '').toLowerCase();
  let days = 7; // default

  // Local (Hubli/Dharwad area)
  if (address.includes('hubli') || address.includes('dharwad') || address.includes('580')) {
    days = 3;
  }
  // Within Karnataka
  else if (address.includes('karnataka') || address.includes('bengaluru') || address.includes('bangalore') || address.includes('mysore') || address.includes('mangalore') || address.includes('belgaum') || address.includes('belagavi')) {
    days = 5;
  }
  // South India
  else if (address.includes('tamil nadu') || address.includes('kerala') || address.includes('andhra') || address.includes('telangana') || address.includes('goa') || address.includes('chennai') || address.includes('hyderabad')) {
    days = 7;
  }
  // North/West/East India
  else if (address.includes('mumbai') || address.includes('delhi') || address.includes('kolkata') || address.includes('maharashtra') || address.includes('rajasthan') || address.includes('punjab') || address.includes('gujarat')) {
    days = 9;
  }
  // Remote areas
  else {
    days = 10;
  }

  const estimatedDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return { days, estimatedDate };
}

// POST /api/orders/razorpay/create - Create Razorpay order
router.post('/razorpay/create', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });

    if (RAZORPAY_KEY_SECRET && RAZORPAY_KEY_SECRET !== '') {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { merchant_upi: '7019461619@ptyes', merchant: 'Prerna Silks' }
      });
      return res.json({ key: RAZORPAY_KEY_ID, amount: order.amount, orderId: order.id });
    }

    return res.json({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      orderId: `order_demo_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/razorpay/verify - Verify Razorpay payment signature
router.post('/razorpay/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, verified: false, message: 'Missing payment details' });
    }

    // Verify signature using HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const verified = expectedSignature === razorpay_signature;

    return res.json({ success: true, verified });
  } catch (error) {
    res.status(500).json({ success: false, verified: false, message: error.message });
  }
});

// POST /api/orders - Place order
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress, customerPhone, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    // Determine payment_status based on method
    let paymentStatus = 'Unpaid';
    
    if (paymentMethod === 'Razorpay' && razorpay_payment_id) {
      // Verify Razorpay signature
      if (razorpay_order_id && razorpay_signature && RAZORPAY_KEY_SECRET) {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');
        if (expectedSig === razorpay_signature) {
          paymentStatus = 'Paid';
        } else {
          return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
        }
      } else {
        paymentStatus = 'Paid'; // Demo mode or missing secret
      }
    } else if (paymentMethod === 'Direct UPI') {
      paymentStatus = 'Paid'; // Legacy fallback
    }
    // COD stays 'Unpaid'
    
    // Map items array to match order items schema
    const formattedItems = items.map(item => ({
      productId: item.productId,
      product_name: item.name || '',
      price: item.price || 0,
      quantity: item.quantity || 1
    }));

    // Generate tracking ID and estimate delivery via postal service
    const trackingId = generateTrackingId();
    const { estimatedDate } = estimateDelivery(shippingAddress);

    const newOrder = new Order({
      userId: req.user.userId,
      total_amount: totalAmount,
      payment_method: paymentMethod || 'COD',
      payment_status: paymentStatus,
      shipping_address: shippingAddress || '',
      payment_ref: razorpay_payment_id || '',
      estimated_delivery: estimatedDate,
      tracking_id: trackingId,
      delivery_service: 'India Post',
      items: formattedItems
    });

    await newOrder.save();

    // Clear cart for the user
    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [] });

    // Fetch and update user details for notifications/profile info
    const user = await User.findById(req.user.userId);
    if (user) {
      let updated = false;
      if (!user.phone && customerPhone) { user.phone = customerPhone; updated = true; }
      if (!user.address && shippingAddress) { user.address = shippingAddress; updated = true; }
      if (updated) await user.save();
    }

    // Automatically send order confirmation alerts to customer AND admin (non-blocking)
    const notificationUser = {
      name: user?.name || 'Customer',
      email: user?.email || '',
      phone: customerPhone || user?.phone || ''
    };
    sendOrderSMSAndWhatsApp(newOrder, formattedItems, notificationUser).catch(err => {
      console.error('Error in automatic notifications:', err.message);
    });

    res.status(201).json({ 
      success: true, 
      message: paymentStatus === 'Paid' ? 'Payment received! Order placed successfully!' : 'Order placed! Pay on delivery.',
      orderId: newOrder.id,
      trackingId: trackingId,
      paymentStatus,
      estimatedDelivery: formatDate(estimatedDate),
      orderSummary: {
        id: newOrder.id,
        total: totalAmount,
        method: paymentMethod,
        status: paymentStatus,
        delivery: formatDate(estimatedDate),
        address: shippingAddress,
        trackingId: trackingId,
        deliveryService: 'India Post',
        items: formattedItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/track/:trackingId - Public track order by tracking ID
router.get('/track/:trackingId', async (req, res) => {
  try {
    const order = await Order.findOne({ tracking_id: req.params.trackingId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found with this tracking ID' });
    }
    
    res.json({
      success: true,
      order: {
        orderId: order.id.slice(-8).toUpperCase(),
        status: order.status,
        trackingId: order.tracking_id,
        deliveryService: order.delivery_service || 'India Post',
        estimatedDelivery: formatDate(order.estimated_delivery),
        shippingAddress: order.shipping_address,
        dispatchedAt: order.dispatched_at ? formatDate(order.dispatched_at) : null,
        createdAt: formatDate(order.created_at),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        items: order.items
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      const { status } = req.query;
      const query = status ? { status } : {};
      
      orders = await Order.find(query).populate('userId', 'name email phone').sort({ created_at: -1 });
      
      // Map to include customer details expected by admin page
      const formattedOrders = orders.map(o => {
        const json = o.toJSON();
        json.customer_name = o.userId ? o.userId.name : 'Unknown';
        json.customer_email = o.userId ? o.userId.email : '';
        json.customer_phone = o.userId ? o.userId.phone : '';
        return json;
      });
      return res.json({ success: true, orders: formattedOrders });
    } else {
      orders = await Order.find({ userId: req.user.userId }).sort({ created_at: -1 });
      return res.json({ success: true, orders });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id - Update order status (admin) with dispatch notifications
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const oldStatus = order.status;
    order.status = req.body.status;
    if (req.body.payment_status) order.payment_status = req.body.payment_status;
    if (req.body.tracking_id) order.tracking_id = req.body.tracking_id;
    
    // When admin dispatches the order
    if (req.body.status === 'Dispatched' && oldStatus !== 'Dispatched') {
      order.dispatched_at = new Date();
      if (!order.tracking_id) {
        order.tracking_id = generateTrackingId();
      }
      
      // Recalculate estimated delivery from dispatch date
      const { estimatedDate } = estimateDelivery(order.shipping_address);
      order.estimated_delivery = estimatedDate;
    }
    
    await order.save();
    
    // Send dispatch notification to customer if status changed to Dispatched
    if (req.body.status === 'Dispatched' && oldStatus !== 'Dispatched') {
      const user = await User.findById(order.userId);
      if (user) {
        const notifUser = {
          name: user.name || 'Customer',
          email: user.email || '',
          phone: user.phone || ''
        };
        sendDispatchNotification(order, notifUser).catch(err => {
          console.error('Error sending dispatch notification:', err.message);
        });
      }
    }
    
    res.json({ success: true, message: 'Order updated', trackingId: order.tracking_id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
