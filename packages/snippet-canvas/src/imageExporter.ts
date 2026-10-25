import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import type { ExportFormat } from "./protocol";

const decodePng = (dataUrl: string) =>
  Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
const decodeDataUrl = (dataUrl: string) => {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid export data URL.");
  const metadata = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  return metadata.includes(";base64") ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
};

/** Handles all extension-host PNG persistence and clipboard integration. */
export class ImageExporter {
  /** Saves one file or a numbered multi-page set in the selected format. */
  async saveFiles(dataUrls: string[], suggestedName: string, format: ExportFormat) {
    const labels: Record<ExportFormat, string> = { png: "PNG Image", jpeg: "JPEG Image", svg: "SVG Image", pdf: "PDF Document" };
    const extension = format === "jpeg" ? "jpg" : format;
    const stem = suggestedName.replace(/\.[^.]+$/i, "");
    const targetName = dataUrls.length > 1 ? `${stem}-page-1.${extension}` : `${stem}.${extension}`;
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(this.defaultDirectory(), targetName)),
      filters: { [labels[format]]: [extension] },
    });
    if (!target) return;
    const chosenStem = target.fsPath.replace(new RegExp(`-page-1\\.${extension}$`, "i"), "").replace(new RegExp(`\\.${extension}$`, "i"), "");
    await Promise.all(dataUrls.map((dataUrl, index) => vscode.workspace.fs.writeFile(
      dataUrls.length > 1 ? vscode.Uri.file(`${chosenStem}-page-${index + 1}.${extension}`) : target,
      decodeDataUrl(dataUrl),
    )));
    void vscode.window.showInformationMessage(dataUrls.length > 1 ? `${dataUrls.length} SnippetCanvas pages exported as ${format.toUpperCase()}.` : `SnippetCanvas ${format.toUpperCase()} exported.`);
  }
  /** Prompts for a target and saves one PNG. */
  async save(dataUrl: string, suggestedName: string) {
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(this.defaultDirectory(), suggestedName)),
      filters: { "PNG Image": ["png"] },
    });
    if (!target) return;
    await vscode.workspace.fs.writeFile(target, decodePng(dataUrl));
    void vscode.window.showInformationMessage(
      `SnippetCanvas image saved to ${target.fsPath}`,
    );
  }

  /** Saves a rendered page set beside the chosen page-one target. */
  async savePages(dataUrls: string[], suggestedName: string) {
    const stem = suggestedName.replace(/\.png$/i, "");
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(
        path.join(this.defaultDirectory(), `${stem}-page-1.png`),
      ),
      filters: { "PNG Image": ["png"] },
    });
    if (!target) return;
    const chosenStem = target.fsPath
      .replace(/-page-1\.png$/i, "")
      .replace(/\.png$/i, "");
    await Promise.all(
      dataUrls.map((dataUrl, index) =>
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${chosenStem}-page-${index + 1}.png`),
          decodePng(dataUrl),
        ),
      ),
    );
    void vscode.window.showInformationMessage(
      `${dataUrls.length} SnippetCanvas pages exported.`,
    );
  }

  /** Writes a temporary PNG and copies its path through VS Code's text clipboard. */
  async copyPath(dataUrl: string) {
    const target = vscode.Uri.file(
      path.join(os.tmpdir(), `snippetcanvas-${Date.now()}.png`),
    );
    await vscode.workspace.fs.writeFile(target, decodePng(dataUrl));
    await vscode.env.clipboard.writeText(target.fsPath);
    void vscode.window.showInformationMessage(
      "Image created; its temporary file path was copied (VS Code's stable API cannot copy binary images).",
    );
  }

  private defaultDirectory() {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir();
  }
}
