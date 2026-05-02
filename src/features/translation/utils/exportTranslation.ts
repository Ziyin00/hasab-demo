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

/** Legacy TXT: `Hasab AI` banner + titled sections only when non-empty text */
export function exportTranslationTxt(sourceText: string, translatedText: string) {
  let content = "Hasab AI\n\n";
  const sections: { title: string; text: string }[] = [
    { title: "Original Text", text: sourceText },
    { title: "Translated Text", text: translatedText },
  ];
  for (const item of sections) {
    if (item.text?.trim()) {
      content += `${item.title}\n`;
      content += `${item.text}\n\n`;
    }
  }
  downloadBlob("HASAB_AI_translation.txt", content, "text/plain;charset=utf-8");
}

export async function exportTranslationPdf(sourceText: string, translatedText: string) {
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

  const writeBlock = (title: string, body: string) => {
    if (!body?.trim()) return;
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(body, maxWidth);
    for (const line of lines as string[]) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    }
    y += 24;
  };

  writeBlock("Original Text", sourceText);
  writeBlock("Translated Text", translatedText);

  doc.save("HASAB_AI_translation.pdf");
}
