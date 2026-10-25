import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({ title, description, children, defaultOpen = false }: { title: string; description?: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details className="control-accordion" open={defaultOpen || undefined}>
    <summary>
      <span><strong>{title}</strong>{description && <small>{description}</small>}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </summary>
    <div className="accordion-content">{children}</div>
  </details>;
}
