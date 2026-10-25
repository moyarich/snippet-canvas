import domToImage from "dom-to-image-more";
import { PDFDocument } from "pdf-lib";
import type { ExportFormat } from "../types";

export type LayoutError = { key: string; message: string; columnId: string };
const PDF_POINTS_PER_PIXEL = 72 / 300;
const MAX_CANVAS_DIMENSION = 16384;
const MAX_CANVAS_AREA = MAX_CANVAS_DIMENSION * MAX_CANVAS_DIMENSION;

type SavedPageStyle = {
  page: HTMLElement;
  width: string;
  height: string;
  minHeight: string;
  maxWidth: string;
  maxHeight: string;
};

const savePageStyles = (pages: HTMLElement[]): SavedPageStyle[] => pages.map((page) => ({
  page,
  width: page.style.width,
  height: page.style.height,
  minHeight: page.style.minHeight,
  maxWidth: page.style.maxWidth,
  maxHeight: page.style.maxHeight,
}));

const restorePageStyles = (styles: SavedPageStyle[]) => () => styles.forEach(({ page, width, height, minHeight, maxWidth, maxHeight }) => {
  page.style.width = width;
  page.style.height = height;
  page.style.minHeight = minHeight;
  page.style.maxWidth = maxWidth;
  page.style.maxHeight = maxHeight;
});

export const fitPagesToCode = (pages: HTMLElement[], minimumWidth = 0, minimumHeight = 0) => {
  const restore = restorePageStyles(savePageStyles(pages));
  for (const page of pages) {
    // Release the configured height before measuring. Otherwise the page's
    // grid track can collapse its rows to the Fit minimum and report a height
    // smaller than the columns it contains.
    page.style.height = "auto";
    page.style.minHeight = "0";
    page.style.maxHeight = "none";
    const computed = getComputedStyle(page);
    const rows = Array.from(page.querySelectorAll<HTMLElement>(":scope > .column-row"));
    const horizontalPadding = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    const verticalPadding = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
    const gap = parseFloat(computed.rowGap || computed.gap) || 0;
    const rowWidths = rows.map((row) => {
      const columns = Array.from(row.querySelectorAll<HTMLElement>(":scope > .snippet"));
      return columns.reduce((width, column) => width + column.offsetWidth, 0) + Math.max(0, columns.length - 1) * gap;
    });
    const rowHeights = rows.map((row) => Math.max(
      0,
      ...Array.from(row.querySelectorAll<HTMLElement>(":scope > .snippet"))
        .map((column) => column.offsetHeight),
    ));
    page.style.width = `${Math.max(minimumWidth, Math.ceil(Math.max(1, ...rowWidths) + horizontalPadding))}px`;
    page.style.height = `${Math.max(minimumHeight, Math.ceil(rowHeights.reduce((height, rowHeight) => height + rowHeight, 0) + Math.max(0, rows.length - 1) * gap + verticalPadding))}px`;
  }
  return restore;
};

export const setPagesToExactSize = (pages: HTMLElement[], width: number, height: number) => {
  const restore = restorePageStyles(savePageStyles(pages));
  pages.forEach((page) => {
    page.style.width = `${width}px`;
    page.style.height = `${height}px`;
    page.style.minHeight = "0";
    page.style.maxWidth = `${width}px`;
    page.style.maxHeight = `${height}px`;
  });
  return restore;
};

export const findOversizedPage = (pages: HTMLElement[], scale: number) => pages.find((page) => {
  const width = page.offsetWidth * scale;
  const height = page.offsetHeight * scale;
  return width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION || width * height > MAX_CANVAS_AREA;
});

export function findLayoutErrors(pages: HTMLElement[], exactPageSize?: { width: number; height: number }) {
  const issues = new Map<string, LayoutError>();
  const addIssue = (node: HTMLElement, reason: string) => {
    const column = node.closest<HTMLElement>("[data-column-id]");
    const page = node.closest<HTMLElement>("[data-page-number]");
    if (!column || !page) return;
    const columnId = column.dataset.columnId!;
    issues.set(`${columnId}:${reason}`, { key: `${columnId}:${reason}`, columnId, message: `Page ${page.dataset.pageNumber} · ${column.dataset.columnName} · ${reason}` });
  };
  pages.flatMap((page) => Array.from(page.querySelectorAll<HTMLElement>("[data-code-width='true']"))).filter((node) => node.scrollWidth > node.clientWidth + 1).forEach((node) => addIssue(node, "code is too wide"));
  pages.flatMap((page) => Array.from(page.querySelectorAll<HTMLElement>("[data-code-height='true']"))).filter((node) => node.scrollHeight > node.clientHeight + 1).forEach((node) => addIssue(node, "code is too tall"));
  if (exactPageSize) pages.forEach((page) => {
    if (page.scrollWidth <= page.clientWidth + 1 && page.scrollHeight <= page.clientHeight + 1) return;
    const pageNumber = page.closest<HTMLElement>("[data-page-number]")?.dataset.pageNumber ?? "";
    issues.set(`page:${pageNumber}`, { key: `page:${pageNumber}`, columnId: "", message: `Page ${pageNumber} · content exceeds the configured ${exactPageSize.width} × ${exactPageSize.height} page size` });
  });
  return [...issues.values()];
}

const exportFilter = (child: Node) => !(child instanceof HTMLElement && child.dataset.exportIgnore === "true");

export async function renderPages(pages: HTMLElement[], format: ExportFormat, scale: number, quality: number) {
  const dimensions = pages.map((page) => ({ width: page.offsetWidth, height: page.offsetHeight }));
  const dataUrls = await Promise.all(pages.map((page, index) => {
    const options = { ...dimensions[index], scale, cacheBust: true, filter: exportFilter };
    if (format === "svg") return domToImage.toSvg(page, { ...options, scale: 1 });
    if (format === "jpeg") return domToImage.toJpeg(page, { ...options, quality });
    return domToImage.toPng(page, options);
  }));
  if (format !== "pdf") return dataUrls;
  const pdf = await PDFDocument.create();
  for (let index = 0; index < dataUrls.length; index += 1) {
    const image = await pdf.embedPng(dataUrls[index]);
    const width = dimensions[index].width * PDF_POINTS_PER_PIXEL;
    const height = dimensions[index].height * PDF_POINTS_PER_PIXEL;
    pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
  }
  return [`data:application/pdf;base64,${await pdf.saveAsBase64()}`];
}

export const renderColumnPng = (column: HTMLElement) => domToImage.toPng(column, {
  pixelRatio: 2,
  cacheBust: true,
  filter: exportFilter,
});
