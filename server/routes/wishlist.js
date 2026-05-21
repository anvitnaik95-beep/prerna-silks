// Wishlist Routes (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// GET /api/wishlist
router.get('/', auth, async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.user.userId }).populate('productId');
    
    const formattedItems = items
      .filter(item => item.productId) // ensure product exists
      .map(item => {
        const prodJSON = item.productId.toJSON();
        return {
          wishlist_id: item.id,
          ...prodJSON
        };
      });

    res.json({ success: true, items: formattedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/wishlist/add - Toggle wishlist
router.post('/add', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const existing = await Wishlist.findOne({ userId: req.user.userId, productId });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing.id);
      res.json({ success: true, message: 'Removed from wishlist', added: false });
    } else {
      const newItem = new Wishlist({ userId: req.user.userId, productId });
      await newItem.save();
      res.json({ success: true, message: 'Added to wishlist', added: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/wishlist/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true, message: 'Removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
