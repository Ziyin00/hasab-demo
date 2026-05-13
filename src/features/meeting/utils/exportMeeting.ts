"use client";

import html2canvas from "html2canvas";

/** Safe Windows/macOS filename stem (drops extension-like suffix from titles). */
export function sanitizeMeetingExportStem(title: string): string {
  const base = title.replace(/\.[^/.]+$/, "").trim() || "meeting_minutes";
  return base.replace(/[/\\?%*:|"<>#\x00-\x1f]/g, "_").slice(0, 120);
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Lightweight markdown cleanup for plain-text downloads. */
export function markdownToPlain(md: string): string {
  let s = md.trim();
  if (!s) return "(No summary)";
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/^(-|\*|\+|\d+\.)\s+/gm, "• ");
  return s.replace(/\n{3,}/g, "\n\n");
}

export function exportMeetingMinutesTxt(summary: string, title = "Meeting minutes") {
  const body = markdownToPlain(summary ?? "");
  const stem = sanitizeMeetingExportStem(title);
  const content = `Hasab AI — Meeting minutes\n\n${stem}\n\n${body}\n`;
  downloadBlob(`${stem}_HASAB_AI_meeting_minutes.txt`, content, "text/plain;charset=utf-8");
}

/** html2canvas’s CSS parser does not support CSS Color 4 syntax. */
function canvasSafeColor(value: string, fallback: string): string {
  const t = value.trim();
  if (/^(lab|oklch|lch|hwb|color)\(/i.test(t)) return fallback;
  return t;
}

/**
 * html2canvas cannot parse modern CSS Color 4 functions (`lab()`, `oklch()`, …) from stylesheets.
 * Strip utility classes on the clone and copy resolved values from the live tree so paints use rgb/rgba.
 */
function flattenCloneStylesFromOriginal(original: HTMLElement, cloned: HTMLElement): void {
  cloned.removeAttribute("class");

  const cs = window.getComputedStyle(original);

  cloned.style.color = canvasSafeColor(cs.color, "#171717");
  cloned.style.backgroundColor = canvasSafeColor(cs.backgroundColor, "transparent");
  cloned.style.backgroundImage = "none";

  cloned.style.fontFamily = cs.fontFamily;
  cloned.style.fontSize = cs.fontSize;
  cloned.style.fontWeight = cs.fontWeight;
  cloned.style.fontStyle = cs.fontStyle;
  cloned.style.lineHeight = cs.lineHeight;
  cloned.style.letterSpacing = cs.letterSpacing;
  cloned.style.textAlign = cs.textAlign;
  cloned.style.textTransform = cs.textTransform;
  cloned.style.whiteSpace = cs.whiteSpace as string;

  cloned.style.textDecorationLine = cs.textDecorationLine;
  cloned.style.textDecorationColor = canvasSafeColor(
    cs.textDecorationColor,
    canvasSafeColor(cs.color, "#171717"),
  );
  cloned.style.textDecorationStyle = cs.textDecorationStyle;

  cloned.style.borderTopWidth = cs.borderTopWidth;
  cloned.style.borderTopStyle = cs.borderTopStyle;
  cloned.style.borderTopColor = canvasSafeColor(cs.borderTopColor, "#e4e4e7");
  cloned.style.borderRightWidth = cs.borderRightWidth;
  cloned.style.borderRightStyle = cs.borderRightStyle;
  cloned.style.borderRightColor = canvasSafeColor(cs.borderRightColor, "#e4e4e7");
  cloned.style.borderBottomWidth = cs.borderBottomWidth;
  cloned.style.borderBottomStyle = cs.borderBottomStyle;
  cloned.style.borderBottomColor = canvasSafeColor(cs.borderBottomColor, "#e4e4e7");
  cloned.style.borderLeftWidth = cs.borderLeftWidth;
  cloned.style.borderLeftStyle = cs.borderLeftStyle;
  cloned.style.borderLeftColor = canvasSafeColor(cs.borderLeftColor, "#e4e4e7");
  cloned.style.borderRadius = cs.borderRadius;
  cloned.style.borderCollapse = cs.borderCollapse;
  cloned.style.boxShadow = /lab\(|oklch\(|lch\(|hwb\(/i.test(cs.boxShadow) ? "none" : cs.boxShadow;

  cloned.style.paddingTop = cs.paddingTop;
  cloned.style.paddingRight = cs.paddingRight;
  cloned.style.paddingBottom = cs.paddingBottom;
  cloned.style.paddingLeft = cs.paddingLeft;
  cloned.style.marginTop = cs.marginTop;
  cloned.style.marginRight = cs.marginRight;
  cloned.style.marginBottom = cs.marginBottom;
  cloned.style.marginLeft = cs.marginLeft;

  cloned.style.boxSizing = cs.boxSizing;
  cloned.style.display = cs.display;
  cloned.style.verticalAlign = cs.verticalAlign;

  cloned.style.listStyleType = cs.listStyleType;
  cloned.style.listStylePosition = cs.listStylePosition;

  const oChildren = [...original.children];
  const cChildren = [...cloned.children];
  const n = Math.min(oChildren.length, cChildren.length);
  for (let i = 0; i < n; i++) {
    const o = oChildren[i];
    const c = cChildren[i];
    if (o instanceof HTMLElement && c instanceof HTMLElement) {
      flattenCloneStylesFromOriginal(o, c);
    }
  }
}

async function canvasToMultiPagePdf(canvas: HTMLCanvasElement, saveAsFilename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const innerW = pageWidth - margin * 2;
  const innerH = pageHeight - margin * 2;

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgDisplayWidth = innerW;
  const imgDisplayHeight = (canvas.height * imgDisplayWidth) / canvas.width;

  let heightLeft = imgDisplayHeight;
  let yPos = margin;

  pdf.addImage(imgData, "JPEG", margin, yPos, imgDisplayWidth, imgDisplayHeight);
  heightLeft -= innerH;

  while (heightLeft > 1) {
    yPos = margin + (heightLeft - imgDisplayHeight);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, yPos, imgDisplayWidth, imgDisplayHeight);
    heightLeft -= innerH;
  }

  pdf.save(saveAsFilename);
}

/**
 * Renders the given element (typically a light-theme clone of the summary) to a
 * multi-page PDF. Uses html2canvas so system / webfonts (e.g. Amharic) match the browser.
 */
export async function exportMeetingMinutesPdfFromElement(
  element: HTMLElement | null,
  title: string,
): Promise<void> {
  if (!element) {
    throw new Error("MISSING_EXPORT_ROOT");
  }

  const stem = sanitizeMeetingExportStem(title);
  const filename = `${stem}_HASAB_AI_meeting_minutes.pdf`;

  await document.fonts.ready.catch(() => {});

  const rect = element.getBoundingClientRect();
  const canvas = await html2canvas(element, {
    scale: Math.min(2, window.devicePixelRatio || 2),
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: Math.max(element.scrollWidth, Math.ceil(rect.width)),
    windowHeight: element.scrollHeight,
    onclone: (_clonedDoc, cloned) => {
      if (!(cloned instanceof HTMLElement)) return;
      flattenCloneStylesFromOriginal(element, cloned);
      cloned.style.backgroundColor = "#ffffff";
    },
  });

  await canvasToMultiPagePdf(canvas, filename);
}
