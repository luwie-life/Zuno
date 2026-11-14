export function galleryImage(value) {
  if (typeof value === 'string') return { url: value, alt: '' };
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value, url: typeof value.url === 'string' ? value.url : '', alt: typeof value.alt === 'string' ? value.alt : '' } : { url: '', alt: '' };
}
const validIndex = (images, index) => Array.isArray(images) && Number.isInteger(index) && index >= 0 && index < images.length;
export function updateGalleryImage(images, index, changes) {
  if (!validIndex(images, index)) return images;
  return images.map((image, current) => current === index ? { ...galleryImage(image), ...changes } : image);
}
export function moveGalleryImage(images, index, direction) {
  if (!validIndex(images, index) || ![-1, 1].includes(direction) || !validIndex(images, index + direction)) return images;
  const next = [...images];
  [next[index], next[index + direction]] = [next[index + direction], next[index]];
  return next;
}
export function removeGalleryImage(images, index) {
  if (!validIndex(images, index)) return images;
  return images.filter((_, current) => current !== index);
}
