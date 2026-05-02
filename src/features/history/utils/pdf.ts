import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { TranslationRecord, TranscriptionRecord } from "../types/history.types";

const LANG_NAMES: Record<string, string> = {
  amh: "Amharic",
  orm: "Oromo",
  eng: "English",
  fra: "French",
  ara: "Arabic",
  som: "Somali",
};

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

function formatDate(str: string) {
  return new Date(str).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function htmlToPDF(html: string, filename: string) {
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    "width:794px",
    "padding:48px",
    "background:#ffffff",
    "color:#1a1a1a",
    "font-family:system-ui,-apple-system,sans-serif",
    "font-size:14px",
    "line-height:1.6",
    "box-sizing:border-box",
  ].join(";");
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((el) => el.remove());
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let yOffset = 0;
    let remaining = imgHeight;

    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yOffset, imgWidth, imgHeight);
      yOffset += pageHeight;
      remaining -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadTranslationPDF(record: TranslationRecord) {
  const logo = await toBase64("/hasab_ai.png");

  const html = `
    <div style="display:block;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
      <img src="${logo}" style="width:32px;height:32px;border-radius:6px;display:inline-block;vertical-align:middle" />
      <span style="font-size:16px;font-weight:700;color:#1a1a1a;display:inline-block;vertical-align:middle;margin-left:10px">Hasab AI</span>
    </div>

    <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 6px">${langLabel(record.source_language)} → ${langLabel(record.target_language)}</h1>
      <p style="font-size:12px;color:#6b7280;margin:0">${formatDate(record.created_at)}</p>
      <p style="font-size:12px;color:#6b7280;margin:4px 0 0">${record.character_count.toLocaleString()} characters</p>
    </div>

    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">${langLabel(record.source_language)}</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
        <p style="margin:0;white-space:pre-wrap;font-size:14px">${record.source_text}</p>
      </div>
    </div>

    <div>
      <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">${langLabel(record.target_language)}</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
        <p style="margin:0;white-space:pre-wrap;font-size:14px">${record.translated_text}</p>
      </div>
    </div>
  `;

  await htmlToPDF(html, `translation-${record.id}.pdf`);
}

export async function downloadTranscriptionPDF(record: TranscriptionRecord) {
  const logo = await toBase64("/hasab_ai.png");
  const name = record.original_filename || record.filename;
  const durSec = parseFloat(record.duration_in_seconds);
  const durStr = isNaN(durSec)
    ? "—"
    : `${Math.floor(durSec / 60)}:${String(Math.floor(durSec % 60)).padStart(2, "0")}`;
  const sizeStr =
    record.file_size < 1024 * 1024
      ? `${(record.file_size / 1024).toFixed(1)} KB`
      : `${(record.file_size / (1024 * 1024)).toFixed(1)} MB`;

  const timestampRows = record.timestamp
    ?.map(
      (t) => `
      <tr>
        <td style="padding:4px 8px 4px 0;color:#6b7280;font-size:12px;white-space:nowrap">${t.start.toFixed(2)}s</td>
        <td style="padding:4px 8px;color:#9ca3af;font-size:12px">${t.speaker}</td>
        <td style="padding:4px 0;font-size:13px">${t.content}</td>
      </tr>`
    )
    .join("") ?? "";

  const html = `
    <div style="display:block;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
      <img src="${logo}" style="width:32px;height:32px;border-radius:6px;display:inline-block;vertical-align:middle" />
      <span style="font-size:16px;font-weight:700;color:#1a1a1a;display:inline-block;vertical-align:middle;margin-left:10px">Hasab AI</span>
    </div>

    <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
      <h1 style="font-size:18px;font-weight:700;margin:0 0 6px;word-break:break-all">${name}</h1>
      <p style="font-size:12px;color:#6b7280;margin:0">${formatDate(record.created_at)}</p>
      <p style="font-size:12px;color:#6b7280;margin:6px 0 0">
        Duration: ${durStr} &nbsp;·&nbsp; Size: ${sizeStr} &nbsp;·&nbsp; Speakers: ${record.num_speakers}
      </p>
    </div>

    ${
      record.transcription
        ? `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Transcription</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
        <p style="margin:0;white-space:pre-wrap;font-size:14px">${record.transcription}</p>
      </div>
    </div>`
        : ""
    }

    ${
      timestampRows
        ? `
    <div style="padding-top:16px;border-top:1px solid #e5e7eb">
      <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Timestamps</p>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${timestampRows}</tbody>
      </table>
    </div>`
        : ""
    }
  `;

  await htmlToPDF(html, `transcription-${record.id}.pdf`);
}
