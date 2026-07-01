"use client";

import type { WidgetConfig } from "../types/widget.types";

interface WidgetPreviewProps {
  config: WidgetConfig;
}

const FAQ_PILLS = ["How to register?", "Check status", "Contact us"];

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const { primary_color, user_message_color, bot_name, welcome_message } = config;
  const userBubbleBg = user_message_color || primary_color;

  return (
    <div className="relative rounded-xl bg-muted/40 border min-h-[420px] flex items-end justify-end p-4 overflow-hidden select-none">
      {/* Chat panel */}
      <div
        className="w-[224px] rounded-2xl overflow-hidden shadow-xl border border-gray-200"
        style={{ background: "white" }}
      >
        {/* ── Header ── */}
        <div
          className="px-3 py-2.5 flex items-center justify-between gap-2"
          style={{
            background: `linear-gradient(135deg, ${primary_color} 0%, ${primary_color}bb 100%)`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-white text-[11px] font-semibold leading-tight truncate">
                {bot_name || "Hasab AI Chat"}
              </span>
              <span className="flex items-center gap-1 mt-0.5 text-white/90 text-[9px] leading-tight">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#22c55e", boxShadow: "0 0 0 2px rgba(34,197,94,0.35)" }}
                />
                Online
              </span>
            </div>
          </div>
          {/* Language pill mock */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.5)" }}
            >
              EN ▾
            </span>
            <span
              className="text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              ✕
            </span>
          </div>
        </div>

        {/* ── FAQ Quick Actions Strip ── */}
        <div className="px-2 py-1.5 border-b bg-white flex gap-1 flex-wrap">
          {FAQ_PILLS.map((q) => (
            <span
              key={q}
              className="text-[8.5px] px-1.5 py-0.5 rounded-full border text-gray-500 border-gray-300 whitespace-nowrap cursor-pointer hover:border-gray-400 transition-colors"
            >
              {q}
            </span>
          ))}
        </div>

        {/* ── Messages Area ── */}
        <div className="p-2.5 space-y-2 min-h-[140px]" style={{ background: "#f5f5f5" }}>
          {/* Welcome (assistant) */}
          <div
            className="text-[10px] text-gray-700 rounded-lg px-2.5 py-1.5 shadow-sm max-w-[85%] leading-relaxed"
            style={{
              background: "white",
              border: "1px solid #e0e0e0",
              borderBottomLeftRadius: "2px",
            }}
          >
            {welcome_message || "Hello! How can I help you today?"}
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div
              className="text-[10px] text-white rounded-lg px-2.5 py-1.5 max-w-[80%] leading-relaxed"
              style={{
                background: userBubbleBg,
                borderBottomRightRadius: "2px",
              }}
            >
              How does this work?
            </div>
          </div>

          {/* Assistant reply */}
          <div
            className="text-[10px] text-gray-700 rounded-lg px-2.5 py-1.5 shadow-sm max-w-[85%] leading-relaxed"
            style={{
              background: "white",
              border: "1px solid #e0e0e0",
              borderBottomLeftRadius: "2px",
            }}
          >
            Just ask me anything!
          </div>
        </div>

        {/* ── Input Area ── */}
        <div className="px-2.5 py-2 border-t bg-white flex items-center gap-1.5">
          {/* Mic button */}
          <button
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{ border: `2px solid ${primary_color}`, color: primary_color }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
            </svg>
          </button>

          {/* Text input stub */}
          <div className="flex-1 h-5 rounded-full bg-gray-100 border border-gray-200" />

          {/* Send button */}
          <button
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: primary_color }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Launcher FAB ── */}
      <div
        className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: primary_color }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
