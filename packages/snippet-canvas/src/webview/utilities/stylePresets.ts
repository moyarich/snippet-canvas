import type {
  ComposerSettings,
  ComposerSettingsPatch,
  SyntaxTheme,
  ThemeDefinition,
} from "../types";

export const themePatch = (
  themes: ThemeDefinition[],
  syntaxTheme: SyntaxTheme,
) => {
  const theme = themes.find(({ value }) => value === syntaxTheme) ?? themes[0];
  if (!theme) return { syntaxTheme, themeColorsCustomized: false };
  return {
    syntaxTheme: theme.value,
    themeColorsCustomized: false,
    ...theme.palette,
  };
};

export const CODING_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "IBM Plex Mono",
  "Roboto Mono",
  "Space Mono",
  "ui-monospace",
];

export type StylePreset = {
  name: string;
  description: string;
  patch: ComposerSettingsPatch;
};
export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "Midnight",
    description: "Deep blue and violet",
    patch: {
      column: {
        syntaxTheme: "midnight",
        themeColorsCustomized: false,
        columnBackground: "#0b1020",
        foreground: "#e5e7eb",
        accent: "#8b5cf6",
        frameStyle: "macos",
      },
      page: {
        backgroundType: "gradient",
        gradient: "linear-gradient(135deg, #312e81 0%, #020617 100%)",
      },
    },
  },
  {
    name: "Dracula",
    description: "Vibrant dark contrast",
    patch: {
      column: {
        syntaxTheme: "dracula",
        themeColorsCustomized: false,
        columnBackground: "#282a36",
        foreground: "#f8f8f2",
        accent: "#bd93f9",
        frameStyle: "minimal",
      },
      page: {
        backgroundType: "gradient",
        gradient: "linear-gradient(145deg, #ff79c6 0%, #44475a 100%)",
      },
    },
  },
  {
    name: "Nord",
    description: "Cool arctic palette",
    patch: {
      column: {
        syntaxTheme: "nord",
        themeColorsCustomized: false,
        columnBackground: "#2e3440",
        foreground: "#eceff4",
        accent: "#88c0d0",
        frameStyle: "terminal",
      },
      page: { backgroundType: "solid", background: "#4c566a" },
    },
  },
  {
    name: "Paper",
    description: "Editorial light style",
    patch: {
      column: {
        syntaxTheme: "solarized-light",
        themeColorsCustomized: false,
        columnBackground: "#fdf6e3",
        foreground: "#586e75",
        accent: "#268bd2",
        frameStyle: "none",
        shadow: {
          enabled: true,
          x: 0,
          y: 12,
          blur: 30,
          spread: 0,
          opacity: 0.2,
          color: "#0f172a",
        },
      },
      page: { backgroundType: "solid", background: "#e2e8f0" },
    },
  },
];

export const pageBackground = (page: ComposerSettings["page"]) => {
  if (page.backgroundType === "gradient") return page.gradient;
  if (page.backgroundType === "image" && page.backgroundImage.trim())
    return `center / cover no-repeat url("${page.backgroundImage.replace(/["\\]/g, "")}")`;
  return page.background;
};
