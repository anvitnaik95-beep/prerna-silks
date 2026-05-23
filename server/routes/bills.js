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
  // Normalize text
  const normalized = text
    .replace(/[,\s]+/g, m => m.includes(',') ? ',' : ' ')
    .replace(/\n/g, ' ');

  // Pattern 1: Look for "Total", "Grand Total", "Net Amount", "Amount Due", "Payable" keywords
  const totalPatterns = [
    /(?:grand\s*total|net\s*(?:amount|total|payable)|amount\s*(?:due|payable)|total\s*(?:amount|due|payable|bill)|payable|balance\s*due)[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:grand\s*total|net\s*total|total\s*amount|amount\s*due)/gi,
    /(?:total)[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:total)/gi,
  ];

  // Try each pattern in priority order
  for (const pattern of totalPatterns) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.length > 0) {
      // Get the last match (usually the grand total comes after subtotals)
      const lastMatch = matches[matches.length - 1];
      const val = parseFloat(lastMatch[1].replace(/,/g, ''));
      if (val > 0 && val < 10000000) { // sanity: up to 1 crore
        return val;
      }
    }
  }

  // Pattern 2: Find all currency amounts in text
  const currencyPattern = /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const amounts = [];
  let match;
  while ((match = currencyPattern.exec(normalized)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (val > 0 && val < 10000000) {
      amounts.push(val);
    }
  }

  // Pattern 3: Look for standalone numbers that could be amounts
  const standaloneNumbers = /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/g;
  while ((match = standaloneNumbers.exec(normalized)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (val >= 50 && val < 10000000) { // at least ₹50 to be a valid bill amount
      amounts.push(val);
    }
  }

  if (amounts.length === 0) return null;

  // Return the largest amount (most likely the total)
  return Math.max(...amounts);
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
