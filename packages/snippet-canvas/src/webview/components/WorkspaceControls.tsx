import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { Slider } from "./controls/Slider";

export function WorkspaceControls({
  zoom,
  onZoom,
  onFit,
}: {
  zoom: number;
  onZoom: (value: number) => void;
  onFit: () => void;
}) {
  const clamp = (v: number) => Math.min(2, Math.max(0.1, v));
  return (
    <div className="zoom-controls">
      <button title="Zoom out" onClick={() => onZoom(clamp(zoom - 0.1))}>
        <Minus size={14} aria-hidden="true" />
      </button>
      <Slider
        ariaLabel="Workspace zoom"
        compact
        min={10}
        max={200}
        step={5}
        value={Math.round(zoom * 100)}
        onChange={(value) => onZoom(value / 100)}
      />
      <button title="Zoom in" onClick={() => onZoom(clamp(zoom + 0.1))}>
        <Plus size={14} aria-hidden="true" />
      </button>
      <button onClick={() => onZoom(1)}><RotateCcw size={13} aria-hidden="true" />100%</button>
      <button onClick={onFit}><Maximize2 size={13} aria-hidden="true" />Fit Page</button>
      <output>{Math.round(zoom * 100)}%</output>
    </div>
  );
}
