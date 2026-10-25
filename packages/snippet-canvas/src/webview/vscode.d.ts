import type { VSCodeApi } from "./api/vscode-api";
declare global {
  interface Window { acquireVsCodeApi?: () => VSCodeApi }
}
