const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Rent', 'Salary', 'Electricity', 'Transport', 'Marketing', 'Packaging', 'Maintenance', 'Other'], default: 'Other' },
  amount: { type: Number, required: true },
  expense_date: { type: Date, default: Date.now },
  payment_method: { type: String, default: 'Cash' },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

expenseSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

expenseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
