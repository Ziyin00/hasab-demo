# Hasab Backend Integration Guide

**Last updated:** 2026-08-22  
**Reference implementation:** `src/features/chat/components/ChatWidget.tsx`  
**CDN script target:** `https://api.hasab.ai/widget/v1/hasab-chatbot.js`

> **Language & TTS (2026-08-22):** See [`WIDGET_LANGUAGE_AND_TTS_BACKEND.md`](./WIDGET_LANGUAGE_AND_TTS_BACKEND.md) for the backend spec on per-request reply language and Amharic-only TTS (`tts` / `language_instruction` fields).

This document is the authoritative specification for everything the backend must provide for the chatbot widget system to work end-to-end — CRUD APIs, chat session management, audio transcription, category classification, analytics, and the CDN snippet script that must visually and behaviorally match `ChatWidget.tsx` exactly.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Widget CRUD API](#2-widget-crud-api)
3. [Chat API](#3-chat-api)
4. [Audio / STT API](#4-audio--stt-api)
5. [Language Context API](#5-language-context-api)
6. [Category API](#6-category-api)
7. [Analytics API](#7-analytics-api)
8. [CDN Script — `hasab-chatbot.js`](#8-cdn-script--hasab-chatbotjs)
9. [Session & Security Model](#9-session--security-model)
10. [Client Metadata](#10-client-metadata)
11. [Data Models (Full Schemas)](#11-data-models-full-schemas)
12. [CDN Script Layout Bugs — Preview vs Live Diff](#12-cdn-script-layout-bugs--preview-vs-live-diff-2026-07-27)

**Also see:** [`CDN_UI_LOCALIZATION.md`](./CDN_UI_LOCALIZATION.md) — localize “Ready to help” and other chrome strings when the visitor switches language (must match `ChatWidget.tsx`).

---

## 1. System Overview

```
Dashboard (hasab-demo)                    Customer Site
       │                                        │
       │  CRUD /chatbot-widgets                 │  <script data-widget-id="...">
       ├──────────────────────► Backend         │           │
       │  POST /chat                            │           ▼ hasab-chatbot.js
       │  POST /upload-audio          ◄─────────┼─── POST /chat
       │  POST /chat/context  ◄── dashboard     │    POST /upload-audio
       │  GET  /analytics             only      │    (language via body, not /chat/context)
```

The admin builds a widget in the dashboard → gets an embed snippet → pastes it on their site. The CDN script (`hasab-chatbot.js`) parses `data-*` attributes from the script tag and renders a chat bubble that must look and behave identically to `ChatWidget.tsx`.

**Same rendering, per-request language + TTS.** The CDN script and dashboard preview both send `language`, `language_instruction`, and `tts` on **every** chat message. The backend must honor those fields for reply text language and Amharic-only TTS. The dashboard no longer posts a persistent `"Language Preference"` context for widget chat (it clears stale ones). See [`WIDGET_LANGUAGE_AND_TTS_BACKEND.md`](./WIDGET_LANGUAGE_AND_TTS_BACKEND.md).

---

## 2. Widget CRUD API

All widget management endpoints are authenticated (admin session). Uses a separate `chatbotApiClient` on the frontend (different base URL or auth header from the main `apiClient`).

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/chatbot-widgets` | List all widgets |
| `GET` | `/chatbot-widgets/:id` | Get single widget |
| `POST` | `/chatbot-widgets` | Create widget |
| `PATCH` | `/chatbot-widgets/:id` | Update widget (partial) |
| `DELETE` | `/chatbot-widgets/:id` | Delete widget |

### Request body — Create / Update

```json
{
  "name": "My Widget",
  "allowed_origins": ["https://example.com", "https://app.example.com"],
  "theme": { ...ChatbotWidgetTheme },
  "settings": { ...ChatbotWidgetSettings },
  "chat_context_ids": [1, 2],
  "rag_store_ids": [5],
  "welcome_message": "Hi, how can I help?",
  "default_language": "en",
  "position": "bottom-right",
  "rate_limit_per_minute": 20,
  "is_active": true
}
```

`PATCH` accepts any subset of the above fields. `widget_id` is backend-generated and never sent by the client.

### Response shape

**List:** `{ data: { widgets: ChatbotWidget[] } }` or `{ data: ChatbotWidget[] }`  
**Single:** `{ data: { widget: ChatbotWidget } }` or `{ data: ChatbotWidget }`

The frontend normalizes both shapes (`r.data.data?.widget ?? r.data.data?.widgets ?? r.data.data`). Picking one and being consistent is preferred — the frontend will handle either.

### `widget_id` format

Must be a stable, URL-safe public identifier (e.g. `wgt_v9bli0es0wovrhibltuxgaxw`). This is what goes into the embed snippet's `data-widget-id` attribute and is used by the CDN script to bootstrap a visitor session. It must never change after creation.

### Allowed origins

Stored as full origins (`protocol + hostname`, no trailing slash). Example: `["https://example.com"]`. The backend enforces CORS using this list — requests from origins not on the list for that `widget_id` must be rejected at the chat endpoint level.

---

## 3. Chat API

### `POST /chat`

Used by both the dashboard preview (`ChatWidget.tsx`) and the CDN snippet. No admin auth required — authenticated via visitor session token (see §9).

#### Request headers

```
X-Visitor-Session-Id: <visitor_session_id>
```

#### Request body — new conversation

```json
{
  "message": "What can you help me with?",
  "model": "hasab-1-lite",
  "source": "widget",
  "page_url": "https://example.com/contact",
  "language": "en",
  "language_instruction": "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
  "tts": false,
  "enable_tts": false,
  "visitor_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_conversation": true,
  "client_metadata": {
    "screen_width": 1440,
    "screen_height": 900,
    "viewport_width": 1440,
    "viewport_height": 772,
    "timezone": "Africa/Addis_Ababa",
    "browser_language": "en-US",
    "platform": "MacIntel",
    "device_type": "desktop",
    "user_language": "en",
    "language_instruction": "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
    "tts": false
  }
}
```

#### Request body — continuing conversation

```json
{
  "message": "...",
  "model": "hasab-1-lite",
  "source": "widget",
  "page_url": "https://example.com/contact",
  "language": "en",
  "visitor_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "chat_history_id": 1042,
  "client_metadata": { ... }
}
```

`new_conversation: true` and `chat_history_id` are mutually exclusive. The frontend sends `new_conversation: true` when `chat_history_id` is null (first message in a session), then stores the returned `chat_history_id` in localStorage for all subsequent messages.

#### Response

```json
{
  "chat_history_id": 1042,
  "message": {
    "content": "I can help you with..."
  },
  "audio_base64": "<optional — Amharic TTS only, when request tts=true>",
  "audio_content_type": "audio/wav"
}
```

The frontend reads `r.data?.chat_history_id` and `r.data?.message?.content`. Fallback path also accepted: `r.data?.data?.message`.

#### Session continuity — stale `chat_history_id`

If the backend returns `404` for a `chat_history_id` (conversation expired/deleted), the frontend:
1. Clears `chat_history_id` from localStorage
2. Retries the same message with `new_conversation: true`

The backend **must** return `404` (not `400` or `500`) for unknown `chat_history_id` values so the frontend can trigger this automatic recovery.

#### `source` field values

| Value | Context |
|---|---|
| `"widget"` | Embedded CDN snippet on a customer site |
| `"dashboard"` | Dashboard test chat (`ChatPage.tsx`) |

#### `visitor_session_id`

A UUID generated and stored in `localStorage` under the key `hasab_visitor_session_id`. It is long-lived (persists across page loads, never expires client-side). The backend uses it to tie conversations to a returning visitor within the 24-hour idle window. See §9 for full session lifecycle.

---

## 4. Audio / STT API

### `POST /upload-audio`

Transcribes a recorded voice clip to text, which is then sent to `POST /chat`.

#### Request

`Content-Type: multipart/form-data`

| Field | Value |
|---|---|
| `audio` | File blob (`audio/wav`, `audio/ogg`, or `audio/mp4`) |
| `translate` | `"false"` |
| `summarize` | `"false"` |
| `is_meeting` | `"false"` |
| `language` | STT language code (e.g. `"eng"`, `"amh"`, `"orm"`) |
| `source_language` | Same as `language` |

The frontend converts the recorded audio to WAV before uploading when possible (via `AudioContext.decodeAudioData` + custom WAV encoder). Falls back to the native format (`ogg`/`mp4`) on decode failure.

STT language codes per UI language:

| UI lang | `language` field |
|---|---|
| `en` | `eng` |
| `am` | `amh` |
| `om` | `orm` |

#### Response

```json
{
  "data": {
    "transcription": "What services do you offer?"
  }
}
```

Also accepted: `{ "data": { "transcription": { "text": "..." } } }` or `{ "transcription": "..." }`. The frontend tries all three shapes. A 30-second `AbortController` timeout is applied client-side.

#### Audio upload feature gate

Only shown when `settings.features.audio_upload === true`. The mic button must not appear otherwise.

---

## 5. Language Context API

> **Widget chat (2026-08-22):** Embed + dashboard bubble send `language` + `language_instruction` on each `POST /chat` / `POST /api/widget/chat`. Backend must use those fields — not this context API — for widget reply language. Dashboard widget clears stale `"Language Preference"` contexts but does not post new ones. Full spec: [`WIDGET_LANGUAGE_AND_TTS_BACKEND.md`](./WIDGET_LANGUAGE_AND_TTS_BACKEND.md).

> **Legacy note:** The endpoints below remain for non-widget admin chat flows. Do not let `"Language Preference"` contexts override per-request widget `language`.

The dashboard preview pushes the visitor's selected language as a server-side context so the LLM responds in the correct language.

### `GET /chat/context`

Returns existing contexts for the current session.

**Response:** `{ contexts: [{ id: number, name: string }] }` or `{ data: [...] }`

### `POST /chat/context`

```json
{
  "context_data": "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
  "name": "Language Preference",
  "priority": 100,
  "is_active": true
}
```

### `DELETE /chat/context/:id`

Removes a context by ID.

#### Update flow (dashboard preview only)

When the visitor changes language (or the widget opens), the dashboard:
1. Fetches all contexts (`GET /chat/context`)
2. Deletes every existing `"Language Preference"` context
3. Waits 300ms (debounce)
4. Posts the new language instruction

Built-in instruction strings:

| Code | Instruction |
|---|---|
| `en` | `CRITICAL: You MUST respond ONLY in English. Do not use any other language.` |
| `am` | `CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.` |
| `om` | `CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.` |
| any other | `CRITICAL: You MUST respond ONLY in {label}. Do not use any other language.` |

Where `{label}` is the `label` field from the matching entry in `settings.languages`.

#### CDN script language flow

The CDN script sets language only via the chat body `language` field. The backend must inject the appropriate system prompt for widget sessions based on this field — no context API call is made by the embed.

---

## 6. Category API

Categories allow auto-classification of conversations into named buckets. Only available in edit mode (existing widgets). Max 20 categories per widget.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/chatbot-widgets/:id/categories` | List categories for a widget |
| `POST` | `/chatbot-widgets/:id/categories` | Create category |
| `PATCH` | `/chatbot-widgets/:id/categories/:catId` | Update category |
| `DELETE` | `/chatbot-widgets/:id/categories/:catId` | Delete category |
| `POST` or `PATCH` | `/chatbot-widgets/:id/categories/reorder` | Reorder categories |

### Category schema

```json
{
  "id": 1,
  "chatbot_widget_id": 12,
  "name": "Technical Support",
  "slug": "technical-support",
  "description": "Questions about product bugs, setup, or integration issues",
  "sort_order": 0,
  "is_active": true,
  "created_at": "2026-07-20T08:00:00Z",
  "updated_at": "2026-07-26T12:00:00Z"
}
```

- `slug` is auto-generated from `name` on the backend (e.g. `"Technical Support"` → `"technical-support"`)
- `description` is shown to the classifier — write it clearly
- `sort_order` drives display order; the reorder endpoint accepts `{ ordered_ids: [3, 1, 2] }`

### Auto-classification

New conversations are auto-classified into the active categories for their widget. The backend must expose `category`, `category_confidence`, and `category_source` on conversation records for the analytics UI to display them. `category_source` must be `"auto"` for classifier-assigned categories and `"manual"` for admin overrides.

---

## 7. Analytics API

### `GET /analytics`

Query params:

| Param | Type | Values |
|---|---|---|
| `range` | string | `"7d"` \| `"14d"` \| `"30d"` \| `"90d"` |

**Response:**

```json
{
  "range": "7d",
  "from": "2026-07-19",
  "to": "2026-07-26",
  "summary": {
    "total_messages": 1204,
    "total_conversations": 318,
    "avg_response_time_ms": 1823,
    "avg_response_time_display": "1.8s",
    "satisfaction_rate": 0.87,
    "satisfaction_sample_size": 42,
    "changes": {
      "messages_percent": 12.4,
      "conversations_percent": -3.1
    }
  },
  "trend": [
    { "date": "2026-07-20", "label": "Mon", "messages": 172, "conversations": 44 }
  ],
  "by_category": [
    { "category_id": 1, "name": "Technical Support", "slug": "technical-support", "conversations_count": 88, "share": 0.277 }
  ],
  "last_updated": "2026-07-26T12:00:00Z"
}
```

`satisfaction_rate` is a `0–1` float; render as a percentage. `changes.*_percent` are signed floats (positive = up, negative = down vs. prior period).

### `GET /analytics/conversations`

Query params:

| Param | Type | Notes |
|---|---|---|
| `range` | string | `"7d"` / `"14d"` / `"30d"` / `"90d"` |
| `page` | number | 1-indexed |
| `per_page` | number | |
| `search` | string | Free-text search across messages |
| `source` | string | `"widget"` / `"dashboard"` |
| `satisfaction_rating` | string | `"positive"` / `"negative"` |
| `category_id` | number | Filter by category ID |
| `category` | `"uncategorized"` | Show only uncategorized conversations |
| `chatbot_widget_id` | number | Filter to a specific widget |

**Response:**

```json
{
  "conversations": [ ...Conversation[] ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 318,
    "last_page": 16
  }
}
```

### `GET /analytics/conversations/:id`

Returns a `ConversationDetail` object — same as `Conversation` but with a `messages: ConversationMessage[]` array included.

---

## 8. CDN Script — `hasab-chatbot.js`

This is the highest-priority section. The script at `https://api.hasab.ai/widget/v1/hasab-chatbot.js` is what customer sites actually embed. It must render identically to `ChatWidget.tsx`. Any visual or behavioral drift means the dashboard preview is lying to the admin.

### 8.1 Bootstrap

On `DOMContentLoaded`, the script:
1. Finds itself via `document.currentScript` (or a selector on `src`)
2. Reads all `data-*` attributes from the script tag
3. JSON-parses `data-theme` and `data-settings`
4. Injects the widget DOM into `document.body`
5. Attaches all event listeners

### 8.2 Snippet data-attribute contract

```html
<script
  async
  src="https://api.hasab.ai/widget/v1/hasab-chatbot.js"
  data-widget-id='wgt_...'
  data-position='bottom-right'
  data-default-language='en'
  data-welcome-message='Hi, how can I help?'
  data-theme='{...}'
  data-settings='{...}'
></script>
```

All attributes except `data-widget-id` are optional. Treat missing/`null` as "use the built-in default listed in §8.3".

### 8.3 Theme defaults (when field is absent or null)

| Field | Default |
|---|---|
| `primary_color` | `#3C6278` |
| `user_message_background` | `#6F0001` |
| `user_message_text_color` | `white` |
| `panel_background` | `white` |
| `message_area_background` | `#f5f5f5` |
| `bot_message_background` | `white` |
| `bot_message_text_color` | `#333` |
| `border_color` | `#e0e0e0` |
| `launcher.background_color` | same as `primary_color` |
| `launcher.text_color` | `white` |
| `panel_width` | `380px` |
| `panel_height` | `620px` |
| `launcher_size` | `56px` |

### 8.4 Panel sizing — responsive

The panel is `position: fixed`. The theme's `panel_width` / `panel_height` are the single source of truth for size — the snippet carries them in `data-theme` and the CDN script must use them directly. Viewport safety is folded into the `width` / `height` values themselves using CSS `min()`, so there are no separate override properties fighting the configured theme:

```css
width:  min(<panelWidth>px,  calc(100vw - 32px));
height: min(<panelHeight>px, calc(100dvh - 120px));
```

On desktop (e.g. 1440px viewport) this is effectively just `panelWidth` / `panelHeight` — the `calc()` term is always larger. On mobile (e.g. 375px viewport width, 667px height) the viewport term wins and the panel shrinks naturally without overflowing. `100dvh` accounts for the mobile browser toolbar; fall back to `100vh` if `dvh` is unsupported.

Clamping rules before applying `min()` (matching `ChatWidget.tsx`):

```js
const panelWidth  = clamp(parsePx(theme.panel_width,  380), 280, 520);
const panelHeight = clamp(parsePx(theme.panel_height, 620), 400, 720);
```

where `parsePx` strips the `px` suffix and returns the fallback on invalid/absent input, and `clamp(n, min, max) = Math.min(Math.max(n, min), max)`.

### 8.5 Positioning

Corner is driven by `data-position`:

| Value | CSS |
|---|---|
| `bottom-right` | `bottom: <offset>; right: 24px` |
| `bottom-left` | `bottom: <offset>; left: 24px` |
| `top-right` | `top: <offset>; right: 24px` |
| `top-left` | `top: <offset>; left: 24px` |

Panel vertical offset = `24 + launcherSize + 8` px from the same edge as the launcher.

### 8.6 Launcher button (closed state)

Priority order:
1. `theme.launcher.icon_url` is set → render as `<img>`
2. `theme.launcher.type === "text"` → render small chat icon **plus** `theme.launcher.label ?? settings.launcher_label` text side by side
3. Default → render a chat-bubble icon only

Background = `theme.launcher.background_color ?? primary_color`  
Text/icon color = `theme.launcher.text_color ?? "white"`  
Size = `launcherSize` px, `border-radius: 9999px`

**Bug fix required:** The current live script renders the literal word `"Chat"` in all cases. This must be replaced with the logic above.

### 8.7 Header

```
[ avatar ]  [ bot name  ]              [ lang selector ] [ reset ] [ X ]
            [ ● Online  ]
```

- **Avatar:** `header.avatar_url` as `<img>` → else `header.avatar_initials` text centered in a colored circle → else a Bot icon. Never blank.
- **Bot name:** `settings.title`. Default: `"Chat Assistant"`.
- **Status line:** `settings.subtitle`. Default: `"Online"`. Always precede with a green dot — it is decorative only, not driven by a live status field.
- **Language selector:** `<select>` populated from `settings.languages[]` (`code` as `value`, `label` as display). Hidden if `settings.features.language_selector === false`. Initial value = `data-default-language`. Persisted to `localStorage` key `hasabChatLang`.
- **Reset button:** Appears only when there are messages. Clears messages and `chat_history_id`.
- **Close button:** Collapses the panel.

### 8.8 Empty state (before first message)

```
        [ large avatar 72px ]
        [ Bot Name ]
        [ subtitle ]
        ─────── Today ───────
[ spacer ] [ welcome message bubble ]
[ spacer ] [ quick prompt chip ]
[ avatar ] [ quick prompt chip ]   ← last chip has avatar
```

- Welcome message: `data-welcome-message`. Rendered in a bot-bubble style (white bg, border, rounded).
- Quick prompt chips: Only from `settings.quick_prompts[]`. Show chip `label`; send `prompt` on click. Hidden entirely if array is empty OR `settings.features.quick_prompts === false`.
- Do **not** render a hardcoded "Welcome" heading above the avatar — the bot name and welcome message are the full content.

### 8.9 Active conversation

Each message rendered as a bubble:

**User bubble** (right-aligned):
- Background: `user_message_background`; color: `user_message_text_color`
- Bottom-right radius: `4px` (tail effect); all others: `1rem`

**Bot bubble** (left-aligned, with 26px avatar):
- Background: `bot_message_background`; color: `bot_message_text_color`
- Border: `1px solid border_color`
- Bottom-left radius: `4px`; others: `1rem`
- Content: render basic markdown (bold `**`, italic `*`, bullet lists `* -`, headings `## ###`) as HTML

**Timestamp:** 10px, muted color, right-aligned for user / left-aligned for bot, format `HH:MM`.

**Typing indicator** (while waiting for response):
```
[ avatar ] [ "Thinking" italic + 3 animated dots ]
```

### 8.10 Mic button — **icon only, never text**

This is the primary bug in the current live script. The button must show an icon at every state:

| State | Button bg | Icon |
|---|---|---|
| idle | `mic.background_color` | `mic.icon_url` as img, else a mic SVG glyph |
| recording | `mic.recording_background_color` | `mic.recording_icon_url` as img, else a stop/square SVG |
| processing | `mic.processing_background_color` | Spinner animation |

`mic.label` / `mic.recording_label` / `mic.processing_label` are **status strip captions** displayed above the input row during recording/processing — they are never the button content. Example: while processing show `"{processing_label}"` (or `"Transcribing…"` if null) as a text line above the input; the button itself stays an icon.

Recording state UI (input row content changes):
```
[ ● 0:12 ] [  ————————————————  ] [ ⏸ ] [ ▶send ]
```
- Red/amber dot indicating recording/paused
- Timer `MM:SS` (tabular numerals)
- Pause/resume toggle
- Send button stops recording and submits

Hidden entirely if `settings.features.audio_upload !== true`.

### 8.11 Send button

- Default: paper-plane SVG icon
- `send.icon_url` set: render as `<img>` instead
- `send.label` non-empty string: render text **next to** the icon (never replace the icon with text)

**Bug fix required:** The current live script renders the literal word `"Send"` with no icon.

### 8.12 Input area

Pill-shaped row:
```
[ text input ··················· ] [ mic | send ]
```
- Placeholder: `settings.input_placeholder`. Default: `"Type your message..."`
- Enter key submits (prevent default)
- Send disabled when input is empty or a request is in-flight
- When mic is enabled (`audio_upload`): show mic icon when input is empty; switch to send icon when typing begins

### 8.13 Markdown rendering

Implement a lightweight inline renderer — no external library required:

| Input | Output |
|---|---|
| `**text**` | `<strong>text</strong>` |
| `*text*` | `<em>text</em>` |
| `## heading` | `<h2>` |
| `### heading` | `<h3>` |
| `* item` / `- item` | `<ul><li>` |
| Blank line | `<br>` |

Escape `&`, `<`, `>` before applying the above.

### 8.14 Voice message playback

When a user message was sent via voice (`isVoice: true`), render a mini audio player in the bubble:
```
[ ▶ ] [ ▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒ ] [ 0:08 ]
```
- 30 decorative waveform bars (seeded from audio URL for stability across re-renders)
- Progress highlight up to current playback position
- Toggle play/pause, show current time while playing / total duration while stopped

### 8.15 Storage keys (exact)

**localStorage** — long-lived, shared between dashboard preview and CDN snippet:

| Key | Value | Lifetime |
|---|---|---|
| `hasab_visitor_session_id` | UUID | Permanent (never expires client-side) |
| `hasab_chat_history_id` | integer string | Until new conversation or reset |
| `hasabChatLang` | language code | Until visitor changes it |

**sessionStorage** — CDN script only, scoped per browser tab:

| Key | Value | Lifetime |
|---|---|---|
| `hasab_widget_{widgetId}_session_token` | short-lived Bearer token | Tab session |

The localStorage keys must match exactly between the dashboard preview and the CDN script — a visitor who tests the widget in the dashboard and then visits the embedded snippet on the customer site will appear as the same returning visitor and continue their conversation.

---

## 9. Session & Security Model

### Visitor session flow

```
First message
  └─► POST /chat { new_conversation: true, visitor_session_id: "uuid" }
        └─► Backend creates conversation, returns chat_history_id: 1042

Second message
  └─► POST /chat { chat_history_id: 1042, visitor_session_id: "uuid" }

Tab closed. Re-opened within 24h.
  └─► POST /chat { chat_history_id: 1042, ... }  ← continues same conversation

24h idle window expires.
  └─► POST /chat { chat_history_id: 1042, ... }
        └─► Backend returns 404
              └─► Client clears chat_history_id, retries with new_conversation: true
```

### Widget authentication (CDN script)

The CDN script uses `data-widget-id` to identify which widget is being used. The backend should:
1. Validate that the request `Origin` header matches `allowed_origins` for that widget — reject with **`403`** if not
2. Issue a short-lived visitor session token tied to `widget_id` + `visitor_session_id`
3. Store the token in `sessionStorage` under key `hasab_widget_{widgetId}_session_token`
4. Send the token as `Authorization: Bearer <token>` on subsequent chat requests
5. On **`401`** (token expired/invalid), refresh the token and retry the request automatically

`data-theme` and `data-settings` are public appearance config — they contain no secrets and must not be treated as sensitive. No `HASAB_KEY` or private keys are ever sent to the browser.

### Error codes — embeds

| HTTP | Meaning | CDN script action |
|---|---|---|
| `401` | Bad or expired session token | Refresh token, retry once |
| `403` | Request origin not in `allowed_origins` | Surface error — admin must add origin to widget allowlist |
| `404` on chat | Stale `chat_history_id` (idle > 24h) | Clear `chat_history_id`, retry with `new_conversation: true` |

**Important for embed testing:** `403` means the site's origin is not in the widget's `allowed_origins` list — it is not a session expiry. Do not treat every non-200 as a token problem. Add the customer origin to the widget allowlist in the dashboard and retry.

### CORS

Enforce `allowed_origins` at the chat endpoint level with a **`403`** response and body `{ "message": "Origin not allowed for this widget" }`. A **`401`** must only be returned for genuine token failures, not origin mismatches — conflating the two was the root cause of the recurring "Invalid or expired widget session" error in live testing.

---

## 10. Client Metadata

Sent with every `POST /chat` request as `client_metadata`. Built client-side from browser APIs.

```typescript
interface ClientMetadata {
  screen_width?: number;       // window.screen.width
  screen_height?: number;      // window.screen.height
  viewport_width?: number;     // window.innerWidth
  viewport_height?: number;    // window.innerHeight
  timezone?: string;           // Intl.DateTimeFormat().resolvedOptions().timeZone
  browser_language?: string;   // navigator.language
  platform?: string;           // navigator.platform
  device_type?: "desktop" | "mobile" | "tablet";
  user_language?: string;      // currently selected language code
}
```

Device type detection logic:
```js
if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";
else if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
else deviceType = "desktop";
```

Stored on the conversation record. Surfaced in the Analytics → Conversation Detail view.

---

## 11. Data Models (Full Schemas)

### ChatbotWidget

```typescript
interface ChatbotWidget {
  id: number;
  widget_id: string;                   // e.g. "wgt_v9bli0es0wovrhibltuxgaxw"
  name: string;
  allowed_origins: string[];           // ["https://example.com"]
  theme: ChatbotWidgetTheme;
  settings: ChatbotWidgetSettings;
  chat_context_ids: number[];
  rag_store_ids: number[];
  welcome_message: string;
  default_language: string;            // "en" | "am" | "om" | any code
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  rate_limit_per_minute: number;
  is_active: boolean;
  snippet?: string;                    // optional pre-built embed snippet
}
```

### ChatbotWidgetTheme

```typescript
interface ChatbotWidgetTheme {
  primary_color?: string;
  panel_background?: string;
  message_area_background?: string;
  text_color?: string;
  bot_message_background?: string;
  bot_message_text_color?: string;
  user_message_background?: string;
  user_message_text_color?: string;
  chip_background?: string;
  chip_text_color?: string;
  border_color?: string;
  font_family?: string;
  border_radius?: string;              // "18px"
  panel_width?: string;               // "400px"
  panel_height?: string;              // "580px"
  launcher_size?: string;             // "64px"
  launcher?: {
    type?: "text" | "icon";
    label?: string | null;
    icon_url?: string | null;
    background_color?: string;
    text_color?: string;
  };
  header?: {
    avatar_url?: string | null;
    avatar_initials?: string;
  };
  mic?: {
    label?: string | null;
    recording_label?: string | null;
    processing_label?: string | null;
    icon_url?: string | null;
    recording_icon_url?: string | null;
    background_color?: string;
    recording_background_color?: string;
    processing_background_color?: string;
    text_color?: string;
  };
  send?: {
    label?: string | null;
    icon_url?: string | null;
  };
}
```

### ChatbotWidgetSettings

```typescript
interface ChatbotWidgetSettings {
  title?: string;
  subtitle?: string;
  launcher_label?: string | null;
  input_placeholder?: string;
  show_language_selector?: boolean;
  languages?: { code: string; label: string }[];
  quick_prompts?: { label: string; prompt: string }[];
  features?: {
    audio_upload?: boolean;
    quick_prompts?: boolean;
    language_selector?: boolean;
  };
}
```

### ChatCategory

```typescript
interface ChatCategory {
  id: number;
  chatbot_widget_id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Conversation (Analytics)

```typescript
interface Conversation {
  id: number;
  title: string;
  model: string | null;
  visitor_session_id: string | null;
  source: string | null;               // "widget" | "dashboard"
  page_url: string | null;
  language: string | null;
  client_ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  origin: string | null;
  client_metadata: ClientMetadata | null;
  satisfaction_rating: "positive" | "negative" | null;
  message_count: number;
  last_message_preview: string | null;
  last_message_role: string | null;
  category: { id: number | null; name: string; slug: string } | null;
  category_confidence: number | null;  // 0–1
  category_source: "auto" | "manual" | null;
  categorized_at: string | null;
  chatbot_widget_id: number | null;
  chatbot_widget: { id: number; widget_id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}
```

---

## 12. CDN Script Layout Bugs — Preview vs Live Diff (2026-07-27)

Live comparison between the dashboard preview (`ChatWidget.tsx`) and the actual embedded snippet confirmed the following rendering differences. All of them are CDN script bugs — **none require backend API changes**.

---

### 12.1 Root cause — Amharic incorrectly treated as RTL ⚠️

**This single bug causes the majority of layout flips below.**

The CDN script appears to apply `direction: rtl` (or `flex-direction: row-reverse`) when the selected language is Amharic (`am` / `amh`). **Amharic uses the Ethiopic script which is strictly left-to-right.** It is not RTL.

**Fix:** Never apply RTL direction for any of the three supported languages. None of them are RTL:

| Language | Code | Script | Direction |
|---|---|---|---|
| English | `en` / `eng` | Latin | LTR ✓ |
| Amharic | `am` / `amh` | Ethiopic (Ge'ez) | **LTR ✓** |
| Afaan Oromoo | `om` / `orm` | Latin | LTR ✓ |

The CDN script must always render with `direction: ltr`. Do not derive text direction from the language code.

---

### 12.2 Quick-prompt chips — layout is mirrored

**Dashboard preview (correct):**
```
[ 26px spacer ] [ pricing chip ──────────── ]
[ HA avatar  ] [ support chip ──────────── ]   ← avatar left of last chip
```

**Embedded snippet (wrong — caused by RTL bug §12.1):**
```
[ ──────────── pricing chip ] [ 26px spacer ]
[ ─────────── support chip ] [ HA avatar   ]   ← avatar right of last chip
```

**Exact layout each row must render (LTR, matching `ChatWidget.tsx`):**

```html
<div style="display:flex; align-items:center; gap:8px;">
  <!-- spacer OR avatar — always on the LEFT -->
  <div style="width:26px; flex-shrink:0;" />        <!-- non-last rows -->
  <!-- OR -->
  <img ... />                                        <!-- last row: bot avatar 26px -->

  <button style="flex:1; text-align:left;">
    {chip label}
  </button>
</div>
```

The avatar appears on the **left** of the **last** chip only. All other rows use a 26px invisible spacer on the left.

---

### 12.3 Welcome message — missing left spacer

**Dashboard preview (correct):**
```
[ 26px spacer ] [ "Hi, how can I help?" bubble ── ]
```

**Embedded snippet (wrong):**
```
[ "Hi, how can I help?" bubble ────────────────── ]   ← no spacer, flush to edge
```

**Fix:** The welcome message row must use the same 26px left spacer as the non-last chip rows above:

```html
<div style="display:flex; align-items:flex-start; gap:8px; width:100%;">
  <div style="width:26px; flex-shrink:0;" />   <!-- 26px spacer, not avatar -->
  <div style="flex:1; /* bubble styles */">
    {welcomeMessage}
  </div>
</div>
```

---

### 12.4 Mic button — appears on left instead of right

**Dashboard preview (correct):** input text → … → mic button on **RIGHT**

**Embedded snippet (wrong):** mic button on **LEFT** → input text → …

This is a direct consequence of the RTL bug (§12.1) reversing the flex row order of the input area. With `direction: ltr` restored, the input area naturally renders as:

```
[ text input ·············· ] [ mic icon ]   ← mic always RIGHT
```

No additional fix needed beyond correcting §12.1.

---

### 12.5 "Today" separator — wrong capitalisation

**Dashboard preview (correct):** `Today`

**Embedded snippet (wrong):** `TODAY`

**Fix:** Render the date separator as title-case `Today`, not all-caps. Do not apply `text-transform: uppercase` to this element.

---

### 12.6 Summary table

| # | Element | Expected (dashboard) | Actual (snippet) | Root cause |
|---|---|---|---|---|
| 12.1 | Text direction | LTR always | RTL for Amharic | Wrong `direction: rtl` |
| 12.2 | Chip layout | `[avatar/spacer][chip]` | `[chip][avatar/spacer]` | RTL flip |
| 12.3 | Welcome message | 26px left spacer | No spacer | RTL flip |
| 12.4 | Mic button | Right of input | Left of input | RTL flip |
| 12.5 | Date separator | `Today` | `TODAY` | `text-transform: uppercase` |

Fixing §12.1 (remove RTL for Amharic) resolves §12.2, §12.3, and §12.4 simultaneously. §12.5 is a separate one-line CSS fix.

---

## Priority Order for Backend Work

1. **Fix session token bug** (§9) — widget is nonfunctional without this
2. **Fix RTL/layout bug for Amharic** (§12.1) — flips chip layout, welcome message spacer, and mic button position simultaneously
3. **CDN script icon fixes** (§8.6, §8.10, §8.11) — mic/send/launcher rendering bare text instead of icons
4. **Fix "Today" capitalisation** (§12.5) — one-line CSS fix
5. **Mobile responsive sizing** (§8.4) — `min()` viewport capping folded into `width`/`height`
6. **Category auto-classification** (§6) — classifying conversations post-send
7. **Analytics `by_category` breakdown** (§7) — needed for the category breakdown chart in the dashboard
