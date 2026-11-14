import { useAuth } from '../../lib/auth.jsx';
import ImageUploadField from '../ImageUploadField.jsx';
import GalleryImagesEditor from './GalleryImagesEditor.jsx';

export default function StorefrontMediaControls({ element, section, elementInspectorProps = {}, sectionInspectorProps = {} }) {
  const { can } = useAuth();
  const readOnly = !can('business.update');
  if (element && typeof elementInspectorProps.onUpdateElement === 'function') {
    const update = elementInspectorProps.onUpdateElement;
    if (element.type === 'image') return <div className="mb-6 space-y-3 rounded-xl border border-emerald-100 p-3">
      <ImageUploadField key={element.id} label="Image upload" value={element.src || ''} showUrl={false} onChange={url => update(element.id, { src: url })} />
      <label className="block text-xs text-slate-600">Image alt text<input aria-label="Image alt text" disabled={readOnly} value={element.settings?.alt || ''} maxLength={1000} className="input mt-1 w-full" onChange={event => update(element.id, { settings: { ...(element.settings || {}), alt: event.target.value } })} /></label>
    </div>;
    if (element.type === 'gallery') {
      const images = Array.isArray(element.settings?.images) ? element.settings.images : [];
      return <div className="mb-6 rounded-xl border border-emerald-100 p-3">
        <ImageUploadField key={element.id} label="Add an uploaded gallery image" purpose="gallery" showUrl={false} disabled={images.length >= 100} onChange={url => { if (url) update(element.id, { settings: { ...(element.settings || {}), images: [...images, { url, alt: '' }] } }); }} />
        <GalleryImagesEditor images={images} onChange={next => update(element.id, { settings: { ...(element.settings || {}), images: next } })} />
      </div>;
    }
    return null;
  }
  if (!section || typeof sectionInspectorProps.onUpdateSection !== 'function') return null;
  const settings = section.settings || {};
  const update = sectionInspectorProps.onUpdateSection;
  if (['hero','about','image_text'].includes(section.type)) {
    const hero = section.type === 'hero';
    return <div className="mb-6 rounded-xl border border-emerald-100 p-3"><ImageUploadField key={section.id} label={hero ? 'Hero background upload' : 'Section image upload'} purpose={hero ? 'hero' : 'editor'} showUrl={false} value={hero ? settings.backgroundImage || settings.image || '' : settings.image || ''} onChange={url => { update(section.id, hero ? 'backgroundImage' : 'image', url); if (hero && !url) update(section.id, 'image', ''); }} /></div>;
  }
  if (section.type === 'gallery') {
    const images = Array.isArray(settings.images) ? settings.images : [];
    return <div className="mb-6 rounded-xl border border-emerald-100 p-3"><ImageUploadField key={section.id} label="Add an uploaded gallery image" purpose="gallery" showUrl={false} disabled={images.length >= 100} onChange={url => { if (url) update(section.id, 'images', [...images, { url, alt: '' }]); }} /></div>;
  }
  return null;
}
