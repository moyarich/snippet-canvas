import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutModes,
  type CodeSnippet,
  type ColumnSettings,
  type ComposerSettings,
} from "../types";
import { Column, type ColumnActions } from "./Column";
import { computeLayout } from "../utilities/layout";
import { pageBackground } from "../utilities/stylePresets";
type Props = {
  snippets: CodeSnippet[];
  settings: ComposerSettings;
  columnSettings: Record<string, ColumnSettings>;
  selectedId?: string;
  onSelect: (id?: string) => void;
  remove: (id: string) => void;
  move: (id: string, d: -1 | 1) => void;
  reorder: (from: string, to: string) => void;
  resize: (id: string, patch: Partial<ColumnSettings>) => void;
  reset: (id: string) => void;
  exportColumn: (id: string) => void;
};
export const Page = forwardRef<HTMLDivElement, Props>(
  (
    {
      snippets,
      settings,
      columnSettings,
      selectedId,
      onSelect,
      remove,
      move,
      reorder,
      resize,
      reset,
      exportColumn,
    },
    ref,
  ) => {
    const rootRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
    const [dragging, setDragging] = useState<string>(),
      layout = useMemo(
        () => computeLayout(snippets, settings, columnSettings),
        [snippets, settings, columnSettings],
      ),
      actions = useMemo<ColumnActions>(
        () => ({
          select: (id) => onSelect(selectedId === id ? undefined : id),
          resize,
          reset,
          exportColumn,
          move,
          remove,
          reorder,
          startDragging: setDragging,
          stopDragging: () => setDragging(undefined),
        }),
        [
          onSelect,
          selectedId,
          resize,
          reset,
          exportColumn,
          move,
          remove,
          reorder,
        ],
      );
    const rowsFor = (columns: (typeof layout.pages)[number]["columns"]) =>
      Array.from(new Set(columns.map((column) => column.rowIndex))).map(
        (rowIndex) => ({
          rowIndex,
          columns: columns.filter((column) => column.rowIndex === rowIndex),
        }),
      );
    return (
      <div className="pages" ref={rootRef}>
        {layout.pages.map((page) => (
          <section
            className="page-shell"
            data-page-number={page.index + 1}
            key={page.index}
          >
            <div className="page-label" data-export-ignore="true">
              Page {page.index + 1} of {layout.pages.length}
            </div>
            <div
              className="page"
              style={{
                width: settings.page.width,
                height: settings.page.height,
                padding: settings.page.padding,
                gap: settings.gap,
                background: pageBackground(settings.page),
              }}
            >
              {!page.columns.length && (
                <div className="empty">
                  <b>No snippets yet</b>
                  <span>
                    Select code, right-click, and choose “SnippetCanvas: Add
                    Selection”.
                  </span>
                </div>
              )}
              {rowsFor(page.columns).map((row) => (
                <div
                  className={`column-row ${settings.layout === LayoutModes.GRID ? "grid-row" : settings.layout === LayoutModes.FLOW ? "flow-row" : "fit-row"}`}
                  key={row.rowIndex}
                  style={{ gap: settings.gap }}
                >
                  {row.columns.map((resolved, index) => (
                    <Column
                      key={`${settings.layout}:${resolved.column.id}`}
                      column={resolved.column}
                      index={index}
                      settings={settings}
                      overrides={resolved.overrides}
                      maxWidth={resolved.maxWidth}
                      maxHeight={resolved.maxHeight}
                      minWidth={settings.layout === LayoutModes.FIT ? 1 : 200}
                      minHeight={settings.layout === LayoutModes.FIT ? 1 : 200}
                      fontSize={resolved.fontSize}
                      selected={selectedId === resolved.column.id}
                      dragging={dragging === resolved.column.sourceId}
                      actions={actions}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
);
