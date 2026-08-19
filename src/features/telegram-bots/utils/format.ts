export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function normalizeCommandName(raw: string): string {
  return raw.trim().replace(/^\//, "").toLowerCase();
}

export function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export function miniAppUrlError(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") return "HTTP is not allowed. Use an HTTPS URL.";
    if (parsed.protocol !== "https:") return "Enter a valid HTTPS URL.";
    if (!parsed.hostname) return "Enter a valid HTTPS URL.";
    return null;
  } catch {
    if (/^http:\/\//i.test(url)) return "HTTP is not allowed. Use an HTTPS URL.";
    return "Enter a valid HTTPS URL (must start with https://).";
  }
}

function asUrl(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
  if (value && typeof value === "object" && "url" in value) {
    return asUrl((value as { url?: unknown }).url);
  }
  return null;
}

export function telegramUserpicUrl(username: string | null | undefined, bust?: string | null): string | null {
  const handle = username?.replace(/^@/, "").trim();
  if (!handle) return null;
  const q = bust ? `?v=${encodeURIComponent(bust)}` : "";
  return `https://t.me/i/userpic/320/${handle}.jpg${q}`;
}

export function botProfilePhotoUrl(bot: {
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  profile_photo?: unknown;
  bot_username?: string | null;
  updated_at?: string;
} | null | undefined): string | null {
  if (!bot) return null;
  return (
    asUrl(bot.profile_photo_url) ||
    asUrl(bot.photo_url) ||
    asUrl(bot.avatar_url) ||
    asUrl(bot.profile_photo) ||
    telegramUserpicUrl(bot.bot_username, bot.updated_at)
  );
}
