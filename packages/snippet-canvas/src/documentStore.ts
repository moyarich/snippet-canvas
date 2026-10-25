import * as vscode from "vscode";
import { LayoutModes } from "./protocol";
import type {
  ColumnSettings,
  ComposerSettings,
  SnippetCanvasDocument,
  SyntaxTheme,
  ThemeDefinition,
} from "./protocol";

const STATE_KEY = "snippetCanvas.state";

export const DEFAULT_COLORS = [
  "#0b1020",
  "#111827",
  "#f8fafc",
  "#e5e7eb",
  "#7c3aed",
  "#268bd2",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#000000",
  "linear-gradient(135deg, #312e81 0%, #020617 100%)",
  "linear-gradient(145deg, #ff79c6 0%, #44475a 100%)",
  "linear-gradient(120deg, #22c55e 0%, #268bd2 100%)",
  "radial-gradient(circle at center, #8b5cf6 0%, #0f172a 100%)",
];

export const DEFAULT_THEMES: ThemeDefinition[] = [
  { value: "midnight", label: "Midnight", palette: { columnBackground: "#0b1020", foreground: "#e5e7eb", accent: "#8b5cf6" } },
  { value: "github-dark", label: "GitHub Dark", palette: { columnBackground: "#0d1117", foreground: "#c9d1d9", accent: "#58a6ff" } },
  { value: "dracula", label: "Dracula", palette: { columnBackground: "#282a36", foreground: "#f8f8f2", accent: "#bd93f9" } },
  { value: "nord", label: "Nord", palette: { columnBackground: "#2e3440", foreground: "#eceff4", accent: "#88c0d0" } },
  { value: "one-dark", label: "One Dark", palette: { columnBackground: "#282c34", foreground: "#abb2bf", accent: "#61afef" } },
  { value: "solarized-light", label: "Solarized Light", palette: { columnBackground: "#fdf6e3", foreground: "#586e75", accent: "#268bd2" } },
];

const THEME_PALETTES: Record<
  SyntaxTheme,
  Pick<Required<ColumnSettings>, "columnBackground" | "foreground" | "accent">
> = {
  midnight: {
    columnBackground: "#0b1020",
    foreground: "#e5e7eb",
    accent: "#8b5cf6",
  },
  "github-dark": {
    columnBackground: "#0d1117",
    foreground: "#c9d1d9",
    accent: "#58a6ff",
  },
  dracula: {
    columnBackground: "#282a36",
    foreground: "#f8f8f2",
    accent: "#bd93f9",
  },
  nord: {
    columnBackground: "#2e3440",
    foreground: "#eceff4",
    accent: "#88c0d0",
  },
  "one-dark": {
    columnBackground: "#282c34",
    foreground: "#abb2bf",
    accent: "#61afef",
  },
  "solarized-light": {
    columnBackground: "#fdf6e3",
    foreground: "#586e75",
    accent: "#268bd2",
  },
};

const DEFAULT_DOCUMENT: SnippetCanvasDocument = {
  snippets: [],
  columnSettings: {},
  settings: {
    layout: LayoutModes.FIT,
    columns: 2,
    gap: 20,
    page: {
      padding: 40,
      width: 1400,
      height: 900,
      background: "#111827",
      backgroundType: "solid",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #0f172a 100%)",
      backgroundImage: "",
    },
    column: {
      width: 650,
      height: 400,
      fontSize: 15,
      lineHeight: 1.55,
      columnBackground: "#0b1020",
      foreground: "#e5e7eb",
      accent: "#8b5cf6",
      borderRadius: 14,
      showChrome: true,
      showFileName: true,
      showLineNumbers: true,
      syntaxTheme: "midnight",
      themeColorsCustomized: false,
      fontFamily: "JetBrains Mono",
      googleFontFamily: "",
      columnPadding: 18,
      indentSize: 2,
      codeAlignment: "left",
      frameStyle: "macos",
      shadow: {
        enabled: true,
        x: 0,
        y: 20,
        blur: 48,
        spread: 0,
        opacity: 0.4,
        color: "#000000",
      },
      title: {
        fontSize: 12,
        fontFamily: "Inter",
        alignment: "left",
        fontWeight: 600,
      },
      decorations: { caption: "", watermark: "", icon: "", tilt: 0 },
    },
  },
};

/** Reads user/workspace configuration used as defaults before document state exists. */
function configuredSettings(): ComposerSettings {
  const configuration = vscode.workspace.getConfiguration("snippetCanvas");
  const get = <T>(key: string, fallback: T) =>
    configuration.get<T>(key, fallback);
  const defaults = DEFAULT_DOCUMENT.settings;
  const syntaxTheme = get("column.syntaxTheme", defaults.column.syntaxTheme);
  const configuredThemes = get<ThemeDefinition[]>("themes", DEFAULT_THEMES);
  const themePalette = configuredThemes.find(({ value }) => value === syntaxTheme)?.palette ?? THEME_PALETTES[syntaxTheme];
  return {
    ...defaults,
    layout: get("mode", defaults.layout),
    columns: get("columnsPerRow", defaults.columns),
    gap: get("columnGap", defaults.gap),
    page: {
      width: get("page.width", defaults.page.width),
      height: get("page.height", defaults.page.height),
      padding: get("page.padding", defaults.page.padding),
      backgroundType: get("page.backgroundType", defaults.page.backgroundType),
      background: get("page.background", defaults.page.background),
      gradient: get("page.gradient", defaults.page.gradient),
      backgroundImage: get(
        "page.backgroundImage",
        defaults.page.backgroundImage,
      ),
    },
    column: {
      width: get("column.width", defaults.column.width),
      height: get("column.height", defaults.column.height),
      fontSize: get("column.fontSize", defaults.column.fontSize),
      lineHeight: get("column.lineHeight", defaults.column.lineHeight),
      columnPadding: get("column.padding", defaults.column.columnPadding),
      ...themePalette,
      syntaxTheme,
      themeColorsCustomized: false,
      fontFamily: get("column.fontFamily", defaults.column.fontFamily),
      googleFontFamily: get(
        "column.googleFontFamily",
        defaults.column.googleFontFamily,
      ),
      indentSize: get("column.indentSize", defaults.column.indentSize),
      codeAlignment: get("column.codeAlignment", defaults.column.codeAlignment),
      borderRadius: get("column.borderRadius", defaults.column.borderRadius),
      frameStyle: get("column.frameStyle", defaults.column.frameStyle),
      showChrome: get("column.showChrome", defaults.column.showChrome),
      showFileName: get("column.showFileName", defaults.column.showFileName),
      showLineNumbers: get(
        "column.showLineNumbers",
        defaults.column.showLineNumbers,
      ),
      shadow: {
        enabled: get("column.shadow.enabled", defaults.column.shadow.enabled),
        x: get("column.shadow.x", defaults.column.shadow.x),
        y: get("column.shadow.y", defaults.column.shadow.y),
        blur: get("column.shadow.blur", defaults.column.shadow.blur),
        spread: get("column.shadow.spread", defaults.column.shadow.spread),
        opacity: get("column.shadow.opacity", defaults.column.shadow.opacity),
        color: get("column.shadow.color", defaults.column.shadow.color),
      },
      title: {
        fontSize: get("column.title.fontSize", defaults.column.title.fontSize),
        fontFamily: get(
          "column.title.fontFamily",
          defaults.column.title.fontFamily,
        ),
        fontWeight: get(
          "column.title.fontWeight",
          defaults.column.title.fontWeight,
        ),
        alignment: get(
          "column.title.alignment",
          defaults.column.title.alignment,
        ),
      },
      decorations: {
        caption: get(
          "column.decorations.caption",
          defaults.column.decorations.caption,
        ),
        watermark: get(
          "column.decorations.watermark",
          defaults.column.decorations.watermark,
        ),
        icon: get("column.decorations.icon", defaults.column.decorations.icon),
        tilt: get("column.decorations.tilt", defaults.column.decorations.tilt),
      },
    },
  };
}

/** Removes every source and continuation override owned by a snippet. */
export function withoutSnippetSettings(
  settings: Record<string, ColumnSettings>,
  snippetId: string,
) {
  return Object.fromEntries(
    Object.entries(settings).filter(
      ([id]) => id !== snippetId && !id.startsWith(`${snippetId}:page:`),
    ),
  );
}

/**
 * Owns the persisted SnippetCanvas document and exposes functional updates.
 * Consumers subscribe to `onDidChange` instead of coordinating refreshes.
 */
export class DocumentStore implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changed.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /** Returns the resolved VS Code `snippetCanvas.*` configuration for the webview API. */
  configuration() {
    const configuration = vscode.workspace.getConfiguration("snippetCanvas");
    return {
      settings: configuredSettings(),
      defaultColors: configuration.get<string[]>("defaultColors", DEFAULT_COLORS),
      themes: configuration.get<ThemeDefinition[]>("themes", DEFAULT_THEMES),
      scaleFontOnResize: configuration.get<boolean>("column.scaleFontOnResize", true),
    };
  }

  /** Reads persisted state and fills missing nested settings from defaults. */
  read(): SnippetCanvasDocument {
    const saved =
      this.context.workspaceState.get<Partial<SnippetCanvasDocument>>(
        STATE_KEY,
      );
    const configured = configuredSettings();
    return {
      snippets: saved?.snippets ?? [],
      columnSettings: saved?.columnSettings ?? {},
      settings: {
        ...configured,
        ...saved?.settings,
        page: { ...configured.page, ...saved?.settings?.page },
        column: {
          ...configured.column,
          ...saved?.settings?.column,
          shadow: {
            ...configured.column.shadow,
            ...saved?.settings?.column?.shadow,
          },
          title: {
            ...configured.column.title,
            ...saved?.settings?.column?.title,
          },
          decorations: {
            ...configured.column.decorations,
            ...saved?.settings?.column?.decorations,
          },
        },
      },
    };
  }

  /** Persists a complete document and notifies views that derive from it. */
  async write(document: SnippetCanvasDocument) {
    await this.context.workspaceState.update(STATE_KEY, document);
    this.changed.fire();
  }

  /** Applies a pure transformation to the latest persisted document. */
  async update(
    transform: (document: SnippetCanvasDocument) => SnippetCanvasDocument,
  ) {
    await this.write(transform(this.read()));
  }

  dispose() {
    this.changed.dispose();
  }
}
