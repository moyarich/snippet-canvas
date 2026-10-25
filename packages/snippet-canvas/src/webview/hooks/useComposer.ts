import { useCallback, useEffect, useState } from "react";
import { useVSCode } from "../context/vscode/VSCodeContext";
import type {
  ComposerSettingsPatch,
  ColumnSettings,
  SnippetCanvasDocument,
  WebviewConfiguration,
} from "../types";
const withoutSnippetSettings = (
  settings: Record<string, ColumnSettings>,
  snippetId: string,
) => Object.fromEntries(
  Object.entries(settings).filter(
    ([id]) => id !== snippetId && !id.startsWith(`${snippetId}:page:`),
  ),
);
export function useComposer() {
  const { post, subscribe } = useVSCode(),
    [state, setState] = useState<SnippetCanvasDocument>(),
    [configuration, setConfiguration] = useState<WebviewConfiguration>(),
    [hydrated, setHydrated] = useState(false);
  useEffect(
    () =>
      subscribe((m) => {
        if (m.type === "hydrate") {
          setState(m.payload);
          setHydrated(true);
        }
        if (m.type === "snippetAdded")
          setState((s) => {
            if (!s) return s;
            if (s.snippets.some((x) => x.id === m.payload.id)) return s;
            return {
              ...s,
              snippets: [...s.snippets, m.payload],
              columnSettings: withoutSnippetSettings(s.columnSettings, m.payload.id),
            };
          });
        if (m.type === "cleared")
          setState((s) => s ? ({ ...s, snippets: [], columnSettings: {} }) : s);
        if (m.type === "configurationChanged") setConfiguration(m.payload);
      }),
    [subscribe],
  );
  useEffect(() => {
    if (hydrated && state) {
      const t = setTimeout(
        () => post({ type: "saveState", payload: state }),
        200,
      );
      return () => clearTimeout(t);
    }
  }, [state, hydrated, post]);
  const updateSettings = useCallback(
    (p: ComposerSettingsPatch) =>
      setState((s) => {
        if (!s) return s;
        const columnSettings = Object.fromEntries(
          Object.entries(s.columnSettings).map(([id, column]) => {
            const next = { ...column };
            for (const key of Object.keys(p.column ?? {}) as (keyof ColumnSettings)[]) delete next[key];
            return [id, next];
          }),
        );
        return {
          ...s,
          columnSettings,
          settings: {
            ...s.settings,
            ...p,
            page: { ...s.settings.page, ...p.page },
            column: {
              ...s.settings.column,
              ...p.column,
              shadow: { ...s.settings.column.shadow, ...p.column?.shadow },
              title: { ...s.settings.column.title, ...p.column?.title },
              decorations: { ...s.settings.column.decorations, ...p.column?.decorations },
            },
          },
        };
      }),
    [],
  );
  const remove = useCallback(
    (id: string) => {
      setState((s) => {
        if (!s) return s;
        return {
          ...s,
          columnSettings: withoutSnippetSettings(s.columnSettings, id),
          snippets: s.snippets.filter((x) => x.id !== id),
        };
      });
      post({ type: "removeSnippet", payload: { id } });
    },
    [post],
  );
  const move = useCallback(
    (id: string, d: -1 | 1) =>
      setState((s) => {
        if (!s) return s;
        const a = [...s.snippets],
          i = a.findIndex((x) => x.id === id),
          j = i + d;
        if (i < 0 || j < 0 || j >= a.length) return s;
        [a[i], a[j]] = [a[j], a[i]];
        post({ type: "reorderSnippets", payload: { ids: a.map((x) => x.id) } });
        return { ...s, snippets: a };
      }),
    [post],
  );
  const reorder = useCallback(
    (fromId: string, toId: string) =>
      setState((s) => {
        if (!s) return s;
        const a = [...s.snippets],
          from = a.findIndex((x) => x.id === fromId),
          to = a.findIndex((x) => x.id === toId);
        if (from < 0 || to < 0 || from === to) return s;
        const [item] = a.splice(from, 1);
        a.splice(to, 0, item);
        post({ type: "reorderSnippets", payload: { ids: a.map((x) => x.id) } });
        return { ...s, snippets: a };
      }),
    [post],
  );
  const updateColumnSettings = useCallback(
    (id: string, p: Partial<ColumnSettings>) =>
      setState((s) => {
        if (!s) return s;
        const next = { ...s.columnSettings[id], ...p };
        for (const key of Object.keys(next) as (keyof ColumnSettings)[]) {
          if (next[key] === undefined) delete next[key];
        }
        const columnSettings = { ...s.columnSettings };
        if (Object.keys(next).length) columnSettings[id] = next;
        else delete columnSettings[id];
        return { ...s, columnSettings };
      }),
    [],
  );
  const resetColumnSettings = useCallback(
    (id: string) =>
      setState((s) => {
        if (!s) return s;
        const columnSettings = { ...s.columnSettings };
        delete columnSettings[id];
        return { ...s, columnSettings };
      }),
    [],
  );
  const updateSnippetLanguage = useCallback(
    (id: string, language: string) =>
      setState((s) => s ? ({
        ...s,
        snippets: s.snippets.map((snippet) =>
          snippet.id === id ? { ...snippet, language } : snippet,
        ),
      }) : s),
    [],
  );
  const updateSnippetPresentation = useCallback(
    (id: string, patch: Partial<Pick<import("../types").CodeSnippet, "title" | "emphasizedLines">>) =>
      setState((s) => s ? ({ ...s, snippets: s.snippets.map((snippet) => snippet.id === id ? { ...snippet, ...patch } : snippet) }) : s),
    [],
  );
  return {
    state,
    configuration,
    hydrated,
    updateSettings,
    updateColumnSettings,
    resetColumnSettings,
    updateSnippetLanguage,
    updateSnippetPresentation,
    remove,
    move,
    reorder,
    post,
  };
}
