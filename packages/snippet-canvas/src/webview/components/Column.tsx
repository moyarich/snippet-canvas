import {
  memo,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  Download,
  GripVertical,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { ColumnSettings, ComposerSettings } from "../types";
import type {
  ResolvedColumnSettings,
  SnippetColumn,
} from "../utilities/layout";
import { highlightCode } from "../utilities/highlight";

type ResizeEdge = "left" | "right" | "bottom" | "corner";
export type ColumnActions = {
  select: (id: string) => void;
  resize: (id: string, patch: Partial<ColumnSettings>) => void;
  move: (id: string, direction: -1 | 1) => void;
  remove: (id: string) => void;
  reset: (id: string) => void;
  exportColumn: (id: string) => void;
  reorder: (from: string, to: string) => void;
  startDragging: (id: string) => void;
  stopDragging: () => void;
};
type Props = {
  column: SnippetColumn;
  index: number;
  settings: ComposerSettings;
  overrides: ResolvedColumnSettings;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  fontSize: number;
  selected: boolean;
  dragging: boolean;
  actions: ColumnActions;
};

function ColumnView({
  column,
  index,
  settings,
  overrides,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  fontSize,
  selected,
  dragging,
  actions,
}: Props) {
  const isFirst = column.pageIndex === 0;
  const width = Math.min(overrides.width ?? settings.column.width, maxWidth);
  const height = Math.min(
    overrides.height ?? settings.column.height,
    maxHeight,
  );
  const highlighted = highlightCode(column.code, column.language);
  const emphasized = parseLineSelection(
    column.emphasizedLines,
    column.code.split("\n").length,
    column.startLine - column.sourceStartLine,
  );
  const shadow = overrides.shadow.enabled
    ? `${overrides.shadow.x}px ${overrides.shadow.y}px ${overrides.shadow.blur}px ${overrides.shadow.spread}px color-mix(in srgb, ${overrides.shadow.color} ${Math.round(overrides.shadow.opacity * 100)}%, transparent)`
    : "none";
  const resize = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    edge: ResizeEdge;
  }>();
  const [resizing, setResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number }>();

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(undefined);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", keydown);
    };
  }, [contextMenu]);

  const select = () => actions.select(column.id);
  const beginResize = (edge: ResizeEdge) => (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const page = event.currentTarget.closest<HTMLElement>(".page");
    const measuredScale =
      page && page.offsetWidth > 0
        ? page.getBoundingClientRect().width / page.offsetWidth
        : 1;
    const scale =
      Number.isFinite(measuredScale) && measuredScale > 0 ? measuredScale : 1;
    resize.current = {
      x: event.clientX,
      y: event.clientY,
      width,
      height,
      scale,
      edge,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
    if (!selected) select();
  };
  const continueResize = (event: PointerEvent) => {
    const start = resize.current;
    if (!start) return;
    const patch: Partial<ColumnSettings> = {};
    const horizontalDelta = (event.clientX - start.x) / start.scale;
    if (start.edge === "left") {
      patch.width = Math.min(
        maxWidth,
        Math.max(minWidth, Math.round(start.width - horizontalDelta)),
      );
    } else if (start.edge === "right" || start.edge === "corner") {
      patch.width = Math.min(
        maxWidth,
        Math.max(minWidth, Math.round(start.width + horizontalDelta)),
      );
    }
    if (start.edge === "bottom" || start.edge === "corner") {
      patch.height = Math.min(
        maxHeight,
        Math.max(
          minHeight,
          Math.round(start.height + (event.clientY - start.y) / start.scale),
        ),
      );
    }
    actions.resize(column.id, patch);
  };
  const endResize = (event: PointerEvent) => {
    continueResize(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    resize.current = undefined;
    setResizing(false);
  };

  return (
    <article
      data-page-column={index}
      data-column-id={column.id}
      data-column-name={column.title ?? column.fileName}
      onDragOver={(event) => {
        if (isFirst) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!isFirst) return;
        event.preventDefault();
        const from = event.dataTransfer.getData("text/plain");
        if (from) actions.reorder(from, column.sourceId);
      }}
      onClick={select}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selected) select();
        setContextMenu({
          x: Math.max(8, Math.min(event.clientX, window.innerWidth - 218)),
          y: Math.max(8, Math.min(event.clientY, window.innerHeight - 190)),
        });
      }}
      data-syntax-theme={overrides.syntaxTheme}
      className={`snippet frame-${overrides.frameStyle} ${overrides.shadow.enabled ? "shadow" : ""} ${selected ? "selected" : ""} ${dragging ? "dragging" : ""} ${resizing ? "resizing" : ""}`}
      style={
        {
          background: overrides.columnBackground,
          color: overrides.foreground,
          borderRadius: overrides.borderRadius,
          width,
          height,
          boxShadow: shadow,
          transform: `rotate(${overrides.decorations.tilt}deg)`,
          "--sc-focus": overrides.accent,
        } as CSSProperties
      }
    >
      {overrides.showChrome && (
        <header>
          {isFirst ? (
            <div
              className="drag-handle"
              title="Drag to reorder"
              draggable={!resizing}
              onDragStart={(event) => {
                event.stopPropagation();
                actions.startDragging(column.sourceId);
                event.dataTransfer.setData("text/plain", column.sourceId);
              }}
              onDragEnd={(event) => {
                event.stopPropagation();
                actions.stopDragging();
              }}
            >
              <GripVertical size={16} aria-hidden="true" />
            </div>
          ) : (
            <div className="continuation" title="Continued column">
              <CornerDownRight size={14} aria-hidden="true" />
            </div>
          )}
          {overrides.frameStyle === "terminal" && (
            <span className="terminal-mark">›_</span>
          )}
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          {overrides.showFileName && (
            <span
              className="column-title"
              style={{
                fontFamily: overrides.title.fontFamily,
                fontSize: overrides.title.fontSize,
                fontWeight: overrides.title.fontWeight,
                textAlign: overrides.title.alignment,
              }}
            >
              {column.title ?? column.fileName}
              {column.pageCount > 1 &&
                ` · ${column.pageIndex + 1}/${column.pageCount}`}
            </span>
          )}
          {isFirst && (
            <div className="column-actions" data-export-ignore="true">
              <button
                aria-label="Move snippet left"
                title="Move left"
                onClick={(event) => {
                  event.stopPropagation();
                  actions.move(column.sourceId, -1);
                }}
              >
                <ArrowLeft size={13} aria-hidden="true" />
              </button>
              <button
                aria-label="Move snippet right"
                title="Move right"
                onClick={(event) => {
                  event.stopPropagation();
                  actions.move(column.sourceId, 1);
                }}
              >
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button
                aria-label="Remove snippet"
                title="Remove snippet"
                onClick={(event) => {
                  event.stopPropagation();
                  actions.remove(column.sourceId);
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </header>
      )}
      <pre
        className="highlighted-code"
        data-language={highlighted.language}
        data-code-height="true"
        style={{
          fontSize,
          lineHeight: overrides.lineHeight,
          fontFamily: overrides.googleFontFamily || overrides.fontFamily,
          textAlign: overrides.codeAlignment,
          padding: `${overrides.columnPadding}px 0`,
          tabSize: overrides.indentSize,
        }}
      >
        <span
          className="line-emphasis-layer"
          aria-hidden="true"
          style={{ left: 0, right: 0, top: overrides.columnPadding }}
        >
          {column.code.split("\n").map((_, lineIndex) => (
            <i
              className={emphasized.has(lineIndex + 1) ? "emphasized" : ""}
              key={lineIndex}
            />
          ))}
        </span>
        {overrides.showLineNumbers && (
          <span className="line-numbers" style={{ color: overrides.accent }}>
            {column.code.split("\n").map((_, lineIndex) => (
              <em key={lineIndex}>{column.startLine + lineIndex}</em>
            ))}
          </span>
        )}
        <code
          className={`column-snippet hljs language-${highlighted.language}`}
          data-code-width="true"
          style={{
            paddingLeft: overrides.columnPadding,
            paddingRight: overrides.columnPadding,
            tabSize: overrides.indentSize,
          }}
          dangerouslySetInnerHTML={{ __html: highlighted.html }}
        />
      </pre>
      {(overrides.decorations.icon ||
        overrides.decorations.watermark ||
        overrides.decorations.caption) && (
        <div className="column-decorations" aria-hidden="true">
          {overrides.decorations.icon && (
            <span className="column-icon">{overrides.decorations.icon}</span>
          )}
          {overrides.decorations.watermark && (
            <span className="column-watermark">
              {overrides.decorations.watermark}
            </span>
          )}
          {overrides.decorations.caption && (
            <span className="column-caption">
              {overrides.decorations.caption}
            </span>
          )}
        </div>
      )}
      <div
        className="resize-handle resize-left"
        data-export-ignore="true"
        onPointerDown={beginResize("left")}
        onPointerMove={continueResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onClick={(event) => event.stopPropagation()}
      />
      <div
        className="resize-handle resize-right"
        data-export-ignore="true"
        onPointerDown={beginResize("right")}
        onPointerMove={continueResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onClick={(event) => event.stopPropagation()}
      />
      <div
        className="resize-handle resize-bottom"
        data-export-ignore="true"
        onPointerDown={beginResize("bottom")}
        onPointerMove={continueResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onClick={(event) => event.stopPropagation()}
      />
      <div
        className="resize-handle resize-handle-nwse resize-corner"
        data-export-ignore="true"
        onPointerDown={beginResize("corner")}
        onPointerMove={continueResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onClick={(event) => event.stopPropagation()}
      />
      {contextMenu && (
        <div
          className="column-context-menu"
          data-export-ignore="true"
          role="menu"
          aria-label={`Actions for ${column.title ?? column.fileName}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="column-context-title">
            {column.title ?? column.fileName}
          </div>
          <button
            role="menuitem"
            disabled={!isFirst}
            onClick={() => {
              actions.move(column.sourceId, -1);
              setContextMenu(undefined);
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Move left
          </button>
          <button
            role="menuitem"
            disabled={!isFirst}
            onClick={() => {
              actions.move(column.sourceId, 1);
              setContextMenu(undefined);
            }}
          >
            <ArrowRight size={14} aria-hidden="true" />
            Move right
          </button>
          <button
            role="menuitem"
            onClick={() => {
              actions.reset(column.id);
              setContextMenu(undefined);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset column settings
          </button>
          <button
            role="menuitem"
            onClick={() => {
              actions.exportColumn(column.id);
              setContextMenu(undefined);
            }}
          >
            <Download size={14} aria-hidden="true" />
            Export this column as PNG
          </button>
          <div className="column-context-separator" />
          <button
            className="danger"
            role="menuitem"
            onClick={() => {
              actions.remove(column.sourceId);
              setContextMenu(undefined);
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove snippet
          </button>
        </div>
      )}
    </article>
  );
}

function parseLineSelection(
  input: string | undefined,
  lineCount: number,
  offset: number,
) {
  const lines = new Set<number>();
  for (const token of input?.split(",") ?? []) {
    const [rawStart, rawEnd] = token.trim().split("-");
    const start = Number(rawStart),
      end = Number(rawEnd ?? rawStart);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    for (
      let line = Math.max(offset + 1, start);
      line <= Math.min(offset + lineCount, end);
      line++
    )
      lines.add(line - offset);
  }
  return lines;
}

export const Column = memo(
  ColumnView,
  (a, b) =>
    a.column.id === b.column.id &&
    a.column.code === b.column.code &&
    a.column.startLine === b.column.startLine &&
    a.column.language === b.column.language &&
    a.column.title === b.column.title &&
    a.column.emphasizedLines === b.column.emphasizedLines &&
    a.column.pageCount === b.column.pageCount &&
    a.index === b.index &&
    a.settings === b.settings &&
    a.overrides === b.overrides &&
    a.maxWidth === b.maxWidth &&
    a.maxHeight === b.maxHeight &&
    a.minWidth === b.minWidth &&
    a.minHeight === b.minHeight &&
    a.fontSize === b.fontSize &&
    a.selected === b.selected &&
    a.dragging === b.dragging &&
    a.actions === b.actions,
);
