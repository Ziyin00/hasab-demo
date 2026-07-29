# CDN Widget ↔ Platform Widget — UI Parity Spec

**Audience:** Backend / CDN embed owners (`hasab-chatbot.js`)  
**Goal:** Make the public snippet widget look and behave **identically** to the dashboard test platform widget (`ChatWidget.tsx` / `GlobalChatWidget`).  
**Source of truth:** Platform widget on `localhost` dashboard (Analytics / any page with `GlobalChatWidget`).  
**CDN script:** `https://api.hasab.ai/widget/v1/hasab-chatbot.js`

---

## 0. Confirmed visual gap (same config, two UIs)

We compared the **same widget config** rendered as:

| Surface | Where | Screenshot |
|---|---|---|
| **Platform (target)** | Dashboard floating widget | White header, mic **inside** input on the **right** |
| **CDN snippet (current)** | Live embed / customer site | Purple header, mic as **separate filled circle** on the **left** |

Both used (or equivalent to) this snippet:

```html
<script
  async
  src="https://api.hasab.ai/widget/v1/hasab-chatbot.js"
  data-widget-id='wgt_v9bli0es0wovrhibltuxgaxw'
  data-position='bottom-right'
  data-default-language='en'
  data-welcome-message='Hi, how can I help?'
  data-theme='{"primary_color":"#9b30e0","panel_background":"#ffffff","message_area_background":"#f8fafc","text_color":"#111827","bot_message_background":"#d8aaff","bot_message_text_color":"#9b30e0","user_message_background":"#9b30e0","user_message_text_color":"#ffffff","chip_background":"#A9A9A9","chip_text_color":"#9b30e0","border_color":"#F5F5F5","font_family":"Inter, system-ui, sans-serif","border_radius":"18px","panel_width":"380px","panel_height":"530px","launcher_size":"64px","launcher":{"type":"text","label":null,"icon_url":null,"background_color":"#9b30e0","text_color":"#ffffff"},"header":{"avatar_url":null,"avatar_initials":"HA"},"mic":{"label":null,"recording_label":null,"processing_label":"Wait","icon_url":null,"recording_icon_url":null,"background_color":"#475569","recording_background_color":"#dc2626","processing_background_color":"#d97706","text_color":"#ffffff"},"send":{"label":null,"icon_url":null}}'
  data-settings='{"title":"Hasab Ai","subtitle":"Ready to help","launcher_label":null,"input_placeholder":"Ask in your language...","show_language_selector":true,"languages":[{"code":"en","label":"English"},{"code":"amh","label":"Amharic"},{"code":"orm","label":"Oromo"}],"quick_prompts":[{"label":"pricing","prompt":"what are hasab ai pricing"},{"label":"support","prompt":"what can you help me"}],"features":{"audio_upload":true,"quick_prompts":true,"language_selector":true}}'
></script>
```

### Gap matrix (must fix)

| # | Area | Platform (required) | CDN today (wrong) |
|---|---|---|---|
| 1 | **Header background** | `panel_background` (**white** `#ffffff`) | Solid `primary_color` (**purple**) |
| 2 | **Header text** | `text_color` for title; muted `#999` for subtitle | White text on purple header |
| 3 | **Header close / actions** | Dark muted icons, `hover:bg-gray-100` | White icons on purple |
| 4 | **Language selector** | Soft primary tint pill: `bg ${primary}18`, `color primary`, `border ${primary}40` | Light-on-purple / different chrome |
| 5 | **Mic placement** | **Inside** the input pill, **right** side (when input empty) | Separate circular button **outside** input, **left** |
| 6 | **Mic idle style** | Ghost icon only (`color: #999`, transparent bg) — **does not** fill with `mic.background_color` | Filled circle using `mic.background_color` (`#475569`) |
| 7 | **Input row layout** | Single full-width rounded pill containing text + mic/send | Mic + separate input field side by side |
| 8 | **Welcome / empty branding** | Large **72px** avatar (full primary gradient) + bold title (`text_color`) + muted subtitle | Smaller / grayed branding, weaker hierarchy |
| 9 | **Welcome structure** | Avatar → title → subtitle → **Today** rule → welcome **bubble** → chips | Partial / different spacing |
| 10 | **Quick-prompt chips** | Full-width pills; **26px** left spacer; **last** chip shows bot avatar (26px) | Avatar alignment / spacing often off |
| 11 | **Panel ↔ launcher gap** | Panel sits `edgeInset + launcherSize + 8px` above launcher | Often tighter / overlapping / different inset |
| 12 | **Launcher open state** | Same FAB, shows **X** icon when panel open | Same idea, verify size/`launcher_size` |

> **Important:** Matching the platform means **not** painting the header with `primary_color`, and **not** rendering a left filled mic button from `mic.background_color` in idle state. Those theme keys still exist for recording/processing (and for future use), but idle chrome must follow the platform layout below.

---

## 1. Architecture reminder

| Layer | Responsibility |
|---|---|
| Portal FE | Saves `theme` + `settings` on the widget; embeds them as `data-theme` / `data-settings` in the snippet |
| CDN script | Must honor those JSON blobs **and** match platform layout |
| Platform widget | `src/features/chat/components/ChatWidget.tsx` — **visual source of truth** |

Do **not** invent a second visual language for the embed. If platform and CDN disagree, **CDN changes**.

---

## 2. Layout structure (copy this tree)

```
[Panel]  fixed corner, flex column, overflow hidden
├── [Header]  panel_background, border-bottom
│   ├── Avatar 34px
│   ├── Title (settings.title) + green online dot + subtitle
│   └── Language select (optional) + New-chat (if messages) + Close
├── [Message area]  flex-1, message_area_background, scroll
│   └── Empty state OR message list
└── [Footer]  panel_background, border-top
    └── [Input pill]  full width, rounded-full
        ├── <input>
        └── Mic OR Send (right)

[Launcher FAB]  circular, launcher_size, docked to corner
```

### Spacing tokens (platform)

| Token | Value |
|---|---|
| Dashboard edge inset | `24px` |
| Panel ↔ launcher gap | `8px` (panel bottom = `inset + launcherSize + 8`) |
| Panel shadow | strong (`shadow-2xl` equivalent) |
| Panel border | `1px solid border_color` |
| Panel radius | `theme.border_radius` (e.g. `18px`) else `16px` |
| Header padding | `12px` horizontal, `10px` vertical, `8px` gap |
| Header avatar | `34×34` |
| Message empty padding | `16px` sides, `32px` top, `16px` bottom |
| Active messages padding | `14px`, row gap `12px` |
| Footer padding | `12px` |
| Input pill padding | `16px` × `8px`, border `1.5px` |
| Bubble text | `13px`, relaxed line-height |
| Bubble max width | ~`76%` |
| Bubble radius | `16px` with trailing corner cut to `4px` |

### Size clamps (floating, non-embedded)

| Dim | Default if missing | Min | Max |
|---|---|---|---|
| `launcher_size` | 56 | 40 | 96 |
| `panel_width` | 380 | 280 | 520 |
| `panel_height` | 620 | 400 | 720 |

Parse `"380px"` → `380`. Apply with `min(value, viewport - padding)`.

---

## 3. Theme key → UI mapping (as platform applies them)

| Theme key | Applies to |
|---|---|
| `primary_color` | Avatar gradient, lang select tint, send button bg, chip fallback, processing spinner, launcher fallback |
| `panel_background` | **Panel shell + header + footer** (not primary) |
| `message_area_background` | Scroll area **and** input pill fill |
| `text_color` | Title, welcome title, input text, header icon buttons |
| `bot_message_*` | Bot bubbles + welcome bubble |
| `user_message_*` | User bubbles |
| `chip_*` | Quick-prompt chips (if set; else primary tint) |
| `border_color` | Panel / header / footer borders, bot bubble border, date rules, idle input border |
| `font_family` | Panel root |
| `border_radius` | Panel only |
| `panel_width` / `panel_height` / `launcher_size` | Dimensions (clamped) |
| `launcher.*` | FAB only |
| `header.avatar_url` / `avatar_initials` | Avatars |
| `mic.icon_url` | Idle mic glyph override only |
| `mic.processing_label` | Processing status text inside pill |
| `send.icon_url` | Send glyph override |

### Hardcoded (match platform)

| Element | Value |
|---|---|
| Muted text | `#999` |
| Online dot | `#22c55e` + soft green ring |
| Recording accents | `#ef4444` / `#f87171` |
| Paused accents | `#f59e0b` / `#fbbf24` |

### Theme fields **not** used for idle chrome on platform

These may be stored in JSON but **must not** drive the idle header/mic layout:

- `mic.background_color` — **do not** paint a left filled mic in idle
- `mic.recording_background_color` / `processing_background_color` / `text_color` — optional for advanced recording UI; platform currently uses hardcoded reds for recording
- `mic.label` / `recording_label` — not button text
- `send.label` — icon-only unless you explicitly support text+icon (platform is icon-only)
- `launcher.label` when `null` — **icon only**, never invent `"Chat"` / `"Mic"` / `"Send"` strings

---

## 4. Required section behavior

### 4.1 Header (critical gap #1)

- Background = `panel_background` (**white** in the sample theme).
- **Never** fill the header with `primary_color`.
- Left: avatar `34px` → title (`settings.title`) → green online dot + `settings.subtitle`.
- Right: language select → optional reset → close `X`.
- Title color = `text_color`; subtitle = `#999`.

### 4.2 Language selector

- From `settings.languages` only.
- Hide if `features.language_selector === false` or `show_language_selector === false`.
- Style: `background: primary + "18"`, `color: primary`, `border: 1px solid primary + "40"`, `11px` font, rounded.
- Seed from `data-default-language`; persist visitor choice.

### 4.3 Empty / welcome state (critical gap #8–10)

Order, top → bottom:

1. Centered avatar **72px** (url → initials on primary gradient → bot icon)
2. Title: `settings.title`, `~20px` bold, `text_color`
3. Subtitle: `settings.subtitle` or “Ready to help”, `12px`, `#999`
4. Horizontal rule with centered **Today**
5. Welcome bubble (bot colors + border), left-aligned with **26px** spacer (no avatar on this row)
6. Quick prompts (if enabled and non-empty)

### 4.4 Quick prompts

- Only from `settings.quick_prompts` (`label` shown, `prompt` sent).
- Only when array non-empty **and** `features.quick_prompts !== false`.
- Empty state only.
- Each row: `26px` left slot; **only the last row** shows bot avatar `26px`.
- Chip: `rounded-full`, `12px`, `px-16 py-8`, `chip_background` / `chip_text_color`.

### 4.5 Input + mic + send (critical gap #5–7)

**Idle layout (must match platform):**

```
┌─────────────────────────────────────────────┐
│  Ask in your language...              [mic] │  ← one pill
└─────────────────────────────────────────────┘
```

Rules:

1. One full-width rounded pill (`message_area_background`, `1.5px border_color`).
2. Text input expands; **right** control is either:
   - **Mic** (ghost, `#999`) when `features.audio_upload === true` **and** input is empty
   - **Send** (filled `primary_color`, white icon) when there is text (or mic disabled)
3. Mic and send are **mutually exclusive** in idle.
4. Do **not** place a filled mic button to the left of the input.
5. `mic.label` / `send.label` = `null` → **icons only**. Never render the words `"Mic"`, `"Send"`, or `"Chat"`.

**Recording / processing:** keep content inside the same pill (timer + pause + send, or processing label + spinner). Platform uses `mic.processing_label` (fallback `"Transcribing…"`).

### 4.6 Launcher

| State | Content |
|---|---|
| Closed + `icon_url` | That image |
| Closed + `type === "text"` + non-empty label | Icon **plus** label |
| Closed + `label: null` | **Chat-bubble icon only** (no `"Chat"` text) |
| Open | **X** icon |

- Background = `launcher.background_color` (fallback `primary_color`)
- Size = `launcher_size`
- Corner = `data-position`

### 4.7 Message bubbles

- Bot: `bot_message_background` / `bot_message_text_color`, `1px border_color`, bottom-left radius `4px`
- User: `user_message_background` / `user_message_text_color`, bottom-right radius `4px`
- Bot rows include `26px` avatar on the left

---

## 5. Settings feature flags

| Flag | Effect |
|---|---|
| `features.audio_upload === true` | Show mic (otherwise never) |
| `features.quick_prompts !== false` | Allow chips when array non-empty |
| `features.language_selector !== false` | Allow language select |
| `show_language_selector === false` | Hide language select |

---

## 6. Acceptance checklist (backend / CDN)

Use the exact snippet in §0 on a blank page. Compare side-by-side with the dashboard widget for the same `widget_id`.

- [ ] Header is **white** (`panel_background`), not purple
- [ ] Title/subtitle use dark/muted colors, not white-on-primary
- [ ] Language pill uses soft primary tint (not inverted on purple bar)
- [ ] Large welcome avatar is full-color primary gradient (not grayed out)
- [ ] Welcome order: avatar → title → subtitle → Today → bubble → chips
- [ ] Chips full-width; last chip has bot avatar; others have 26px spacer
- [ ] Input is a **single** pill; mic is **inside**, on the **right**, ghost style
- [ ] No left filled mic circle in idle
- [ ] Empty `launcher.label` → icon-only FAB (no `"Chat"` text)
- [ ] `mic.label` / `send.label` null → icons only (no `"Mic"` / `"Send"` text)
- [ ] Panel sits clearly above launcher with ~8px gap
- [ ] Open launcher shows **X**
- [ ] Colors for bubbles/chips/launcher match JSON exactly

---

## 7. Reference

| Item | Location |
|---|---|
| Platform UI | `src/features/chat/components/ChatWidget.tsx` |
| Dashboard mount | `src/features/chat/components/GlobalChatWidget.tsx` |
| Theme / settings types | `src/features/chatbot-widgets/types/chatbot-widget.types.ts` |
| Snippet serializer | `src/features/chatbot-widgets/components/SnippetModal.tsx` |

**Rule of thumb:** if a screenshot of the CDN widget and the dashboard widget for the same config can be told apart, the CDN still has a gap — fix CDN until they are indistinguishable.
