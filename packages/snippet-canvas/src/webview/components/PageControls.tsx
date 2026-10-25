import { LayoutModes, type ComposerSettings, type ComposerSettingsPatch, type PageSettings } from "../types";
import { Slider } from "./controls/Slider";
import { Accordion } from "./controls/Accordion";
import { ColorPicker } from "./controls/ColorPicker";
import { RotateCcw } from "lucide-react";
export function PageControls({
  value: v,
  onChange,
  defaultColors,
  defaults,
  renderedPageSize,
}: {
  value: ComposerSettings;
  onChange: (p: ComposerSettingsPatch) => void;
  defaultColors: string[];
  defaults: PageSettings;
  renderedPageSize: { width: number; height: number };
}) {
  const backgroundSource = v.page.backgroundType === "image"
    ? "image"
    : "paint";
  const paintValue = v.page.backgroundType === "gradient" ? v.page.gradient : v.page.background;
  const updatePaint = (paint: string) => {
    const gradient = /^\s*(?:linear|radial)-gradient\(/i.test(paint);
    onChange({ page: gradient
      ? { backgroundType: "gradient", gradient: paint }
      : { backgroundType: "solid", background: paint } });
  };
  const resetPage = v.layout === LayoutModes.FIT
    ? { ...defaults, width: 1, height: 1 }
    : defaults;
  const backgroundChanged = v.page.backgroundType !== defaults.backgroundType
    || v.page.background !== defaults.background
    || v.page.gradient !== defaults.gradient
    || v.page.backgroundImage !== defaults.backgroundImage;
  const range = (
    label: keyof PageSettings,
    title: string,
    min: number,
    max: number,
    step = 1,
  ) => {
    const configuredValue = Number(v.page[label]);
    const renderedValue = v.layout === LayoutModes.FIT && (label === "width" || label === "height")
      ? renderedPageSize[label]
      : configuredValue;
    const unit = label === "width" || label === "height" || label === "padding" ? " px" : "";
    return <Slider label={title} min={min} max={max} step={step} value={renderedValue}
    valueLabel={`${renderedValue}${unit}`}
    actionLabel={v.page[label] !== resetPage[label]
      ? v.layout === LayoutModes.FIT && (label === "width" || label === "height")
        ? `Let content determine page ${label}`
        : `Reset ${title.toLowerCase()}`
      : undefined}
    onAction={v.page[label] !== resetPage[label] ? () => onChange({ page: { [label]: resetPage[label] } }) : undefined}
    onChange={(value) => onChange({ page: { [label]: value } })} />;
  };
  return (
    <section>
      <h3>Page</h3>
      <p className="hint">
        {v.layout === LayoutModes.FIT
          ? "Fit grows the page beyond these minimum dimensions when the code needs more room."
          : "The page dimensions below are used exactly for preview and export."}
      </p>
      <label>
        Size preset
        <select
          value={
            v.page.width === 2550 && v.page.height === 3300
              ? "letter-p"
              : v.page.width === 3300 && v.page.height === 2550
                ? "letter-l"
                : v.page.width === 2480 && v.page.height === 3508
                  ? "a4-p"
                  : "custom"
          }
          onChange={(e) => {
            const sizes: Record<string, [number, number]> = {
                "letter-p": [2550, 3300],
                "letter-l": [3300, 2550],
                "a4-p": [2480, 3508],
              },
              size = sizes[e.target.value];
            if (size) onChange({ page: { width: size[0], height: size[1] } });
          }}
        >
          <option value="custom">Custom</option>
          <option value="letter-p">US Letter · Portrait (2550 × 3300)</option>
          <option value="letter-l">US Letter · Landscape (3300 × 2550)</option>
          <option value="a4-p">A4 · Portrait (2480 × 3508)</option>
        </select>
      </label>
      {range("width", v.layout === LayoutModes.FIT ? "Minimum page width (px)" : "Page width (px)", v.layout === LayoutModes.FIT ? 1 : 500, 5000, 1)}
      {range("height", v.layout === LayoutModes.FIT ? "Minimum page height (px)" : "Page height (px)", v.layout === LayoutModes.FIT ? 1 : 500, 5000, 1)}
      {range("padding", "Page padding", 0, 240)}
      <Accordion title="Background" description="Color, gradient, image, or transparency">
        <label>Source<select aria-label="Background source" value={backgroundSource} onChange={(e) => onChange({ page: { backgroundType: e.target.value === "paint" ? "solid" : e.target.value as PageSettings["backgroundType"] } })}>
          <option value="paint">Paint</option><option value="image">Image URL</option>
        </select></label>
        {backgroundSource === "paint" && <ColorPicker label="Paint" value={paintValue} defaultColors={defaultColors} gradient solid showAlpha defaultActiveTab={v.page.backgroundType === "gradient" ? "gradient" : "solid"} onChangeTabs={(tab) => updatePaint(tab === "gradient" ? v.page.gradient : v.page.background)} onChange={updatePaint} />}
        {v.page.backgroundType === "image" && <label>Image URL<input className="text-input" type="url" value={v.page.backgroundImage} placeholder="https://…" onChange={(e) => onChange({ page: { backgroundImage: e.target.value } })} /></label>}
        {backgroundChanged && <button className="reset compact-reset" type="button" onClick={() => onChange({ page: {
          backgroundType: defaults.backgroundType,
          background: defaults.background,
          gradient: defaults.gradient,
          backgroundImage: defaults.backgroundImage,
        } })}>
          <RotateCcw size={14} aria-hidden="true" />
          Reset background
        </button>}
      </Accordion>
      <button className="reset page-reset" type="button" onClick={() => onChange({ page: { ...resetPage } })}>
        <RotateCcw size={14} aria-hidden="true" />
        {v.layout === LayoutModes.FIT ? "Reset all Fit page settings" : "Reset all page settings"}
      </button>
    </section>
  );
}
