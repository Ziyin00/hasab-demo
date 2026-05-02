"use client";

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMeetingMinutesTxt(summary: string, title = "Meeting minutes") {
  const body = summary?.trim() || "(No summary)";
  const content = `Hasab AI\n\n${title}\n\n${body}\n`;
  downloadBlob("HASAB_AI_meeting_minutes.txt", content, "text/plain;charset=utf-8");
}

export async function exportMeetingMinutesPdf(summary: string, title = "Meeting minutes") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Hasab AI", margin, y);
  y += 28;
  doc.setFontSize(12);
  doc.text(title, margin, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  const text = summary?.trim() || "(No summary)";
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines as string[]) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 16;
  }
  doc.save("HASAB_AI_meeting_minutes.pdf");
}
