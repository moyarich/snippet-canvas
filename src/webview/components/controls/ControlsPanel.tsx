import { useEffect, useState, type ReactNode } from "react";
import { Columns3, FileText, MousePointer2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

type Props = {
  header: ReactNode;
  mode: ReactNode;
  page: ReactNode;
  columns: ReactNode;
  selection: ReactNode;
  actions: ReactNode;
  selectionAvailable: boolean;
};

export function ControlsPanel(props: Props) {
  const [tab, setTab] = useState<"page" | "columns" | "selection">("page");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("snippetCanvas.sidebarCollapsed") === "true");
  const toggleCollapsed = () => setCollapsed((current) => {
    const next = !current;
    localStorage.setItem("snippetCanvas.sidebarCollapsed", String(next));
    return next;
  });
  useEffect(() => {
    if (props.selectionAvailable) setTab("selection");
    else if (tab === "selection") setTab("columns");
  }, [props.selectionAvailable]);
  const tabs = [
    ["page", "Page", FileText], ["columns", "Columns", Columns3], ["selection", "Selected", MousePointer2],
  ] as const;
  return <aside className={`controls ${collapsed ? "collapsed" : ""}`}>
    <div className="controls-header">
      {!collapsed && props.header}
      <button className="sidebar-toggle" title={collapsed ? "Expand settings sidebar" : "Collapse settings sidebar"} aria-label={collapsed ? "Expand settings sidebar" : "Collapse settings sidebar"} aria-expanded={!collapsed} onClick={toggleCollapsed}>
        {collapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
      </button>
    </div>
    {!collapsed && <>
    <div className="layout-mode-slot">{props.mode}</div>
    <div className="control-tabs" role="tablist" aria-label="Composer settings">
      {tabs.map(([id, label, Icon]) => <button key={id} role="tab" aria-selected={tab === id} disabled={id === "selection" && !props.selectionAvailable} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={14} aria-hidden="true" /><span>{label}</span></button>)}
    </div>
    <div className="controls-body">
      <div role="tabpanel" className="control-tab-panel" key={tab}>
        {tab === "page" && props.page}
        {tab === "columns" && props.columns}
        {tab === "selection" && props.selection}
      </div>
    </div>
    <div className="controls-footer">{props.actions}</div>
    </>}
  </aside>;
}
