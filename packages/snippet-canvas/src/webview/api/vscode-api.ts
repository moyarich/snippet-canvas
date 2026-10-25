import type { ClientMessage, HostMessage, SnippetCanvasDocument } from "../types";
export type VSCodeApi = { postMessage(m: ClientMessage): void };
let api: VSCodeApi | undefined;
const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
};
const copyDataUrl = async (dataUrl: string) => {
  const blob = await (await fetch(dataUrl)).blob();
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("This browser does not support copying images. Use Export PNG instead.");
  }
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
};
const previewState: SnippetCanvasDocument = {
  snippets: [{ id: "preview-snippet", fileName: "example.ts", filePath: "src/example.ts", sourceUri: "preview://example.ts", language: "typescript", code: "type Greeting = { name: string };\n\nexport function greet({ name }: Greeting) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet({ name: \"SnippetCanvas\" }));", startLine: 1, endLine: 7, startCharacter: 0, endCharacter: 54, createdAt: Date.now() }],
  columnSettings: {},
  settings: { layout: "fit", columns: 2, gap: 20, page: { padding: 40, width: 1400, height: 900, background: "#111827", backgroundType: "solid", gradient: "linear-gradient(135deg, #7c3aed 0%, #0f172a 100%)", backgroundImage: "" }, column: { width: 650, height: 400, fontSize: 15, lineHeight: 1.55, columnBackground: "#0b1020", foreground: "#e5e7eb", accent: "#8b5cf6", borderRadius: 14, showChrome: true, showFileName: true, showLineNumbers: true, syntaxTheme: "midnight", themeColorsCustomized: false, fontFamily: "JetBrains Mono", googleFontFamily: "", columnPadding: 18, indentSize: 2, codeAlignment: "left", frameStyle: "macos", shadow: { enabled: true, x: 0, y: 20, blur: 48, spread: 0, opacity: .4, color: "#000000" }, title: { fontSize: 12, fontFamily: "Inter", alignment: "left", fontWeight: 600 }, decorations: { caption: "", watermark: "", icon: "", tilt: 0 } } },
};
let previewScaleFontOnResize = true;
const previewApi: VSCodeApi = { postMessage(message) {
  if (message.type === "ready") queueMicrotask(() => {
    window.dispatchEvent(new MessageEvent<HostMessage>("message", { data: { type: "hydrate", payload: previewState } }));
    window.dispatchEvent(new MessageEvent<HostMessage>("message", { data: { type: "configurationChanged", payload: { settings: previewState.settings, defaultColors: ["#0b1020", "#111827", "#f8fafc", "#e5e7eb", "#8b5cf6", "#268bd2", "#22c55e", "#f59e0b", "#ef4444", "#000000", "linear-gradient(135deg, #312e81 0%, #020617 100%)", "linear-gradient(145deg, #ff79c6 0%, #44475a 100%)"], themes: [{ value: "midnight", label: "Midnight", palette: { columnBackground: "#0b1020", foreground: "#e5e7eb", accent: "#8b5cf6" } }], scaleFontOnResize: previewScaleFontOnResize } } }));
    return;
  });
  if (message.type === "setScaleFontOnResize") {
    previewScaleFontOnResize = message.payload.enabled;
    window.dispatchEvent(new MessageEvent<HostMessage>("message", { data: { type: "configurationChanged", payload: { settings: previewState.settings, defaultColors: ["#0b1020", "#111827", "#f8fafc", "#e5e7eb", "#8b5cf6"], themes: [{ value: "midnight", label: "Midnight", palette: { columnBackground: "#0b1020", foreground: "#e5e7eb", accent: "#8b5cf6" } }], scaleFontOnResize: previewScaleFontOnResize } } }));
    return;
  }
  if (message.type === "exportPng") {
    downloadDataUrl(message.payload.dataUrl, message.payload.suggestedName);
    return;
  }
  if (message.type === "exportFiles") {
    const extension = message.payload.format === "jpeg" ? "jpg" : message.payload.format;
    message.payload.dataUrls.forEach((dataUrl, index) => {
      const suffix = message.payload.dataUrls.length > 1 ? `-page-${index + 1}` : "";
      downloadDataUrl(dataUrl, `${message.payload.suggestedName}${suffix}.${extension}`);
    });
    return;
  }
  if (message.type === "exportPngPages") {
    message.payload.dataUrls.forEach((dataUrl, index) =>
      downloadDataUrl(dataUrl, `${message.payload.suggestedName.replace(/\.png$/i, "")}-page-${index + 1}.png`),
    );
    return;
  }
  if (message.type === "copyImage") {
    void copyDataUrl(message.payload.dataUrl).catch((error) => {
      console.error(`SnippetCanvas could not copy the image: ${String(error)}`);
    });
    return;
  }
  if (message.type === "showMessage") {
    const log = message.payload.kind === "error" ? console.error : console.info;
    log(message.payload.message);
  }
} };
export const getVsCodeApi = () => (api ??= window.acquireVsCodeApi?.() ?? previewApi);
