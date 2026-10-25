import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
import type { ExportFormat } from "../../types";

export type ExportOptions = {
  format: ExportFormat;
  scale: number;
  quality: number;
  scope: "all" | "current";
  fitContent: boolean;
};

export function ExportControls({
  onExport,
  onCopy,
  pageWidth,
  pageHeight,
  contentSized,
}: {
  onExport: (options: ExportOptions) => void;
  onCopy: (options: ExportOptions) => void;
  pageWidth: number;
  pageHeight: number;
  contentSized: boolean;
}) {
  const [options, setOptions] = useState<ExportOptions>({
    format: "png",
    scale: 2,
    quality: 0.92,
    scope: "all",
    fitContent: false,
  });
  const isVector = options.format === "svg";
  const maxRasterScale = Math.max(1, Math.min(4, Math.floor(16384 / Math.max(pageWidth, pageHeight))));
  useEffect(() => {
    if (options.scale > maxRasterScale) setOptions((current) => ({ ...current, scale: maxRasterScale }));
  }, [maxRasterScale, options.scale]);
  const outputSummary = isVector
    ? `Vector · ${pageWidth} × ${pageHeight} px page`
    : options.format === "pdf"
      ? `${pageWidth} × ${pageHeight} px page · ${options.scale}× raster detail`
      : `${pageWidth * options.scale} × ${pageHeight * options.scale} px per page`;

  return (
    <div className="export-controls">
      <div className="export-options">
        <div className="export-field">
          <label htmlFor="export-format">Format</label>

          <select
            id="export-format"
            value={options.format}
            onChange={(event) =>
              setOptions({
                ...options,
                format: event.target.value as ExportFormat,
              })
            }
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="svg">SVG</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="export-field">
          <label htmlFor="export-pages">Pages</label>

          <select
            id="export-pages"
            value={options.scope}
            onChange={(event) =>
              setOptions({
                ...options,
                scope: event.target.value as ExportOptions["scope"],
              })
            }
          >
            <option value="all">All pages</option>
            <option value="current">Current page</option>
          </select>
        </div>

        <div className="export-field">
          <label htmlFor="export-resolution">Resolution</label>

          <select
            id="export-resolution"
            value={options.scale}
            disabled={isVector}
            onChange={(event) =>
              setOptions({
                ...options,
                scale: Number(event.target.value),
              })
            }
          >
            {[1, 2, 3, 4].map((scale) => <option key={scale} value={scale} disabled={scale > maxRasterScale}>{scale}×</option>)}
          </select>
          {isVector && <small>Vector</small>}
          {!isVector && maxRasterScale < 4 && <small>Maximum {maxRasterScale}× for this page size</small>}
        </div>

        {options.format === "jpeg" && (
          <div className="export-field">
            <label htmlFor="export-quality">Quality</label>

            <select
              id="export-quality"
              value={options.quality}
              onChange={(event) =>
                setOptions({
                  ...options,
                  quality: Number(event.target.value),
                })
              }
            >
              <option value={0.8}>80%</option>
              <option value={0.92}>92%</option>
              <option value={1}>100%</option>
            </select>
          </div>
        )}
      </div>

      <output className="export-summary" aria-live="polite">{outputSummary}</output>

      {!contentSized && <div className="export-settings">
        <label className="check export-fit">
          <input
            type="checkbox"
            checked={options.fitContent}
            onChange={(event) =>
              setOptions({
                ...options,
                fitContent: event.target.checked,
              })
            }
          />

          <span>Expand page to fit all code</span>
        </label>
      </div>}

      <div className="export-actions">
        <button className="primary" onClick={() => onExport(options)}>
          <Download size={15} aria-hidden="true" />
          <span>Export {options.format.toUpperCase()}</span>
        </button>

        <button
          onClick={() =>
            onCopy({
              ...options,
              scope: "current",
            })
          }
        >
          <Copy size={15} aria-hidden="true" />
          <span>Copy current page</span>
        </button>
      </div>
    </div>
  );
}
