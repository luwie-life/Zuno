import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { StoreLayout } from '../../pages/Store.jsx';
import { applyStorefrontMetadata, buildStorefrontMetadata, captureStorefrontHead } from '../../lib/storefrontMetadata.js';

const HeadOwner = createContext(null);
export default function StorefrontMetadataLayout(props) {
  const restoreRef = useRef(null);
  const owner = useMemo(() => ({ reset: () => restoreRef.current?.() }), []);
  useLayoutEffect(() => {
    restoreRef.current = captureStorefrontHead(document);
    return () => { owner.reset(); restoreRef.current = null; };
  }, [owner]);
  return <HeadOwner.Provider value={owner}><StoreLayout {...props} /></HeadOwner.Provider>;
}
export function StorefrontMetadataOutlet() {
  const context = useOutletContext();
  const owner = useContext(HeadOwner);
  const { pathname } = useLocation();
  const business = context?.biz;
  const storeBase = context?.storeBase || '';
  const metadata = useMemo(() => buildStorefrontMetadata(business, pathname, storeBase, window.location.origin), [business, pathname, storeBase]);
  useEffect(() => {
    let current = true;
    queueMicrotask(() => {
      if (!current || !owner) return;
      owner.reset();
      applyStorefrontMetadata(document, metadata);
    });
    return () => { current = false; owner?.reset(); };
  }, [metadata, owner]);
  return <Outlet context={context} />;
}
