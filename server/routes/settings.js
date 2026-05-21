// Settings routes (Public & Admin) (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// GET /api/settings/:key
router.get('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ setting_key: req.params.key });
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    res.json({ success: true, value: setting.setting_value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
