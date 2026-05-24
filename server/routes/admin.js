// Admin Routes - Dashboard stats & customers (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const Setting = require('../models/Setting');
const Comment = require('../models/Comment');
const Expense = require('../models/Expense');
const Bill = require('../models/Bill');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const lowStock = await Product.countDocuments({ stock: { $lte: 5 } });

    // Orders Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({ created_at: { $gte: startOfToday } });

    // Monthly Revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const revenueAgg = await Order.aggregate([
      { $match: { created_at: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const monthlyRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Recent Orders
    const orders = await Order.find().populate('userId', 'name').sort({ created_at: -1 }).limit(5);
    const recentOrders = orders.map(o => {
      const json = o.toJSON();
      json.customer_name = o.userId ? o.userId.name : 'Customer';
      return json;
    });

    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }, 'name stock category').limit(10);

    // Categories group by
    const categoriesAgg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const categories = categoriesAgg.map(c => ({ category: c._id, count: c.count }));

    // Sales Data last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const salesAgg = await Order.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total_amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesData = salesAgg.map(s => {
      const mName = monthNames[s._id.month - 1];
      return {
        month: `${mName} ${s._id.year}`,
        orders: s.orders,
        revenue: s.revenue
      };
    });

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingOrders,
        lowStock,
        ordersToday,
        monthlyRevenue,
        recentOrders,
        lowStockProducts,
        categories,
        salesData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/customers', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).sort({ created_at: -1 });
    const customers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at
    }));
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/feedback', auth, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ created_at: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/settings/:key', auth, adminOnly, async (req, res) => {
  try {
    const { value } = req.body;
    await Setting.findOneAndUpdate(
      { setting_key: req.params.key },
      { setting_value: value },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/test-smtp', async (req, res) => {
  const nodemailer = require('nodemailer');
  const Setting = require('../models/Setting');
  
  try {
    const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS'];
    const dbSettings = await Setting.find({ setting_key: { $in: keys } });
    const settingsMap = {};
    for (const s of dbSettings) {
      if (s.setting_value) settingsMap[s.setting_key] = s.setting_value;
    }

    const SMTP_USER = settingsMap.SMTP_USER || process.env.SMTP_USER;
    const SMTP_PASS = settingsMap.SMTP_PASS || process.env.SMTP_PASS;
    const SMTP_HOST = settingsMap.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(settingsMap.SMTP_PORT || process.env.SMTP_PORT || '587');
    const SMTP_SECURE = (settingsMap.SMTP_SECURE || process.env.SMTP_SECURE) === 'true';

    const testConfig = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    };

    const diag = {
      source: settingsMap.SMTP_USER ? 'Database Settings' : 'Environment Variables',
      env_user: SMTP_USER ? SMTP_USER.substring(0, 5) + '...' : 'MISSING',
      env_pass: SMTP_PASS ? 'CONFIGURED' : 'MISSING',
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE
    };

    if (!SMTP_USER || !SMTP_PASS) {
      return res.json({ success: false, message: 'SMTP credentials missing from database settings and env variables!', diag });
    }

    const transporter = nodemailer.createTransport(testConfig);
    await transporter.verify();
    return res.json({ success: true, message: 'SMTP connection verified successfully! Email is ready to send.', diag });
  } catch (err) {
    return res.json({ success: false, message: 'SMTP verify failed!', error: err.message, code: err.code });
  }
});

router.post('/delete-all-data', auth, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const ordersDeleted = await Order.deleteMany({});
    const commentsDeleted = await Comment.deleteMany({});
    const expensesDeleted = await Expense.deleteMany({});
    const feedbackDeleted = await Feedback.deleteMany({});
    const billsDeleted = await Bill.deleteMany({});

    res.json({
      success: true,
      message: 'All data deleted successfully',
      counts: {
        orders: ordersDeleted.deletedCount,
        comments: commentsDeleted.deletedCount,
        expenses: expensesDeleted.deletedCount,
        feedback: feedbackDeleted.deletedCount,
        bills: billsDeleted.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/notification-status - Check notification config
router.get('/notification-status', auth, adminOnly, async (req, res) => {
  const checks = {
    smtp: {
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : null
    },
    twilio: {
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      sid: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 5) + '***' : null,
      smsFrom: process.env.TWILIO_FROM_SMS || null,
      whatsappFrom: process.env.TWILIO_FROM_WHATSAPP || null
    },
    admin: {
      email: process.env.ADMIN_EMAIL || null,
      phone: process.env.ADMIN_PHONE || null
    }
  };
  res.json({ success: true, ...checks });
});

module.exports = router;
