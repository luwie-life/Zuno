import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, required: true, unique: true },
  name: { type: String, maxlength: 160, default: '' },
  purpose: { type: String, enum: ['logo','hero','background','banner','gallery','portfolio','service','product','editor'], default: 'editor' },
  status: { type: String, enum: ['uploading','ready','failed','archived'], default: 'uploading', index: true },
  url: String,
  format: String,
  bytes: Number,
  width: Number,
  height: Number,
  failureCode: String,
}, { timestamps: true });
schema.index({ business: 1, status: 1, createdAt: -1 });
export default mongoose.models.MediaAsset || mongoose.model('MediaAsset', schema);
