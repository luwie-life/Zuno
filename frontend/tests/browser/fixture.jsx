import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../src/lib/auth.jsx';
import ImageUploadField from '../../src/components/ImageUploadField.jsx';
import '../../src/index.css';
function Fixture() {
  const { ctx, loading, switchBusiness } = useAuth();
  const [images, setImages] = useState({ ['a'.repeat(24)]: 'https://media.fixture.invalid/original.png', ['b'.repeat(24)]: 'https://media.fixture.invalid/second-business.png' });
  const tenant = String(ctx?.business?._id || '');
  if (loading || !tenant) return <p>Loading fixture...</p>;
  return <main style={{ maxWidth: 420, padding: 16 }}>
    <p data-testid="current-business">{tenant}</p>
    <button type="button" onClick={() => switchBusiness('b'.repeat(24))}>Switch fixture business</button>
    <ImageUploadField label="Fixture image" value={images[tenant] || ''} onChange={url => setImages(current => ({ ...current, [tenant]: url }))} />
    <output data-testid="selected-image">{images[tenant] || ''}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<AuthProvider><Fixture /></AuthProvider>);
