import { useEffect, useRef, useState } from "react";
import { Send, RotateCcw, Loader2 } from "lucide-react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const STORAGE_KEY = "baerbock-bot-history-v1";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/baerbock-chat`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const TYPE_SPEED = 28; // ms per char for typewriter reveal (Buchstabe für Buchstabe)

// Renders text with [[verhaspler]] highlighted
function RenderMessage({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[\[(.+)\]\]$/);
        if (m) {
          return (
            <span
              key={i}
              className="text-baerbock-accent font-medium"
              title="Verhaspler"
            >
              {m[1]}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export default function BaerbockBot() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamRaw, setStreamRaw] = useState("");
  const [visibleLen, setVisibleLen] = useState(0);
  const streamingId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const visibleLenRef = useRef(0);
  visibleLenRef.current = visibleLen;

  // Load history
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);
  // Persist
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isStreaming = !!streamRaw;
    el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, streamRaw, visibleLen]);

  // Typewriter reveal
  useEffect(() => {
    if (visibleLen >= streamRaw.length) return;
    const id = setTimeout(() => setVisibleLen((v) => Math.min(streamRaw.length, v + 1)), TYPE_SPEED);
    return () => clearTimeout(id);
  }, [streamRaw, visibleLen]);

  async function send() {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);
    setStreamRaw("");
    setVisibleLen(0);
    streamingId.current = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Zu viele Anfragen — kurz Pause, [[also]] gleich nochmal!");
        if (resp.status === 402) throw new Error("Kontingent leer.");
        throw new Error("Antwort konnte nicht geladen werden.");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assembled = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assembled += delta;
              setStreamRaw(assembled);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      // Wait for typewriter to catch up
      await new Promise<void>((resolve) => {
        const check = () => {
          if (visibleLenRef.current >= assembled.length) resolve();
          else setTimeout(check, TYPE_SPEED);
        };
        check();
      });
      const id = streamingId.current ?? crypto.randomUUID();
      const finalMsg: Msg = { id, role: "assistant", content: assembled };
      setMessages((prev) => [...prev, finalMsg]);
      setStreamRaw("");
      setVisibleLen(0);
      streamingId.current = null;
    } catch (e: any) {
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Oh nein, [[stratigisch]] ist da gerade was schief gelaufen — ${e?.message || "unbekannter Fehler"}.`,
      };
      setMessages((prev) => [...prev, errMsg]);
      setStreamRaw("");
      setVisibleLen(0);
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, hsl(280 35% 14% / 0.55), transparent 50%)," +
          "radial-gradient(circle at 80% 100%, hsl(190 40% 12% / 0.5), transparent 55%)," +
          "linear-gradient(180deg, hsl(230 25% 7%), hsl(230 30% 5%))",
        color: "hsl(220 30% 95%)",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      <style>{`
        :root { --baerbock-accent: 320 95% 70%; }
        .text-baerbock-accent { color: hsl(var(--baerbock-accent)); }
        .bg-baerbock-accent { background-color: hsl(var(--baerbock-accent)); }
        .ring-baerbock-accent { --tw-ring-color: hsl(var(--baerbock-accent)); }
        .baerbock-bubble-user {
          background: linear-gradient(135deg, hsl(220 30% 16%), hsl(220 30% 13%));
          border: 1px solid hsl(220 25% 25% / 0.6);
        }
        .baerbock-bubble-bot {
          background: linear-gradient(135deg, hsl(280 25% 13% / 0.85), hsl(230 30% 10% / 0.85));
          border: 1px solid hsl(var(--baerbock-accent) / 0.18);
          backdrop-filter: blur(8px);
        }
        .baerbock-caret::after {
          content: "▍"; opacity: 0.6; margin-left: 2px;
          animation: bb-blink 1s steps(2,start) infinite;
        }
        @keyframes bb-blink { to { visibility: hidden; } }
      `}</style>

      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5">
        <header>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full grid place-items-center text-lg font-semibold bg-gradient-to-br from-[hsl(320_95%_70%)] to-[hsl(280_60%_50%)] text-white shadow-lg">
              B
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold tracking-tight">ACAB-Bot</div>
              <div className="text-xs text-white/50 truncate">
                Annalena Charlotte Alma Baerbock — [[stratigisch]] für euch da
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Verlauf löschen"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
              aria-label="Chat löschen"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </header>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !streamRaw && (
            <div className="text-center py-16 text-white/60">
              <div className="text-3xl mb-3">✨</div>
              <p className="text-base">
                Hallo Kolleginnen und Kollegen! Ich bin sooo bereit für eure Fragen.
              </p>
              <p className="text-sm text-white/40 mt-2">
                Frag mich was — egal ob Politik, Cyber, Klima oder [[Talisbahn]].
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "baerbock-bubble-user" : "baerbock-bubble-bot"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-baerbock-accent" />
                    <span className="text-[11px] uppercase tracking-wider text-white/40">ACAB-Bot</span>
                  </div>
                )}
                <RenderMessage text={m.content} />
              </div>
            </div>
          ))}

          {streamRaw && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap baerbock-bubble-bot">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-baerbock-accent" />
                  <span className="text-[11px] uppercase tracking-wider text-white/40">ACAB-Bot</span>
                </div>
                <span className="baerbock-caret">
                  <RenderMessage text={streamRaw.slice(0, visibleLen)} />
                </span>
              </div>
            </div>
          )}

          {isLoading && !streamRaw && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 baerbock-bubble-bot flex items-center gap-2 text-white/60 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Sammle [[stratigisch]] meine Gedanken …
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-white/5 bg-black/30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 focus-within:border-[hsl(var(--baerbock-accent)/0.5)] transition-colors px-3 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Stell mir eine Frage, [[ganz ehrlich]] …"
              className="flex-1 min-w-0 bg-transparent resize-none focus:outline-none text-[15px] py-1.5 max-h-40 placeholder:text-white/40"
              disabled={isLoading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-baerbock-accent text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
              aria-label="Senden"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-[10px] text-white/30 text-center mt-2">
            Satire · Verhaspler sind hervorgehoben
          </div>
        </div>
      </div>
    </div>
  );
}
