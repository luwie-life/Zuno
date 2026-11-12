import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye } from 'lucide-react';
import { StorefrontRenderer } from '../../pages/StorefrontHome.jsx';

const widths = { desktop: 1200, tablet: 768, mobile: 390 };
const frameDocument = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><div id="draft-root"></div></body></html>';

function DraftDialog({ business, storefront, activePage, initialDevice, onClose, onOpenLive }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [device, setDevice] = useState(widths[initialDevice] ? initialDevice : 'desktop');
  const [target, setTarget] = useState(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  const config = { ...storefront, pages: (storefront.pages || []).map(page => page.id === activePage?.id ? { ...page, visible: true } : page) };
  const blockAction = event => {
    if (event.target.closest?.('a,button,input,select,textarea')) { event.preventDefault(); event.stopPropagation(); }
  };
  const prepareFrame = event => {
    const doc = event.currentTarget.contentDocument;
    if (!doc) return;
    const base = doc.createElement('base'); base.href = document.baseURI; doc.head.appendChild(base);
    document.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(style => doc.head.appendChild(style.cloneNode(true)));
    setTarget(doc.getElementById('draft-root'));
  };
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} className="m-auto w-[95vw] max-w-none rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50" style={{ maxHeight: '95vh' }}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3">
      <div><h2 id={titleId} className="text-base font-bold">Draft preview</h2><p className="text-xs text-slate-500">Current page content only. Nothing is saved or published.</p></div>
      <label className="text-xs">Draft preview width<select value={device} onChange={event => setDevice(event.target.value)} className="ml-2 rounded-lg border border-slate-200 p-2"><option value="desktop">Desktop (1200px)</option><option value="tablet">Tablet (768px)</option><option value="mobile">Mobile (390px)</option></select></label>
      <button type="button" autoFocus onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Close draft preview</button>
    </header>
    <p className="px-3 py-2 text-xs text-slate-500">Links, cart and booking actions are disabled. Storefront shell and server-generated metadata are not included. Scroll if the selected viewport is wider than this screen.</p>
    <div className="overflow-auto bg-slate-100 p-2">
      <iframe title="Draft storefront preview" sandbox="allow-same-origin" srcDoc={frameDocument} onLoad={prepareFrame} className="mx-auto block border-0 bg-white" style={{ width: widths[device], height: '65vh', minHeight: 320 }} />
    </div>
    {target && createPortal(<div onClickCapture={blockAction} onSubmitCapture={event => { event.preventDefault(); event.stopPropagation(); }}>
      <StorefrontRenderer pageSlug={activePage?.isHome ? 'home' : activePage?.slug || 'home'} biz={business} storefront={config} slug={business.slug || ''} storeBase={business.slug ? `/store/${business.slug}` : ''} color={storefront.theme?.primaryColor || business.brandColor || '#0B3D2E'} editorMode={false} />
    </div>, target)}
    {business.slug && typeof onOpenLive === 'function' && <footer className="border-t border-slate-200 p-3"><button type="button" onClick={onOpenLive} className="text-xs underline">Open live storefront</button><span className="ml-2 text-xs text-slate-500">This opens the public URL, not this unsaved draft.</span></footer>}
  </dialog>;
}

export default function StorefrontDraftPreviewButton({ business = {}, storefront = {}, activePage = null, initialDevice = 'desktop', onOpenLive }) {
  const [openedFor, setOpenedFor] = useState(null);
  const context = `${business._id || ''}:${activePage?.id || ''}`;
  useEffect(() => { setOpenedFor(null); }, [context]);
  return <>
    <button type="button" disabled={!activePage} onClick={() => setOpenedFor(context)} title="Preview draft" aria-label="Preview draft" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Eye size={15} /></button>
    {openedFor === context && <DraftDialog business={business} storefront={storefront} activePage={activePage} initialDevice={initialDevice} onClose={() => setOpenedFor(null)} onOpenLive={onOpenLive} />}
  </>;
}
