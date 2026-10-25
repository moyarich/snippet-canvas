import {
  LayoutModes,
  type CodeSnippet,
  type ColumnSettings,
  type ComposerSettings,
} from "../../types";
import type {
  DocumentLayout,
  PageLayout,
  ResolvedColumnSettings,
  SnippetColumn,
} from "./layoutTypes";
import { getColumnDefaults } from "../columnSettings";

export function computeLayout(
  snippets: CodeSnippet[],
  settings: ComposerSettings,
  columnOverrides: Record<string, ColumnSettings>,
): DocumentLayout {
  const innerWidth = Math.max(
    1,
    settings.page.width - settings.page.padding * 2,
  );
  const innerHeight = Math.max(
    1,
    settings.page.height - settings.page.padding * 2,
  );
  const fitMaxWidth = Math.max(innerWidth, 5000 - settings.page.padding * 2);
  const fitMaxHeight = Math.max(innerHeight, 5000 - settings.page.padding * 2);
  const columnDefaults = getColumnDefaults(settings);
  const getSettings = (
    columnId: string,
    sourceId: string,
  ): ResolvedColumnSettings => ({
    ...columnDefaults,
    ...(columnOverrides[sourceId] ?? {}),
    ...(columnOverrides[columnId] ?? {}),
  });
  const columns: SnippetColumn[] = snippets.flatMap((source) => {
    if (settings.layout === LayoutModes.FIT)
      return [
        {
          ...source,
          id: `${source.id}:page:0`,
          sourceId: source.id,
          sourceStartLine: source.startLine,
          pageIndex: 0,
          pageCount: 1,
        },
      ];
    const lines = source.code.split("\n");
    const result: SnippetColumn[] = [];
    let offset = 0;
    let pageIndex = 0;
    while (offset < lines.length) {
      const id = `${source.id}:page:${pageIndex}`;
      const columnSettings = getSettings(id, source.id);
      const height = Math.min(columnSettings.height, innerHeight);
      const chromeHeight =
        columnSettings.showChrome && columnSettings.frameStyle !== "none"
          ? columnSettings.frameStyle === "minimal"
            ? 36
            : 44
          : 0;
      const capacity = Math.max(
        1,
        Math.floor(
          (height - chromeHeight - columnSettings.columnPadding * 2) /
            (columnSettings.fontSize * columnSettings.lineHeight),
        ),
      );
      const slice = lines.slice(offset, offset + capacity);
      result.push({
        ...source,
        id,
        sourceId: source.id,
        sourceStartLine: source.startLine,
        pageIndex,
        pageCount: 0,
        code: slice.join("\n"),
        startLine: source.startLine + offset,
        endLine: Math.min(
          source.endLine,
          source.startLine + offset + slice.length - 1,
        ),
      });
      offset += slice.length;
      pageIndex++;
    }
    result.forEach((column) => (column.pageCount = result.length));
    return result;
  });

  const pageColumns: Array<Array<{ column: SnippetColumn; rowIndex: number }>> =
    [[]];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let rowCount = 0;
  let rowIndex = 0;
  for (const column of columns) {
    const own = getSettings(column.id, column.sourceId);
    const width = Math.min(
      own.width,
      settings.layout === LayoutModes.FIT ? fitMaxWidth : innerWidth,
    );
    const height = Math.min(
      own.height,
      settings.layout === LayoutModes.FIT ? fitMaxHeight : innerHeight,
    );
    const startsNewRow =
      settings.layout === LayoutModes.GRID
        ? rowCount >= settings.columns || (x > 0 && x + width > innerWidth)
        : x > 0 && x + width > innerWidth;
    if (startsNewRow) {
      x = 0;
      y += rowHeight + settings.gap;
      rowHeight = 0;
      rowCount = 0;
      rowIndex++;
    }
    if (
      settings.layout !== LayoutModes.FIT &&
      y > 0 &&
      y + height > innerHeight
    ) {
      pageColumns.push([]);
      x = 0;
      y = 0;
      rowHeight = 0;
      rowCount = 0;
      rowIndex = 0;
    }
    pageColumns.at(-1)!.push({ column, rowIndex });
    x += width + settings.gap;
    rowHeight = Math.max(rowHeight, height);
    rowCount++;
  }

  const pages = pageColumns.map(
    (page, index): PageLayout => ({
      index,
      columns: page.map(({ column, rowIndex }) => {
        const own = getSettings(column.id, column.sourceId);
        const maxHeight = settings.layout === LayoutModes.FIT
          ? fitMaxHeight
          : innerHeight;
        const height = Math.min(own.height, maxHeight);
        const maxWidth =
          settings.layout === LayoutModes.FIT ? fitMaxWidth : innerWidth;
        const width = Math.min(own.width, maxWidth);
        return {
          column,
          overrides: own,
          width,
          height,
          maxWidth,
          maxHeight,
          fontSize: own.fontSize,
          rowIndex,
        };
      }),
    }),
  );

  return { pages, innerWidth, innerHeight };
}
