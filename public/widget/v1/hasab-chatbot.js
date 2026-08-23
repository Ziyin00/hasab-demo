/**
 * Hasab embed widget (CDN: /widget/v1/hasab-chatbot.js).
 *
 * TTS integration (disabled) — see git history:
 * isTtsLanguage, shouldRequestTts, tts/enable_tts payload, audio_base64 decode, Tigist player.
 */
(function () {
  'use strict';

  function init() {
    var currentScript = document.currentScript;
    if (!currentScript || !currentScript.getAttribute('data-widget-id')) {
      var scripts = document.querySelectorAll('script[src*="hasab-chatbot.js"][data-widget-id]');
      currentScript = scripts.length ? scripts[scripts.length - 1] : null;
      if (!currentScript) {
        scripts = document.querySelectorAll('script[src*="hasab-chatbot.js"]');
        currentScript = scripts[scripts.length - 1] || null;
      }
    }
    var widgetId = currentScript && currentScript.getAttribute('data-widget-id');
    if (!widgetId) return; 

    var scriptApiBaseUrl = currentScript && currentScript.getAttribute('data-api-base-url');
    var apiBaseUrl = (scriptApiBaseUrl || 'https://api.hasab.ai').replace(/\/$/, '');
    var tokenKey = 'hasab_widget_' + widgetId + '_session_token';
    var visitorKey = 'hasab_visitor_session_id';
    var historyKey = 'hasab_chat_history_id';
    var langKey = 'hasabChatLang_' + widgetId;

    var config = null;
    // TTS integration (disabled): var widgetFeatures = { tts: false };
    var widgetFeatures = { tts: false };
    var sessionToken = sessionStorage.getItem(tokenKey);
    var mediaRecorder = null;
    var audioChunks = [];
    var micState = 'idle';
    var recSecs = 0;
    var recTimer = null;
    var recPaused = false;

    var STT_LANG = { en: 'eng', am: 'amh', om: 'orm', orm: 'orm' };

    var LANG_INSTRUCTIONS = {
      en: 'CRITICAL: You MUST respond ONLY in English. Do not use any other language.',
      eng: 'CRITICAL: You MUST respond ONLY in English. Do not use any other language.',
      am: 'CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.',
      amh: 'CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.',
      om: 'CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.',
      orm: 'CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.'
    };

    // Built-in chrome strings — match platform ChatWidget LANG_STRINGS / CDN_UI_LOCALIZATION.md
    var LANG_STRINGS = {
      en: {
        subtitle: 'Ready to help',
        placeholder: 'Type your message...',
        today: 'Today',
        online: 'Online',
        thinking: 'Thinking',
        welcomeBody: 'Pick a question above, type, or tap the mic to speak.',
        prompts: [
          { label: 'What can you help me with?', prompt: 'What can you help me with?' },
          { label: 'Tell me about your features', prompt: 'Tell me about your features' },
          { label: 'How do I get started?', prompt: 'How do I get started?' }
        ]
      },
      am: {
        subtitle: 'ለመርዳት ዝግጁ',
        placeholder: 'መልዕክትዎን ይፃፉ...',
        today: 'ዛሬ',
        online: 'ኦንላይን',
        thinking: 'እያሰበ ነው',
        welcomeBody: 'ጥያቄ ይምረጡ፣ ይፃፉ ወይም ሚክሮፎኑን ይጫኑ።',
        prompts: [
          { label: 'ምን ሊረዱኝ ይችላሉ?', prompt: 'ምን ሊረዱኝ ይችላሉ?' },
          { label: 'ስለ ፕሮዳክቱ ይናገሩ', prompt: 'ስለ ፕሮዳክቱ ይናገሩ' },
          { label: 'እንዴት እጀምር?', prompt: 'እንዴት እጀምር?' }
        ]
      },
      om: {
        subtitle: "Gargaaruuf qophaa'eera",
        placeholder: 'Ergaa kee barreessi...',
        today: "Har'a",
        online: 'Online',
        thinking: 'Yaadaa jira',
        welcomeBody: 'Gaaffii filadhu, barreessi yookaan miikrofoona tuqi.',
        prompts: [
          { label: 'Maal na gargaaruu dandeessa?', prompt: 'Maal na gargaaruu dandeessa?' },
          { label: "Waa'ee tajaajila dubbadhu", prompt: "Waa'ee tajaajila dubbadhu" },
          { label: 'Akkami jalqabuu?', prompt: 'Akkami jalqabuu?' }
        ]
      }
    };

    function toLangKey(code) {
      var c = String(code || '').toLowerCase();
      if (c === 'am' || c === 'amh') return 'am';
      if (c === 'om' || c === 'orm') return 'om';
      if (c === 'en' || c === 'eng') return 'en';
      return 'en';
    }

    function chatLanguageInstruction(code) {
      var c = String(code || '').toLowerCase();
      if (LANG_INSTRUCTIONS[c]) return LANG_INSTRUCTIONS[c];
      var key = toLangKey(code);
      return LANG_INSTRUCTIONS[key] || LANG_INSTRUCTIONS.en;
    }

    // TTS integration (disabled):
    // function isTtsLanguage(code) {
    //   return toLangKey(code) === 'am';
    // }
    //
    // function shouldRequestTts(langCode) {
    //   return widgetFeatures.tts === true && isTtsLanguage(langCode);
    // }
    //
    // function audioUrlFromChatPayload(json) {
    //   if (!json) return null;
    //   var b64 = json.audio_base64
    //     || (json.message && json.message.audio_base64)
    //     || (json.data && json.data.audio_base64);
    //   if (!b64 || typeof b64 !== 'string') return null;
    //   var contentType = (json.audio_content_type && String(json.audio_content_type).trim()) || 'audio/wav';
    //   try {
    //     var binary = atob(b64);
    //     var bytes = new Uint8Array(binary.length);
    //     var i;
    //     for (i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    //     return URL.createObjectURL(new Blob([bytes], { type: contentType }));
    //   } catch (e) {
    //     return null;
    //   }
    // }

    function resolveChrome(lang, settingsObj, welcomeMessage) {
      var key = toLangKey(lang);
      var ui = LANG_STRINGS[key] || LANG_STRINGS.en;
      var isEn = key === 'en';
      return {
        subtitle: isEn ? ((settingsObj && settingsObj.subtitle) || ui.subtitle) : ui.subtitle,
        placeholder: isEn
          ? ((settingsObj && settingsObj.input_placeholder) || ui.placeholder)
          : ui.placeholder,
        today: ui.today,
        thinking: ui.thinking,
        welcome: isEn ? (welcomeMessage || ui.welcomeBody) : ui.welcomeBody,
        prompts: ui.prompts
      };
    }

    function resolvePromptsForLang(rawPrompts, lang) {
      var key = toLangKey(lang);
      if (!rawPrompts) return null;
      if (Array.isArray(rawPrompts)) {
        return rawPrompts.length ? rawPrompts : null;
      }
      if (typeof rawPrompts === 'object') {
        var list = rawPrompts[lang]
          || rawPrompts[key]
          || (key === 'am' ? rawPrompts.amh : null)
          || (key === 'om' ? rawPrompts.orm : null)
          || rawPrompts.en
          || rawPrompts.eng
          || [];
        return Array.isArray(list) && list.length ? list : null;
      }
      return null;
    }

    var ICONS = {
      bot: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
      // Lucide MessageSquareDot — matches platform ChatWidget launcher
      chat: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.7 3H5a2 2 0 0 0-2 2v16l4-4h12a2 2 0 0 0 2-2v-2.7"/><circle cx="18" cy="6" r="3"/></svg>',
      // Lucide X — sized for launcher FAB (platform uses w-6 h-6)
      closeFab: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      mic: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
      stop: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
      pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
      close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      reset: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
      spinner: '<svg class="spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
      thumbUp: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
      thumbDown: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>'
    };

    function uuid() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    }

    function visitorSessionId() {
      var id = localStorage.getItem(visitorKey);
      if (!id) {
        id = uuid();
        localStorage.setItem(visitorKey, id);
      }
      return id;
    }

    function getChatHistoryId() {
      var v = localStorage.getItem(historyKey);
      return v ? Number(v) : null;
    }

    function saveChatHistoryId(id) {
      localStorage.setItem(historyKey, String(id));
    }

    function clearHistory() {
      localStorage.removeItem(historyKey);
    }

    function clearSession() {
      sessionStorage.removeItem(tokenKey);
      sessionToken = null;
    }

    function getLanguage() {
      var raw = localStorage.getItem(langKey) || (config && config.default_language) || 'en';
      return toLangKey(raw);
    }

    function setLanguage(code) {
      localStorage.setItem(langKey, toLangKey(code));
    }

    function sttLang(code) {
      var key = toLangKey(code);
      return STT_LANG[key] || STT_LANG[code] || STT_LANG[String(code || '').toLowerCase()] || code;
    }

    function parsePx(value, fallback) {
      if (!value) return fallback;
      var n = parseInt(String(value).replace(/px$/i, ''), 10);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    }

    function clamp(n, min, max) {
      return Math.min(Math.max(n, min), max);
    }

    function audioBufferToWav(buffer) {
      var len = buffer.length;
      var ch = buffer.numberOfChannels;
      var sr = buffer.sampleRate;
      var ab = new ArrayBuffer(44 + len * ch * 2);
      var view = new DataView(ab);
      var i;

      function writeStr(off, s) {
        for (i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
      }

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + len * ch * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, ch, true);
      view.setUint32(24, sr, true);
      view.setUint32(28, sr * ch * 2, true);
      view.setUint16(32, ch * 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, len * ch * 2, true);

      var offset = 44;
      var c;
      var s;
      for (i = 0; i < len; i++) {
        for (c = 0; c < ch; c++) {
          s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          offset += 2;
        }
      }
      return ab;
    }

    function toWav(blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) {
              reject(new Error('AudioContext unavailable'));
              return;
            }
            var ctx = new Ctx();
            ctx.decodeAudioData(e.target.result).then(function (decoded) {
              resolve(new Blob([audioBufferToWav(decoded)], { type: 'audio/wav' }));
            }).catch(reject);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    }

    function fmtSecs(s) {
      var m = Math.floor(s / 60);
      return m + ':' + (s % 60).toString().padStart(2, '0');
    }

    function fmtTime(date) {
      var h = date.getHours().toString().padStart(2, '0');
      var m = date.getMinutes().toString().padStart(2, '0');
      return h + ':' + m;
    }

    function request(path, options) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Accept = 'application/json';
      if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }

      return fetch(apiBaseUrl + path, options)
        .catch(function () {
          var err = new Error('NETWORK');
          err.code = 'NETWORK';
          throw err;
        })
        .then(function (response) {
          return response.text().then(function (text) {
            var json;
            try {
              json = text ? JSON.parse(text) : {};
            } catch (parseError) {
              var parseErr = new Error('PARSE');
              parseErr.code = 'PARSE';
              throw parseErr;
            }
            if (!response.ok) {
              var err = new Error(json.message || json.error || 'Request failed');
              err.status = response.status;
              err.body = json;
              throw err;
            }
            return json;
          });
        });
    }

    function applyApiBaseUrl(candidate) {
      if (!candidate) return;
      if (scriptApiBaseUrl) {
        apiBaseUrl = String(scriptApiBaseUrl).replace(/\/$/, '');
        return;
      }
      apiBaseUrl = String(candidate).replace(/\/$/, '').replace(/^http:\/\//i, 'https://');
    }

    function parseScriptJson(attr) {
      var raw = currentScript && currentScript.getAttribute(attr);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }

    function deepMerge(target, source) {
      if (!source || typeof source !== 'object') return target;
      var out = target && typeof target === 'object' ? Object.assign({}, target) : {};
      Object.keys(source).forEach(function (key) {
        var val = source[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          out[key] = deepMerge(out[key] || {}, val);
        } else if (val !== undefined && val !== null) {
          out[key] = val;
        }
      });
      return out;
    }

    function nonEmptyString(value) {
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : '';
    }

    function applyScriptDataOverrides(widgetConfig) {
      var dataTheme = parseScriptJson('data-theme');
      var dataSettings = parseScriptJson('data-settings');
      var dataPosition = currentScript.getAttribute('data-position');
      var dataWelcome = currentScript.getAttribute('data-welcome-message');
      var dataLang = currentScript.getAttribute('data-default-language');

      if (dataTheme) widgetConfig.theme = deepMerge(widgetConfig.theme || {}, dataTheme);
      if (dataSettings) widgetConfig.settings = deepMerge(widgetConfig.settings || {}, dataSettings);
      if (dataPosition) widgetConfig.position = dataPosition;
      if (dataWelcome !== null && dataWelcome !== undefined) widgetConfig.welcome_message = dataWelcome;
      if (dataLang) widgetConfig.default_language = dataLang;

      return widgetConfig;
    }

    function syncWidgetFeatures(cfg) {
      // TTS integration (disabled): widgetFeatures = { tts: f.tts === true };
      widgetFeatures = { tts: false };
    }

    function loadConfig() {
      return request('/api/chatbot-widgets/' + encodeURIComponent(widgetId) + '/config')
        .then(function (json) {
          config = applyScriptDataOverrides(json.data.widget || {});
          syncWidgetFeatures(config);
          applyApiBaseUrl(config.api_base_url);
          return config;
        });
    }

    function ensureSession() {
      if (sessionToken) return Promise.resolve(sessionToken);

      return request('/api/chatbot-widgets/session', {
        method: 'POST',
        body: JSON.stringify({
          widget_id: widgetId,
          visitor_session_id: visitorSessionId(),
          page_url: window.location.href
        })
      }).then(function (json) {
        sessionToken = json.data.widget_session_token;
        sessionStorage.setItem(tokenKey, sessionToken);
        return sessionToken;
      });
    }

    function refreshSession() {
      clearSession();
      return ensureSession();
    }

    function isSessionError(err) {
      if (!err) return false;
      if (err.status === 401) return true;
      var msg = String(err.message || '').toLowerCase();
      return msg.indexOf('session') >= 0 || msg.indexOf('expired') >= 0 || msg.indexOf('invalid') >= 0;
    }

    function clientMetadata(language) {
      var ua = navigator.userAgent || '';
      var deviceType = 'desktop';
      if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';
      else if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';

      return {
        screen_width: window.screen && window.screen.width,
        screen_height: window.screen && window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
        browser_language: navigator.language || '',
        platform: navigator.platform || '',
        device_type: deviceType,
        user_language: language || ''
      };
    }

    function postChat(payload, token) {
      return request('/api/widget/chat', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'X-Visitor-Session-Id': visitorSessionId()
        },
        body: JSON.stringify(payload)
      });
    }

    function submitFeedback(rating) {
      var chatHistoryId = getChatHistoryId();
      if (!chatHistoryId) return Promise.resolve();
      return ensureSession().then(function (token) {
        return request('/api/widget/chat/feedback', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'X-Visitor-Session-Id': visitorSessionId()
          },
          body: JSON.stringify({ chat_history_id: chatHistoryId, rating: rating })
        });
      });
    }

    function sendMessage(text, language, options) {
      options = options || {};
      var sessionRetried = !!options.sessionRetried;
      var historyRetried = !!options.historyRetried;

      return ensureSession().then(function (token) {
        var chatHistoryId = getChatHistoryId();
        var langCode = language || getLanguage();
        var chatLang = toLangKey(langCode);
        var instruction = chatLanguageInstruction(langCode);
        // var wantTts = shouldRequestTts(langCode);
        var payload = {
          message: text,
          model: 'hasab-1-lite',
          visitor_session_id: visitorSessionId(),
          source: 'widget',
          page_url: window.location.href,
          language: chatLang,
          language_instruction: instruction,
          // tts: wantTts,
          // enable_tts: wantTts,
          client_metadata: Object.assign(clientMetadata(chatLang), {
            language_instruction: instruction
            // , tts: wantTts
          })
        };
        if (chatHistoryId && !historyRetried) {
          payload.chat_history_id = chatHistoryId;
        } else {
          payload.new_conversation = true;
        }

        return postChat(payload, token).then(function (json) {
          if (json.chat_history_id) saveChatHistoryId(json.chat_history_id);
          var content = (json.message && json.message.content) ||
            (json.data && json.data.message && (typeof json.data.message === 'string' ? json.data.message : json.data.message.content)) ||
            null;
          // var audioUrl = wantTts ? audioUrlFromChatPayload(json) : null;
          return { content: content };
        }).catch(function (err) {
          if (err.status === 404 && chatHistoryId && !historyRetried) {
            clearHistory();
            return sendMessage(text, language, { sessionRetried: sessionRetried, historyRetried: true });
          }
          if (!sessionRetried && isSessionError(err)) {
            return refreshSession().then(function () {
              return sendMessage(text, language, { sessionRetried: true, historyRetried: historyRetried });
            });
          }
          throw err;
        });
      });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
      });
    }

    function escapeAttr(value) {
      return escapeHtml(value || '');
    }

    function hexWithAlpha(hex, alpha) {
      var h = String(hex || '').replace('#', '').trim();
      if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      }
      if (!/^[0-9a-fA-F]{6}$/.test(h)) {
        return hex || '#000000';
      }
      return '#' + h + String(alpha || 'ff');
    }

    function cssValue(value, fallback) {
      value = String(value || fallback || '').replace(/[<>"'{};]/g, '').trim();
      return value || fallback;
    }

    function renderMarkdown(raw) {
      var lines = String(raw || '').split('\n');
      var html = '';
      var inList = false;
      var i;
      var line;
      var esc;

      for (i = 0; i < lines.length; i++) {
        line = lines[i];
        esc = escapeHtml(line);

        if (/^### /.test(esc)) {
          if (inList) { html += '</ul>'; inList = false; }
          html += '<h3>' + esc.slice(4).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</h3>';
        } else if (/^## /.test(esc)) {
          if (inList) { html += '</ul>'; inList = false; }
          html += '<h2>' + esc.slice(3).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</h2>';
        } else if (/^[\*\-] /.test(esc)) {
          if (!inList) { html += '<ul>'; inList = true; }
          html += '<li>' + esc.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</li>';
        } else {
          if (inList && esc.trim()) { html += '</ul>'; inList = false; }
          if (esc.trim()) {
            html += esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '<br>';
          } else {
            html += '<br>';
          }
        }
      }
      if (inList) html += '</ul>';
      return html;
    }

    function buildAvatarHtml(headerTheme, sizeClass) {
      sizeClass = sizeClass || 'avatar-sm';
      if (headerTheme.avatar_url) {
        return '<img class="avatar ' + sizeClass + '" src="' + escapeAttr(headerTheme.avatar_url) + '" alt="">';
      }
      if (headerTheme.avatar_initials) {
        return '<span class="avatar ' + sizeClass + ' initials">' + escapeHtml(headerTheme.avatar_initials) + '</span>';
      }
      return '<span class="avatar ' + sizeClass + ' icon">' + ICONS.bot + '</span>';
    }

    function buildLauncherHtml(launcherTheme, settings, isOpen) {
      if (isOpen) return ICONS.closeFab;
      if (launcherTheme.icon_url) {
        return '<img class="launcher-icon" src="' + escapeAttr(launcherTheme.icon_url) + '" alt="">';
      }
      // Explicit theme.launcher.label (including "" / null) wins — empty means icon-only.
      var label = '';
      if (launcherTheme && Object.prototype.hasOwnProperty.call(launcherTheme, 'label')) {
        label = String(launcherTheme.label == null ? '' : launcherTheme.label).trim();
      } else {
        label = nonEmptyString(settings.launcher_label) || '';
      }
      if (launcherTheme.type !== 'icon' && label) {
        return '<span class="launcher-inner">' + ICONS.chat + '<span class="launcher-text">' + escapeHtml(label) + '</span></span>';
      }
      return ICONS.chat;
    }

    function waveformBarsSeed(url) {
      var seed = String(url || '').length;
      var bars = [];
      var i;
      for (i = 0; i < 30; i++) {
        var x = Math.sin(i * 0.7 + seed) * 0.5 + 0.5;
        bars.push(0.15 + x * 0.85);
      }
      return bars;
    }

    function createWidget() {
      var root = document.createElement('div');
      root.id = 'hasab-chatbot-root-' + widgetId;
      document.body.appendChild(root);

      var shadow = root.attachShadow({ mode: 'open' });
      var position = (config && config.position) || 'bottom-right';
      var theme = (config && config.theme) || {};
      var settings = (config && config.settings) || {};
      var features = settings.features || {};
      // TTS integration (disabled): widgetFeatures = { tts: features.tts === true };
      widgetFeatures = { tts: false };

      var primary = cssValue(theme.primary_color, '#3C6278');
      var launcherTheme = theme.launcher || {};
      var headerTheme = theme.header || {};
      var micTheme = theme.mic || {};
      var sendTheme = theme.send || {};
      var panelBackground = theme.panel_background || '#ffffff';
      var messageAreaBackground = theme.message_area_background || '#f5f5f5';
      var textColor = theme.text_color || '#111827';
      var botMessageBackground = theme.bot_message_background || '#ffffff';
      var botMessageTextColor = theme.bot_message_text_color || '#333';
      var userMessageBackground = theme.user_message_background || '#6F0001';
      var userMessageTextColor = theme.user_message_text_color || '#ffffff';
      var chipBackground = theme.chip_background || primary;
      var chipTextColor = theme.chip_text_color || primary;
      var borderColor = theme.border_color || '#e0e0e0';
      var fontFamily = theme.font_family || 'Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      var borderRadius = theme.border_radius || '18px';

      var panelWidthPx = clamp(parsePx(theme.panel_width, 380), 280, 520);
      var panelHeightPx = clamp(parsePx(theme.panel_height, 620), 400, 720);
      var launcherSizePx = clamp(parsePx(theme.launcher_size, 56), 40, 96);

      var adminWelcome = (config && config.welcome_message) || null;
      var title = settings.title || 'Chat Assistant';
      var chrome = resolveChrome(getLanguage(), settings, adminWelcome);
      var welcome = chrome.welcome;
      var subtitle = chrome.subtitle;
      var inputPlaceholder = chrome.placeholder;
      var thinkingLabel = chrome.thinking;
      var todayLabel = chrome.today;
      var languages = Array.isArray(settings.languages) && settings.languages.length ? settings.languages : [
        { code: 'en', label: 'English' },
        { code: 'am', label: 'Amharic' },
        { code: 'om', label: 'Afaan Oromoo' }
      ];
      languages = languages.map(function (lang) {
        return {
          code: toLangKey(lang.code),
          label: lang.label || lang.code
        };
      });
      var rawPrompts = settings.quick_prompts || [];
      var multiLangPrompts = !Array.isArray(rawPrompts) && typeof rawPrompts === 'object' ? rawPrompts : null;
      var legacyPrompts = Array.isArray(rawPrompts) && rawPrompts.length ? rawPrompts : null;
      var language = getLanguage();
      var resolvedAdminPrompts = resolvePromptsForLang(rawPrompts, language);
      var quickPrompts = resolvedAdminPrompts || chrome.prompts;
      var showLanguageSelector = settings.show_language_selector !== false && features.language_selector !== false;
      var showAudio = features.audio_upload === true;
      var side = position.indexOf('left') >= 0 ? 'left' : 'right';
      var vertical = position.indexOf('top') >= 0 ? 'top' : 'bottom';
      var edgeInset = 24;
      var panelOffset = edgeInset + launcherSizePx + 8;
      var launcherBackground = launcherTheme.background_color || primary;
      var launcherTextColor = launcherTheme.text_color || '#ffffff';
      var mutedText = '#999';
      var primarySoftBg = hexWithAlpha(primary, '18');
      var primarySoftBorder = hexWithAlpha(primary, '40');
      var primaryGradient = 'linear-gradient(135deg,' + primary + ' 0%,' + hexWithAlpha(primary, 'bb') + ' 100%)';

      var messages = [];
      var isLoading = false;
      var isOpen = false;

      var languageOptions = languages.map(function (lang) {
        var selected = lang.code === language ? ' selected' : '';
        return '<option value="' + escapeHtml(lang.code) + '"' + selected + '>' + escapeHtml(lang.label || lang.code) + '</option>';
      }).join('');

      shadow.innerHTML = [
        '<style>',
        ':host{all:initial;font-family:' + cssValue(fontFamily, 'Inter,system-ui,sans-serif') + '}',
        '@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}',
        '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}.pulse{animation:pulse 1.2s ease-in-out infinite}',
        '@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}',
        '.wrap{position:fixed;z-index:2147483647;color:#333;font-family:inherit}',
        '.panel{display:none;flex-direction:column;position:fixed;overflow:hidden;background:' + cssValue(panelBackground, '#fff') + ';border:1px solid ' + cssValue(borderColor, '#e0e0e0') + ';border-radius:' + cssValue(borderRadius, '18px') + ';box-shadow:0 20px 45px rgba(15,23,42,.22);',
        'width:min(' + panelWidthPx + 'px,calc(100vw - 32px));',
        'height:min(' + panelHeightPx + 'px,calc(100dvh - 120px));',
        '}',
        '@supports not (height:100dvh){.panel{height:min(' + panelHeightPx + 'px,calc(100vh - 120px))}}',
        '.panel.open{display:flex}',
        /* Header: panel_background — never primary fill (SPEC §4.1) */
        '.head{background:' + cssValue(panelBackground, '#fff') + ';color:' + cssValue(textColor, '#111827') + ';padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;border-bottom:1px solid ' + cssValue(borderColor, '#e0e0e0') + '}',
        '.brand{display:flex;align-items:center;gap:10px;min-width:0;flex:1}',
        '.avatar{border-radius:999px;object-fit:cover;display:inline-flex;align-items:center;justify-content:center;color:#fff;font:700 12px/1 inherit;flex:0 0 auto;overflow:hidden}',
        '.avatar.initials,.avatar.icon{background:' + primaryGradient + '}',
        '.avatar-sm{width:34px;height:34px}',
        '.avatar-md{width:26px;height:26px;font-size:9px}',
        '.avatar-lg{width:72px;height:72px;font-size:24px}',
        '.avatar.icon svg{display:block;color:#fff}',
        '.head-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}',
        '.title{font:700 15px/1.2 inherit;color:' + cssValue(textColor, '#111827') + '}',
        '.sub{font:400 12px/1.2 inherit;color:' + mutedText + ';margin-top:2px;display:flex;align-items:center;gap:4px}',
        '.dot{width:6px;height:6px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.35);flex-shrink:0}',
        'select{border:1px solid ' + primarySoftBorder + ';border-radius:10px;background:' + primarySoftBg + ';color:' + cssValue(primary, '#3C6278') + ';padding:6px 22px 6px 10px;font:600 11px/1 inherit;max-width:132px;appearance:none;cursor:pointer}',
        'select option{color:#111827;background:#fff}',
        '.select-wrap{position:relative}',
        '.select-wrap:after{content:"▾";position:absolute;right:8px;top:50%;transform:translateY(-50%);color:' + cssValue(primary, '#3C6278') + ';font-size:9px;font-weight:700;pointer-events:none}',
        '.icon-btn{width:28px;height:28px;border-radius:999px;background:transparent;color:' + mutedText + ';display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border:0;padding:0}',
        '.icon-btn:hover{background:#f3f4f6;color:' + cssValue(textColor, '#111827') + '}',
        '.icon-btn.hidden{display:none}',
        '.msgs{flex:1;overflow:auto;padding:16px;background:' + cssValue(messageAreaBackground, '#f5f5f5') + ';position:relative}',
        '.msgs.has-messages{padding:14px}',
        '.empty-state{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:32px 0 16px}',
        '.empty-state.hidden{display:none}',
        '.empty-name{font:700 20px/1.25 inherit;color:' + cssValue(textColor, '#111827') + '}',
        '.empty-sub{font:400 12px/1.3 inherit;color:' + mutedText + '}',
        '.today-divider{display:flex;align-items:center;gap:10px;width:100%;margin:12px 0 8px;color:' + mutedText + ';font:600 11px/1 inherit}',
        '.today-divider:before,.today-divider:after{content:"";flex:1;height:1px;background:' + cssValue(borderColor, '#e0e0e0') + '}',
        '.msg-row{display:flex;margin-bottom:12px;align-items:flex-end;gap:8px}',
        '.msg-row.user{justify-content:flex-end}',
        '.msg-row.bot{justify-content:flex-start}',
        '.msg-col{display:flex;flex-direction:column;gap:2px;max-width:76%}',
        '.msg-row.user .msg-col{align-items:flex-end}',
        '.msg-row.bot .msg-col{align-items:flex-start}',
        '.bubble-msg{padding:10px 12px;font:400 13px/1.5 inherit;word-break:break-word}',
        '.bubble-msg.user{background:' + cssValue(userMessageBackground, '#6F0001') + ';color:' + cssValue(userMessageTextColor, '#fff') + ';border-radius:16px;border-bottom-right-radius:4px}',
        '.bubble-msg.bot{background:' + cssValue(botMessageBackground, '#fff') + ';color:' + cssValue(botMessageTextColor, '#333') + ';border:1px solid ' + cssValue(borderColor, '#e0e0e0') + ';border-radius:16px;border-bottom-left-radius:4px}',
        '.bubble-msg.error{background:#fee2e2;color:#b42318;border:1px solid #fca5a5}',
        '.bubble-msg h2,.bubble-msg h3{font-weight:600;margin:8px 0 4px;font-size:inherit}',
        '.bubble-msg ul{margin:6px 0;padding-left:18px}',
        '.bubble-msg li{margin:3px 0}',
        '.msg-ts{font:400 10px/1 inherit;color:' + mutedText + '}',
        '.feedback-row{display:flex;gap:4px;margin-top:4px}',
        '.feedback-btn{border:0;background:none;padding:4px;cursor:pointer;border-radius:6px;color:' + mutedText + ';display:inline-flex;align-items:center;justify-content:center;transition:color .15s,background .15s}',
        '.feedback-btn:hover{background:' + cssValue(chipBackground, '#f0f0f0') + ';color:' + cssValue(primary, '#333') + '}',
        '.feedback-btn.active{color:' + cssValue(primary, '#333') + '}',
        '.spacer{width:26px;height:26px;flex-shrink:0}',
        '.chip-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:10px;width:100%}',
        '.chip{flex:1;border:0;background:' + cssValue(chipBackground, primary) + ';color:' + cssValue(chipTextColor, primary) + ';border-radius:999px;padding:8px 16px;font:600 12px/1.2 inherit;cursor:pointer;text-align:left}',
        '.chip:hover{filter:brightness(.97)}',
        '.typing-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:12px}',
        '.typing-bubble{padding:10px 12px;border-radius:16px;border-bottom-left-radius:4px;background:' + cssValue(botMessageBackground, '#fff') + ';border:1px solid ' + cssValue(borderColor, '#e0e0e0') + ';display:flex;align-items:center;gap:6px;color:' + mutedText + ';font:italic 13px/1 inherit}',
        '.typing-dots{display:inline-flex;gap:3px}.typing-dots span{width:5px;height:5px;border-radius:999px;background:#9ca3af;animation:bounce 1.2s infinite}.typing-dots span:nth-child(2){animation-delay:.2s}.typing-dots span:nth-child(3){animation-delay:.4s}',
        '.voice-player{display:flex;flex-direction:column;gap:6px;min-width:180px}',
        '.voice-controls{display:flex;align-items:center;gap:8px}',
        '.voice-play{width:32px;height:32px;border-radius:999px;border:0;background:rgba(255,255,255,.2);color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}',
        '.voice-bars{display:flex;align-items:center;gap:1px;flex:1;height:28px}',
        '.voice-bar{width:4px;border-radius:999px;background:rgba(255,255,255,.35);transition:background .1s}',
        '.voice-time{font:400 11px/1 inherit;opacity:.75;font-variant-numeric:tabular-nums}',
        '.input-area{border-top:1px solid ' + cssValue(borderColor, '#e0e0e0') + ';background:' + cssValue(panelBackground, '#fff') + ';flex-shrink:0;padding:12px}',
        '.status-strip{display:none;align-items:center;gap:8px;padding:8px 12px;margin:0 0 8px;border-radius:10px;font:600 11px/1 inherit}',
        '.status-strip.recording{display:flex;background:#fef2f2;color:#ef4444}',
        '.status-strip.processing{display:flex;background:#fffbeb;color:#d97706}',
        '.status-dot{width:8px;height:8px;border-radius:999px;background:#ef4444}.status-dot.pulse{animation:pulse 1s infinite}',
        /* Single full-width input pill; mic/send inside on the right (SPEC §4.5) */
        '.form{display:block;margin:0}',
        '.input-pill{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:8px 16px;border-radius:999px;background:' + cssValue(messageAreaBackground, '#f5f5f5') + ';border:1.5px solid ' + cssValue(borderColor, '#e0e0e0') + '}',
        '.rec-row{display:none;flex:1;align-items:center;gap:8px;min-width:0}',
        '.rec-row.active{display:flex}',
        '.rec-timer{font:600 12px/1 inherit;font-variant-numeric:tabular-nums;color:#ef4444}',
        '.rec-track{flex:1;height:4px;background:#fecaca;border-radius:999px}',
        'input.text-input{flex:1;min-width:0;border:0;border-radius:0;padding:4px 0;font:400 14px/1.3 inherit;outline:none;background:transparent;color:' + cssValue(textColor, '#111827') + '}',
        'input.text-input.hidden{display:none}',
        'input.text-input::placeholder{color:' + mutedText + '}',
        'button.action{border:0;border-radius:999px;cursor:pointer;font:600 14px/1 inherit;display:inline-flex;align-items:center;justify-content:center;gap:0;padding:0;flex-shrink:0}',
        '.mic{width:32px;height:32px;background:transparent;color:' + mutedText + '}',
        '.mic:hover{color:' + cssValue(textColor, '#111827') + ';background:#f3f4f6}',
        '.mic.recording{background:#ef4444;color:#fff}',
        '.mic.processing{background:#d97706;color:#fff}',
        '.mic.hidden,.send.hidden,.pause-btn.hidden{display:none!important}',
        '.send{width:32px;height:32px;background:' + cssValue(primary, '#3C6278') + ';color:#fff}',
        '.send:disabled{opacity:.4;cursor:not-allowed}',
        '.pause-btn{width:32px;height:32px;background:transparent;color:#f59e0b}',
        '.btn-icon{width:18px;height:18px;object-fit:contain;display:block}',
        '.bubble-btn{border-radius:999px;box-shadow:0 16px 34px rgba(15,23,42,.24);font-size:13px;padding:0;overflow:hidden;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:fixed;transition:transform .15s}',
        '.bubble-btn:hover{transform:scale(1.05)}',
        '.bubble-btn:active{transform:scale(.95)}',
        '.launcher-inner{display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:0 8px}',
        '.launcher-icon{width:22px;height:22px;object-fit:contain}',
        '.launcher-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 12px/1 inherit}',
        '</style>',
        '<div class="wrap">',
        '<section class="panel" aria-live="polite">',
        '<div class="head"><div class="brand">' + buildAvatarHtml(headerTheme, 'avatar-sm') + '<div><div class="title">' + escapeHtml(title) + '</div><div class="sub"><span class="dot"></span>' + escapeHtml(subtitle) + '</div></div></div>',
        '<div class="head-actions">',
        showLanguageSelector ? '<div class="select-wrap"><select class="lang">' + languageOptions + '</select></div>' : '',
        '<button class="icon-btn reset-btn hidden" type="button" aria-label="Reset chat" title="New chat">' + ICONS.reset + '</button>',
        '<button class="icon-btn close-btn" type="button" aria-label="Close chat">' + ICONS.close + '</button>',
        '</div></div>',
        '<div class="msgs"></div>',
        '<div class="input-area">',
        '<div class="status-strip recording"><span class="status-dot pulse"></span><span class="rec-label"></span></div>',
        '<div class="status-strip processing"><span>' + ICONS.spinner + '</span><span class="proc-label">' + escapeHtml(micTheme.processing_label || 'Transcribing…') + '</span></div>',
        '<form class="form">',
        '<div class="input-pill">',
        '<input class="text-input" autocomplete="off" placeholder="' + escapeHtml(inputPlaceholder) + '" />',
        '<div class="rec-row"><span class="status-dot pulse"></span><span class="rec-timer">0:00</span><div class="rec-track"></div></div>',
        '<button class="action pause-btn hidden" type="button" aria-label="Pause recording">' + ICONS.pause + '</button>',
        '<button class="action mic' + (showAudio ? '' : ' hidden') + '" type="button" aria-label="Record audio"></button>',
        '<button class="action send hidden" type="submit" aria-label="Send message" disabled></button>',
        '</div>',
        '</form>',
        '</div>',
        '</section>',
        '<button class="bubble-btn" type="button" aria-label="Open chat">' + buildLauncherHtml(launcherTheme, settings, false) + '</button>',
        '</div>'
      ].join('');

      var wrap = shadow.querySelector('.wrap');
      var panel = shadow.querySelector('.panel');
      var bubble = shadow.querySelector('.bubble-btn');
      var form = shadow.querySelector('.form');
      var input = shadow.querySelector('.text-input');
      var msgsEl = shadow.querySelector('.msgs');
      var languageSelect = shadow.querySelector('.lang');
      var micButton = shadow.querySelector('.mic');
      var pauseButton = shadow.querySelector('.pause-btn');
      var sendButton = shadow.querySelector('.send');
      var recRow = shadow.querySelector('.rec-row');
      var recTimerEl = shadow.querySelector('.rec-timer');
      var closeBtn = shadow.querySelector('.close-btn');
      var resetBtn = shadow.querySelector('.reset-btn');
      var recStrip = shadow.querySelector('.status-strip.recording');
      var procStrip = shadow.querySelector('.status-strip.processing');
      var recLabel = shadow.querySelector('.rec-label');
      var subEl = shadow.querySelector('.sub');

      function applyPosition() {
        panel.style.bottom = '';
        panel.style.top = '';
        panel.style.left = '';
        panel.style.right = '';
        bubble.style.bottom = '';
        bubble.style.top = '';
        bubble.style.left = '';
        bubble.style.right = '';
        bubble.style.width = launcherSizePx + 'px';
        bubble.style.height = launcherSizePx + 'px';
        bubble.style.background = cssValue(launcherBackground, primary);
        bubble.style.color = cssValue(launcherTextColor, '#fff');

        if (vertical === 'bottom') {
          bubble.style.bottom = edgeInset + 'px';
          panel.style.bottom = panelOffset + 'px';
        } else {
          bubble.style.top = edgeInset + 'px';
          panel.style.top = panelOffset + 'px';
        }
        if (side === 'right') {
          bubble.style.right = edgeInset + 'px';
          panel.style.right = edgeInset + 'px';
        } else {
          bubble.style.left = edgeInset + 'px';
          panel.style.left = edgeInset + 'px';
        }
      }

      applyPosition();

      function renderMicButton() {
        if (!micButton) return;
        micButton.className = 'action mic';
        if (micState === 'recording') micButton.className += ' recording pulse';
        else if (micState === 'processing') micButton.className += ' processing';

        var iconUrl = micState === 'recording'
          ? (micTheme.recording_icon_url || micTheme.icon_url)
          : micTheme.icon_url;

        if (micState === 'processing') {
          micButton.innerHTML = ICONS.spinner;
        } else if (iconUrl) {
          micButton.innerHTML = '<img class="btn-icon" src="' + escapeAttr(iconUrl) + '" alt="">';
        } else if (micState === 'recording') {
          micButton.innerHTML = ICONS.stop;
        } else {
          micButton.innerHTML = ICONS.mic;
        }
      }

      function renderSendButton() {
        if (!sendButton) return;
        if (isLoading) {
          sendButton.innerHTML = ICONS.spinner;
          sendButton.disabled = true;
          sendButton.classList.remove('hidden');
          return;
        }

        var hasText = !!input.value.trim();
        var recording = micState === 'recording';

        // Idle: mic OR send — mutually exclusive (SPEC §4.5)
        if (showAudio && !hasText && !recording && micState === 'idle') {
          sendButton.classList.add('hidden');
          return;
        }

        sendButton.classList.remove('hidden');
        sendButton.disabled = (!hasText && !recording) || micState === 'processing';

        if (sendTheme.icon_url) {
          sendButton.innerHTML = '<img class="btn-icon" src="' + escapeAttr(sendTheme.icon_url) + '" alt="">';
        } else {
          sendButton.innerHTML = ICONS.send;
        }
      }

      function updateInputButtons() {
        renderMicButton();
        renderSendButton();

        var hasText = !!input.value.trim();

        if (showAudio && micState === 'recording') {
          micButton.classList.remove('hidden');
          pauseButton.classList.remove('hidden');
          input.classList.add('hidden');
          recRow.classList.add('active');
          sendButton.classList.add('hidden');
        } else if (showAudio && micState === 'processing') {
          micButton.classList.remove('hidden');
          pauseButton.classList.add('hidden');
          input.classList.remove('hidden');
          recRow.classList.remove('active');
          sendButton.classList.add('hidden');
        } else if (showAudio && micState === 'idle' && !hasText) {
          // Ghost mic inside pill on the right; no separate left filled button
          micButton.classList.remove('hidden');
          pauseButton.classList.add('hidden');
          input.classList.remove('hidden');
          recRow.classList.remove('active');
          sendButton.classList.add('hidden');
        } else {
          // Has text (or mic disabled) → send only
          if (micButton) micButton.classList.add('hidden');
          pauseButton.classList.add('hidden');
          input.classList.remove('hidden');
          recRow.classList.remove('active');
        }
      }

      function updateStatusStrip() {
        recStrip.style.display = micState === 'recording' ? 'flex' : 'none';
        procStrip.style.display = micState === 'processing' ? 'flex' : 'none';
        if (micState === 'recording') {
          recLabel.textContent = 'Recording ' + fmtSecs(recSecs);
          recTimerEl.textContent = fmtSecs(recSecs);
        }
      }

      function setMicState(next) {
        micState = next;
        updateStatusStrip();
        updateInputButtons();
        input.disabled = micState !== 'idle' || isLoading;
        if (micState === 'recording') {
          input.placeholder = 'Listening…';
        } else if (micState === 'processing') {
          input.placeholder = micTheme.processing_label || 'Transcribing…';
        } else {
          input.placeholder = inputPlaceholder;
        }
      }

      function updateResetButton() {
        if (messages.length > 0) resetBtn.classList.remove('hidden');
        else resetBtn.classList.add('hidden');
      }

      function buildEmptyStateHtml() {
        var html = [
          '<div class="empty-state">',
          buildAvatarHtml(headerTheme, 'avatar-lg'),
          '<div class="empty-name">' + escapeHtml(title) + '</div>',
          '<div class="empty-sub">' + escapeHtml(subtitle) + '</div>',
          '<div class="today-divider">' + escapeHtml(todayLabel) + '</div>',
          '</div>',
          '<div class="msg-row bot"><span class="spacer"></span><div class="msg-col"><div class="bubble-msg bot">' + escapeHtml(welcome) + '</div></div></div>'
        ];

        if (features.quick_prompts !== false && quickPrompts.length > 0) {
          quickPrompts.forEach(function (prompt, idx) {
            var label = typeof prompt === 'string' ? prompt : (prompt.label || '');
            var value = typeof prompt === 'string' ? prompt : (prompt.prompt || prompt.value || label);
            if (!label || !value) return;
            var isLast = idx === quickPrompts.length - 1;
            html.push(
              '<div class="chip-row">' +
              (isLast ? buildAvatarHtml(headerTheme, 'avatar-md') : '<span class="spacer"></span>') +
              '<button class="chip" type="button" data-prompt="' + escapeAttr(value) + '">' + escapeHtml(label) + '</button>' +
              '</div>'
            );
          });
        }

        return html.join('');
      }

      function applyLanguageUI(code) {
        var resolved = resolveChrome(code, settings, adminWelcome);
        welcome = resolved.welcome;
        subtitle = resolved.subtitle;
        inputPlaceholder = resolved.placeholder;
        thinkingLabel = resolved.thinking;
        todayLabel = resolved.today;
        input.placeholder = inputPlaceholder;

        if (subEl) {
          subEl.innerHTML = '<span class="dot"></span>' + escapeHtml(subtitle);
        }

        // Admin multilingual map → pick for lang; legacy array stays fixed;
        // otherwise use built-in localized fallback prompts.
        if (multiLangPrompts) {
          quickPrompts = resolvePromptsForLang(multiLangPrompts, code) || resolved.prompts;
        } else if (legacyPrompts) {
          quickPrompts = legacyPrompts;
        } else {
          quickPrompts = resolved.prompts;
        }

        renderMessages();
      }

      function renderMessages() {
        var html = '';
        if (messages.length === 0 && !isLoading) {
          msgsEl.classList.remove('has-messages');
          html = buildEmptyStateHtml();
        } else {
          msgsEl.classList.add('has-messages');
          messages.forEach(function (msg) {
            html += renderMessageRow(msg);
          });
        }

        if (isLoading) {
          html += '<div class="typing-row">' + buildAvatarHtml(headerTheme, 'avatar-md') +
            '<div class="typing-bubble">' + escapeHtml(thinkingLabel) + '<span class="typing-dots"><span></span><span></span><span></span></span></div></div>';
        }

        msgsEl.innerHTML = html;
        bindChipHandlers();
        bindVoicePlayers();
        bindFeedbackButtons();
        msgsEl.scrollTop = msgsEl.scrollHeight;
        updateResetButton();
      }

      function renderMessageRow(msg) {
        var isUser = msg.role === 'user';
        var rowClass = 'msg-row ' + (isUser ? 'user' : 'bot');
        var bubbleClass = 'bubble-msg ' + (isUser ? 'user' : 'bot') + (msg.isError ? ' error' : '');
        var contentHtml = '';

        if (msg.isVoice && msg.audioUrl) {
          contentHtml = buildVoicePlayerHtml(msg.audioUrl) +
            (msg.content ? '<p class="voice-caption">' + escapeHtml(msg.content) + '</p>' : '');
        } else if (!isUser && !msg.isError) {
          // TTS integration (disabled): assistant Tigist voice player
          contentHtml = renderMarkdown(msg.content);
        } else {
          contentHtml = escapeHtml(msg.content);
        }

        var avatar = isUser ? '' : buildAvatarHtml(headerTheme, 'avatar-md');
        var leading = isUser ? '' : avatar;
        var trailing = isUser ? '' : '';

        var feedbackHtml = '';
        if (!isUser && !msg.isError) {
          var activeClass = msg.feedback === 'positive' ? ' active' : '';
          var activeClassNeg = msg.feedback === 'negative' ? ' active' : '';
          feedbackHtml = '<div class="feedback-row">' +
            '<button type="button" class="feedback-btn' + activeClass + '" data-rating="positive" aria-label="Good response">' + ICONS.thumbUp + '</button>' +
            '<button type="button" class="feedback-btn' + activeClassNeg + '" data-rating="negative" aria-label="Bad response">' + ICONS.thumbDown + '</button>' +
            '</div>';
        }

        return '<div class="' + rowClass + '">' +
          (isUser ? '' : leading) +
          '<div class="msg-col"><div class="' + bubbleClass + '">' + contentHtml + '</div>' +
          feedbackHtml +
          '<span class="msg-ts">' + fmtTime(msg.ts) + '</span></div>' +
          trailing +
          '</div>';
      }

      function buildVoicePlayerHtml(audioUrl) {
        var bars = waveformBarsSeed(audioUrl);
        var barsHtml = bars.map(function (h) {
          return '<div class="voice-bar" data-h="' + h + '" style="height:' + Math.round(h * 100) + '%"></div>';
        }).join('');

        return '<div class="voice-player" data-audio-url="' + escapeAttr(audioUrl) + '">' +
          '<div class="voice-controls">' +
          '<button type="button" class="voice-play" aria-label="Play">' + ICONS.play + '</button>' +
          '<div class="voice-bars">' + barsHtml + '</div>' +
          '<span class="voice-time">0:00</span>' +
          '</div></div>';
      }

      function bindVoicePlayers() {
        shadow.querySelectorAll('.voice-player').forEach(function (player) {
          if (player._bound) return;
          player._bound = true;
          var url = player.getAttribute('data-audio-url');
          var audio = new Audio(url);
          var playBtn = player.querySelector('.voice-play');
          var timeEl = player.querySelector('.voice-time');
          var barEls = player.querySelectorAll('.voice-bar');
          var playing = false;
          var duration = 0;

          audio.addEventListener('loadedmetadata', function () {
            duration = audio.duration || 0;
            timeEl.textContent = fmtSecs(Math.floor(duration));
          });

          audio.addEventListener('timeupdate', function () {
            var progress = duration ? audio.currentTime / duration : 0;
            barEls.forEach(function (bar, i) {
              bar.style.background = (i / barEls.length) <= progress ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)';
            });
            timeEl.textContent = fmtSecs(Math.floor(audio.currentTime));
          });

          audio.addEventListener('ended', function () {
            playing = false;
            playBtn.innerHTML = ICONS.play;
            timeEl.textContent = fmtSecs(Math.floor(duration));
            barEls.forEach(function (bar) { bar.style.background = 'rgba(255,255,255,.35)'; });
          });

          playBtn.addEventListener('click', function () {
            if (playing) {
              audio.pause();
              playing = false;
              playBtn.innerHTML = ICONS.play;
            } else {
              audio.play();
              playing = true;
              playBtn.innerHTML = ICONS.pause;
            }
          });
        });
      }

      function bindChipHandlers() {
        shadow.querySelectorAll('.chip').forEach(function (chip) {
          if (chip._bound) return;
          chip._bound = true;
          chip.addEventListener('click', function () {
            var prompt = chip.getAttribute('data-prompt');
            if (prompt) sendAndRender(prompt);
          });
        });
      }

      function bindFeedbackButtons() {
        shadow.querySelectorAll('.feedback-btn').forEach(function (btn) {
          if (btn._bound) return;
          btn._bound = true;
          btn.addEventListener('click', function () {
            var rating = btn.getAttribute('data-rating');
            var row = btn.closest('.feedback-row');
            var botMessages = messages.filter(function (m) { return m.role === 'assistant'; });
            var msgIdx = Array.from(shadow.querySelectorAll('.feedback-row')).indexOf(row);
            if (msgIdx >= 0 && botMessages[msgIdx]) {
              var alreadyActive = botMessages[msgIdx].feedback === rating;
              botMessages[msgIdx].feedback = alreadyActive ? null : rating;
              if (!alreadyActive) {
                submitFeedback(rating);
              }
              renderMessages();
            }
          });
        });
      }

      function setLoading(loading) {
        isLoading = loading;
        renderMessages();
        updateInputButtons();
        input.disabled = loading || micState !== 'idle';
      }

      function addMessage(text, role, options) {
        options = options || {};
        messages.push({
          role: role,
          content: text,
          isError: !!options.isError,
          isVoice: !!options.isVoice,
          // playTts: !!options.playTts,
          // replyLang: options.replyLang || null,
          audioUrl: options.isVoice && options.audioUrl ? options.audioUrl : null,
          ts: new Date()
        });
        renderMessages();
      }

      function resetChat() {
        messages = [];
        clearHistory();
        renderMessages();
      }

      function openPanel() {
        isOpen = true;
        panel.classList.add('open');
        bubble.innerHTML = buildLauncherHtml(launcherTheme, settings, true);
        bubble.setAttribute('aria-label', 'Close chat');
        input.focus();
        updateLangContext(language);
      }

      function closePanel() {
        isOpen = false;
        panel.classList.remove('open');
        bubble.innerHTML = buildLauncherHtml(launcherTheme, settings, false);
        bubble.setAttribute('aria-label', 'Open chat');
      }

      function languageLabel(code) {
        var i;
        for (i = 0; i < languages.length; i++) {
          if (languages[i].code === code) return languages[i].label || code;
        }
        return code;
      }

      function langInstruction(code) {
        return chatLanguageInstruction(code);
      }

      function updateLangContext(code) {
        // Language is sent on each chat payload; backend injects the system instruction.
        // Portal /chat/context requires admin auth and is not available to widget sessions.
        setLanguage(code);
        return Promise.resolve();
      }

      applyLanguageUI(language);
      setMicState('idle');

      bubble.addEventListener('click', function () {
        if (isOpen) closePanel();
        else openPanel();
      });

      closeBtn.addEventListener('click', closePanel);
      resetBtn.addEventListener('click', resetChat);

      input.addEventListener('input', updateInputButtons);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (micState === 'recording') {
          stopRecording(true);
          return;
        }
        var text = input.value.trim();
        if (!text || isLoading || micState !== 'idle') return;
        input.value = '';
        updateInputButtons();
        sendAndRender(text);
      });

      if (languageSelect) {
        languageSelect.addEventListener('change', function () {
          language = toLangKey(languageSelect.value);
          setLanguage(language);
          updateLangContext(language);
          applyLanguageUI(language);
          // Fresh conversation when the visitor switches language.
          messages = [];
          clearHistory();
          renderMessages();
        });
      }

      if (micButton) {
        micButton.addEventListener('click', function () {
          if (micState === 'processing' || isLoading) return;
          if (micState === 'recording') stopRecording(false);
          else startRecording();
        });
      }

      if (pauseButton) {
        pauseButton.addEventListener('click', function () {
          if (!mediaRecorder || micState !== 'recording') return;
          if (recPaused) {
            mediaRecorder.resume();
            recPaused = false;
            pauseButton.innerHTML = ICONS.pause;
            recTimer = setInterval(function () {
              recSecs += 1;
              updateStatusStrip();
            }, 1000);
          } else {
            mediaRecorder.pause();
            recPaused = true;
            pauseButton.innerHTML = ICONS.play;
            if (recTimer) { clearInterval(recTimer); recTimer = null; }
          }
        });
      }

      function sendAndRender(text, voiceOptions) {
        voiceOptions = voiceOptions || {};
        // var replyLang = toLangKey(language);
        // var wantTts = shouldRequestTts(replyLang);
        addMessage(text, 'user', { isVoice: voiceOptions.isVoice, audioUrl: voiceOptions.audioUrl });
        setLoading(true);
        sendMessage(text, language).then(function (result) {
          setLoading(false);
          var content = (result && result.content) || (typeof result === 'string' ? result : null);
          addMessage(content || 'No response received.', 'assistant', {
            // playTts: wantTts,
            // replyLang: replyLang,
            // audioUrl: wantTts && result && result.audioUrl ? result.audioUrl : null
          });
        }).catch(function () {
          setLoading(false);
          addMessage('Unable to connect to the service. Please try again.', 'assistant', { isError: true });
          clearSession();
        });
      }

      var activeStream = null;

      function startRecording() {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
          addMessage('Audio recording is not supported in this browser.', 'assistant', { isError: true });
          return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          activeStream = stream;
          var mimeType = '';
          var candidates = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4'
          ];
          var i;
          for (i = 0; i < candidates.length; i++) {
            if (MediaRecorder.isTypeSupported(candidates[i])) {
              mimeType = candidates[i];
              break;
            }
          }

          mediaRecorder = mimeType
            ? new MediaRecorder(stream, { mimeType: mimeType })
            : new MediaRecorder(stream);
          audioChunks = [];
          recPaused = false;

          mediaRecorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) audioChunks.push(event.data);
          };

          mediaRecorder.onstop = function () {
            stream.getTracks().forEach(function (track) { track.stop(); });
            activeStream = null;
            if (recTimer) { clearInterval(recTimer); recTimer = null; }
            setMicState('processing');

            var recordedType = (mediaRecorder && mediaRecorder.mimeType) || mimeType || 'audio/webm';
            var baseType = String(recordedType).split(';')[0].trim() || 'audio/webm';
            var blob = new Blob(audioChunks, { type: baseType });

            transcribeAudio(blob, baseType).then(function (result) {
              setMicState('idle');
              recSecs = 0;
              if (result.text) {
                sendAndRender(result.text, { isVoice: true, audioUrl: result.audioUrl });
              }
            }).catch(function () {
              setMicState('idle');
              recSecs = 0;
              addMessage('Could not transcribe audio. Please try typing instead.', 'assistant', { isError: true });
            });
          };

          mediaRecorder.start(1000);
          recSecs = 0;
          recTimer = setInterval(function () {
            if (!recPaused) {
              recSecs += 1;
              updateStatusStrip();
            }
          }, 1000);
          setMicState('recording');
        }).catch(function () {
          setMicState('idle');
          addMessage('Microphone access denied. Please allow mic access or type your message.', 'assistant', { isError: true });
        });
      }

      function stopRecording(andSend) {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
        mediaRecorder.stop();
        if (andSend) {
          // onstop handler submits transcription
        }
      }
    }

    function transcribeAudio(blob, mimeType, sessionRetried) {
      var lang = getLanguage();
      var prepare = String(mimeType || blob.type || '').toLowerCase().indexOf('wav') >= 0
        ? Promise.resolve({ blob: blob, mime: 'audio/wav', name: 'recording.wav' })
        : toWav(blob).then(function (wavBlob) {
          return { blob: wavBlob, mime: 'audio/wav', name: 'recording.wav' };
        }).catch(function () {
          var baseType = String(mimeType || blob.type || 'audio/webm').split(';')[0].trim().toLowerCase();
          var extension = 'webm';
          var uploadType = baseType || 'audio/webm';
          if (baseType.indexOf('ogg') >= 0) { extension = 'ogg'; uploadType = 'audio/ogg'; }
          else if (baseType.indexOf('mp4') >= 0 || baseType.indexOf('m4a') >= 0) {
            extension = 'mp4';
            uploadType = 'audio/mp4';
          }
          return { blob: blob, mime: uploadType, name: 'recording.' + extension };
        });

      return prepare.then(function (prepared) {
        return ensureSession().then(function (token) {
          var controller = new AbortController();
          var timeout = setTimeout(function () { controller.abort(); }, 30000);

          var formData = new FormData();
          formData.append('audio', new File([prepared.blob], prepared.name, { type: prepared.mime }));
          formData.append('translate', 'false');
          formData.append('summarize', 'false');
          formData.append('is_meeting', 'false');
          formData.append('language', sttLang(lang));
          formData.append('source_language', sttLang(lang));

          return fetch(apiBaseUrl + '/api/v1/upload-audio', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token,
              'X-Visitor-Session-Id': visitorSessionId(),
              Accept: 'application/json'
            },
            body: formData,
            signal: controller.signal
          }).then(function (response) {
            clearTimeout(timeout);
            return response.text().then(function (text) {
              var json;
              try { json = text ? JSON.parse(text) : {}; } catch (e) { throw new Error('PARSE'); }
              if (!response.ok) {
                var err = new Error(json.message || 'Upload failed');
                err.status = response.status;
                throw err;
              }
              var transcription = json.data && json.data.transcription;
              if (typeof transcription === 'object' && transcription !== null) transcription = transcription.text;
              transcription = transcription || json.transcription;
              if (!transcription) throw new Error('No transcription returned.');
              var audioUrl = URL.createObjectURL(prepared.blob);
              return { text: String(transcription).trim(), audioUrl: audioUrl };
            });
          });
        });
      }).catch(function (err) {
        if (!sessionRetried && isSessionError(err)) {
          return refreshSession().then(function () {
            return transcribeAudio(blob, mimeType, true);
          });
        }
        throw err;
      });
    }

    loadConfig().then(function () {
      return ensureSession();
    }).then(createWidget).catch(function (error) {
      if (window.console) console.warn('Hasab chatbot failed to load:', error.message || error);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
