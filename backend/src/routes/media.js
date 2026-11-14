import express, { Router } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import MediaAsset from '../models/MediaAsset.js';
import { requireAuth, requireBusiness } from '../middleware/auth.js';
import { asyncH, HttpError, notFound } from '../lib/errors.js';
import { parse, z, objectId, pageParams } from '../lib/validate.js';
import { imageUploadConfig, validateImageUpload, cloudinaryImageParameters, signCloudinaryImage, verifiedCloudinaryImage } from '../lib/cloudinaryImages.js';

const r = Router();
r.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));
r.use(requireAuth, requireBusiness('business.update'));
const uploads = rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many image uploads. Please try again later.' } } });
const publicAsset = asset => ({ id: String(asset._id), publicId: asset.publicId, url: asset.url, name: asset.name, purpose: asset.purpose, format: asset.format, bytes: asset.bytes, width: asset.width, height: asset.height });

r.post('/images', uploads, express.json({ limit: '8mb' }), asyncH(async (req, res) => {
  const body = parse(z.object({ mimeType: z.string().max(100), data: z.string(), name: z.string().trim().max(160).optional(), purpose: z.enum(['logo','hero','background','banner','gallery','portfolio','service','product','editor']).default('editor') }), req.body);
  const { buffer, format } = validateImageUpload(body.mimeType, body.data);
  const config = imageUploadConfig();
  const publicId = `zuno/${req.business._id}/${randomUUID()}`;
  const asset = await MediaAsset.create({ business: req.business._id, uploadedBy: req.user._id, publicId, name: body.name || '', purpose: body.purpose });
  try {
    const parameters = cloudinaryImageParameters(publicId);
    const form = new FormData();
    for (const [key, value] of Object.entries(parameters)) form.append(key, value);
    form.append('api_key', config.key);
    form.append('signature', signCloudinaryImage(parameters, config.secret));
    form.append('file', new Blob([buffer], { type: body.mimeType }), `upload.${format}`);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) throw new HttpError(502, 'The image upload failed. Please check the upload configuration or try again.', 'MEDIA_PROVIDER_ERROR');
    const verified = verifiedCloudinaryImage(result, publicId, config.cloud);
    Object.assign(asset, verified, { status: 'ready' });
    await asset.save();
    res.status(201).json({ asset: publicAsset(asset) });
  } catch (error) {
    await MediaAsset.updateOne({ _id: asset._id, business: req.business._id }, { status: 'failed', failureCode: 'UPLOAD_FAILED' }).catch(() => {});
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'The image upload could not finish. Please try again.', 'MEDIA_UPLOAD_FAILED');
  }
}));
r.get('/images', asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { business: req.business._id, status: 'ready' };
  const [items, total] = await Promise.all([MediaAsset.find(filter).sort('-createdAt').skip(skip).limit(limit), MediaAsset.countDocuments(filter)]);
  res.json({ items: items.map(publicAsset), total, page, limit });
}));
r.delete('/images/:id', asyncH(async (req, res) => {
  const id = parse(objectId, req.params.id);
  const asset = await MediaAsset.findOneAndUpdate({ _id: id, business: req.business._id, status: { $in: ['ready','archived'] } }, { status: 'archived' }, { new: true });
  if (!asset) throw notFound('Image not found');
  // Retain the provider file because existing storefront records may still reference it.
  res.json({ archived: true, fileRetained: true });
}));
export default r;
