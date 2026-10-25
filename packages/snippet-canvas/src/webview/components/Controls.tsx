import { Check } from "lucide-react";
import { LayoutModes, type CodeSnippet, type ColumnSettings, type ComposerSettings, type ComposerSettingsPatch, type ThemeDefinition } from "../types";
import { PageControls } from "./PageControls";
import { ColumnDefaultsControls } from "./controls/ColumnDefaultsControls";
import { ControlsPanel } from "./controls/ControlsPanel";
import { ExportControls } from "./controls/ExportControls";
import type { ExportOptions } from "./controls/ExportControls";
import { SelectedColumnControls } from "./controls/SelectedColumnControls";

type Props = {
  value: ComposerSettings;
  onChange: (patch: ComposerSettingsPatch) => void;
  onExport: (options: ExportOptions) => void;
  onCopy: (options: ExportOptions) => void;
  selected?: CodeSnippet;
  selectedColumnSettings?: ColumnSettings;
  renderedColumnSize?: { width: number; height: number };
  onColumnSettingsChange: (patch: Partial<ColumnSettings>) => void;
  onColumnSettingsReset: () => void;
  onLanguageChange: (language: string) => void;
  onSnippetPresentationChange: (patch: Partial<Pick<CodeSnippet, "title" | "emphasizedLines">>) => void;
  defaultColors: string[];
  themes: ThemeDefinition[];
  renderedPageSize: { width: number; height: number };
  pageDefaults: ComposerSettings["page"];
  settingsDefaults: ComposerSettings;
  scaleFontOnResize: boolean;
  onScaleFontOnResizeChange: (enabled: boolean) => void;
};

export function Controls(props: Props) {
  return <ControlsPanel
    header={<div className="brand"><b>SC</b><div><strong>SnippetCanvas</strong><small>Code composition studio</small></div></div>}
    mode={<section className="layout-mode-control" aria-labelledby="layout-mode-label">
      <div className="control-heading"><strong id="layout-mode-label">Layout mode</strong><small>Arrange code across pages</small></div>
      <div className="seg">
        {Object.values(LayoutModes).map((layout) => {
          const selected = props.value.layout === layout;
          return <button key={layout} aria-pressed={selected} className={selected ? "active" : ""} onClick={() => {
            if (layout === LayoutModes.FIT) {
              props.onChange({ layout, page: { width: 1, height: 1 } });
              return;
            }
            const page = props.value.page.width < 500 || props.value.page.height < 500
              ? {
                  width: Math.max(500, props.settingsDefaults.page.width),
                  height: Math.max(500, props.settingsDefaults.page.height),
                }
              : undefined;
            const targetInnerWidth = Math.max(
              1,
              (page?.width ?? props.value.page.width) - props.value.page.padding * 2,
            );
            const targetGridWidth = Math.max(
              1,
              Math.floor((targetInnerWidth - props.value.gap * (props.value.columns - 1)) / props.value.columns),
            );
            props.onChange(layout === LayoutModes.GRID
              ? { layout, page, column: { width: targetGridWidth } }
              : { layout, page });
          }}>
            {selected && <Check size={13} strokeWidth={3} aria-hidden="true" />}
            <span>{layout[0].toUpperCase() + layout.slice(1)}</span>
          </button>;
        })}
      </div>
      {props.value.layout === LayoutModes.FIT && <p className="mode-status">Page size automatically fits all visible code.</p>}
    </section>}
    page={<PageControls value={props.value} defaults={props.pageDefaults} renderedPageSize={props.renderedPageSize} defaultColors={props.defaultColors} onChange={props.onChange} />}
    columns={<ColumnDefaultsControls value={props.value} defaults={props.settingsDefaults} scaleFontOnResize={props.scaleFontOnResize} onScaleFontOnResizeChange={props.onScaleFontOnResizeChange} defaultColors={props.defaultColors} themes={props.themes} onChange={props.onChange} />}
    selection={<SelectedColumnControls selected={props.selected} value={props.value} scaleFontOnResize={props.scaleFontOnResize} defaultColors={props.defaultColors} themes={props.themes} columnSettings={props.selectedColumnSettings} renderedColumnSize={props.renderedColumnSize} onChange={props.onColumnSettingsChange} onReset={props.onColumnSettingsReset} onLanguageChange={props.onLanguageChange} onPresentationChange={props.onSnippetPresentationChange} />}
    actions={<ExportControls
      onExport={props.onExport}
      onCopy={props.onCopy}
      pageWidth={props.value.layout === LayoutModes.FIT ? props.renderedPageSize.width : props.value.page.width}
      pageHeight={props.value.layout === LayoutModes.FIT ? props.renderedPageSize.height : props.value.page.height}
      contentSized={props.value.layout === LayoutModes.FIT}
    />}
    selectionAvailable={Boolean(props.selected)}
  />;
}
