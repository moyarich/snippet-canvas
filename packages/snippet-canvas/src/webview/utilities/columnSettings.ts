import type { ColumnSettings, ComposerSettings } from "../types";

/** Converts composer-level column defaults into the complete reusable column model. */
export function getColumnDefaults(
  settings: ComposerSettings,
): Required<Omit<ColumnSettings, "scaleFontOnResize">> {
  return { ...settings.column };
}

export function resolveColumnSettings(
  settings: ComposerSettings,
  ...overrides: (ColumnSettings | undefined)[]
) {
  return Object.assign(
    getColumnDefaults(settings),
    ...overrides.filter(Boolean),
  ) as Required<Omit<ColumnSettings, "scaleFontOnResize">>;
}
