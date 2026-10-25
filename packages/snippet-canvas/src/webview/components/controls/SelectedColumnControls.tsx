import {
  LayoutModes,
  type CodeSnippet,
  type ColumnSettings,
  type ComposerSettings,
  type ThemeDefinition,
} from "../../types";
import { LANGUAGE_OPTIONS } from "../../utilities/highlight";
import { ColumnSettingsControls } from "./ColumnSettingsControls";
import { ColumnAppearanceControls } from "./AppearanceControls";
import { resolveColumnSettings } from "../../utilities/columnSettings";
import { RotateCcw } from "lucide-react";

type Props = {
  selected?: CodeSnippet;
  value: ComposerSettings;
  scaleFontOnResize: boolean;
  columnSettings?: ColumnSettings;
  renderedColumnSize?: { width: number; height: number };
  onChange: (patch: Partial<ColumnSettings>) => void;
  onReset: () => void;
  onLanguageChange: (language: string) => void;
  onPresentationChange: (
    patch: Partial<Pick<CodeSnippet, "title" | "emphasizedLines">>,
  ) => void;
  defaultColors: string[];
  themes: ThemeDefinition[];
};

export function SelectedColumnControls(props: Props) {
  const { selected, value, columnSettings } = props;
  if (!selected)
    return (
      <section className="individual-options">
        <h3>Selected column</h3>
        <p className="hint">
          Select a column on the page to override its settings.
        </p>
      </section>
    );
  const maxWidth = Math.max(
    200,
    (value.layout === LayoutModes.FIT ? 5000 : value.page.width) -
      value.page.padding * 2,
  );
  const maxHeight = Math.max(
    200,
    (value.layout === LayoutModes.FIT ? 5000 : value.page.height) -
      value.page.padding * 2,
  );
  const resolved = resolveColumnSettings(value, columnSettings);
  const scaleFontOnResize = columnSettings?.scaleFontOnResize
    ?? props.scaleFontOnResize;
  return (
    <section className="individual-options">
      <h3>Selected column</h3>
      <div className="field-group title-field">
        <label htmlFor="selected-column-title">Title</label>
        <div className="input-with-action">
          <input
            id="selected-column-title"
            className="text-input"
            value={selected.title ?? ""}
            placeholder={selected.fileName}
            onChange={(event) =>
              props.onPresentationChange({
                title: event.target.value || undefined,
              })
            }
          />
          <button
            type="button"
            aria-label="Reset title to filename"
            title="Reset title to filename"
            disabled={!selected.title}
            onClick={() => props.onPresentationChange({ title: undefined })}
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <label>
        Language
        <select
          value={selected.language}
          onChange={(event) => props.onLanguageChange(event.target.value)}
        >
          {!LANGUAGE_OPTIONS.includes(selected.language) && (
            <option value={selected.language}>{selected.language}</option>
          )}
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </label>
      <label>
        Emphasize lines
        <input
          className="text-input"
          value={selected.emphasizedLines ?? ""}
          placeholder="3, 5-8"
          onChange={(event) =>
            props.onPresentationChange({ emphasizedLines: event.target.value })
          }
        />
      </label>
      <p className="field-help">
        Use snippet-relative line numbers, such as 3, 5-8.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={scaleFontOnResize}
          onChange={(event) =>
            props.onChange({ scaleFontOnResize: event.target.checked })
          }
        />
        Scale font with column size
      </label>
      <p className="field-help">
        Automatically fits the code font when this column is resized.
        {columnSettings?.scaleFontOnResize === undefined
          ? ` Using the global ${props.scaleFontOnResize ? "on" : "off"} setting.`
          : " This column overrides the global setting."}
      </p>
      {columnSettings?.scaleFontOnResize !== undefined && (
        <button
          className="reset compact-reset"
          type="button"
          onClick={() => props.onChange({ scaleFontOnResize: undefined })}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Use global font scaling
        </button>
      )}
      <ColumnSettingsControls
        value={resolved}
        overrides={columnSettings}
        renderedSize={props.renderedColumnSize}
        minWidth={value.layout === LayoutModes.FIT ? 1 : 200}
        minHeight={value.layout === LayoutModes.FIT ? 1 : 200}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        showInheritance
        labelPrefix="Column"
        onChange={props.onChange}
        onReset={(key) => props.onChange({ [key]: undefined })}
      />
      <ColumnAppearanceControls
        value={resolved}
        overrides={columnSettings}
        defaultColors={props.defaultColors}
        themes={props.themes}
        showInheritance
        onChange={props.onChange}
      />
      <button className="reset" onClick={props.onReset}>
        Use global column settings
      </button>
    </section>
  );
}
