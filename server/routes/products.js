// Product Routes - CRUD with filters (MongoDB Mongoose version)
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// GET /api/products/clear-base64 - Remove base64 image data from all products (fixes sort memory limit)
router.get('/clear-base64', auth, adminOnly, async (req, res) => {
  try {
    const result = await Product.updateMany(
      { image: /^data:/ },
      { $set: { image: '' } }
    );
    const result2 = await Product.updateMany(
      { 'images.image_url': /^data:/ },
      { $pull: { images: { image_url: /^data:/ } } }
    );
    res.json({ success: true, message: `Cleared ${result.modifiedCount} main images, ${result2.modifiedCount} products with gallery images` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products - Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, color, occasion, pattern, rating, minPrice, maxPrice, search, sort } = req.query;
    const query = {};

    if (category) query.category = new RegExp(category.trim(), 'i');
    if (color) query.color = new RegExp(color.trim(), 'i');
    if (occasion) query.occasion = new RegExp(occasion.trim(), 'i');
    if (pattern) query.pattern = new RegExp(pattern.trim(), 'i');
    if (rating) query.rating = { $gte: Number(rating) };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    let sortOption = { created_at: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'name') sortOption = { name: 1 };

    // Fetch without MongoDB sort (avoids 32MB memory limit with large base64 images stored in products)
    let products = await Product.find(query, { name:1, price:1, original_price:1, image:1, rating:1, category:1, color:1, occasion:1, pattern:1, stock:1, featured:1, sareeDetails:1, blouseDetails:1, images:1, created_at:1 }).lean();

    // Sort in JavaScript
    if (sortOption.price) {
      products.sort((a, b) => sortOption.price === 1 ? a.price - b.price : b.price - a.price);
    } else if (sortOption.rating) {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sortOption.name) {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    // Format images property so the frontend gets up to 2 images for card hover
    const formattedProducts = products.map(p => {
      const imgs = p.images || [];
      const sortedImgs = [...imgs]
        .sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))
        .slice(0, 2);
      p.id = p._id?.toString() || p._id;
      delete p._id;
      delete p.__v;
      p.images = sortedImgs;
      return p;
    });

    res.json({ success: true, count: formattedProducts.length, products: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products - Create product (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, original_price, description, image, rating, category, color, occasion, pattern, stock, featured, sareeDetails, blouseDetails } = req.body;

    const newProduct = new Product({
      name,
      price: price || 0,
      original_price: original_price || 0,
      description: description || '',
      image: image || '',
      rating: rating || 4,
      category,
      color: color || 'Multi',
      occasion: occasion || 'Casual',
      pattern: pattern || 'Traditional',
      stock: stock || 0,
      featured: featured || false,
      sareeDetails: sareeDetails || {},
      blouseDetails: blouseDetails || {}
    });

    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product created', productId: newProduct.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id - Update product (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, original_price, description, image, rating, category, color, occasion, pattern, stock, featured, sareeDetails, blouseDetails } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.name = name;
    product.price = price;
    product.original_price = original_price;
    product.description = description;
    product.image = image;
    product.rating = rating;
    product.category = category;
    product.color = color;
    product.occasion = occasion;
    product.pattern = pattern;
    product.stock = stock;
    product.featured = featured;
    if (sareeDetails) product.sareeDetails = sareeDetails;
    if (blouseDetails) product.blouseDetails = blouseDetails;

    await product.save();
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Setup multer for product image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /api/products/:id/images - Upload an image
router.post('/:id/images', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const isCover = req.body.is_cover === 'true' || req.body.is_cover === true;
    const imageUrl = `/uploads/products/${req.file.filename}`;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Append gallery image
    product.images.push({ image_url: imageUrl, is_cover: isCover });

    // Update main image field
    if (isCover) {
      product.image = imageUrl;
    } else if (!product.image || product.image.trim() === '') {
      product.image = imageUrl;
    }

    await product.save();
    const addedImg = product.images[product.images.length - 1];

    res.status(201).json({ id: addedImg.id, product_id: req.params.id, image_url: imageUrl, is_cover: isCover });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/images/:imageId
router.delete('/images/:imageId', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findOne({ 'images._id': req.params.imageId });
    if (!product) return res.status(404).json({ success: false, message: 'Image not found' });

    const img = product.images.id(req.params.imageId);
    if (img) {
      const filePath = path.join(__dirname, '../public', img.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      product.images.pull(req.params.imageId);

      if (img.is_cover) {
        if (product.images.length > 0) {
          product.images[0].is_cover = true;
          product.image = product.images[0].image_url;
        } else {
          product.image = '';
        }
      }

      await product.save();
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
