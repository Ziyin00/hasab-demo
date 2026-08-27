# Widget Language & TTS — Backend Specification

**Last updated:** 2026-08-22  
**Frontend reference:** `src/features/chat/components/ChatWidget.tsx`, `widget/v1/hasab-chatbot.js`  
**Portal utilities:** `src/features/chatbot-widgets/utils/languageCodes.ts`

This document defines what the **backend must implement** so embedded chatbot widgets (CDN snippet) and the dashboard preview behave correctly for:

1. **Reply text language** — follows the **visitor’s selected language** on every message (not the admin’s `default_language`).
2. **TTS (Tigist voice)** — synthesized **only when the visitor has Amharic selected** and the widget has `settings.features.tts === true`.

---

## Table of Contents

1. [Summary](#1-summary)
2. [Affected Endpoints](#2-affected-endpoints)
3. [Language Codes](#3-language-codes)
4. [Chat Request — Required Fields](#4-chat-request--required-fields)
5. [Language Resolution Rules](#5-language-resolution-rules)
6. [TTS Rules](#6-tts-rules)
7. [Chat Response Shape](#7-chat-response-shape)
8. [Language Change Behavior](#8-language-change-behavior)
9. [Widget Settings vs Request Fields](#9-widget-settings-vs-request-fields)
10. [Dashboard vs CDN Snippet](#10-dashboard-vs-cdn-snippet)
11. [Acceptance Tests](#11-acceptance-tests)
12. [Common Bugs to Avoid](#12-common-bugs-to-avoid)

---

## 1. Summary

| Concern | Rule |
|--------|------|
| **Reply text language** | Use the **`language`** and **`language_instruction`** fields from **each** chat request. Do **not** lock replies to `widget.default_language` or a stale account context. |
| **TTS audio** | Synthesize and return `audio_base64` **only when** `tts: true` **and** normalized `language === "am"`. Otherwise return text only. |
| **Widget `features.tts`** | Admin toggle meaning: “TTS is **allowed** for this widget.” It does **not** mean “always synthesize on every reply.” |
| **STT vs chat language** | STT upload uses ISO 639-3 (`eng`, `amh`, `orm`). Chat uses UI codes (`en`, `am`, `om`). Do not mix them. |

---

## 2. Affected Endpoints

| Client | Method | Path | Auth |
|--------|--------|------|------|
| Dashboard preview (`ChatWidget`) | `POST` | `/chat` | Admin session + `X-Visitor-Session-Id` |
| CDN embed (`hasab-chatbot.js`) | `POST` | `/api/widget/chat` | `Authorization: Bearer <widget_session_token>` + `X-Visitor-Session-Id` |

Both endpoints must apply **identical** language and TTS logic. The request body shape is the same; only auth differs.

---

## 3. Language Codes

### UI codes (chat `language` field)

Used in `POST /chat` and `POST /api/widget/chat`:

| UI code | Language | Aliases (normalize on receipt) |
|---------|----------|--------------------------------|
| `en` | English | `eng` |
| `am` | Amharic | `amh` |
| `om` | Afaan Oromoo | `orm` |

**Backend must normalize** incoming aliases before applying language logic:

```
eng, en  → en
amh, am  → am
orm, om  → om
unknown  → en (fallback)
```

### STT codes (`POST /upload-audio` only)

| UI / visitor language | STT `language` field |
|-----------------------|----------------------|
| `en` | `eng` |
| `am` | `amh` |
| `om` | `orm` |

STT codes must **never** be used as the chat reply language.

---

## 4. Chat Request — Required Fields

### Example — English (text only)

```json
{
  "message": "what are hasab ai pricing",
  "model": "hasab-1-lite",
  "source": "widget",
  "page_url": "https://example.com/",
  "language": "en",
  "language_instruction": "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
  "tts": false,
  "enable_tts": false,
  "visitor_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_conversation": true,
  "client_metadata": {
    "user_language": "en",
    "language_instruction": "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
    "tts": false,
    "timezone": "Africa/Addis_Ababa",
    "device_type": "desktop"
  }
}
```

### Example — Amharic (text + TTS when widget TTS enabled)

```json
{
  "message": "ዋጋ ስንት ነው?",
  "model": "hasab-1-lite",
  "source": "widget",
  "page_url": "https://example.com/",
  "language": "am",
  "language_instruction": "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.",
  "tts": true,
  "enable_tts": true,
  "visitor_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "chat_history_id": 1178,
  "client_metadata": {
    "user_language": "am",
    "language_instruction": "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.",
    "tts": true
  }
}
```

### Example — Oromo (text only)

```json
{
  "message": "gatii baasuu",
  "language": "om",
  "language_instruction": "CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.",
  "tts": false,
  "enable_tts": false
}
```

### Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | yes | User message text |
| `model` | string | yes | e.g. `hasab-1-lite` |
| `source` | string | yes | `"widget"` for embed + dashboard bubble |
| `language` | string | yes | Normalized UI code: `en`, `am`, or `om` |
| `language_instruction` | string | yes | System prompt for reply language (see §5) |
| `tts` | boolean | yes | Whether to synthesize Tigist audio for this reply |
| `enable_tts` | boolean | recommended | Mirror of `tts` (same semantics) |
| `visitor_session_id` | string | yes | UUID from browser localStorage |
| `page_url` | string | recommended | Current page URL |
| `chat_history_id` | number | conditional | Continue conversation (mutually exclusive with `new_conversation`) |
| `new_conversation` | boolean | conditional | Start fresh thread |
| `client_metadata` | object | recommended | Analytics + echo of `user_language`, `language_instruction`, `tts` |

---

## 5. Language Resolution Rules

Priority order for determining **reply text language** (highest wins):

1. **`language_instruction`** on the current request (explicit system prompt from client).
2. **`language`** on the current request (normalized to `en` / `am` / `om`).
3. **`client_metadata.user_language`** (same normalized code).

**Do not use** for reply language:

- `widget.default_language` from widget config or DB.
- Admin account `"Language Preference"` context from `/chat/context` (widget sessions must not depend on this).
- Language detected from the user message alone (message language ≠ reply language preference).
- Language stored on an old `chat_history_id` from before the visitor switched language.

### Built-in `language_instruction` strings

The portal sends these when the language is one of the three supported UI codes:

| `language` | `language_instruction` |
|------------|------------------------|
| `en` | `CRITICAL: You MUST respond ONLY in English. Do not use any other language.` |
| `am` | `CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.` |
| `om` | `CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.` |

For custom language codes in `settings.languages`, the client sends:

`CRITICAL: You MUST respond ONLY in {label}. Do not use any other language.`

where `{label}` is the human-readable name from widget settings.

### Implementation pseudocode

```python
def resolve_reply_language(body):
    lang = normalize_ui_code(body.get("language"))
    instruction = body.get("language_instruction") or built_in_instruction(lang)
    return lang, instruction  # inject instruction as system message for this turn
```

---

## 6. TTS Rules

TTS uses the **Tigist** Amharic voice. It is **independent** of mic/STT (`settings.features.audio_upload`).

### When to synthesize

Synthesize **if and only if all** of the following are true:

1. Widget has `settings.features.tts === true` (from widget config / `data-settings`).
2. Request has `tts: true` (client sends this only for Amharic).
3. Normalized `language === "am"`.

### When **not** to synthesize

| Condition | Expected backend behavior |
|-----------|---------------------------|
| `tts: false` | Return text only. **Omit** `audio_base64` or send `null`. |
| `language` is `en` or `om` | Return text only, even if widget has `features.tts: true`. |
| Widget `features.tts: false` | Never synthesize, even if client mistakenly sends `tts: true`. |

### Implementation pseudocode

```python
def should_synthesize_tts(widget, body):
    if not widget.settings.features.get("tts"):
        return False
    lang = normalize_ui_code(body.get("language"))
    if lang != "am":
        return False
    if body.get("tts") is not True:
        return False
    return True
```

### Important distinction

| Setting | Meaning |
|---------|---------|
| `widget.settings.features.tts` | Admin: “This widget **supports** TTS.” |
| Request `tts: true` | Visitor: “Play TTS **for this message** (Amharic only).” |

**Wrong:** “If `features.tts` is true, always return Amharic TTS on every reply.”  
**Correct:** “If `features.tts` is true **and** request `language === "am"` **and** request `tts === true`, attach audio.”

The client **never** displays audio when `language !== "am"`, but the backend should still omit synthesis to save cost and avoid confusion.

---

## 7. Chat Response Shape

### Text-only reply (English / Oromo, or Amharic with TTS off)

```json
{
  "chat_history_id": 1178,
  "message": {
    "content": "Hasab AI pricing depends on your plan. Contact contact@hasab.ai for details."
  }
}
```

### Amharic reply with TTS

```json
{
  "chat_history_id": 1178,
  "message": {
    "content": "የሃሳብ AI ዋጋ ለማወቅ contact@hasab.ai ይጻፉ።"
  },
  "audio_base64": "<base64-encoded wav bytes>",
  "audio_content_type": "audio/wav"
}
```

### Response field rules

| Field | When present |
|-------|--------------|
| `message.content` | Always (assistant text in the **requested language**) |
| `audio_base64` | Only when TTS was synthesized (Amharic + `tts: true`) |
| `audio_content_type` | With `audio_base64`; default client expectation: `audio/wav` |

Clients also accept nested paths (fallback):

- `message.audio_base64`
- `data.audio_base64`

Prefer top-level fields for consistency.

---

## 8. Language Change Behavior

When the visitor changes language in the widget dropdown:

1. Client clears `chat_history_id` from localStorage.
2. Client sends the next message with `new_conversation: true`.
3. Client sends the **new** `language` and `language_instruction`.

**Backend must** apply the new language on that message. Do not inherit reply language from a previous conversation tied to the same `visitor_session_id`.

---

## 9. Widget Settings vs Request Fields

From embed snippet `data-settings` (and widget DB record):

```json
{
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "am", "label": "Amharic" },
    { "code": "om", "label": "Oromo" }
  ],
  "features": {
    "audio_upload": true,
    "tts": true,
    "quick_prompts": true,
    "language_selector": true
  }
}
```

| Widget field | Backend use |
|--------------|-------------|
| `default_language` | Initial dropdown value only. **Not** reply language after visitor switches. |
| `settings.languages` | Populate language selector; labels for custom `language_instruction` fallback. |
| `settings.features.tts` | Gate whether TTS is **allowed** at all. |
| `settings.features.audio_upload` | Gate mic/STT only. Unrelated to TTS. |
| `chat_context_ids` | Knowledge/context injection. Must **not** override per-request `language`. |

### Quick prompts language keys

Portal normalizes keys to UI codes: `en`, `am`, `om`. Legacy keys `amh` / `orm` may exist in old data — treat as aliases when looking up prompts (optional; client already normalizes on save).

---

## 10. Dashboard vs CDN Snippet

| Behavior | Dashboard `ChatWidget` | CDN `hasab-chatbot.js` |
|----------|------------------------|-------------------------|
| Chat endpoint | `POST /chat` | `POST /api/widget/chat` |
| Language on each request | `language` + `language_instruction` | Same |
| TTS flag on each request | `tts` / `enable_tts` | Same |
| `/chat/context` “Language Preference” | Client **deletes** stale contexts; does **not** post new ones | Not used |
| Auth | Admin session | Widget session token |

Both clients must receive the same language and TTS behavior from the backend.

---

## 11. Acceptance Tests

### Language — text replies

| # | Visitor language | User message | Expected reply text language |
|---|------------------|--------------|------------------------------|
| L1 | English | "what are hasab ai pricing" | English |
| L2 | Amharic | "ዋጋ ስንት ነው?" | Amharic |
| L3 | Oromo | "gatii baasuu" | Oromo |
| L4 | English (after switching from Amharic) | "hello" | English (new conversation) |
| L5 | English | "hello" | English even if `widget.default_language` is `am` |

Verify request payload contains `"language": "en"` and matching `language_instruction`.

### TTS — audio replies

| # | Widget `features.tts` | Visitor language | Request `tts` | Expected response |
|---|----------------------|------------------|---------------|-------------------|
| T1 | `true` | `am` | `true` | Amharic text + `audio_base64` |
| T2 | `true` | `en` | `false` | English text, **no** `audio_base64` |
| T3 | `true` | `om` | `false` | Oromo text, **no** `audio_base64` |
| T4 | `false` | `am` | `true` | Amharic text, **no** `audio_base64` (widget TTS disabled) |
| T5 | `true` | `en` | `false` | English text even if widget config has `tts: true` |

### Regression — reported bugs

| Bug | Expected fix |
|-----|--------------|
| English selected but reply in Amharic | Honor `language: "en"` + `language_instruction` on every request |
| English/Oromo show TTS player | Do not return `audio_base64` when `tts: false` |
| Language stuck until admin changes widget default | Use per-request `language`, not `default_language` |

---

## 12. Common Bugs to Avoid

1. **Using `amh` / `orm` as chat language** — these are STT codes; normalize to `am` / `om`.
2. **Using `widget.default_language` for LLM replies** — only use request `language`.
3. **Always synthesizing when `features.tts: true`** — check request `language === "am"` and `tts: true`.
4. **Returning Amharic TTS for English requests** — wastes synthesis; client hides it but UX breaks if client is outdated.
5. **Merging admin `/chat/context` “Language Preference” into widget chat** — causes wrong language for embed visitors.
6. **Caching language on `chat_history_id`** — visitor can switch language mid-session; client starts `new_conversation` but backend must not ignore new `language`.

---

## CDN Script Deployment

The portal ships the reference script at:

- Source: `widget/v1/hasab-chatbot.js`
- Local dev: `http://localhost:5137/widget/v1/hasab-chatbot.js?v=20260822b`
- Production target: `https://api.hasab.ai/widget/v1/hasab-chatbot.js`

Backend changes above are **required** for correct behavior even with the updated script. The client enforces TTS display rules, but **reply text language** can only be correct if the backend honors `language` and `language_instruction`.

---

## Related Docs

- [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md) — full widget system spec
- [`CDN_UI_LOCALIZATION.md`](./CDN_UI_LOCALIZATION.md) — UI chrome strings per language
- Portal language helpers: `src/features/chatbot-widgets/utils/languageCodes.ts`
