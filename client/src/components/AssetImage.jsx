import { useEffect, useState } from "react";
import assetUrl, { staticAssetFallback } from "../utils/assetUrl";

export default function AssetImage({
  value,
  alt = "",
  className = "",
  fallbackLabel = "Image unavailable",
  fallback = null,
  ...imageProps
}) {
  const primary = assetUrl(value);
  const secondary = staticAssetFallback(value);
  const [source, setSource] = useState(primary);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(!primary);

  useEffect(() => {
    setSource(primary);
    setTriedFallback(false);
    setFailed(!primary);
  }, [primary, secondary]);

  function handleError() {
    if (!triedFallback && secondary && secondary !== source) {
      setTriedFallback(true);
      setSource(secondary);
      return;
    }
    setFailed(true);
  }

  if (failed) {
    return (
      <div
        className={`asset-unavailable ${className}`.trim()}
        role="img"
        aria-label={alt ? `${alt} unavailable` : fallbackLabel}
      >
        {fallback || <span>{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      className={className}
      src={source}
      alt={alt}
      onError={handleError}
    />
  );
}
