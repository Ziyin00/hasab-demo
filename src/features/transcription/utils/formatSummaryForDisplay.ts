/** Strip common LLM markdown so summary reads as plain prose; lists are parsed separately. */
export function stripInlineMarkdownMarkers(segment: string): string {
  let s = segment;
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_\n]+)_/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  return s.trim();
}

function stripHeadingPrefix(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

export type SummaryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

/**
 * Turn raw summary text into paragraphs and bullet lists (no literal * / - in the copy).
 */
export function parseSummaryIntoBlocks(raw: string): SummaryBlock[] {
  const normalized = raw.trim().replace(/\r\n/g, "\n");
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const blocks: SummaryBlock[] = [];
  let paraBuf: string[] = [];
  let listBuf: string[] = [];

  const flushPara = () => {
    const joined = paraBuf.join("\n").trim();
    paraBuf = [];
    if (!joined) return;
    const text = stripInlineMarkdownMarkers(
      joined
        .split("\n")
        .map((ln) => stripHeadingPrefix(ln.trim()))
        .filter(Boolean)
        .join("\n"),
    );
    if (text) blocks.push({ kind: "paragraph", text });
  };

  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = listBuf
      .map((line) => stripInlineMarkdownMarkers(stripHeadingPrefix(line)))
      .filter(Boolean);
    listBuf = [];
    if (items.length) blocks.push({ kind: "list", items });
  };

  for (const line of lines) {
    const listMatch = line.match(/^\s*(?:[*\-•]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushPara();
      listBuf.push(listMatch[1].trim());
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      paraBuf.push(line);
    }
  }
  flushPara();
  flushList();

  return blocks;
}
