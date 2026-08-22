import type {
  LanguageOption,
  QuickPrompt,
  QuickPromptsConfig,
  QuickPromptsMultilingual,
} from "../types/chatbot-widget.types";
import { normalizeUiLanguageCode } from "./languageCodes";

/**
 * Remap quick_prompts keys from legacy STT aliases (amh/orm/eng) to UI codes (am/om/en).
 * Alias keys fill in only when the canonical key is missing; canonical keys win.
 */
export function normalizeQuickPromptKeys(
  quickPrompts: QuickPromptsConfig | undefined | null
): QuickPromptsConfig | undefined {
  if (!quickPrompts || Array.isArray(quickPrompts)) return quickPrompts ?? undefined;

  const next: QuickPromptsMultilingual = {};

  for (const [key, list] of Object.entries(quickPrompts)) {
    if (!Array.isArray(list)) continue;
    const normalized = normalizeUiLanguageCode(key);
    if (!next[normalized]?.length) {
      next[normalized] = list.map((p) => ({ ...p }));
    }
  }

  for (const [key, list] of Object.entries(quickPrompts)) {
    if (!Array.isArray(list)) continue;
    const normalized = normalizeUiLanguageCode(key);
    if (key === normalized) {
      next[normalized] = list.map((p) => ({ ...p }));
    }
  }

  return next;
}

/** Aliases the CDN also understands — try exact key first, then these. */
const LANG_ALIASES: Record<string, string[]> = {
  am: ["amh"],
  amh: ["am"],
  orm: ["om"],
  om: ["orm"],
  en: ["eng"],
  eng: ["en"],
};

export function isMultilingualQuickPrompts(
  value: QuickPromptsConfig | undefined | null
): value is QuickPromptsMultilingual {
  return !!value && !Array.isArray(value) && typeof value === "object";
}

/**
 * Normalize whatever the API returns into the per-language object format.
 * Legacy arrays are assigned to the first configured language (or `en`).
 */
export function normalizeQuickPrompts(
  quickPrompts: QuickPromptsConfig | undefined | null,
  languages: LanguageOption[] | undefined
): QuickPromptsMultilingual {
  if (!quickPrompts) return {};

  if (!Array.isArray(quickPrompts)) {
    const out: QuickPromptsMultilingual = {};
    for (const [code, list] of Object.entries(quickPrompts)) {
      out[code] = Array.isArray(list) ? list.map((p) => ({ ...p })) : [];
    }
    return out;
  }

  const primary = languages?.[0]?.code || "en";
  return { [primary]: quickPrompts.map((p) => ({ ...p })) };
}

/**
 * Resolve prompts for the visitor's current language.
 * Guide: currentLang → en → empty (caller uses built-in UI_STRINGS).
 */
export function resolveQuickPromptsForLang(
  quickPrompts: QuickPromptsConfig | undefined | null,
  lang: string
): QuickPrompt[] | null {
  if (!quickPrompts) return null;

  // Legacy array: same chips for every language
  if (Array.isArray(quickPrompts)) {
    return quickPrompts.length > 0 ? quickPrompts : null;
  }

  const candidates = [lang, ...(LANG_ALIASES[lang] ?? []), "en", "eng"];
  const tried = new Set<string>();

  for (const code of candidates) {
    if (tried.has(code)) continue;
    tried.add(code);
    const list = quickPrompts[code];
    if (Array.isArray(list) && list.length > 0) return list;
  }

  // Missing / empty → built-in fallback in the widget
  return null;
}

export function hasAnyQuickPrompts(
  quickPrompts: QuickPromptsConfig | undefined | null
): boolean {
  if (!quickPrompts) return false;
  if (Array.isArray(quickPrompts)) return quickPrompts.length > 0;
  return Object.values(quickPrompts).some((l) => Array.isArray(l) && l.length > 0);
}
