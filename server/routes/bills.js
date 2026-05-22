const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for image/pdf upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/bills');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `bill_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or PDF files are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Get all bills
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    let query = {};
    if (req.query.search) {
      query = { title: new RegExp(req.query.search.trim(), 'i') };
    }

    const bills = await Bill.find(query).sort({ created_at: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Server error fetching bills' });
  }
});

// Upload a bill (image or PDF) — no conversion needed
router.post('/upload', auth, upload.single('billImage'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    let amount = req.body.amount ? parseFloat(req.body.amount) : null;

    if (!title) {
      return res.status(400).json({ message: 'Bill title is required' });
    }

    // Amount Detection from title (if not manually provided)
    if (!amount) {
      const numbersInTitle = title.match(/\b\d+(?:,\d{3})*(?:\.\d{2})?\b/);
      if (numbersInTitle) {
        amount = parseFloat(numbersInTitle[0].replace(/,/g, ''));
      } else {
        amount = 0; // No amount found - admin should enter manually
      }
    }

    const relativeFilePath = `/uploads/bills/${req.file.filename}`;

    // Save to MongoDB
    const newBill = new Bill({
      title,
      amount,
      file_path: relativeFilePath
    });
    await newBill.save();

    res.status(201).json({
      id: newBill.id,
      title,
      amount,
      file_path: relativeFilePath,
      message: `Bill uploaded successfully! Detected Amount: ₹${amount.toLocaleString('en-IN')}`
    });
  } catch (error) {
    console.error('Error uploading bill:', error);
    res.status(500).json({ message: error.message || 'Server error processing bill' });
  }
});

// Delete a bill
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Delete the file
    const filePath = path.join(__dirname, '../public', bill.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting bill' });
  }
});

module.exports = router;
