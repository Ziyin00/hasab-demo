export type ExportSegment = {
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string;
};

function toSrtTimestamp(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const ms = Math.round((safe % 1) * 1000);
  const total = Math.floor(safe);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss},${String(ms).padStart(3, "0")}`;
}

export function buildSrtContent(segments: ExportSegment[], fallbackText: string): string {
  const raw =
    segments.length > 0
      ? segments
      : fallbackText.trim()
        ? [{ startSeconds: 0, endSeconds: 10, text: fallbackText.trim() }]
        : [];
  const lines = raw
    .map(
      (r, i) =>
        `${i + 1}\n${toSrtTimestamp(r.startSeconds)} --> ${toSrtTimestamp(r.endSeconds)}\n${r.text}\n`
    )
    .join("\n");
  return lines;
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Escape transcript text before injecting into offline HTML for html2canvas. */
function escapePdfHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Split on blank lines into paragraphs; single newlines become line breaks inside each block. */
function transcriptBodyToParagraphHtml(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return `<p class="para para--empty">(No transcript content.)</p>`;
  }
  return trimmed
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const escaped = escapePdfHtml(block).replace(/\n/g, "<br />");
      return `<p class="para">${escaped}</p>`;
    })
    .join("");
}

const PDF_MARGIN_PT = 52;
/** Footer band at bottom of page (rule + page numbers), below the raster. */
const PDF_FOOTER_BAND_PT = 44;

/**
 * Renders transcript in an isolated iframe (rgb-only CSS), captures with html2canvas
 * on that subtree — avoids jsPDF `.html()`, which clones into the host document and pulls
 * in Tailwind `lab()` / `oklch()` that html2canvas cannot parse.
 */
export async function saveTranscriptPdf(title: string, body: string, filenameBase: string) {
  if (typeof document === "undefined") return;

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const pageW_pt = doc.internal.pageSize.getWidth();
  const pageH_pt = doc.internal.pageSize.getHeight();
  const contentW_pt = pageW_pt - PDF_MARGIN_PT * 2;
  const contentH_pt = pageH_pt - PDF_MARGIN_PT * 2;
  /** Max raster height per page = content height minus footer band. */
  const imageViewportH_pt = Math.max(contentH_pt - PDF_FOOTER_BAND_PT, 120);
  const rasterBottomY = pageH_pt - PDF_MARGIN_PT - PDF_FOOTER_BAND_PT;
  const footerRuleY = rasterBottomY + 8;
  const footerTextY = pageH_pt - 20;
  const pxWidth = Math.round((contentW_pt * 96) / 72);

  const displayTitleRaw = title.trim() || filenameBase || "Transcript";
  const safeTitle = escapePdfHtml(displayTitleRaw);
  const normalizedBody = body.replace(/\r\n/g, "\n").trim();
  const bodyInnerHtml = transcriptBodyToParagraphHtml(normalizedBody);

  const exportedMeta = escapePdfHtml(
    `Exported ${new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })} · Hasab`
  );

  const fontCss =
    "https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&display=swap";

  try {
    doc.setProperties({
      title: displayTitleRaw.slice(0, 512),
      subject: "Transcript",
      author: "Hasab",
      keywords: "transcript,subtitle",
      creator: "Hasab Dashboard",
    });
  } catch {
    /* narrow environments */
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${pxWidth + 80}px`,
    "min-height:4800px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");

  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument;
    if (!idoc) return;

    idoc.open();
    idoc.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
      `<link rel="preconnect" href="https://fonts.googleapis.com"/>` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>` +
      `<link rel="stylesheet" href="${fontCss}"/>` +
      `<style>` +
      `*,*::before,*::after{box-sizing:border-box;}` +
      `html,body{margin:0;padding:0;background:rgb(255,255,255);}` +
      `.wrap{` +
      `width:${pxWidth}px;max-width:${pxWidth}px;` +
      `margin:0 auto;padding:4px 4px 36px;` +
      `-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;` +
      `text-rendering:optimizeLegibility;` +
      `font-family:"Manrope","Noto Sans Ethiopic","Segoe UI","Apple Color Emoji",system-ui,sans-serif;` +
      `font-size:12.5px;line-height:1.72;` +
      `font-weight:400;` +
      `color:rgb(51,65,85);` +
      `background:rgb(255,255,255);` +
      `letter-spacing:0.013em;` +
      `}` +
      `.meta{` +
      `display:block;` +
      `font-size:10px;line-height:1.5;` +
      `font-weight:500;` +
      `color:rgb(148,163,184);` +
      `margin:0 0 28px;padding:0;` +
      `letter-spacing:0.045em;` +
      `text-transform:uppercase;` +
      `}` +
      `h1.doc-title{` +
      `font-family:inherit;` +
      `font-size:20px;` +
      `line-height:1.32;` +
      `font-weight:600;` +
      `color:rgb(15,23,39);` +
      `margin:0 0 22px;padding:0 0 18px;` +
      `letter-spacing:-0.028em;` +
      `border-bottom:1px solid rgb(226,232,240);` +
      `}` +
      `.paras{` +
      `display:flex;` +
      `flex-direction:column;` +
      `gap:18px;` +
      `margin:0;` +
      `padding:2px 0 0;` +
      `unicode-bidi:plaintext;` +
      `}` +
      `p.para{` +
      `margin:0;` +
      `padding:0;` +
      `line-height:1.74;` +
      `word-break:break-word;` +
      `overflow-wrap:break-word;` +
      `color:rgb(51,65,85);` +
      `}` +
      `p.para--empty{font-style:italic;color:rgb(148,163,184);}` +
      `</style></head><body>` +
      `<div class="wrap">` +
      `<div class="meta">${exportedMeta}</div>` +
      `<h1 class="doc-title">${safeTitle}</h1>` +
      `<div class="paras">${bodyInnerHtml}</div>` +
      `</div></body></html>`
    );
    idoc.close();

    const win = idoc.defaultView;
    if (win) {
      await new Promise<void>((resolve) => {
        void win.document.fonts.ready.then(() => resolve()).catch(() => resolve());
        setTimeout(() => resolve(), 800);
      });
    }

    const target = (idoc.body.querySelector(".wrap") as HTMLElement | null) ?? idoc.body;
    const globalWin = typeof window !== "undefined" ? window : null;
    const dpr = globalWin ? Math.min(globalWin.devicePixelRatio || 1, 2.5) : 2;

    /** Raster scale for crisp type in PDF (capped for file size). */
    const captureScale = Math.min(3.25, Math.max(2.25, (dpr * 5) / 3));

    const runCapture = async (foreignObject: boolean) =>
      html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: captureScale,
        logging: false,
        useCORS: true,
        foreignObjectRendering: foreignObject,
        windowWidth: Math.max(pxWidth + 24, target.scrollWidth),
        windowHeight: Math.max(1, target.scrollHeight),
      });

    let canvas: HTMLCanvasElement;
    try {
      canvas = await runCapture(false);
    } catch {
      canvas = await runCapture(true);
    }

    const imgW_pt = contentW_pt;
    const pxTo_pt = imgW_pt / canvas.width;
    const totalImgH_pt = canvas.height * pxTo_pt;
    const pageCount = Math.max(1, Math.ceil((totalImgH_pt - 1e-3) / imageViewportH_pt));

    /** Sharp tiling for multi-page raster */
    const drawSlice = (
      dest: HTMLCanvasElement,
      srcCanvas: HTMLCanvasElement,
      srcYPx: number,
      slicePxHNumber: number
    ) => {
      const destHPx = Math.max(1, Math.ceil(slicePxHNumber));
      dest.width = srcCanvas.width;
      dest.height = destHPx;
      const sctx = dest.getContext("2d");
      if (!sctx) return;
      sctx.fillStyle = "#ffffff";
      sctx.fillRect(0, 0, dest.width, dest.height);
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(
        srcCanvas,
        0,
        Math.max(0, Math.floor(srcYPx)),
        srcCanvas.width,
        slicePxHNumber,
        0,
        0,
        srcCanvas.width,
        slicePxHNumber
      );
    };

    const strip = document.createElement("canvas");
    const jpegQ = 0.98;

    for (let page = 0; page < pageCount; page++) {
      if (page > 0) doc.addPage();
      const offset_pt = page * imageViewportH_pt;
      const remaining_pt = Math.max(0, totalImgH_pt - offset_pt);
      const sliceH_pt = Math.min(imageViewportH_pt, remaining_pt);
      const srcY_px = offset_pt / pxTo_pt;
      const slicePxH = sliceH_pt / pxTo_pt;

      drawSlice(strip, canvas, srcY_px, slicePxH);

      doc.addImage(
        strip.toDataURL("image/jpeg", jpegQ),
        "JPEG",
        PDF_MARGIN_PT,
        PDF_MARGIN_PT,
        imgW_pt,
        sliceH_pt
      );

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(PDF_MARGIN_PT, footerRuleY, pageW_pt - PDF_MARGIN_PT, footerRuleY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 130, 150);
      doc.text(`Page ${page + 1} of ${pageCount}`, pageW_pt / 2, footerTextY, { align: "center" });
      doc.setTextColor(30, 41, 59);
    }

    doc.save(`${filenameBase}.pdf`);
  } finally {
    iframe.remove();
  }
}
