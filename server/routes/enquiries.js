const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

async function getOrCreateUser(phone, name, email) {
  let user = await User.findOne({ phone });
  if (user) return user._id;
  user = new User({
    name: name || 'Guest',
    email: email || `guest_${phone}@prerna.in`,
    phone,
    password: crypto.randomBytes(8).toString('hex'),
    role: 'customer'
  });
  await user.save();
  return user._id;
}

// Public: GET /api/enquiries/pay/:token - Get enquiry by payment token
router.get('/pay/:token', async (req, res) => {
  try {
    const enquiry = await Enquiry.findOne({ paymentLinkToken: req.params.token });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Invalid or expired payment link' });
    if (enquiry.paymentStatus === 'paid') {
      return res.json({ success: true, enquiry, alreadyPaid: true });
    }
    res.json({
      success: true,
      razorpayKeyId: RAZORPAY_KEY_ID,
      enquiry: {
        id: enquiry._id.toString(),
        enquiryId: enquiry.enquiryId,
        customerName: enquiry.customerName,
        productName: enquiry.productName,
        quotedAmount: enquiry.quotedAmount,
        paymentStatus: enquiry.paymentStatus,
        razorpayOrderId: enquiry.razorpayOrderId,
        status: enquiry.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public: POST /api/enquiries/pay/:token - Process payment via token
router.post('/pay/:token', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const enquiry = await Enquiry.findOne({ paymentLinkToken: req.params.token });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Invalid payment link' });
    if (enquiry.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }
    let paymentVerified = false;
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature && RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');
      paymentVerified = expectedSig === razorpay_signature;
    } else if (!RAZORPAY_KEY_SECRET) {
      paymentVerified = true;
    }
    if (!paymentVerified) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
    enquiry.razorpayPaymentId = razorpay_payment_id || '';
    enquiry.razorpaySignature = razorpay_signature || '';
    enquiry.paymentStatus = 'paid';
    enquiry.status = 'Paid';
    const userId = enquiry.userId || await getOrCreateUser(enquiry.customerPhone, enquiry.customerName, enquiry.customerEmail);
    const newOrder = new Order({
      userId,
      total_amount: enquiry.quotedAmount,
      subtotal: enquiry.quotedAmount,
      delivery_fee: 0,
      payment_method: 'Razorpay',
      payment_status: 'Paid',
      shipping_address: enquiry.customerAddress || 'Enquiry order',
      payment_ref: razorpay_payment_id || '',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        product_name: enquiry.productName || 'Enquiry Product',
        price: enquiry.quotedAmount,
        quantity: 1
      }],
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_id: 'XB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
      delivery_service: 'XpressBees'
    });
    await newOrder.save();
    enquiry.orderId = newOrder._id;
    await enquiry.save();
    res.json({ success: true, message: 'Payment successful! Order placed.', order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/enquiries - Submit enquiry (public, optional auth)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, productName, productDescription, productImage, message } = req.body;
    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
    const enquiry = new Enquiry({
      customerName, customerPhone, customerEmail, customerAddress,
      productName, productDescription, productImage, message,
      userId: req.user ? req.user.userId : null
    });
    await enquiry.save();
    res.status(201).json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/enquiries - List enquiries (auth)
router.get('/', auth, async (req, res) => {
  try {
    let enquiries;
    if (req.user.role === 'admin') {
      const { status } = req.query;
      const query = status ? { status } : {};
      enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
    } else {
      enquiries = await Enquiry.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    }
    res.json({ success: true, enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/enquiries/:id - Get single enquiry (auth)
router.get('/:id', auth, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    if (req.user.role !== 'admin' && enquiry.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/enquiries/:id - Admin update enquiry
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status, quotedAmount, adminNotes } = req.body;
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    if (status) enquiry.status = status;
    if (quotedAmount !== undefined) enquiry.quotedAmount = quotedAmount;
    if (adminNotes !== undefined) enquiry.adminNotes = adminNotes;
    await enquiry.save();
    res.json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/enquiries/:id/generate-payment - Admin generates payment link
router.post('/:id/generate-payment', auth, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    if (!enquiry.quotedAmount || enquiry.quotedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Set a quoted amount first' });
    }
    const token = crypto.randomBytes(16).toString('hex');
    enquiry.paymentLinkToken = token;
    if (RAZORPAY_KEY_SECRET && RAZORPAY_KEY_SECRET !== '') {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const order = await razorpay.orders.create({
        amount: Math.round(enquiry.quotedAmount * 100),
        currency: 'INR',
        receipt: `enq_${enquiry.enquiryId}`,
        notes: { enquiryId: enquiry.enquiryId, type: 'enquiry_payment' }
      });
      enquiry.razorpayOrderId = order.id;
    }
    enquiry.status = 'Quoted';
    await enquiry.save();
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `${req.protocol}://${req.get('host')}`
      : 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay-enquiry/${token}`;
    res.json({ success: true, paymentUrl, token, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
