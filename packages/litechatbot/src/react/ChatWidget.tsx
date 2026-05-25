import { useState, useRef, useEffect, useMemo, type ReactElement } from "react";
import type { BusinessConfig, Message } from "../core/types.js";
import { ChatBot } from "../client/chatbot.js";
import type { ProviderConfig } from "../client/types.js";

export interface ChatWidgetProps {
  /** Business config — name, services, hours, area, policies. */
  business: BusinessConfig;
  /** Provider chain + API keys. */
  providers: ProviderConfig;
  /** Optional theme overrides. */
  theme?: {
    primary?: string;
    background?: string;
    text?: string;
  };
  /** Initial greeting (defaults to "Hi! How can we help?"). */
  greeting?: string;
  /** Show "Powered by litechatbot" footer (default true). Free tier marker. */
  showBranding?: boolean;
  /** Position of the launcher bubble. */
  position?: "bottom-right" | "bottom-left";
}

interface ChatMessage extends Message {
  id: string;
  ts: number;
}

const DEFAULT_THEME = {
  primary: "#0f172a",
  background: "#ffffff",
  text: "#0f172a"
};

const BOLT = "⚡";

export function ChatWidget(props: ChatWidgetProps): ReactElement {
  const {
    business,
    providers,
    theme: themeOverrides,
    greeting = `Hi! I'm here for ${business.name}. How can we help?`,
    showBranding = true,
    position = "bottom-right"
  } = props;

  const theme = { ...DEFAULT_THEME, ...themeOverrides };
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "g0", role: "assistant", content: greeting, ts: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bot = useMemo(() => new ChatBot({ business, providers }), [business, providers]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(): Promise<void> {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const history: Message[] = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await bot.reply(text, { history });
      setMessages((prev) => [...prev, { id: `a${Date.now()}`, role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { id: `e${Date.now()}`, role: "assistant", content: `Sorry — something went wrong. (${errMsg})`, ts: Date.now() }]);
    } finally {
      setSending(false);
    }
  }

  const launcherPos = position === "bottom-left" ? { left: 20 } : { right: 20 };
  const panelPos = position === "bottom-left" ? { left: 20 } : { right: 20 };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 20,
            ...launcherPos,
            width: 56,
            height: 56,
            borderRadius: 14,
            background: theme.primary,
            color: "#fff",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 99999
          }}
        >
          {BOLT}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat"
          style={{
            position: "fixed",
            bottom: 20,
            ...panelPos,
            width: 360,
            maxWidth: "calc(100vw - 40px)",
            height: 520,
            maxHeight: "calc(100vh - 40px)",
            background: theme.background,
            color: theme.text,
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "system-ui, -apple-system, sans-serif",
            zIndex: 99999
          }}
        >
          <header style={{
            padding: "12px 16px",
            background: theme.primary,
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <strong>{business.name}</strong>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}
            >
              ×
            </button>
          </header>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.role === "user" ? theme.primary : "#f1f5f9",
                  color: m.role === "user" ? "#fff" : theme.text,
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap"
                }}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", padding: "8px 12px", color: "#94a3b8", fontSize: 13 }}>
                typing…
              </div>
            )}
          </div>

          <div style={{ display: "flex", padding: 10, borderTop: "1px solid #e2e8f0", gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              placeholder="Type a message…"
              disabled={sending}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: theme.primary,
                color: "#fff",
                border: "none",
                cursor: sending ? "default" : "pointer",
                opacity: sending || !input.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>

          {showBranding && (
            <a
              href="https://github.com/agents-io/litechatbot"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
                textDecoration: "none",
                borderTop: "1px solid #f1f5f9"
              }}
            >
              {BOLT} Powered by litechatbot
            </a>
          )}
        </div>
      )}
    </>
  );
}
