import type { ColumnSettings, ThemeDefinition } from "../../types";
import { Slider } from "./Slider";
import { CODING_FONTS, themePatch } from "../../utilities/stylePresets";
import { Accordion } from "./Accordion";
import { ColorPicker } from "./ColorPicker";

type ResolvedColumnSettings = Required<Omit<ColumnSettings, "scaleFontOnResize">>;

type ColumnAppearanceProps = {
  value: ResolvedColumnSettings;
  overrides?: ColumnSettings;
  showInheritance?: boolean;
  onChange: (patch: Partial<ColumnSettings>) => void;
  defaultColors: string[];
  themes: ThemeDefinition[];
};

export function ColumnAppearanceControls({
  value,
  overrides,
  showInheritance = false,
  onChange,
  defaultColors,
  themes,
}: ColumnAppearanceProps) {
  const check = (
    key: "showChrome" | "showFileName" | "showLineNumbers",
    label: string,
  ) => (
    <label className="check">
      <input
        type="checkbox"
        checked={value[key]}
        onChange={(event) => onChange({ [key]: event.target.checked })}
      />
      {label}
    </label>
  );
  const overriddenCount = Object.keys(overrides ?? {}).filter(
    (key) => !["width", "height", "fontSize", "lineHeight"].includes(key),
  ).length;
  const inheritance = showInheritance
    ? `${overriddenCount} appearance override${overriddenCount === 1 ? "" : "s"}; untouched controls inherit global values.`
    : undefined;
  return (
    <div className="control-subsection">
      <Accordion
        title="Code appearance"
        description={inheritance ?? "Theme, font, spacing, and alignment"}
      >
        <label>
          Syntax theme
          <select
            value={value.syntaxTheme}
            onChange={(event) =>
              onChange(
                themePatch(
                  themes,
                  event.target.value as ResolvedColumnSettings["syntaxTheme"],
                ),
              )
            }
          >
            {themes.map((theme) => (
              <option value={theme.value} key={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <p className="field-help">
          Themes include the code background, text, and accent palette. Editing
          a color below creates a custom palette.
        </p>
        {value.themeColorsCustomized && (
          <div className="custom-theme-badge">
            Custom palette based on{" "}
            {themes.find(({ value: theme }) => theme === value.syntaxTheme)
              ?.label ?? "theme"}
          </div>
        )}
        <div className="inline-colors three">
          <ColorPicker
            label="Column"
            value={value.columnBackground}
            defaultColors={defaultColors}
            onChange={(columnBackground) =>
              onChange({ columnBackground, themeColorsCustomized: true })
            }
          />
          <ColorPicker
            label="Text"
            value={value.foreground}
            defaultColors={defaultColors}
            onChange={(foreground) =>
              onChange({ foreground, themeColorsCustomized: true })
            }
          />
          <ColorPicker
            label="Accent"
            value={value.accent}
            defaultColors={defaultColors}
            onChange={(accent) =>
              onChange({ accent, themeColorsCustomized: true })
            }
          />
        </div>
        <label>
          Coding font
          <select
            value={value.fontFamily}
            onChange={(event) => onChange({ fontFamily: event.target.value })}
          >
            {CODING_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>
        <label>
          Any Google Font
          <input
            className="text-input"
            value={value.googleFontFamily}
            placeholder="e.g. Geist Mono"
            onChange={(event) =>
              onChange({ googleFontFamily: event.target.value })
            }
          />
        </label>
        <p className="field-help">
          Enter any family from Google Fonts. Leave blank to use the coding font
          above.
        </p>
        <Slider
          label="Internal padding"
          min={0}
          max={80}
          value={value.columnPadding}
          onChange={(columnPadding) => onChange({ columnPadding })}
        />
        <Slider
          label="Tab width"
          min={1}
          max={8}
          value={value.indentSize}
          onChange={(indentSize) => onChange({ indentSize })}
        />
        <label>
          Code alignment
          <select
            value={value.codeAlignment}
            onChange={(event) =>
              onChange({
                codeAlignment: event.target
                  .value as ResolvedColumnSettings["codeAlignment"],
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </Accordion>
      <Accordion
        title="Window frame"
        description={inheritance ?? "Chrome, corners, and shadow"}
      >
        <Slider
          label="Corners"
          min={0}
          max={32}
          value={value.borderRadius}
          onChange={(borderRadius) => onChange({ borderRadius })}
        />
        <label>
          Window frame
          <select
            value={value.frameStyle}
            onChange={(event) =>
              onChange({
                frameStyle: event.target
                  .value as ResolvedColumnSettings["frameStyle"],
                showChrome: event.target.value !== "none",
              })
            }
          >
            <option value="macos">macOS</option>
            <option value="minimal">Minimal</option>
            <option value="terminal">Terminal</option>
            <option value="none">None</option>
          </select>
        </label>
        {check("showChrome", "Window chrome")}
        {check("showFileName", "File name")}
        {check("showLineNumbers", "Line numbers")}
        <label className="check">
          <input
            type="checkbox"
            checked={value.shadow.enabled}
            onChange={(event) =>
              onChange({
                shadow: { ...value.shadow, enabled: event.target.checked },
              })
            }
          />
          Drop shadow
        </label>
        {value.shadow.enabled && (
          <div className="nested-controls">
            <Slider
              label="Shadow X"
              min={-50}
              max={50}
              value={value.shadow.x}
              onChange={(x) => onChange({ shadow: { ...value.shadow, x } })}
            />
            <Slider
              label="Shadow Y"
              min={-50}
              max={80}
              value={value.shadow.y}
              onChange={(y) => onChange({ shadow: { ...value.shadow, y } })}
            />
            <Slider
              label="Shadow blur"
              min={0}
              max={100}
              value={value.shadow.blur}
              onChange={(blur) =>
                onChange({ shadow: { ...value.shadow, blur } })
              }
            />
            <Slider
              label="Shadow spread"
              min={-30}
              max={50}
              value={value.shadow.spread}
              onChange={(spread) =>
                onChange({ shadow: { ...value.shadow, spread } })
              }
            />
            <Slider
              label="Shadow opacity"
              min={0}
              max={1}
              step={0.05}
              value={value.shadow.opacity}
              onChange={(opacity) =>
                onChange({ shadow: { ...value.shadow, opacity } })
              }
            />
            <ColorPicker
              label="Shadow color"
              value={value.shadow.color}
              defaultColors={defaultColors}
              onChange={(color) =>
                onChange({ shadow: { ...value.shadow, color } })
              }
            />
          </div>
        )}
      </Accordion>
      <Accordion
        title="Title styling"
        description={inheritance ?? "Header typography and alignment"}
      >
        <Slider
          label="Title font size"
          min={8}
          max={40}
          value={value.title.fontSize}
          onChange={(fontSize) =>
            onChange({ title: { ...value.title, fontSize } })
          }
        />
        <Slider
          label="Title weight"
          min={400}
          max={800}
          step={100}
          value={value.title.fontWeight}
          onChange={(fontWeight) =>
            onChange({ title: { ...value.title, fontWeight } })
          }
        />
        <label>
          Title font
          <input
            className="text-input"
            value={value.title.fontFamily}
            onChange={(event) =>
              onChange({
                title: { ...value.title, fontFamily: event.target.value },
              })
            }
          />
        </label>
        <label>
          Title alignment
          <select
            value={value.title.alignment}
            onChange={(event) =>
              onChange({
                title: {
                  ...value.title,
                  alignment: event.target
                    .value as ResolvedColumnSettings["title"]["alignment"],
                },
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <button
          className="reset compact-reset"
          onClick={() =>
            onChange({
              title: {
                fontSize: 12,
                fontFamily: "Inter",
                alignment: "left",
                fontWeight: 600,
              },
            })
          }
        >
          Reset title styling
        </button>
      </Accordion>
      <Accordion
        title="Decorations"
        description={inheritance ?? "Caption, watermark, icon, and tilt"}
      >
        <label>
          Caption
          <input
            className="text-input"
            value={value.decorations.caption}
            onChange={(event) =>
              onChange({
                decorations: {
                  ...value.decorations,
                  caption: event.target.value,
                },
              })
            }
          />
        </label>
        <label>
          Watermark
          <input
            className="text-input"
            value={value.decorations.watermark}
            onChange={(event) =>
              onChange({
                decorations: {
                  ...value.decorations,
                  watermark: event.target.value,
                },
              })
            }
          />
        </label>
        <label>
          Icon or emoji
          <input
            className="text-input"
            value={value.decorations.icon}
            onChange={(event) =>
              onChange({
                decorations: { ...value.decorations, icon: event.target.value },
              })
            }
          />
        </label>
        <Slider
          label="Tilt"
          min={-8}
          max={8}
          step={0.5}
          value={value.decorations.tilt}
          valueLabel={`${value.decorations.tilt}°`}
          onChange={(tilt) =>
            onChange({ decorations: { ...value.decorations, tilt } })
          }
        />
        <button
          className="reset compact-reset"
          onClick={() =>
            onChange({
              decorations: { caption: "", watermark: "", icon: "", tilt: 0 },
            })
          }
        >
          Clear decorations
        </button>
      </Accordion>
    </div>
  );
}
