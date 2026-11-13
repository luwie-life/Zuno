import { useId } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { galleryImage, updateGalleryImage, moveGalleryImage, removeGalleryImage } from '../../lib/galleryEditor.js';

export default function GalleryImagesEditor({ images = [], onChange }) {
  const id = useId();
  const { can } = useAuth();
  const disabled = !can('business.update') || typeof onChange !== 'function';
  return <section aria-labelledby={`${id}-heading`} className="mt-4 space-y-3 border-t border-slate-200 pt-3">
    <h3 id={`${id}-heading`} className="text-sm font-semibold text-slate-800">Gallery entries ({images.length})</h3>
    <p className="text-xs text-slate-500">Edit image URLs and descriptions, or change their order. Removing an entry does not archive or delete the uploaded file. Save to persist gallery changes.</p>
    {images.length === 0 && <p className="text-xs text-slate-500">Add an image using the upload or media-library controls above.</p>}
    {images.map((value, index) => {
      const image = galleryImage(value);
      return <article key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-600">Image {index + 1}</p>
        {image.url && <img src={image.url} alt={image.alt || `Gallery image ${index + 1}`} loading="lazy" className="max-h-32 w-full rounded-lg object-contain" />}
        <label className="block text-xs text-slate-600" htmlFor={`${id}-url-${index}`}>Image URL {index + 1}</label>
        <input id={`${id}-url-${index}`} aria-label={`Image URL ${index + 1}`} type="url" disabled={disabled} value={image.url} maxLength={3000} onChange={event => onChange(updateGalleryImage(images, index, { url: event.target.value }))} className="input w-full" />
        <label className="block text-xs text-slate-600" htmlFor={`${id}-alt-${index}`}>Image description {index + 1}</label>
        <input id={`${id}-alt-${index}`} aria-label={`Image description ${index + 1}`} disabled={disabled} value={image.alt} maxLength={1000} onChange={event => onChange(updateGalleryImage(images, index, { alt: event.target.value }))} className="input w-full" />
        <div className="flex flex-wrap gap-3 text-xs">
          <button type="button" aria-label={`Move gallery image ${index + 1} earlier`} disabled={disabled || index === 0} onClick={() => onChange(moveGalleryImage(images, index, -1))} className="underline disabled:opacity-40">Move earlier</button>
          <button type="button" aria-label={`Move gallery image ${index + 1} later`} disabled={disabled || index === images.length - 1} onClick={() => onChange(moveGalleryImage(images, index, 1))} className="underline disabled:opacity-40">Move later</button>
          <button type="button" aria-label={`Remove gallery image ${index + 1}`} disabled={disabled} onClick={() => onChange(removeGalleryImage(images, index))} className="text-danger underline disabled:opacity-40">Remove from gallery</button>
        </div>
      </article>;
    })}
  </section>;
}
