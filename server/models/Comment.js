const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user_name: { type: String, default: 'Customer' },
  comment: { type: String, required: true },
  rating: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now }
});

commentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

commentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    // Maintain key naming for backward compatibility
    ret.user_id = ret.userId;
    ret.product_id = ret.productId;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Comment', commentSchema);
