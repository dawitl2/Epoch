"use client";

import type { GeographyAlert } from "@/src/lib/contracts";

function relativeTime(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

export function AlertPanel({ alert, onClose }: { alert: GeographyAlert; onClose: () => void }) {
  return (
    <aside className="country-panel alert-panel panel-swap" aria-live="polite">
      <header className="alert-panel__header">
        <button type="button" className="plain-back" onClick={onClose}>← Return to country view</button>
        <p className="micro-label">Live geography alert · USGS</p>
        <div className="alert-magnitude"><span>M</span><strong>{alert.magnitude.toFixed(1)}</strong></div>
        <h1>{alert.place}</h1>
      </header>
      <div className="alert-panel__body">
        <p className="alert-panel__detail">{alert.detail}</p>
        <dl className="country-facts">
          <div><dt>Recorded</dt><dd>{relativeTime(alert.occurredAt)}</dd></div>
          <div><dt>Depth</dt><dd>{alert.depthKm} km</dd></div>
          <div><dt>Latitude</dt><dd>{alert.latitude.toFixed(3)}°</dd></div>
          <div><dt>Longitude</dt><dd>{alert.longitude.toFixed(3)}°</dd></div>
        </dl>
        <div className="alert-panel__coordinates">{alert.latitude.toFixed(4)} / {alert.longitude.toFixed(4)}</div>
        <a className="black-button alert-source-link" href={alert.sourceUrl} target="_blank" rel="noreferrer">Open USGS event report ↗</a>
        <p className="alert-disclaimer">Earthquake markers are informational and refresh from the USGS daily feed. They are not emergency instructions.</p>
      </div>
    </aside>
  );
}
