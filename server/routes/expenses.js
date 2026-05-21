// Expense CRUD Routes (Admin) (MongoDB Mongoose Version)
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ expense_date: -1 });
    res.json({ success: true, expenses });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, category, amount, expense_date, payment_method, notes } = req.body;
    const newExpense = new Expense({
      title,
      category: category || 'Other',
      amount,
      expense_date: expense_date || new Date(),
      payment_method: payment_method || 'Cash',
      notes: notes || ''
    });
    await newExpense.save();
    res.status(201).json({ success: true, message: 'Expense added' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
