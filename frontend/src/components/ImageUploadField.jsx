import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { apiUrl, getBizId, getToken } from '../lib/api.js';
import { uploadStoreImage, validateImageFile } from '../lib/imageUpload.js';

export default function ImageUploadField({ label = 'Image', value = '', onChange = () => {}, onUploaded, purpose = 'editor', showUrl = true, disabled = false }) {
  const { ctx, can } = useAuth();
  const tenant = String(ctx?.business?._id || getBizId() || '');
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('');
  const active = useRef(null);
  const alive = useRef(false);
  const tenantRef = useRef(tenant);
  const callbacks = useRef({ onChange, onUploaded });
  tenantRef.current = tenant;
  callbacks.current = { onChange, onUploaded };
  const permitted = !!tenant && can('business.update') && !disabled;

  useEffect(() => { alive.current = true; return () => { alive.current = false; active.current?.abort(); }; }, []);
  useEffect(() => { active.current?.abort(); active.current = null; setBusy(false); setProgress(null); setError(''); setNotice(''); setPreview(''); }, [tenant]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const choose = async event => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || !permitted || active.current) return;
    setError(''); setNotice('');
    try { validateImageFile(file); } catch (err) { setError(err.message); return; }
    const controller = new AbortController();
    const token = getToken();
    const capturedTenant = tenant;
    active.current = controller;
    const current = () => alive.current && !controller.signal.aborted && tenantRef.current === capturedTenant && String(getBizId() || '') === capturedTenant;
    setBusy(true); setPreview(URL.createObjectURL(file));
    try {
      const asset = await uploadStoreImage(file, {
        url: apiUrl('/media/images'), token, businessId: capturedTenant, purpose, signal: controller.signal,
        onProgress: state => { if (current()) setProgress(state); },
        onUnauthorized: () => { if (getToken() === token) window.dispatchEvent(new Event('zuno:signed-out')); },
      });
      if (!current()) return;
      callbacks.current.onChange(asset.url);
      callbacks.current.onUploaded?.(asset);
      setNotice('Image uploaded. Save your storefront to persist this selection.');
    } catch (err) {
      if (alive.current && tenantRef.current === capturedTenant) setError(err.message || 'The image could not be uploaded.');
    } finally {
      if (active.current === controller) { active.current = null; if (alive.current) { setBusy(false); setPreview(''); } }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      {(preview || value) && <img src={preview || value} alt={`${label} preview`} className="max-h-40 w-full rounded-xl border border-slate-200 object-contain" />}
      <label htmlFor={id} className="block text-xs text-slate-600">
        {value ? 'Replace with an uploaded image' : 'Choose an image to upload'}
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || !permitted} onChange={choose} className="mt-2 block w-full text-xs" />
      </label>
      <p className="text-[11px] text-slate-400">JPEG, PNG or WebP. Maximum 5 MB.</p>
      {showUrl && <label className="block text-xs text-slate-600">Or keep using an image URL<input type="url" value={value || ''} disabled={busy || !permitted} onChange={event => { setError(''); setNotice(''); callbacks.current.onChange(event.target.value); }} placeholder="https://..." className="input mt-1 w-full" /></label>}
      {busy && <div role="status" className="space-y-2 text-xs text-forest">
        <p>{progress?.stage === 'reading' ? 'Reading image...' : progress?.stage === 'processing' ? 'File received. Processing image on the server...' : progress?.percent ? `Transferring file: ${progress.percent}%` : 'Uploading image...'}</p>
        {progress?.stage === 'uploading' && <progress max="100" value={progress.percent || 0} className="w-full" aria-label="File transfer progress" />}
        <button type="button" className="underline" onClick={() => active.current?.abort()}>Cancel upload</button>
      </div>}
      {!busy && value && <button type="button" disabled={!permitted} className="text-xs text-danger underline" onClick={() => { setError(''); setNotice(''); callbacks.current.onChange(''); }}>Remove image from this field</button>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {notice && <p role="status" className="text-xs text-forest">{notice}</p>}
    </div>
  );
}
