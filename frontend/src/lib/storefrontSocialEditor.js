const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin', 'pinterest', 'threads'];
function entries(input) {
  if (Array.isArray(input)) return input.filter(item => item && typeof item === 'object' && PLATFORMS.includes(item.platform)).map(item => ({ ...item }));
  if (!input || typeof input !== 'object') return [];
  return PLATFORMS.filter(platform => typeof input[platform] === 'string' && input[platform].trim()).map(platform => ({ id: `social-${platform}`, platform, url: input[platform], visible: true }));
}
export function socialLinkValue(input, platform) {
  const value = entries(input).find(item => item.platform === platform)?.url;
  return typeof value === 'string' ? value : '';
}
export function updateSocialLink(input, platform, value) {
  const current = entries(input);
  if (!PLATFORMS.includes(platform)) return current;
  const index = current.findIndex(item => item.platform === platform);
  const previous = current[index];
  const next = current.filter(item => item.platform !== platform);
  const url = typeof value === 'string' ? value : '';
  if (!url.trim()) return next;
  next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, { id: previous?.id || `social-${platform}`, platform, url, visible: previous?.visible !== false });
  return next;
}
