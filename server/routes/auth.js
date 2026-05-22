// Auth Routes - Register & Login with JWT (MongoDB Version)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validation helpers
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // phone is optional
  const cleaned = phone.replace(/[^0-9]/g, '');
  // Accept 10-digit Indian phone numbers
  return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
}

function validateName(name) {
  if (!name || name.trim().length < 2) return false;
  if (name.trim().length > 50) return false;
  // Allow letters, spaces, and basic punctuation
  return /^[a-zA-Z\s.'-]+$/.test(name.trim());
}

function validatePassword(password) {
  if (!password || password.length < 6) return false;
  if (password.length > 128) return false;
  return true;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Validate name
    if (!validateName(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid name (2-50 characters, letters only)' 
      });
    }

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be between 6 and 128 characters' 
      });
    }

    // Validate phone (optional but must be valid if provided)
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 10-digit Indian phone number' 
      });
    }
    
    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'customer',
      phone: phone ? phone.replace(/[^0-9]/g, '').slice(-10) : ''
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser.id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'customer' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
