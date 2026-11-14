import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../src/lib/auth.jsx';
import StorefrontMediaControls from '../../src/components/storefront/StorefrontMediaControls.jsx';
import '../../src/index.css';
const firstUrl = 'https://media.fixture.invalid/gallery-one.png';
const secondUrl = 'https://media.fixture.invalid/gallery-two.png';
function GalleryFixture() {
  const { ctx, loading } = useAuth();
  const [element, setElement] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'image'
    ? { id: 'image-fixture', type: 'image', src: firstUrl, settings: { alt: 'Original description', caption: 'Retain the image caption' } }
    : { id: 'gallery-fixture', type: 'gallery', settings: { columns: 3, images: [firstUrl, { url: secondUrl, alt: 'Second gallery description', caption: 'Retain this caption' }] } });
  if (loading || !ctx?.business) return <p>Loading fixture...</p>;
  return <main style={{ maxWidth: 420, padding: 16 }}>
    <StorefrontMediaControls element={element} elementInspectorProps={{ onUpdateElement: (id, changes) => setElement(current => current.id === id ? { ...current, ...changes } : current) }} />
    <pre data-testid="gallery-state" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(element)}</pre>
  </main>;
}
createRoot(document.getElementById('root')).render(<AuthProvider><GalleryFixture /></AuthProvider>);
