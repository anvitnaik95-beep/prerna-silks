const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  title: { type: String, required: true },
  file_path: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  created_at: { type: Date, default: Date.now }
});

billSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

billSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Bill', billSchema);
