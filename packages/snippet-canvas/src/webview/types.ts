export * from "../protocol";
export type { HostToWebview as HostMessage } from "../protocol";
export type ClientMessage = import("../protocol").WebviewToHost | import("../protocol").MultiPageExport;
export type ComposerSettingsPatch = Omit<Partial<import("../protocol").ComposerSettings>, "page" | "column"> & {
  page?: Partial<import("../protocol").PageSettings>;
  column?: import("../protocol").ColumnSettings;
};
