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

/**
 * OCR-based amount extraction from bill images using Tesseract.js
 * Preprocesses image with sharp for better OCR accuracy
 */
async function extractAmountFromImage(filePath) {
  try {
    const Tesseract = require('tesseract.js');
    let imagePath = filePath;

    // Preprocess image with sharp for better OCR results
    if (!filePath.toLowerCase().endsWith('.pdf')) {
      try {
        const sharp = require('sharp');
        const processedPath = filePath.replace(/(\.\w+)$/, '_processed.png');
        await sharp(filePath)
          .greyscale()
          .normalize()
          .sharpen()
          .resize({ width: 2000, withoutEnlargement: true })
          .toFile(processedPath);
        imagePath = processedPath;
      } catch (sharpErr) {
        console.log('Sharp preprocessing skipped:', sharpErr.message);
        // Fall back to original image
      }
    }

    // Run Tesseract OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: () => {} // silence logs
    });

    // Cleanup processed image
    if (imagePath !== filePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    console.log('OCR extracted text:', text.substring(0, 500));

    if (!text || text.trim().length === 0) {
      return { amount: null, ocrText: '', confidence: 'no_text' };
    }

    // Extract amounts using multiple patterns (Indian currency formats)
    const amount = findBestAmount(text);
    return { amount, ocrText: text.substring(0, 1000), confidence: amount ? 'ocr_detected' : 'no_amount_found' };
  } catch (err) {
    console.error('OCR extraction error:', err.message);
    return { amount: null, ocrText: '', confidence: 'ocr_failed' };
  }
}

/**
 * Intelligent amount extraction from OCR text
 * Looks for total/grand total first, then falls back to largest amount
 */
function findBestAmount(text) {
  if (!text) return null;
  
  // Normalize lines and text
  const lines = text.split('\n');
  const candidates = [];

  // Helper to check if a number is a date, phone number, pincode, or outside sane range
  const isInvalidAmount = (val, originalStr) => {
    const cleanStr = originalStr.replace(/[^0-9]/g, '');
    // Exclude phone numbers (10 digits)
    if (cleanStr.length === 10) return true;
    // Exclude Indian zipcodes/pincodes (6 digits, e.g. starting with 5, 6, or 1-9)
    if (cleanStr.length === 6 && (cleanStr.startsWith('5') || cleanStr.startsWith('6') || cleanStr.startsWith('1'))) return true;
    // Exclude years (2000 to 2030)
    if (val >= 2000 && val <= 2030) return true;
    // Exclude quantities or tiny/insanely huge numbers
    if (val < 50 || val > 1000000) return true;
    return false;
  };

  // 1. Look line-by-line for lines containing ledger keywords
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('total') || 
      lowerLine.includes('payable') || 
      lowerLine.includes('net') || 
      lowerLine.includes('amount') || 
      lowerLine.includes('grand') || 
      lowerLine.includes('sum') ||
      lowerLine.includes('rs') ||
      lowerLine.includes('inr') ||
      lowerLine.includes('₹')
    ) {
      // Find all numbers in this line
      const numbersInLine = line.match(/[\d,]+\.\d{2}\b|[\d,]+\b/g);
      if (numbersInLine) {
        for (const numStr of numbersInLine) {
          const val = parseFloat(numStr.replace(/,/g, ''));
          if (!isNaN(val) && !isInvalidAmount(val, numStr)) {
            // Highly prioritize "grand total", "net payable" over generic "amount"
            let weight = 1;
            if (lowerLine.includes('grand') || lowerLine.includes('payable') || lowerLine.includes('net')) {
              weight = 10;
            } else if (lowerLine.includes('total')) {
              weight = 5;
            }
            candidates.push({ val, weight });
          }
        }
      }
    }
  }

  if (candidates.length > 0) {
    // Sort by weight descending, then by value descending (usually grand total is the largest weighted candidate)
    candidates.sort((a, b) => b.weight - a.weight || b.val - a.val);
    return candidates[0].val;
  }

  // 2. Fallback: Parse all numbers in the entire document, filter out invalid ones, and return the largest sensible number
  const allNumbers = text.match(/[\d,]+\.\d{2}\b|[\d,]+\b/g);
  const fallbackAmounts = [];
  if (allNumbers) {
    for (const numStr of allNumbers) {
      const val = parseFloat(numStr.replace(/,/g, ''));
      if (!isNaN(val) && !isInvalidAmount(val, numStr)) {
        fallbackAmounts.push(val);
      }
    }
  }

  if (fallbackAmounts.length > 0) {
    return Math.max(...fallbackAmounts);
  }

  return null;
}

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

// Upload a bill (image or PDF) with OCR amount detection
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

    let ocrInfo = '';

    // OCR-based Amount Detection from uploaded image (if amount not manually provided)
    if (!amount && req.file.mimetype.startsWith('image/')) {
      const absoluteFilePath = path.join(__dirname, '../public/uploads/bills', req.file.filename);
      const ocrResult = await extractAmountFromImage(absoluteFilePath);
      
      if (ocrResult.amount) {
        amount = ocrResult.amount;
        ocrInfo = `OCR scanned and detected amount: ₹${amount.toLocaleString('en-IN')}`;
      } else {
        ocrInfo = `OCR scan completed but could not detect a clear amount. Please enter manually.`;
      }
      
      // Log OCR text for debugging
      if (ocrResult.ocrText) {
        console.log(`Bill OCR [${title}]: confidence=${ocrResult.confidence}, amount=${amount}, text_preview="${ocrResult.ocrText.substring(0, 200)}"`);
      }
    }

    const relativeFilePath = `/uploads/bills/${req.file.filename}`;

    // Save to MongoDB
    const newBill = new Bill({
      title,
      amount: amount || 0,
      file_path: relativeFilePath
    });
    await newBill.save();

    const message = amount 
      ? `Bill uploaded successfully! ${ocrInfo || `Amount: ₹${amount.toLocaleString('en-IN')}`}`
      : `Bill uploaded. ${ocrInfo || 'No amount detected — please update manually.'}`;

    res.status(201).json({
      id: newBill.id,
      title,
      amount: amount || 0,
      file_path: relativeFilePath,
      message,
      ocr_info: ocrInfo
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
