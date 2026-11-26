
import { Router } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { requireAuth, requireBusiness } from '../middleware/auth.js';
import { asyncH, bad } from '../lib/errors.js';

const r = Router();

r.use(requireAuth, requireBusiness(null));

r.post('/signature', asyncH(async (req, res) => {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return res.status(503).json({
      error: { message: 'Image uploads are not configured yet.' },
    });
  }

  const resourceType = req.body?.resourceType || 'image';

  if (resourceType !== 'image') {
    throw bad('Only image uploads are supported.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `zuno/${req.business._id}`;

  const params = {
    folder,
    timestamp,
  };

  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(signatureBase + env.cloudinary.apiSecret)
    .digest('hex');

  res.json({
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
  });
}));

export default r;
