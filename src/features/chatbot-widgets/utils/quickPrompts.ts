import type {
  LanguageOption,
  QuickPrompt,
  QuickPromptsConfig,
  QuickPromptsMultilingual,
} from "../types/chatbot-widget.types";
import { normalizeUiLanguageCode } from "./languageCodes";

/**
 * Built-in chips — seed the editor only when the API omits `quick_prompts`.
 * Match `LANG_STRINGS.*.prompts` in hasab-chatbot.js / ChatWidget.
 */
export const DEFAULT_QUICK_PROMPTS: QuickPromptsMultilingual = {
  en: [
    { label: "What can you help me with?", prompt: "What can you help me with?" },
    { label: "Tell me about your features", prompt: "Tell me about your features" },
    { label: "How do I get started?", prompt: "How do I get started?" },
  ],
  am: [
    { label: "ምን ሊረዱኝ ይችላሉ?", prompt: "ምን ሊረዱኝ ይችላሉ?" },
    { label: "ስለ ፕሮዳክቱ ይናገሩ", prompt: "ስለ ፕሮዳክቱ ይናገሩ" },
    { label: "እንዴት እጀምር?", prompt: "እንዴት እጀምር?" },
  ],
  om: [
    { label: "Maal na gargaaruu dandeessa?", prompt: "Maal na gargaaruu dandeessa?" },
    { label: "Waa'ee tajaajila dubbadhu", prompt: "Waa'ee tajaajila dubbadhu" },
    { label: "Akkami jalqabuu?", prompt: "Akkami jalqabuu?" },
  ],
};

export function cloneDefaultQuickPrompts(): QuickPromptsMultilingual {
  const out: QuickPromptsMultilingual = {};
  for (const [code, list] of Object.entries(DEFAULT_QUICK_PROMPTS)) {
    out[code] = list.map((p) => ({ ...p }));
  }
  return out;
}

/** True when the widget has no stored list (omit key / null / empty map). */
export function isQuickPromptsUnset(
  quickPrompts: QuickPromptsConfig | undefined | null
): boolean {
  if (quickPrompts == null) return true;
  if (Array.isArray(quickPrompts)) return false;
  return Object.keys(quickPrompts).length === 0;
}

/**
 * Remap quick_prompts keys from legacy STT aliases (amh/orm/eng) to UI codes (am/om/en).
 * Canonical keys win (including `[]`); aliases fill only when the canonical key is missing.
 */
export function normalizeQuickPromptKeys(
  quickPrompts: QuickPromptsConfig | undefined | null
): QuickPromptsConfig | undefined {
  if (!quickPrompts || Array.isArray(quickPrompts)) return quickPrompts ?? undefined;

  const next: QuickPromptsMultilingual = {};

  for (const [key, list] of Object.entries(quickPrompts)) {
    if (!Array.isArray(list)) continue;
    const normalized = normalizeUiLanguageCode(key);
    if (key === normalized) {
      next[normalized] = list.map((p) => ({ ...p }));
    }
  }

  for (const [key, list] of Object.entries(quickPrompts)) {
    if (!Array.isArray(list)) continue;
    const normalized = normalizeUiLanguageCode(key);
    if (key === normalized) continue;
    if (!Object.prototype.hasOwnProperty.call(next, normalized)) {
      next[normalized] = list.map((p) => ({ ...p }));
    }
  }

  return next;
}

/** Aliases stored on older widgets — check after canonical UI codes. */
const LANG_ALIASES: Record<string, string[]> = {
  am: ["amh"],
  om: ["orm"],
  en: ["eng"],
};

export function isMultilingualQuickPrompts(
  value: QuickPromptsConfig | undefined | null
): value is QuickPromptsMultilingual {
  return !!value && !Array.isArray(value) && typeof value === "object";
}

/**
 * Normalize a *stored* list into the per-language object format.
 * Does not seed defaults — call `quickPromptsForEditor` for the settings UI.
 */
export function normalizeQuickPrompts(
  quickPrompts: QuickPromptsConfig | undefined | null,
  languages: LanguageOption[] | undefined
): QuickPromptsMultilingual {
  if (!quickPrompts) return {};

  if (!Array.isArray(quickPrompts)) {
    const keyed = normalizeQuickPromptKeys(quickPrompts);
    return isMultilingualQuickPrompts(keyed) ? keyed : {};
  }

  const primary = languages?.[0]?.code
    ? normalizeUiLanguageCode(languages[0].code)
    : "en";
  return { [primary]: quickPrompts.map((p) => ({ ...p })) };
}

/**
 * Editor display state:
 * - Key omitted / null / `{}` → seed built-in 3 per language (not persisted until save/edit)
 * - Array or non-empty map → show that list only (do not re-add defaults)
 */
export function quickPromptsForEditor(
  quickPrompts: QuickPromptsConfig | undefined | null,
  languages?: LanguageOption[]
): QuickPromptsMultilingual {
  if (isQuickPromptsUnset(quickPrompts)) {
    return cloneDefaultQuickPrompts();
  }

  // Legacy array: mirror the same list on every language tab
  if (Array.isArray(quickPrompts)) {
    const list = quickPrompts.map((p) => ({ ...p }));
    const codes = new Set<string>(
      (languages?.length ? languages : [{ code: "en", label: "English" }]).map((l) =>
        normalizeUiLanguageCode(l.code)
      )
    );
    for (const code of Object.keys(DEFAULT_QUICK_PROMPTS)) codes.add(code);
    const out: QuickPromptsMultilingual = {};
    for (const code of codes) out[code] = list.map((p) => ({ ...p }));
    return out;
  }

  return normalizeQuickPrompts(quickPrompts, languages);
}

/**
 * Resolve chips for the visitor's language (CDN + ChatWidget parity).
 *
 * Returns `null` when the caller should use built-in defaults.
 * Returns `[]` when the admin intentionally hid chips for that language / legacy empty array.
 */
export function resolveQuickPromptsForLang(
  quickPrompts: QuickPromptsConfig | undefined | null,
  lang: string
): QuickPrompt[] | null {
  if (quickPrompts == null) return null;

  // Legacy array: same chips for every language (including [] = none)
  if (Array.isArray(quickPrompts)) {
    return quickPrompts;
  }

  if (typeof quickPrompts !== "object") return null;

  const key = normalizeUiLanguageCode(lang);
  const candidates = [key, lang, ...(LANG_ALIASES[key] ?? [])];
  const tried = new Set<string>();

  for (const code of candidates) {
    if (tried.has(code)) continue;
    tried.add(code);
    if (!Object.prototype.hasOwnProperty.call(quickPrompts, code)) continue;
    const list = quickPrompts[code];
    return Array.isArray(list) ? list : null;
  }

  // Missing key for this language → built-in defaults (do not fall back to en chips)
  return null;
}

/** Value to persist — `undefined` means omit the key (built-in defaults). */
export function prepareQuickPromptsForSave(
  quickPrompts: QuickPromptsConfig | undefined | null,
  languages?: LanguageOption[]
): QuickPromptsConfig | undefined {
  if (isQuickPromptsUnset(quickPrompts)) return undefined;
  // Keep legacy arrays as arrays (including [] = no chips everywhere)
  if (Array.isArray(quickPrompts)) {
    return quickPrompts.map((p) => ({ ...p }));
  }
  return normalizeQuickPrompts(quickPrompts, languages);
}

export function hasAnyQuickPrompts(
  quickPrompts: QuickPromptsConfig | undefined | null
): boolean {
  if (!quickPrompts) return false;
  if (Array.isArray(quickPrompts)) return quickPrompts.length > 0;
  return Object.values(quickPrompts).some((l) => Array.isArray(l) && l.length > 0);
}
