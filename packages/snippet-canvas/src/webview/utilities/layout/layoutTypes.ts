import type { CodeSnippet, ColumnSettings } from "../../types";

export type SnippetColumn = CodeSnippet & {
  sourceId: string;
  pageIndex: number;
  pageCount: number;
  sourceStartLine: number;
};

export type ResolvedColumnSettings = Required<Omit<ColumnSettings, "scaleFontOnResize">>;

export type ColumnLayout = {
  column: SnippetColumn;
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  fontSize: number;
  rowIndex: number;
  overrides: ResolvedColumnSettings;
};

export type PageLayout = { index: number; columns: ColumnLayout[] };

export type DocumentLayout = {
  pages: PageLayout[];
  innerWidth: number;
  innerHeight: number;
};
