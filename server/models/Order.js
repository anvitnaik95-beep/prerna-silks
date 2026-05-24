const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, default: '' },
  price: { type: Number, default: 0.00 },
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total_amount: { type: Number, default: 0.00 },
  subtotal: { type: Number, default: 0.00 },
  delivery_fee: { type: Number, default: 0 },
  payment_method: { type: String, default: 'COD' },
  payment_status: { type: String, enum: ['Unpaid', 'Paid', 'Failed', 'Refunded'], default: 'Unpaid' },
  shipping_address: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  payment_ref: { type: String, default: '' },
  estimated_delivery: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  tracking_id: { type: String, default: '' },
  delivery_service: { type: String, default: 'XpressBees' },
  dispatched_at: { type: Date, default: null },
  items: [orderItemSchema],
  created_at: { type: Date, default: Date.now },
  notified_confirmed: { type: Boolean, default: false },
  notified_dispatched: { type: Boolean, default: false },
  notified_shipped: { type: Boolean, default: false },
  notified_delivered: { type: Boolean, default: false }
});

orderSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    // Also map total_amount to totalAmount if required by the client
    ret.totalAmount = ret.total_amount;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Order', orderSchema);
