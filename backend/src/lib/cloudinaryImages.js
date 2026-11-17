import { createHash } from 'node:crypto';
import { HttpError } from './errors.js';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function imageUploadConfig(environment = process.env) {
  const cloud = (environment.CLOUDINARY_CLOUD_NAME || '').trim();
  const key = (environment.CLOUDINARY_API_KEY || '').trim();
  const secret = (environment.CLOUDINARY_API_SECRET || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(cloud) || !key || !secret) throw new HttpError(503, 'Image uploads are not configured. Contact Zuno support.', 'MEDIA_NOT_CONFIGURED');
  return { cloud, key, secret };
}
export function validateImageUpload(mimeType, data) {
  if (!IMAGE_MIME_TYPES.includes(mimeType)) throw new HttpError(400, 'Choose a JPEG, PNG or WebP image.', 'INVALID_IMAGE_TYPE');
  if (typeof data !== 'string' || !data.length) throw new HttpError(400, 'Choose an image to upload.', 'INVALID_IMAGE_DATA');
  if (data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new HttpError(413, 'Images must be 5 MB or smaller.', 'IMAGE_TOO_LARGE');
  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length || buffer.toString('base64') !== data) throw new HttpError(400, 'The image data is invalid.', 'INVALID_IMAGE_DATA');
  if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Images must be 5 MB or smaller.', 'IMAGE_TOO_LARGE');
  let format = '';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) format = 'png';
  else if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) format = 'jpg';
  else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') format = 'webp';
  const expected = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mimeType];
  if (!format || format !== expected) throw new HttpError(400, 'The file contents do not match the selected image type.', 'INVALID_IMAGE_CONTENT');
  return { buffer, format };
}
export function cloudinaryImageParameters(publicId, now = new Date()) {
  return { allowed_formats: 'jpg,png,webp', overwrite: 'false', public_id: publicId, timestamp: String(Math.floor(now.getTime() / 1000)) };
}
export function signCloudinaryImage(parameters, secret) {
  const serialized = Object.keys(parameters).sort().map(key => `${key}=${parameters[key]}`).join('&');
  return createHash('sha1').update(serialized + secret).digest('hex');
}
export function verifiedCloudinaryImage(result, publicId, cloud) {
  let url;
  try { url = new URL(result?.secure_url); } catch { throw new HttpError(502, 'The image provider returned an invalid image.', 'MEDIA_PROVIDER_ERROR'); }
  if (result.public_id !== publicId || result.resource_type !== 'image' || result.type !== 'upload' || !['jpg','png','webp'].includes(result.format) || !Number.isInteger(result.bytes) || result.bytes <= 0 || result.bytes > MAX_IMAGE_BYTES || !(result.width > 0 && result.height > 0) || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || !url.pathname.startsWith(`/${cloud}/image/upload/`) || url.username || url.password || url.port) throw new HttpError(502, 'The image provider returned an invalid image.', 'MEDIA_PROVIDER_ERROR');
  return { url: url.href, format: result.format, bytes: result.bytes, width: result.width, height: result.height };
}
