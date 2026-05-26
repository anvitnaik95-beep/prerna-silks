const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  enquiryId: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  productName: { type: String, default: '' },
  productDescription: { type: String, default: '' },
  productImage: { type: String, default: '' },
  message: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  quotedAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Quoted', 'Accepted', 'Paid', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentLinkToken: { type: String, default: '' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

enquirySchema.pre('save', function(next) {
  if (!this.enquiryId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.enquiryId = `ENQ-${ts}${rnd}`;
  }
  this.updatedAt = new Date();
  next();
});

enquirySchema.virtual('id').get(function() { return this._id.toHexString(); });

enquirySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
