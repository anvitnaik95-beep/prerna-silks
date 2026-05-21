// Feedback Routes (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { auth, adminOnly } = require('../middleware/auth');
const { sendAdminFeedbackEmail } = require('../services/notificationService');

// POST /api/feedback - Public
router.post('/', async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;
    const newFeedback = new Feedback({
      name: name || 'Anonymous',
      email: email || '',
      message,
      rating: rating || 5
    });
    await newFeedback.save();
    
    // Automatically send email notification to admin (non-blocking)
    sendAdminFeedbackEmail(newFeedback).catch(err => console.error('Feedback email error:', err));
    
    res.status(201).json({ 
      success: true, 
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/feedback - Admin only
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ created_at: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/feedback/:id - Admin delete feedback
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
