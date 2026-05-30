const mongoose = require('mongoose');

const sareeDetailsSchema = new mongoose.Schema({
  pattern: { type: String, default: '' },
  purity: { type: String, default: '' },
  color: { type: String, default: '' },
  fabric: { type: String, default: '' },
  length: { type: String, default: '5.5 meters' },
  work: { type: String, default: '' },
  border: { type: String, default: '' }
}, { _id: false });

const blouseDetailsSchema = new mongoose.Schema({
  border: { type: String, default: '' },
  work: { type: String, default: '' },
  fabric: { type: String, default: '' },
  length: { type: String, default: '0.8 meters' },
  pattern: { type: String, default: '' },
  color: { type: String, default: '' }
}, { _id: false });

const productImageSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  is_cover: { type: Boolean, default: false }
});

// Auto-map _id for subdocument product images
productImageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0.00 },
  original_price: { type: Number, default: 0.00 },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  rating: { type: Number, default: 2.5 },
  category: { type: String, required: true },
  color: { type: String, default: 'Multi' },
  occasion: { type: String, default: 'Casual' },
  pattern: { type: String, default: 'Traditional' },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  badge: { type: String, default: '' },
  colorCount: { type: Number, default: 0 },
  moq: { type: Number, default: 5 },
  sareeDetails: { type: sareeDetailsSchema, default: () => ({}) },
  blouseDetails: { type: blouseDetailsSchema, default: () => ({}) },
  images: [productImageSchema],
  created_at: { type: Date, default: Date.now }
});

productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Product', productSchema);
