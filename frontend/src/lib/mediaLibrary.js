const idPattern = /^[a-f0-9]{24}$/i;
export function parseMediaPage(data) {
  if (!data || !Array.isArray(data.items) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || !Number.isInteger(data.limit) || data.limit < 1) throw new Error('The server returned an invalid media list.');
  const items = data.items.map(asset => {
    if (!asset || !idPattern.test(asset.id) || typeof asset.url !== 'string') throw new Error('The server returned an invalid image.');
    let url;
    try { url = new URL(asset.url); } catch { throw new Error('The server returned an invalid image URL.'); }
    if (url.protocol !== 'https:') throw new Error('The server returned an insecure image URL.');
    return { ...asset, name: typeof asset.name === 'string' ? asset.name : '' };
  });
  return { items, total: data.total, page: data.page, limit: data.limit };
}
export function createMediaLibraryClient({ baseUrl, token, businessId, getToken, getBusinessId, fetchImpl = fetch, onUnauthorized = () => {} }) {
  const isCurrent = () => !!token && !!businessId && getToken() === token && String(getBusinessId() || '') === businessId;
  async function request(path, method, signal) {
    if (!isCurrent()) throw new Error('Your session or business changed. Reopen the media library.');
    const response = await fetchImpl(`${baseUrl}${path}`, { method, signal, headers: { Authorization: `Bearer ${token}`, 'X-Business-Id': businessId } });
    const data = await response.json().catch(() => null);
    if (!isCurrent()) throw new Error('Your session or business changed. Reopen the media library.');
    if (response.status === 401) onUnauthorized();
    if (!response.ok) throw new Error(data?.error?.message || 'The media request failed. Please try again.');
    return data;
  }
  return {
    isCurrent,
    async list(page = 1, signal) { return parseMediaPage(await request(`?page=${page}&limit=12`, 'GET', signal)); },
    async archive(id, signal) {
      if (!idPattern.test(id)) throw new Error('Invalid image identifier.');
      const result = await request(`/${encodeURIComponent(id)}`, 'DELETE', signal);
      if (result?.archived !== true || result?.fileRetained !== true) throw new Error('The server did not confirm that the image was archived. Refresh the library.');
      return result;
    },
  };
}
