# CDN UI Localization — “Ready to help” & Chrome Strings

**Last updated:** 2026-07-30  
**Audience:** Backend / CDN (`hasab-chatbot.js`)  
**Reference:** `src/features/chat/components/ChatWidget.tsx` (`LANG_STRINGS`)

Dashboard preview already localizes widget chrome when the visitor switches language. The CDN embed must do the same so Amharic / Afaan Oromoo visitors do not see English UI chrome.

---

## 1. Problem

`settings.subtitle` (and several other chrome fields) are **admin-authored English** strings, e.g.:

```json
{
  "title": "Hasab AI Chat",
  "subtitle": "Ready to help",
  "input_placeholder": "Ask in your language..."
}
```

Today the live CDN widget often shows that English subtitle for every language. Platform preview does not: for Amharic / Oromo it swaps in built-in translations.

---

## 2. Required behavior (match platform)

| Visitor language | Subtitle source |
|---|---|
| `en` / `eng` | `settings.subtitle` if non-empty, else built-in `"Ready to help"` |
| `am` / `amh` | Always built-in `"ለመርዳት ዝግጁ"` — **ignore** admin `settings.subtitle` |
| `om` / `orm` | Always built-in `"Gargaaruuf qophaa'eera"` — **ignore** admin `settings.subtitle` |
| any other code | Fall back to English rules |

Same pattern for sibling chrome strings (see §4).

**Rationale:** Admin fields are single-locale today. Until settings support per-language overrides, non-English UI must use the built-in map so chrome tracks the language selector.

---

## 3. Language code normalization

Admin / snippet may use short or ISO 639-3 codes. Normalize before lookup:

| Incoming | Canonical key |
|---|---|
| `en`, `eng` | `en` |
| `am`, `amh` | `am` |
| `om`, `orm` | `om` |
| anything else | `en` (fallback strings) |

Pseudo:

```js
function toLangKey(code) {
  if (code === "am" || code === "amh") return "am";
  if (code === "om" || code === "orm") return "om";
  return "en";
}
```

Seed language from `data-default-language`, then visitor choice (`localStorage` key `hasabChatLang`). Re-resolve chrome strings whenever language changes.

---

## 4. Built-in string table (ship in CDN)

Copy these exactly (platform source of truth):

| Key | `en` | `am` | `om` |
|---|---|---|---|
| **subtitle** | Ready to help | ለመርዳት ዝግጁ | Gargaaruuf qophaa'eera |
| **placeholder** | Type your message... | መልዕክትዎን ይፃፉ... | Ergaa kee barreessi... |
| **today** | Today | ዛሬ | Har'a |
| **online** | Online | ኦንላይን | Online |
| **thinking** | Thinking | እያሰበ ነው | Yaadaa jira |
| **welcomeBody** | Pick a question above, type, or tap the mic to speak. | ጥያቄ ይምረጡ፣ ይፃፉ ወይም ሚክሮፎኑን ይጫኑ። | Gaaffii filadhu, barreessi yookaan miikrofoona tuqi. |

### Resolution rules (same for each field)

```text
if langKey === "en":
  display = settings.<field> || BUILTIN.en.<field>
else:
  display = BUILTIN[langKey].<field>
```

Field mapping:

| UI element | Settings field (English override only) | Builtin key |
|---|---|---|
| Header / welcome subtitle | `settings.subtitle` | `subtitle` |
| Input placeholder | `settings.input_placeholder` | `placeholder` |
| “Today” divider label | *(none — always builtin)* | `today` |
| Thinking indicator | *(none — always builtin)* | `thinking` |
| Welcome bubble body | `data-welcome-message` / welcome | `welcomeBody` |

**Welcome message note:** Platform uses admin `welcome_message` only when `langKey === "en"`; for `am` / `om` it uses `welcomeBody` from the table above. CDN should match.

**Title** (`settings.title` / bot name) stays as configured in all languages — do not translate the product/bot name unless you add a separate i18n API later.

---

## 5. Where these strings appear

```
┌─────────────────────────────────────┐
│ [avatar] Title          [EN ▾] [X] │  ← title = settings (all langs)
│          Ready to help              │  ← subtitle (localize)
├─────────────────────────────────────┤
│           ○  Today  ○               │  ← today (localize)
│                                     │
│     [ Welcome bubble text ]         │  ← welcome (localize per §4)
│     [ quick prompt chips… ]         │  ← see multilingual quick_prompts
│                                     │
│  Type your message...        [mic]  │  ← placeholder (localize)
└─────────────────────────────────────┘
```

---

## 6. Acceptance checklist

- [ ] With language `en`, subtitle shows admin `settings.subtitle` or `"Ready to help"`.
- [ ] Switch to Amharic → subtitle becomes `ለመርዳት ዝግጁ` immediately (no English left in subtitle).
- [ ] Switch to Oromo → subtitle becomes `Gargaaruuf qophaa'eera`.
- [ ] `am` and `amh` behave identically; `om` and `orm` behave identically.
- [ ] “Today” divider and input placeholder also switch with language.
- [ ] Changing language mid-session updates chrome without reload.
- [ ] Layout stays LTR for all three languages (Amharic is **not** RTL).

---

## 7. Out of scope (for now)

- Per-language admin editing of `subtitle` / `welcome_message` / `input_placeholder` in the dashboard (would be `Record<lang, string>` later).
- Translating `settings.title` / bot name.
- LLM reply language — already handled via chat `language` + server-side system prompt (see `BACKEND_INTEGRATION.md` §5).

Multilingual **quick prompts** are a separate payload shape (`quick_prompts` as array **or** `Record<lang, QuickPrompt[]>`). Resolve chips with the same `toLangKey` / fallback chain as the dashboard; do not hardcode English chips for `am`/`om` when translated prompts exist.

---

## 8. Minimal CDN snippet

```js
const LANG_STRINGS = {
  en: {
    subtitle: "Ready to help",
    placeholder: "Type your message...",
    today: "Today",
    thinking: "Thinking",
    welcomeBody: "Pick a question above, type, or tap the mic to speak.",
  },
  am: {
    subtitle: "ለመርዳት ዝግጁ",
    placeholder: "መልዕክትዎን ይፃፉ...",
    today: "ዛሬ",
    thinking: "እያሰበ ነው",
    welcomeBody: "ጥያቄ ይምረጡ፣ ይፃፉ ወይም ሚክሮፎኑን ይጫኑ።",
  },
  om: {
    subtitle: "Gargaaruuf qophaa'eera",
    placeholder: "Ergaa kee barreessi...",
    today: "Har'a",
    thinking: "Yaadaa jira",
    welcomeBody: "Gaaffii filadhu, barreessi yookaan miikrofoona tuqi.",
  },
};

function toLangKey(code) {
  if (code === "am" || code === "amh") return "am";
  if (code === "om" || code === "orm") return "om";
  return "en";
}

function resolveChrome(lang, settings, welcomeMessage) {
  const key = toLangKey(lang);
  const ui = LANG_STRINGS[key];
  const isEn = key === "en";
  return {
    subtitle: isEn ? (settings?.subtitle || ui.subtitle) : ui.subtitle,
    placeholder: isEn
      ? (settings?.input_placeholder || ui.placeholder)
      : ui.placeholder,
    today: ui.today,
    thinking: ui.thinking,
    welcome: isEn ? (welcomeMessage || ui.welcomeBody) : ui.welcomeBody,
  };
}
```

Call `resolveChrome` on init and on every language change; bind returned strings into the DOM.
