export const LayoutModes = { FIT: "fit", GRID: "grid", FLOW: "flow" } as const;
export type LayoutMode = typeof LayoutModes[keyof typeof LayoutModes];
export type ExportFormat = "png" | "jpeg" | "svg" | "pdf";
export interface CodeSnippet {
  id: string;
  title?: string;
  fileName: string;
  filePath: string;
  sourceUri: string;
  language: string;
  code: string;
  startLine: number;
  endLine: number;
  startCharacter: number;
  endCharacter: number;
  createdAt: number;
  emphasizedLines?: string;
}
export type SyntaxTheme = "midnight" | "github-dark" | "dracula" | "nord" | "one-dark" | "solarized-light";
export interface ThemeDefinition { value: SyntaxTheme; label: string; palette: { columnBackground: string; foreground: string; accent: string } }
export type WindowFrameStyle = "macos" | "minimal" | "terminal" | "none";
export interface ShadowSettings { enabled: boolean; x: number; y: number; blur: number; spread: number; opacity: number; color: string; }
export interface TitleSettings { fontSize: number; fontFamily: string; alignment: "left" | "center" | "right"; fontWeight: number; }
export interface DecorationSettings { caption: string; watermark: string; icon: string; tilt: number; }
export interface ComposerSettings {
  layout: LayoutMode;
  columns: number;
  gap: number;
  page: PageSettings;
  column: Required<Omit<ColumnSettings, "scaleFontOnResize">>;
}
export interface PageSettings {
  width: number;
  height: number;
  padding: number;
  background: string;
  backgroundType: "solid" | "gradient" | "image";
  gradient: string;
  backgroundImage: string;
}
export interface ColumnSettings {
  scaleFontOnResize?: boolean;
  width?: number;
  height?: number;
  fontSize?: number;
  lineHeight?: number;
  columnBackground?: string;
  foreground?: string;
  accent?: string;
  syntaxTheme?: SyntaxTheme;
  themeColorsCustomized?: boolean;
  fontFamily?: string;
  googleFontFamily?: string;
  columnPadding?: number;
  indentSize?: number;
  codeAlignment?: "left" | "center" | "right";
  borderRadius?: number;
  shadow?: ShadowSettings;
  showChrome?: boolean;
  showFileName?: boolean;
  showLineNumbers?: boolean;
  frameStyle?: WindowFrameStyle;
  title?: TitleSettings;
  decorations?: DecorationSettings;
}
export interface SnippetCanvasDocument {
  snippets: CodeSnippet[];
  settings: ComposerSettings;
  columnSettings: Record<string, ColumnSettings>;
}
export interface WebviewConfiguration {
  settings: ComposerSettings;
  defaultColors: string[];
  themes: ThemeDefinition[];
  scaleFontOnResize: boolean;
}
export type HostToWebview =
  | { type: "hydrate"; payload: SnippetCanvasDocument }
  | { type: "configurationChanged"; payload: WebviewConfiguration }
  | { type: "snippetAdded"; payload: CodeSnippet }
  | { type: "cleared" };
export type WebviewToHost =
  | { type: "ready" }
  | { type: "setScaleFontOnResize"; payload: { enabled: boolean } }
  | { type: "saveState"; payload: SnippetCanvasDocument }
  | { type: "removeSnippet"; payload: { id: string } }
  | { type: "reorderSnippets"; payload: { ids: string[] } }
  | { type: "exportPng"; payload: { dataUrl: string; suggestedName: string } }
  | { type: "exportFiles"; payload: { dataUrls: string[]; suggestedName: string; format: ExportFormat } }
  | { type: "copyImage"; payload: { dataUrl: string } }
  | {
      type: "showMessage";
      payload: { message: string; kind?: "info" | "error" };
    };
export type MultiPageExport = {
  type: "exportPngPages";
  payload: { dataUrls: string[]; suggestedName: string };
};
