const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  gst: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Blocked'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

supplierSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

supplierSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Supplier', supplierSchema);
