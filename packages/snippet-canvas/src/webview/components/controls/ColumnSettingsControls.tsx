import type { ColumnSettings } from "../../types";
import { Slider } from "./Slider";

type Props = {
  value: Required<Pick<ColumnSettings, "width" | "height" | "fontSize" | "lineHeight">>;
  overrides?: ColumnSettings;
  maxWidth: number;
  maxHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxFontSize?: number;
  renderedSize?: { width: number; height: number };
  showInheritance?: boolean;
  labelPrefix?: string;
  onChange: (patch: Partial<ColumnSettings>) => void;
  onReset?: (key: DimensionKey) => void;
};
type DimensionKey = "width" | "height" | "fontSize" | "lineHeight";

export function ColumnSettingsControls({
  value,
  overrides,
  maxWidth,
  maxHeight,
  minWidth = 200,
  minHeight = 200,
  maxFontSize = 200,
  renderedSize,
  showInheritance = false,
  labelPrefix = "Default column",
  onChange,
  onReset,
}: Props) {
  const range = (
    key: DimensionKey,
    label: string,
    min: number,
    max: number,
    step: number,
  ) => {
    const renderedValue = key === "width"
      ? renderedSize?.width
      : key === "height"
        ? renderedSize?.height
        : undefined;
    const actualValue = renderedValue ?? value[key];
    const displayedValue = Math.min(max, Math.max(min, actualValue));
    const inherited = showInheritance && overrides?.[key] === undefined;
    const unit = key === "width" || key === "height" || key === "fontSize" ? " px" : "";
    return <Slider
    label={`${labelPrefix} ${label}`}
    min={min}
    max={max}
    step={step}
    value={displayedValue}
    valueLabel={`${displayedValue}${unit}`}
    actionLabel={!inherited && onReset ? `Use automatic ${labelPrefix.toLowerCase()} ${label}` : undefined}
    onAction={!inherited && onReset ? () => onReset(key) : undefined}
    onChange={(nextValue) => onChange({ [key]: nextValue })}
  />;
  };
  return <>
    {range("width", "width", minWidth, maxWidth, 1)}
    {range("height", "height", minHeight, maxHeight, 1)}
    {range("fontSize", "font size", 1, maxFontSize, 1)}
    {range("lineHeight", "line height", 1.1, 2, .05)}
  </>;
}
