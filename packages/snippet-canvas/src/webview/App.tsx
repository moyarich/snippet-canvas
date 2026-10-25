import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useComposer } from "./hooks/useComposer";
import { useWorkspaceNavigation } from "./hooks/useWorkspaceNavigation";
import { Controls } from "./components/Controls";
import { Page } from "./components/Page";
import { WorkspaceControls } from "./components/WorkspaceControls";
import type { ExportOptions } from "./components/controls/ExportControls";
import { LayoutModes } from "./types";
import { findLayoutErrors, findOversizedPage, fitPagesToCode, renderColumnPng, renderPages, setPagesToExactSize, type LayoutError } from "./utilities/export";

const clamp = (value: number) => Math.min(2, Math.max(0.1, value));

export default function App() {
  const composer = useComposer();
  const { state, hydrated } = composer;
  const pagesRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<LayoutError[]>([]);
  const [errorIndex, setErrorIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [zoom, setZoom] = useState(0.5);
  const [renderedPageSize, setRenderedPageSize] = useState({ width: 0, height: 0 });
  const [renderedColumnSize, setRenderedColumnSize] = useState<{ width: number; height: number }>();
  const fontFitFrame = useRef<number>();
  const normalizedInitialFit = useRef(false);
  const selectedSourceId = selectedId?.replace(/:page:\d+$/, "") ?? "";
  const selected = state?.snippets.find(
    (snippet) => snippet.id === selectedSourceId,
  );
  useEffect(() => {
    if (normalizedInitialFit.current || !state || !composer.configuration) return;
    normalizedInitialFit.current = true;
    const defaults = composer.configuration.settings?.page;
    if (state.settings.layout === LayoutModes.FIT && defaults
      && state.settings.page.width === defaults.width
      && state.settings.page.height === defaults.height) {
      composer.updateSettings({ page: { width: 1, height: 1 } });
    }
  }, [state, composer.configuration, composer.updateSettings]);
  const googleFontFamilies = state ? [...new Set([state.settings.column.googleFontFamily, ...Object.values(state.columnSettings).map((settings) => settings.googleFontFamily ?? "")].map((family) => family.trim()).filter(Boolean))].join("|") : "";
  useLayoutEffect(() => {
    if (!state || !pagesRef.current) return;
    const pages = Array.from(pagesRef.current.querySelectorAll<HTMLElement>(".page"));
    if (state.settings.layout !== LayoutModes.FIT) {
      setRenderedPageSize({ width: state.settings.page.width, height: state.settings.page.height });
    } else {
      fitPagesToCode(pages, state.settings.page.width, state.settings.page.height);
      const firstPage = pages[0];
      setRenderedPageSize(firstPage
        ? { width: firstPage.offsetWidth, height: firstPage.offsetHeight }
        : { width: state.settings.page.width, height: state.settings.page.height });
    }
    const selectedColumn = selectedId
      ? Array.from(pagesRef.current.querySelectorAll<HTMLElement>("[data-column-id]")).find(
          (column) => column.dataset.columnId === selectedId,
        )
      : undefined;
    setRenderedColumnSize(selectedColumn
      ? { width: selectedColumn.offsetWidth, height: selectedColumn.offsetHeight }
      : undefined);
  }, [selectedId, state?.settings.layout, state?.settings.page.width, state?.settings.page.height, state?.settings.page.padding, state?.settings.gap, state?.snippets, state?.columnSettings, state?.settings.column]);
  useEffect(() => {
    document.querySelectorAll("link[data-snippetcanvas-font]").forEach((node) => node.remove());
    const links = googleFontFamilies.split("|").filter(Boolean).map((family) => {
      const link = document.createElement("link");
      link.dataset.snippetcanvasFont = family;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
      document.head.append(link);
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [googleFontFamilies]);
  useEffect(() => {
    setErrors([]);
    setErrorIndex(0);
  }, [state?.settings, state?.columnSettings, state?.snippets]);
  const fit = () => {
    const stage = stageRef.current;
    if (!stage || !state) return;
    setZoom(
      clamp(
        Math.min(
          (stage.clientWidth - 80) / state.settings.page.width,
          (stage.clientHeight - 100) / state.settings.page.height,
        ),
      ),
    );
    requestAnimationFrame(() =>
      stage.scrollTo({ left: 0, top: 0, behavior: "auto" }),
    );
  };
  const navigation = useWorkspaceNavigation(stageRef, zoom, setZoom, fit);
  const updateColumnSettings = useCallback((id: string, patch: Partial<import("./types").ColumnSettings>) => {
    composer.updateColumnSettings(id, patch);
    const scaleFontOnResize = state?.columnSettings[id]?.scaleFontOnResize
      ?? composer.configuration?.scaleFontOnResize;
    if (!scaleFontOnResize || (patch.width === undefined && patch.height === undefined)) return;
    if (fontFitFrame.current !== undefined) cancelAnimationFrame(fontFitFrame.current);
    fontFitFrame.current = requestAnimationFrame(() => {
      fontFitFrame.current = requestAnimationFrame(() => {
        const column = Array.from(pagesRef.current?.querySelectorAll<HTMLElement>("[data-column-id]") ?? [])
          .find((node) => node.dataset.columnId === id);
        const viewport = column?.querySelector<HTMLElement>("[data-code-height='true']");
        const code = column?.querySelector<HTMLElement>("[data-code-width='true']");
        if (!viewport || !code) return;
        const original = viewport.style.fontSize;
        let low = 1;
        let high = 200;
        while (low < high) {
          const candidate = Math.ceil((low + high) / 2);
          viewport.style.fontSize = `${candidate}px`;
          const fits = code.scrollWidth <= code.clientWidth + 1
            && viewport.scrollHeight <= viewport.clientHeight + 1;
          if (fits) low = candidate;
          else high = candidate - 1;
        }
        viewport.style.fontSize = original;
        composer.updateColumnSettings(id, { fontSize: low });
      });
    });
  }, [state?.columnSettings, composer.configuration?.scaleFontOnResize, composer.updateColumnSettings]);
  const render = async (action: "exportPng" | "copyImage", options: ExportOptions) => {
    if (!pagesRef.current || busy || !state) return;
    let nodes = Array.from(pagesRef.current.querySelectorAll<HTMLElement>(".page"));
    if (options.scope === "current") {
      const selectedColumn = selectedId ? pagesRef.current.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(selectedId)}"]`) : undefined;
      nodes = [selectedColumn?.closest<HTMLElement>(".page") ?? nodes[0]].filter((node): node is HTMLElement => Boolean(node));
    }
    const contentSizedExport = options.fitContent || state.settings.layout === LayoutModes.FIT;
    const restorePageSize = contentSizedExport
      ? fitPagesToCode(nodes, state.settings.page.width, state.settings.page.height)
      : setPagesToExactSize(nodes, state.settings.page.width, state.settings.page.height);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const format = action === "copyImage" ? "png" : options.format;
    if (format !== "svg") {
      const oversizedPage = findOversizedPage(nodes, options.scale);
      if (oversizedPage) {
        restorePageSize();
        const message = `Page ${oversizedPage.closest<HTMLElement>("[data-page-number]")?.dataset.pageNumber ?? ""} at ${options.scale}× would exceed the browser's maximum export size. Choose a lower resolution or smaller page.`;
        setErrors([{ key: "resolution", message, columnId: "" }]);
        composer.post({ type: "showMessage", payload: { kind: "error", message: `SnippetCanvas: ${message}` } });
        return;
      }
    }
    const issues = findLayoutErrors(nodes, contentSizedExport ? undefined : state.settings.page);
    if (issues.length) {
      restorePageSize();
      setErrors(issues);
      setErrorIndex(0);
      composer.post({
        type: "showMessage",
        payload: {
          kind: "error",
          message: `SnippetCanvas could not export because ${issues.length} code visibility issue${issues.length === 1 ? " was" : "s were"} found. Use the error details above the workspace to locate and fix ${issues.length === 1 ? "it" : "them"}.`,
        },
      });
      return;
    }
    setErrors([]);
    setBusy(true);
    nodes.forEach((node) => node.classList.add("exporting"));
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const dataUrls = await renderPages(nodes, format, options.scale, options.quality);
      const suggestedName = `snippetcanvas-${new Date().toISOString().slice(0, 10)}`;
      if (action === "copyImage")
        composer.post({ type: "copyImage", payload: { dataUrl: dataUrls[0] } });
      else
        composer.post({
          type: "exportFiles",
          payload: { dataUrls, suggestedName, format },
        });
    } catch (error) {
      const message = `Could not render image: ${String(error)}`;
      setErrors([{ key: "render", message, columnId: "" }]);
      composer.post({
        type: "showMessage",
        payload: { kind: "error", message: `SnippetCanvas ${message}` },
      });
    } finally {
      nodes.forEach((node) => node.classList.remove("exporting"));
      restorePageSize();
      setBusy(false);
    }
  };
  const renderColumn = useCallback(async (columnId: string) => {
    if (!pagesRef.current || busy) return;
    const column = Array.from(
      pagesRef.current.querySelectorAll<HTMLElement>("[data-column-id]"),
    ).find((node) => node.dataset.columnId === columnId);
    if (!column) return;
    const code = column.querySelector<HTMLElement>("[data-code-width='true']");
    const viewport = column.querySelector<HTMLElement>("[data-code-height='true']");
    if ((code && code.scrollWidth > code.clientWidth + 1) ||
        (viewport && viewport.scrollHeight > viewport.clientHeight + 1)) {
      const name = column.dataset.columnName ?? "column";
      const message = `${name} cannot be exported because some code is clipped.`;
      setErrors([{ key: `${columnId}:export`, message, columnId }]);
      composer.post({ type: "showMessage", payload: { kind: "error", message: `SnippetCanvas: ${message}` } });
      return;
    }
    setBusy(true);
    column.classList.add("exporting");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const dataUrl = await renderColumnPng(column);
      const safeName = (column.dataset.columnName ?? "column").replace(/[^a-z0-9._-]+/gi, "-");
      composer.post({
        type: "exportPng",
        payload: {
          dataUrl,
          suggestedName: `snippetcanvas-${safeName}-${new Date().toISOString().slice(0, 10)}.png`,
        },
      });
    } catch (error) {
      const message = `Could not render column image: ${String(error)}`;
      setErrors([{ key: `${columnId}:render`, message, columnId }]);
      composer.post({ type: "showMessage", payload: { kind: "error", message: `SnippetCanvas ${message}` } });
    } finally {
      column.classList.remove("exporting");
      setBusy(false);
    }
  }, [busy, composer.post]);
  const focusError = (error: LayoutError) => {
    if (!error.columnId) return;
    const column = Array.from(
      pagesRef.current?.querySelectorAll<HTMLElement>("[data-column-id]") ?? [],
    ).find((node) => node.dataset.columnId === error.columnId);
    setSelectedId(error.columnId);
    column?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  };
  if (!hydrated || !state || !composer.configuration) return <div className="loading">Opening pages…</div>;
  return (
    <div className="composer-shell">
      <Controls
        value={state.settings}
        defaultColors={composer.configuration.defaultColors}
        themes={composer.configuration.themes}
        pageDefaults={composer.configuration.settings?.page ?? state.settings.page}
        settingsDefaults={composer.configuration.settings ?? state.settings}
        scaleFontOnResize={composer.configuration.scaleFontOnResize}
        onScaleFontOnResizeChange={(enabled) => composer.post({ type: "setScaleFontOnResize", payload: { enabled } })}
        renderedPageSize={renderedPageSize}
        onChange={composer.updateSettings}
        onExport={(options) => render("exportPng", options)}
        onCopy={(options) => render("copyImage", options)}
        selected={selected}
        selectedColumnSettings={
          selectedId ? state.columnSettings[selectedId] : undefined
        }
        renderedColumnSize={renderedColumnSize}
        onColumnSettingsChange={(patch) =>
          selectedId && updateColumnSettings(selectedId, patch)
        }
        onColumnSettingsReset={() =>
          selectedId && composer.resetColumnSettings(selectedId)
        }
        onLanguageChange={(language) =>
          selectedSourceId &&
          composer.updateSnippetLanguage(selectedSourceId, language)
        }
        onSnippetPresentationChange={(patch) => selectedSourceId && composer.updateSnippetPresentation(selectedSourceId, patch)}
      />
      <main className="workspace">
        <section
          className={`stage ${navigation.panning ? "panning" : ""}`}
          ref={stageRef}
          {...navigation.handlers}
        >
        <div className="stage-head">
          <div className="workspace-info">
            <span>
              {state.snippets.length} snippet
              {state.snippets.length === 1 ? "" : "s"}
            </span>
            <WorkspaceControls zoom={zoom} onZoom={setZoom} onFit={fit} />
            {busy && <span>Rendering…</span>}
          </div>
          <div className="stage-errors" role="alert" aria-live="assertive">
            {errors.length > 0 && <>
              <button
                className="stage-error-message"
                title={`${errors[errorIndex].message}. Select this column to fix it.`}
                disabled={!errors[errorIndex].columnId}
                onClick={() => focusError(errors[errorIndex])}
              >
                <TriangleAlert size={14} aria-hidden="true" />
                <span>{errors[errorIndex].message}</span>
              </button>
              {errors.length > 1 && <div className="stage-error-navigation" aria-label="Error navigation">
                <button aria-label="Previous error" onClick={() => setErrorIndex((errorIndex - 1 + errors.length) % errors.length)}><ChevronLeft size={15} aria-hidden="true" /></button>
                <span>{errorIndex + 1}/{errors.length}</span>
                <button aria-label="Next error" onClick={() => setErrorIndex((errorIndex + 1) % errors.length)}><ChevronRight size={15} aria-hidden="true" /></button>
              </div>}
            </>}
          </div>
        </div>
        <div className="zoom-viewport">
          <div
            className="zoom-layer"
            style={{ zoom }}
          >
            <Page
              ref={pagesRef}
              snippets={state.snippets}
              settings={state.settings}
              columnSettings={state.columnSettings}
              resize={updateColumnSettings}
              reset={composer.resetColumnSettings}
              exportColumn={renderColumn}
              selectedId={selectedId}
              onSelect={setSelectedId}
              remove={composer.remove}
              move={composer.move}
              reorder={composer.reorder}
            />
          </div>
        </div>
        </section>
      </main>
    </div>
  );
}
