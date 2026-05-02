export function formatSeconds(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/** MM:SS for floating scrubber labels */
export function formatMmSs(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const mm = Math.floor(safe / 60);
  const ss = Math.floor(safe % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
