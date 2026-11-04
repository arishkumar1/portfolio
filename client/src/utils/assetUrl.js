import api from '../services/api';

const apiBase = api.defaults.baseURL;

export default function assetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Uploads are served by the API host, while the portfolio can be hosted
  // separately (for example, on Vercel).
  try {
    const base = new URL(apiBase, window.location.origin);
    const url = new URL(raw, base);
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname) && base.hostname !== url.hostname) {
      url.hostname = base.hostname;
      url.port = base.port;
      url.protocol = base.protocol;
    }
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch {
    return '';
  }
  return '';
}

export function staticAssetFallback(value) {
  const raw = String(value || '').trim();
  if (!raw.startsWith('/uploads/')) return '';
  return new URL(raw, window.location.origin).href;
}
