const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, enum: ['approval', 'order', 'general'], default: 'general' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);