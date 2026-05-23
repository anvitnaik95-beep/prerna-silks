// Comment / Reviews Routes (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/comments/check/:productId - Check if current user already reviewed this product
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const existing = await Comment.findOne({
      userId: req.user.userId,
      productId: req.params.productId
    });
    res.json({ success: true, hasReviewed: !!existing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/comments - Add a review and update product average rating
router.post('/', auth, async (req, res) => {
  try {
    const { productId, comment, rating } = req.body;
    if (!productId || !comment) return res.status(400).json({ success: false, message: 'productId and comment are required' });

    // Check if user already reviewed this product
    const existing = await Comment.findOne({ userId: req.user.userId, productId });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this product. Only one review per product is allowed.' 
      });
    }

    const user = await User.findById(req.user.userId);
    const userName = user ? user.name : 'Customer';
    
    // Create new comment
    const newComment = new Comment({
      userId: req.user.userId,
      productId,
      user_name: userName,
      comment,
      rating: rating || 5
    });

    await newComment.save();
    
    // Recalculate average rating of product
    const stats = await Comment.aggregate([
      { $match: { productId: newComment.productId } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' } } }
    ]);

    const avgRating = stats.length > 0 ? stats[0].avgRating : 2.5;

    // Update product rating
    await Product.findByIdAndUpdate(productId, { rating: Number(avgRating.toFixed(1)) });

    res.status(201).json({ success: true, message: 'Review added and rating updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/comments/admin/all - Get all reviews for admin portal
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const comments = await Comment.find().populate('productId').sort({ created_at: -1 });

    const formattedComments = comments.map(c => {
      const json = c.toJSON();
      json.product_name = c.productId ? c.productId.name : 'Unknown Product';
      json.product_image = c.productId ? c.productId.image : '';
      return json;
    });

    res.json({ success: true, comments: formattedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/comments/:productId - Get reviews for a specific product
router.get('/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ productId: req.params.productId }).sort({ created_at: -1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/comments/:id - Delete a review (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
