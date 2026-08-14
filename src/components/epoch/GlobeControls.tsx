"use client";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onNorth: () => void;
};

export function GlobeControls({ onZoomIn, onZoomOut, onReset, onNorth }: Props) {
  return (
    <div className="globe-controls" role="group" aria-label="Globe controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">+</button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">−</button>
      <button type="button" onClick={onReset} aria-label="Reset globe" title="Reset globe">↺</button>
      <button type="button" onClick={onNorth} aria-label="Orient north" title="Orient north"><strong>N</strong></button>
    </div>
  );
}
