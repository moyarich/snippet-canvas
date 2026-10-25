import * as vscode from "vscode";
import type {
  HostToWebview,
  MultiPageExport,
  WebviewToHost,
} from "./protocol";
import { DocumentStore, withoutSnippetSettings } from "./documentStore";
import { ImageExporter } from "./imageExporter";

type ComposerMessage = WebviewToHost | MultiPageExport;

/** Owns the composer webview lifecycle and its extension-host message boundary. */
export class ComposerPanel implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly store: DocumentStore,
    private readonly exporter: ImageExporter,
  ) {}

  /** Reveals the existing composer or creates and initializes a new panel. */
  open() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "snippetCanvas",
      "SnippetCanvas",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview"),
        ],
      },
    );
    this.panel = panel;
    panel.iconPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "icon.svg",
    );
    panel.webview.html = createWebviewHtml(
      panel.webview,
      this.context.extensionUri,
    );

    const messages = panel.webview.onDidReceiveMessage((message: ComposerMessage) =>
      this.handleMessage(message),
    );
    panel.onDidDispose(() => {
      messages.dispose();
      if (this.panel === panel) this.panel = undefined;
    });
  }

  /** Sends the latest complete document to an open composer. */
  sync() {
    this.post({ type: "hydrate", payload: this.store.read() });
    this.post({ type: "configurationChanged", payload: this.store.configuration() });
  }

  /** Posts a typed host message when the composer is available. */
  post(message: HostToWebview) {
    void this.panel?.webview.postMessage(message);
  }

  dispose() {
    this.panel?.dispose();
    this.panel = undefined;
  }

  private async handleMessage(message: ComposerMessage) {
    switch (message.type) {
      case "ready":
        this.sync();
        break;
      case "setScaleFontOnResize":
        await vscode.workspace
          .getConfiguration("snippetCanvas")
          .update(
            "column.scaleFontOnResize",
            message.payload.enabled,
            vscode.ConfigurationTarget.Workspace,
          );
        break;
      case "saveState":
        await this.store.write(message.payload);
        break;
      case "removeSnippet":
        await this.store.update((document) => ({
          ...document,
          snippets: document.snippets.filter(
            (snippet) => snippet.id !== message.payload.id,
          ),
          columnSettings: withoutSnippetSettings(
            document.columnSettings,
            message.payload.id,
          ),
        }));
        break;
      case "reorderSnippets":
        await this.store.update((document) => {
          const byId = new Map(
            document.snippets.map((snippet) => [snippet.id, snippet]),
          );
          return {
            ...document,
            snippets: message.payload.ids.flatMap((id) => byId.get(id) ?? []),
          };
        });
        break;
      case "exportPng":
        await this.exporter.save(
          message.payload.dataUrl,
          message.payload.suggestedName,
        );
        break;
      case "exportFiles":
        await this.exporter.saveFiles(message.payload.dataUrls, message.payload.suggestedName, message.payload.format);
        break;
      case "exportPngPages":
        await this.exporter.savePages(
          message.payload.dataUrls,
          message.payload.suggestedName,
        );
        break;
      case "copyImage":
        await this.exporter.copyPath(message.payload.dataUrl);
        break;
      case "showMessage":
        void (message.payload.kind === "error"
          ? vscode.window.showErrorMessage(message.payload.message)
          : vscode.window.showInformationMessage(message.payload.message));
        break;
    }
  }
}

/** Builds the CSP-constrained HTML shell loaded by the Vite webview bundle. */
function createWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const root = vscode.Uri.joinPath(extensionUri, "dist", "webview");
  const script = webview.asWebviewUri(
    vscode.Uri.joinPath(root, "webview.js"),
  );
  const style = webview.asWebviewUri(
    vscode.Uri.joinPath(root, "webview.css"),
  );
  const nonce = Math.random().toString(36).slice(2);
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: https:; font-src ${webview.cspSource} https://fonts.gstatic.com data:; style-src ${webview.cspSource} https://fonts.googleapis.com 'unsafe-inline'; script-src 'nonce-${nonce}';"><link rel="stylesheet" href="${style}"></head><body><div id="root"></div><script nonce="${nonce}" src="${script}"></script></body></html>`;
}
