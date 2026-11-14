import api from "../services/api";

const apiBase = api.defaults.baseURL;

export default function assetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // Uploads are served by the API host, while the portfolio can be hosted
  // separately (for example, on Vercel).
  try {
    const base = new URL(apiBase, window.location.origin);
    const url = new URL(raw, base);
    if (
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname) &&
      base.hostname !== url.hostname
    ) {
      url.hostname = base.hostname;
      url.port = base.port;
      url.protocol = base.protocol;
    }
    if (["http:", "https:"].includes(url.protocol)) return url.href;
  } catch {
    return "";
  }
  return "";
}

export function downloadAssetUrl(value) {
  const resolved = assetUrl(value);
  if (!resolved) return "";

  try {
    const url = new URL(resolved);
    if (
      url.pathname.startsWith("/uploads/") &&
      !url.pathname.startsWith("/uploads/download/")
    ) {
      const filename = decodeURIComponent(
        url.pathname.slice("/uploads/".length),
      );
      if (filename && !filename.includes("/")) {
        url.pathname = `/uploads/download/${encodeURIComponent(filename)}`;
      }
    } else if (/^\/api\/media\/[a-f\d]{24}$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(
        "/api/media/",
        "/api/media/download/",
      );
    }
    return url.href;
  } catch {
    return "";
  }
}

export function staticAssetFallback(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    if (!url.pathname.startsWith("/uploads/")) return "";
    return new URL(url.pathname, window.location.origin).href;
  } catch {
    return "";
  }
}
