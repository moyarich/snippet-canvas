import type { CSSProperties } from "react";
import { RotateCcw } from "lucide-react";

type SliderProps = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueLabel?: string;
  ariaLabel?: string;
  disabled?: boolean;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onChange: (value: number) => void;
};

/** Consistent range input with an accessible label and a visual progress track. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  valueLabel,
  ariaLabel,
  disabled = false,
  compact = false,
  actionLabel,
  onAction,
  onChange,
}: SliderProps) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const style = { "--slider-progress": `${Math.min(100, Math.max(0, progress))}%` } as CSSProperties;
  const input = <input
    className="slider-input"
    aria-label={ariaLabel ?? label}
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    disabled={disabled}
    style={style}
    onChange={(event) => onChange(Number(event.target.value))}
  />;

  if (compact || !label) return input;
  return <label className="slider-field">
    <span className="slider-label">{label}</span>
    <output className="slider-value">{valueLabel ?? value}</output>
    {actionLabel && onAction && <button className="slider-action" type="button" aria-label={actionLabel} title={actionLabel} onClick={onAction}><RotateCcw size={13} aria-hidden="true" /></button>}
    {input}
    <span className="slider-bounds" aria-hidden="true"><span>{min}</span><span>{max}</span></span>
  </label>;
}
