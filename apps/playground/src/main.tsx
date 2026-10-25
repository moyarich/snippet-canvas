import { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DocumentationSite } from "./components/ui/Layout/DocumentationSite/DocumentationSite";
import { DocOutline, DocOutlineShell } from "./components/ui/DocOutline";
import { CodeBlock } from "./components/ui/CodeBlock";
import "./styles.css";

const pages = [
  { path: "/", label: "Overview", sourcePath: "docs/page.mdx", content: lazy(() => import("../../../docs/page.mdx")) },
  { path: "/getting-started", label: "Getting started", sourcePath: "docs/getting-started/page.mdx", content: lazy(() => import("../../../docs/getting-started/page.mdx")) },
  { path: "/development", label: "Development", sourcePath: "docs/development/page.mdx", content: lazy(() => import("../../../docs/development/page.mdx")) },
  { path: "/playground", label: "Live composer", sourcePath: "packages/snippet-canvas/src/webview/App.tsx" },
];
const getPath = () => window.location.hash.slice(1) || "/";
const navigate = (path: string) => { window.location.hash = path; };
const search = async (query: string) => pages.filter((page) => page.label.toLowerCase().includes(query.toLowerCase()));
const components = { pre: CodeBlock };

function App() {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const update = () => { setPath(getPath()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const page = pages.find((item) => item.path === path);
  const Content = page && "content" in page ? page.content : undefined;
  useEffect(() => { document.title = `${page?.label ?? "Page not found"} | SnippetCanvas`; }, [page]);
  return <DocumentationSite
    title="SnippetCanvas"
    repository="https://github.com/moyarich/snippet-canvas"
    pages={pages}
    currentPath={path}
    onNavigate={navigate}
    search={search}
    sidebar={<aside className="mf-sidebar"><div className="playground-version">SnippetCanvas · v0.1.0</div><nav className="playground-nav" aria-label="Documentation">{pages.map((item) => <a key={item.path} href={`#${item.path}`} aria-current={item.path === path ? "page" : undefined}>{item.label}</a>)}</nav></aside>}
    outline={path !== "/playground" ? <DocOutlineShell><DocOutline key={path} renderLink={(item, active) => <a href={`#${path}`} aria-current={active ? "location" : undefined} onClick={(event) => { event.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}>{item.label}</a>} /></DocOutlineShell> : null}
  >
    <Suspense fallback={<p role="status">Loading documentation…</p>}>
      {Content ? <Content components={components} /> : path === "/playground" ? <><h1>Live composer</h1><p>Try layouts, colors, typography, and image exports with a sample code snippet.</p><a className="preview-link" href="./snippet-preview.html" target="_blank" rel="noreferrer">Open composer in a new tab</a><iframe className="composer-preview" src="./snippet-preview.html" title="SnippetCanvas composer" allow="clipboard-write" /></> : <><h1>Page not found</h1><a href="#/">Return to overview</a></>}
    </Suspense>
  </DocumentationSite>;
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing playground root element");
createRoot(root).render(<App />);
