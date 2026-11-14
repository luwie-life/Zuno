import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../src/lib/auth.jsx';
import ImageUploadField from '../../src/components/ImageUploadField.jsx';
import StorefrontDraftPreviewButton from '../../src/components/storefront/StorefrontDraftPreviewButton.jsx';
import '../../src/index.css';
function PreviewFixture({ business }) {
  const [heading, setHeading] = useState('Initial draft heading');
  const selected = { id: 'draft-page', title: 'Draft page', slug: 'draft-page', visible: false, isHome: false, sections: [{ id: 'draft-section', type: 'rich_text', visible: true, settings: { editableContent: true }, elements: [{ id: 'draft-heading', type: 'heading', visible: true, content: heading }, { id: 'draft-link', type: 'button', visible: true, content: 'Disabled preview action', action: { type: 'external', value: 'https://blocked.fixture.invalid/action', target: '_blank' } }] }] };
  const storefront = { theme: {}, pages: [{ id: 'home', title: 'Home', slug: 'home', isHome: true, visible: true, sections: [{ id: 'home-section', type: 'rich_text', visible: true, settings: { title: 'Home draft heading' }, elements: [] }] }, selected] };
  return <MemoryRouter><main style={{ padding: 16 }}>
    <label>Draft heading<input value={heading} onChange={event => setHeading(event.target.value)} /></label>
    <StorefrontDraftPreviewButton business={business} storefront={storefront} activePage={selected} />
    <output data-testid="draft-page-visibility">{String(selected.visible)}</output>
  </main></MemoryRouter>;
}
function Fixture() {
  const { ctx, loading, switchBusiness } = useAuth();
  const [images, setImages] = useState({ ['a'.repeat(24)]: 'https://media.fixture.invalid/original.png', ['b'.repeat(24)]: 'https://media.fixture.invalid/second-business.png' });
  const tenant = String(ctx?.business?._id || '');
  if (loading || !tenant) return <p>Loading fixture...</p>;
  if (new URLSearchParams(window.location.search).get('mode') === 'preview') return <PreviewFixture business={ctx.business} />;
  return <main style={{ maxWidth: 420, padding: 16 }}>
    <p data-testid="current-business">{tenant}</p>
    <button type="button" onClick={() => switchBusiness('b'.repeat(24))}>Switch fixture business</button>
    <ImageUploadField label="Fixture image" value={images[tenant] || ''} onChange={url => setImages(current => ({ ...current, [tenant]: url }))} />
    <output data-testid="selected-image">{images[tenant] || ''}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<AuthProvider><Fixture /></AuthProvider>);
