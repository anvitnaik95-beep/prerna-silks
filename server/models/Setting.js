const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: String, default: '' }
});

settingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

settingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Setting', settingSchema);
