// Admin Routes - Dashboard stats & customers (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const Setting = require('../models/Setting');
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

module.exports = router;
