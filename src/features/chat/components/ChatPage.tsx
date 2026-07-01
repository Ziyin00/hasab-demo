"use client";

import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWidgetConfig } from "@/features/widget/hooks/useWidget";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  ts: Date;
}

const QUICK_PROMPTS = [
  "What can you help me with?",
  "Tell me about your features",
  "How do I get started?",
];

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (escaped.match(/^### /)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 class="font-semibold mt-3 mb-1">${escaped.slice(4)}</h3>`;
    } else if (escaped.match(/^## /)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 class="font-semibold mt-3 mb-1">${escaped.slice(3)}</h2>`;
    } else if (escaped.match(/^# /)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 class="font-semibold mt-3 mb-1">${escaped.slice(2)}</h2>`;
    } else if (escaped.match(/^[\*\-] /)) {
      if (!inList) { html += '<ul class="list-disc pl-5 my-1">'; inList = true; }
      let item = escaped.slice(2)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      html += `<li>${item}</li>`;
    } else {
      if (inList && escaped.trim()) { html += "</ul>"; inList = false; }
      if (escaped.trim()) {
        let p = escaped
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");
        html += `<span>${p}</span><br>`;
      } else {
        html += "<br>";
      }
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPage() {
  const { data: config } = useWidgetConfig();
  const primaryColor = config?.primary_color ?? "#3C6278";
  const userMsgColor = config?.user_message_color ?? "#6F0001";
  const botName = config?.bot_name ?? "Hasab AI Chat";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: trimmed, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const r = await apiClient.post("/chat", {
        message: trimmed,
        model: "hasab-1-lite",
      });
      const content = r.data?.message?.content ?? r.data?.data?.message ?? "No response received.";
      setMessages((prev) => [...prev, { role: "assistant", content, ts: new Date() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to the service. Please check your connection and try again.",
          isError: true,
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => setMessages([]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{botName}</p>
            <p className="flex items-center gap-1.5 text-white/90 text-xs mt-0.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "#22c55e", boxShadow: "0 0 0 2px rgba(34,197,94,0.35)" }}
              />
              Online
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-white/80 hover:text-white hover:bg-white/20 gap-1.5 text-xs"
          onClick={reset}
          disabled={isEmpty}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>

      {/* ── Quick Actions Strip ── */}
      {isEmpty && (
        <div className="px-4 py-2.5 border-b bg-background flex gap-2 flex-wrap shrink-0">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ background: "#f5f5f5" }}
      >
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)` }}
            >
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 text-sm">Welcome to {botName}</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Type a message or pick a question above to start testing your chatbot.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div
                className={cn("rounded-lg px-3.5 py-2.5 text-sm leading-relaxed")}
                style={
                  msg.role === "user"
                    ? {
                        background: msg.isError ? "#fee2e2" : userMsgColor,
                        color: msg.isError ? "#b91c1c" : "white",
                        borderBottomRightRadius: "2px",
                      }
                    : {
                        background: msg.isError ? "#fee2e2" : "white",
                        color: msg.isError ? "#b91c1c" : "#333",
                        border: `1px solid ${msg.isError ? "#fca5a5" : "#e0e0e0"}`,
                        borderBottomLeftRadius: "2px",
                      }
                }
              >
                {msg.role === "assistant" && !msg.isError ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  msg.content
                )}
              </div>
              <span className={cn("text-[10px] text-gray-400", msg.role === "user" ? "text-right" : "text-left")}>
                {formatTime(msg.ts)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-lg px-3.5 py-2.5 text-sm"
              style={{
                background: "white",
                border: "1px solid #e0e0e0",
                borderBottomLeftRadius: "2px",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 italic">Thinking</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="px-4 py-3 border-t bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send)"
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50 max-h-32 leading-relaxed"
            style={{ ["--tw-ring-color" as string]: primaryColor } as React.CSSProperties}
            disabled={loading}
          />
          <Button
            size="icon"
            disabled={!input.trim() || loading}
            onClick={() => send(input)}
            className="rounded-full w-10 h-10 shrink-0 transition-opacity"
            style={{ background: primaryColor }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Shift+Enter for new line · messages use your saved contexts
        </p>
      </div>
    </div>
  );
}
