import type {
  ChatbotWidgetSettings,
  ChatbotWidgetTheme,
  LanguageOption,
  WidgetFeatures,
} from "../types/chatbot-widget.types";
import { normalizeUiLanguageCode } from "./languageCodes";
import { normalizeQuickPromptKeys } from "./quickPrompts";

/**
 * CDN embed + public config expect an explicit features object
 * (see live data-settings: audio_upload, quick_prompts, language_selector).
 */
export function normalizeWidgetFeatures(
  features?: WidgetFeatures | null
): Required<WidgetFeatures> {
  return {
    audio_upload: features?.audio_upload === true,
    // TTS integration (disabled): tts: features?.tts === true,
    tts: false,
    quick_prompts: features?.quick_prompts !== false,
    language_selector: features?.language_selector !== false,
  };
}

function normalizeLanguageOption(lang: LanguageOption): LanguageOption {
  return {
    ...lang,
    code: normalizeUiLanguageCode(lang.code),
  };
}

/** Dedupe languages that collapse to the same UI code (e.g. am + amh → am). */
function normalizeLanguages(
  languages: LanguageOption[] | undefined
): LanguageOption[] | undefined {
  if (!languages?.length) return languages;

  const seen = new Set<string>();
  const out: LanguageOption[] = [];
  for (const lang of languages) {
    const code = normalizeUiLanguageCode(lang.code);
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...lang, code });
  }
  return out;
}

/**
 * Merge API theme with defaults so nested launcher/header/mic/send never wipe
 * when the backend omits keys.
 */
export function mergeWidgetTheme(
  defaults: ChatbotWidgetTheme,
  theme?: ChatbotWidgetTheme | null
): ChatbotWidgetTheme {
  const t = theme ?? {};
  return {
    ...defaults,
    ...t,
    launcher: { ...defaults.launcher, ...t.launcher },
    header: { ...defaults.header, ...t.header },
    mic: { ...defaults.mic, ...t.mic },
    send: { ...defaults.send, ...t.send },
  };
}

/** Settings blob as carried in data-settings on the embed snippet. */
export function normalizeWidgetSettings(
  settings?: ChatbotWidgetSettings | null
): ChatbotWidgetSettings {
  const s = settings ?? {};
  const languages = normalizeLanguages(s.languages?.map(normalizeLanguageOption));

  return {
    ...s,
    languages,
    quick_prompts: normalizeQuickPromptKeys(s.quick_prompts),
    features: normalizeWidgetFeatures(s.features),
  };
}

/**
 * Keep CDN `settings.launcher_label` aligned with theme (single source of truth)
 * without fighting the Settings tab on every keystroke.
 */
export function syncLauncherLabelFromTheme(
  settings: ChatbotWidgetSettings,
  theme: ChatbotWidgetTheme
): ChatbotWidgetSettings {
  const label =
    theme.launcher != null && Object.prototype.hasOwnProperty.call(theme.launcher, "label")
      ? String(theme.launcher.label ?? "")
      : (settings.launcher_label ?? "");
  return { ...settings, launcher_label: label };
}
