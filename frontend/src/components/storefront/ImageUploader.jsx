import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X, UploadCloud } from 'lucide-react';
import { api } from '../../lib/api.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({
  value = [],
  onChange,
  maxFiles = 5,
  label = 'Images',
  helperText = 'JPG, PNG or WebP. Maximum 5 MB per image.',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const images = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  const remaining = Math.max(0, maxFiles - images.length);

  const uploadFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selected.length) return;

    setError('');
    const candidates = selected.slice(0, remaining);

    if (selected.length > remaining) {
      setError(`You can add ${remaining} more image${remaining === 1 ? '' : 's'}.`);
    }

    const valid = [];

    for (const file of candidates) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: use JPG, PNG or WebP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: the maximum file size is 5 MB.`);
        continue;
      }

      valid.push(file);
    }

    if (!valid.length) return;

    setUploading(true);

    const uploaded = [];

    try {
      for (let index = 0; index < valid.length; index += 1) {
        const file = valid[index];
        setProgress(`Uploading ${index + 1} of ${valid.length}…`);

        const signed = await api('/media/signature', {
          method: 'POST',
          biz: true,
        });

        if (!signed?.cloudName || !signed?.apiKey || !signed?.timestamp || !signed?.signature) {
          throw new Error('The media service returned an incomplete upload signature.');
        }

        const form = new FormData();
        form.append('file', file);
        form.append('api_key', signed.apiKey);
        form.append('timestamp', String(signed.timestamp));
        form.append('folder', signed.folder || '');
        form.append('signature', signed.signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: 'POST', body: form }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.secure_url) {
          throw new Error(result?.error?.message || `Could not upload ${file.name}.`);
        }

        uploaded.push(result.secure_url);
        onChange([...images, ...uploaded]);
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
    setError('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-400">
          {images.length}/{maxFiles}
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              <img
                src={src}
                alt={`${label} ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={uploading}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                <X size={15} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                  First image
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-emerald-600 hover:bg-emerald-50/50 disabled:cursor-wait disabled:opacity-60"
        >
          {uploading ? (
            <LoaderCircle size={22} className="animate-spin text-emerald-700" />
          ) : (
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
              <UploadCloud size={19} />
            </span>
          )}

          <span className="text-sm font-semibold text-slate-700">
            {uploading ? progress : 'Upload images'}
          </span>
          <span className="mt-1 text-xs text-slate-400">
            {uploading ? 'Keep this screen open while uploading' : 'Choose from your device'}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxFiles > 1}
        onChange={uploadFiles}
        className="hidden"
      />

      <p className="text-xs leading-5 text-slate-400">{helperText}</p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}

      {uploading && (
        <p className="flex items-center gap-2 text-xs text-emerald-700">
          <LoaderCircle size={13} className="animate-spin" />
          {progress}
        </p>
      )}
    </div>
  );
}