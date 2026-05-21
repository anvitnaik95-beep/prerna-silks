const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  email: { type: String, default: '' },
  message: { type: String, required: true },
  rating: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now }
});

feedbackSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

feedbackSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
