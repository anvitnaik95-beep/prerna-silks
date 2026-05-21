// Supplier CRUD Routes (Admin) (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ created_at: -1 });
    res.json({ success: true, suppliers });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, contact_person, city, phone, email, gst, status } = req.body;
    const newSupplier = new Supplier({
      name,
      contact_person: contact_person || '',
      city,
      phone,
      email: email || '',
      gst: gst || '',
      status: status || 'Active'
    });
    await newSupplier.save();
    res.status(201).json({ success: true, message: 'Supplier added', id: newSupplier.id });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, contact_person, city, phone, email, gst, status } = req.body;
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, {
      name,
      contact_person,
      city,
      phone,
      email,
      gst,
      status
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
