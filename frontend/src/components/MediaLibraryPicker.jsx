import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { apiUrl, getBizId, getToken } from '../lib/api.js';
import { createMediaLibraryClient } from '../lib/mediaLibrary.js';

export default function MediaLibraryPicker({ tenant, onSelect, onClose }) {
  const { can } = useAuth();
  const token = getToken();
  const headingId = useId();
  const permitted = can('business.update') && !!tenant && String(getBizId() || '') === tenant;
  const allowed = useRef(permitted);
  allowed.current = permitted;
  const alive = useRef(false);
  const request = useRef(null);
  const archiveLock = useRef(false);
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 12 });
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const client = useMemo(() => createMediaLibraryClient({ baseUrl: apiUrl('/media/images'), token, businessId: tenant, getToken, getBusinessId: getBizId, onUnauthorized: () => window.dispatchEvent(new Event('zuno:signed-out')) }), [tenant, token]);

  const load = useCallback(async (page = 1) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = () => alive.current && allowed.current && client.isCurrent() && request.current === controller && !controller.signal.aborted;
    setLoading(true); setError(''); setConfirmation(null);
    setData({ items: [], total: 0, page, limit: 12 });
    try { const result = await client.list(page, controller.signal); if (current()) setData(result); }
    catch (err) { if (current()) setError(err.message || 'Could not load images.'); }
    finally { if (current()) setLoading(false); }
  }, [client]);

  useEffect(() => {
    alive.current = true; archiveLock.current = false; setArchiving(false); setNotice('');
    if (permitted) load(1);
    return () => { alive.current = false; request.current?.abort(); };
  }, [load, permitted]);

  const archive = async () => {
    const asset = confirmation;
    if (!asset || archiveLock.current || !allowed.current || !client.isCurrent()) return;
    archiveLock.current = true; setArchiving(true); setError(''); setNotice('');
    const controller = new AbortController();
    request.current?.abort(); request.current = controller;
    const current = () => alive.current && allowed.current && client.isCurrent() && request.current === controller && !controller.signal.aborted;
    try {
      await client.archive(asset.id, controller.signal);
      if (!current()) return;
      setConfirmation(null);
      setNotice('Image archived from the library. Its provider file and existing storefront references are retained.');
      load(1);
    } catch (err) { if (current()) setError(err.message || 'Could not archive the image.'); }
    finally { if (alive.current && client.isCurrent()) { archiveLock.current = false; setArchiving(false); } }
  };

  if (!permitted || !client.isCurrent()) return <p role="alert" className="text-xs text-danger">Select an authorized business and reopen the media library.</p>;
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <section aria-labelledby={headingId} className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2"><h3 id={headingId} className="text-sm font-semibold text-slate-800">Media library</h3><button type="button" onClick={onClose} disabled={archiving} className="text-xs underline">Close library</button></div>
      <p className="text-xs text-slate-500">Reuse an uploaded image. Selecting it changes editor state only; use Save to persist it. To upload a new image, close this library and use the upload control above.</p>
      {loading && <p role="status" className="text-xs text-slate-500">Loading images...</p>}
      {archiving && <p role="status" className="text-xs text-slate-500">Archiving image...</p>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {notice && <p role="status" className="text-xs text-forest">{notice}</p>}
      {!loading && !error && data.items.length === 0 && <p className="text-xs text-slate-500">No images on this page.</p>}
      <div className="grid grid-cols-2 gap-2">{data.items.map(asset => <article key={asset.id} className="min-w-0 rounded-lg border border-slate-200 p-2">
        <img src={asset.url} alt={asset.name || 'Uploaded image'} loading="lazy" className="h-24 w-full object-contain" />
        <p className="my-2 truncate text-[11px] text-slate-600" title={asset.name || asset.publicId}>{asset.name || 'Uploaded image'}</p>
        <button type="button" disabled={loading || archiving} className="w-full rounded-lg bg-emerald-50 px-2 py-2 text-xs text-emerald-800" onClick={() => { if (allowed.current && client.isCurrent()) onSelect(asset); }}>Use image</button>
        <button type="button" disabled={loading || archiving} className="mt-2 w-full text-xs text-danger underline" onClick={() => setConfirmation(asset)}>Archive image</button>
      </article>)}</div>
      {confirmation && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="break-words text-xs text-amber-900">Archive {confirmation.name || 'this image'}? It will disappear from the library. Its provider file will remain available to existing storefront references.</p>
        <p className="break-all text-[10px] text-amber-900">{confirmation.url}</p>
        <div className="flex gap-3"><button type="button" disabled={archiving} onClick={archive} className="text-xs text-danger underline">Confirm archive</button><button type="button" disabled={archiving} onClick={() => setConfirmation(null)} className="text-xs underline">Cancel</button></div>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <button type="button" disabled={loading || archiving || data.page <= 1} onClick={() => load(data.page - 1)} className="underline disabled:opacity-40">Previous</button>
        <span>Page {data.page} of {pages}</span>
        <button type="button" disabled={loading || archiving || data.page >= pages} onClick={() => load(data.page + 1)} className="underline disabled:opacity-40">Next</button>
        <button type="button" disabled={loading || archiving} onClick={() => load(data.page)} className="underline disabled:opacity-40">Refresh library</button>
      </div>
    </section>
  );
}
