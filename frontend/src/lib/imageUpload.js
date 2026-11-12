export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export class ImageUploadError extends Error {
  constructor(message, status = 0, code = 'IMAGE_UPLOAD_FAILED') { super(message); this.status = status; this.code = code; }
}
export function validateImageFile(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new ImageUploadError('Choose a JPEG, PNG or WebP image.', 400, 'INVALID_IMAGE_TYPE');
  if (!Number.isFinite(file.size) || file.size <= 0) throw new ImageUploadError('The selected image is empty.', 400, 'INVALID_IMAGE_DATA');
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageUploadError('Images must be 5 MB or smaller.', 413, 'IMAGE_TOO_LARGE');
}
const cancelled = () => new ImageUploadError('Upload cancelled. Your previous image has not changed.', 0, 'UPLOAD_CANCELLED');
export function readImageBase64(file, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled());
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal?.removeEventListener('abort', abort);
    reader.onload = () => { cleanup(); const value = String(reader.result || ''); const marker = value.indexOf(';base64,'); if (marker < 0) reject(new ImageUploadError('The selected image could not be read.')); else resolve(value.slice(marker + 8)); };
    reader.onerror = () => { cleanup(); reject(new ImageUploadError('The selected image could not be read.')); };
    reader.onabort = () => { cleanup(); reject(cancelled()); };
    signal?.addEventListener('abort', abort, { once: true });
    reader.readAsDataURL(file);
  });
}
export async function uploadStoreImage(file, { url, token, businessId, purpose = 'editor', onProgress = () => {}, onUnauthorized = () => {}, signal, createXhr = () => new XMLHttpRequest(), readFile = readImageBase64 } = {}) {
  validateImageFile(file);
  if (!token) throw new ImageUploadError('Sign in before uploading an image.', 401, 'UNAUTHENTICATED');
  if (!/^[a-f\d]{24}$/i.test(String(businessId || ''))) throw new ImageUploadError('Select a business before uploading.', 400, 'NO_BUSINESS');
  if (signal?.aborted) throw cancelled();
  onProgress({ stage: 'reading', percent: 0 });
  const data = await readFile(file, signal);
  if (signal?.aborted) throw cancelled();
  return new Promise((resolve, reject) => {
    const xhr = createXhr();
    const abort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const fail = error => { cleanup(); reject(error); };
    xhr.open('POST', url);
    xhr.timeout = 120_000;
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-Business-Id', String(businessId));
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress({ stage: 'uploading', percent: Math.round(event.loaded / event.total * 100) }); };
    xhr.upload.onload = () => onProgress({ stage: 'processing', percent: 100 });
    xhr.onload = () => {
      cleanup();
      const body = xhr.response || {};
      if (xhr.status === 401) onUnauthorized();
      if (xhr.status < 200 || xhr.status >= 300) return reject(new ImageUploadError(body.error?.message || (xhr.status === 413 ? 'Images must be 5 MB or smaller.' : 'The image upload failed. Please try again.'), xhr.status, body.error?.code || 'IMAGE_UPLOAD_FAILED'));
      const asset = body.asset;
      if (!asset || typeof asset.id !== 'string' || typeof asset.publicId !== 'string' || typeof asset.url !== 'string' || !asset.url.startsWith('https://')) return reject(new ImageUploadError('The server did not return a saved image. Please try again.', 502, 'INVALID_UPLOAD_RESPONSE'));
      onProgress({ stage: 'complete', percent: 100 });
      resolve(asset);
    };
    xhr.onerror = () => fail(new ImageUploadError('Cannot reach the server. Check your connection and try again.'));
    xhr.ontimeout = () => fail(new ImageUploadError('The image upload timed out. Your previous image has not changed.'));
    xhr.onabort = () => fail(cancelled());
    signal?.addEventListener('abort', abort, { once: true });
    onProgress({ stage: 'uploading', percent: 0 });
    xhr.send(JSON.stringify({ mimeType: file.type, data, name: String(file.name || 'image').slice(0, 160), purpose }));
  });
}
