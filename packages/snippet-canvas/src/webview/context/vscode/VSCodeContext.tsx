import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { ClientMessage, HostMessage, SnippetCanvasDocument } from "../../types";
import { getVsCodeApi } from "../../api/vscode-api";
type Bridge = {
  post: (m: ClientMessage) => void;
  subscribe: (l: (m: HostMessage) => void) => () => void;
};
const Context = createContext<Bridge | null>(null);
export function VSCodeProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<(m: HostMessage) => void>());
  useEffect(() => {
    const h = (e: MessageEvent<HostMessage>) =>
      listeners.current.forEach((f) => f(e.data));
    window.addEventListener("message", h);
    getVsCodeApi().postMessage({ type: "ready" });
    return () => window.removeEventListener("message", h);
  }, []);
  const post = useCallback((m: ClientMessage) => getVsCodeApi().postMessage(m), []);
  const subscribe = useCallback((l: (m: HostMessage) => void) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);
  return (
    <Context.Provider
      value={useMemo(() => ({ post, subscribe }), [post, subscribe])}
    >
      {children}
    </Context.Provider>
  );
}
export function useVSCode() {
  const v = useContext(Context);
  if (!v) throw Error("useVSCode must be inside VSCodeProvider");
  return v;
}
