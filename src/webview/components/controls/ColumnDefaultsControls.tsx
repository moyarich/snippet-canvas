import {
  LayoutModes,
  type ComposerSettings,
  type ComposerSettingsPatch,
  type ThemeDefinition,
} from "../../types";
import { ColumnSettingsControls } from "./ColumnSettingsControls";
import { Slider } from "./Slider";
import { STYLE_PRESETS } from "../../utilities/stylePresets";
import { Accordion } from "./Accordion";
import { ColumnAppearanceControls } from "./AppearanceControls";
import { getColumnDefaults } from "../../utilities/columnSettings";

export function ColumnDefaultsControls({
  value,
  defaults,
  scaleFontOnResize,
  onScaleFontOnResizeChange,
  onChange,
  defaultColors,
  themes,
}: {
  value: ComposerSettings;
  defaults: ComposerSettings;
  scaleFontOnResize: boolean;
  onScaleFontOnResizeChange: (enabled: boolean) => void;
  onChange: (patch: ComposerSettingsPatch) => void;
  defaultColors: string[];
  themes: ThemeDefinition[];
}) {
  const innerWidth = Math.max(1, value.page.width - value.page.padding * 2);
  const maxWidth = Math.max(
    200,
    value.layout === LayoutModes.FIT
      ? 5000 - value.page.padding * 2
      : innerWidth,
  );
  const maxHeight = Math.max(
    200,
    value.layout === LayoutModes.FIT
      ? 5000 - value.page.padding * 2
      : value.page.height - value.page.padding * 2,
  );
  const fitWidth = (columns = value.columns) =>
    Math.max(1, Math.floor((innerWidth - value.gap * (columns - 1)) / columns));
  const resolved = getColumnDefaults(value);
  return (
    <section>
      <h3>Columns</h3>
      <p className="hint">Columns are code panels arranged inside the page.</p>
      <label>
        Style preset
        <select
          defaultValue=""
          onChange={(event) => {
            const preset = STYLE_PRESETS.find(
              ({ name }) => name === event.target.value,
            );
            if (preset) onChange(preset.patch);
            event.target.value = "";
          }}
        >
          <option value="" disabled>
            Choose a preset…
          </option>
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} · {preset.description}
            </option>
          ))}
        </select>
      </label>
      <Accordion
        title="Layout & size"
        description="Dimensions and spacing"
        defaultOpen
      >
        {value.layout === LayoutModes.GRID && (
          <Slider
            label="Maximum columns per row"
            min={1}
            max={4}
            value={value.columns}
            onChange={(columns) =>
              onChange({ columns, column: { width: fitWidth(columns) } })
            }
          />
        )}
        <ColumnSettingsControls
          value={value.column}
          minWidth={value.layout === LayoutModes.FIT ? 1 : 200}
          minHeight={value.layout === LayoutModes.FIT ? 1 : 200}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          onChange={(column) => onChange({ column })}
          onReset={(key) => onChange({ column: { [key]: defaults.column[key] } })}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={scaleFontOnResize}
            onChange={(event) => onScaleFontOnResizeChange(event.target.checked)}
          />
          Scale font with column size
        </label>
        <p className="field-help">When enabled, resizing a column also scales its code font proportionally.</p>
        <Slider
          label="Column gap"
          min={0}
          max={120}
          value={value.gap}
          actionLabel={value.gap !== defaults.gap ? "Reset column gap" : undefined}
          onAction={value.gap !== defaults.gap ? () => onChange({ gap: defaults.gap }) : undefined}
          onChange={(gap) => onChange({ gap })}
        />
      </Accordion>
      <ColumnAppearanceControls
        value={resolved}
        defaultColors={defaultColors}
        themes={themes}
        onChange={(column) => onChange({ column })}
      />
    </section>
  );
}
