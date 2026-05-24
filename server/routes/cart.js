// Cart Routes (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// GET /api/cart - Get user's cart with product details flattened
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: true, items: [] });
    }

    // Format so that product details are flattened into the cart item, and cart_item_id is returned
    const formattedItems = cart.items
      .filter(item => item.productId) // ensure product still exists
      .map(item => {
        const prod = item.productId;
        const prodJSON = prod.toJSON ? prod.toJSON() : prod;
        const prodId = prod._id ? prod._id.toString() : prod.toString();
        return {
          cart_item_id: item.id,
          quantity: item.quantity,
          id: prodId,
          _id: prodId,
          productId: prodId,
          product_id: prodId,
          ...prodJSON
        };
      });

    console.log(`[Cart] User ${req.user.userId}: ${formattedItems.length} items fetched`);
    res.json({ success: true, items: formattedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cart/add
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());
    const qty = Number(quantity) || 1;

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty });
    }

    await cart.save();
    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/cart/update
router.put('/update', auth, async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    if (!cartItemId) return res.status(400).json({ success: false, message: 'cartItemId is required' });

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(cartItemId);
    if (item) {
      item.quantity = Number(quantity) || 1;
      await cart.save();
    }

    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart/remove/:cartItemId
router.delete('/remove/:cartItemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items.pull(req.params.cartItemId);
    await cart.save();

    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
