import { useEffect, useRef, useState } from "react";
import { Send, Volume2, VolumeX, RotateCcw, Loader2, User, UserX, Mic } from "lucide-react";
import BaerbockAvatar from "@/components/BaerbockAvatar";
import BaerbockLiveMode from "@/components/BaerbockLiveMode";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const STORAGE_KEY = "baerbock-bot-history-v1";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/baerbock-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/baerbock-tts`;
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
  const [ttsOn, setTtsOn] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [avatarOn, setAvatarOn] = useState(true);
  const [mouth, setMouth] = useState(0);
  const VOICE_OPTIONS = [
    { key: "matilda", label: "Matilda — warm" },
    { key: "lily", label: "Lily — energisch" },
    { key: "sarah", label: "Sarah — sanft" },
    { key: "alice", label: "Alice — bestimmt" },
    { key: "jessica", label: "Jessica — dramatisch" },
    { key: "laura", label: "Laura — freundlich" },
  ];
  const [voice, setVoice] = useState<string>(() => {
    try { return localStorage.getItem("baerbock-voice") || "matilda"; } catch { return "matilda"; }
  });
  useEffect(() => { try { localStorage.setItem("baerbock-voice", voice); } catch {} }, [voice]);
  const [customVoiceId, setCustomVoiceId] = useState<string>(() => {
    try { return localStorage.getItem("baerbock-voice-id") || ""; } catch { return ""; }
  });
  useEffect(() => { try { localStorage.setItem("baerbock-voice-id", customVoiceId); } catch {} }, [customVoiceId]);
  const [liveMode, setLiveMode] = useState(false);
  // streamingText: the raw text currently being received from server (full so far)
  const [streamRaw, setStreamRaw] = useState("");
  // visibleLen: how many chars of streamRaw are revealed via typewriter
  const [visibleLen, setVisibleLen] = useState(0);
  const streamingId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ttsOnRef = useRef(ttsOn);
  ttsOnRef.current = ttsOn;

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

  // Auto-scroll — instant during streaming so user always sees the latest letters
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isStreaming = !!streamRaw;
    el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, streamRaw, visibleLen]);

  // Typewriter reveal — Buchstabe für Buchstabe
  useEffect(() => {
    if (visibleLen >= streamRaw.length) return;
    const id = setTimeout(() => setVisibleLen((v) => Math.min(streamRaw.length, v + 1)), TYPE_SPEED);
    return () => clearTimeout(id);
  }, [streamRaw, visibleLen]);

  function stopMouthLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setMouth(0);
  }

  function startMouthLoop() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      // RMS around 128 midpoint
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      // Scale and smooth
      const target = Math.min(1, rms * 3.2);
      setMouth((prev) => prev + (target - prev) * 0.45);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function browserSpeak(text: string, msgId: string) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) { setSpeakingId(null); return; }
      synth.cancel();
      const clean = text.replace(/\[\[(.*?)\]\]/g, "$1");
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "de-DE";
      u.rate = 1.05;
      u.pitch = 1.25;
      const voices = synth.getVoices();
      const de = voices.find((v) => v.lang?.startsWith("de") && /female|frau|anna|petra|katja/i.test(v.name))
        || voices.find((v) => v.lang?.startsWith("de"));
      if (de) u.voice = de;
      // Fake mouth animation since we have no analyser
      let t = 0;
      const fake = () => {
        t += 0.12;
        setMouth(0.35 + Math.abs(Math.sin(t * 6)) * 0.5);
        rafRef.current = requestAnimationFrame(fake);
      };
      rafRef.current = requestAnimationFrame(fake);
      u.onend = () => { stopMouthLoop(); setSpeakingId((cur) => (cur === msgId ? null : cur)); };
      u.onerror = () => { stopMouthLoop(); setSpeakingId(null); };
      setSpeakingId(msgId);
      synth.speak(u);
    } catch {
      stopMouthLoop();
      setSpeakingId(null);
    }
  }

  async function speak(text: string, msgId: string) {
    if (!ttsOnRef.current) return;
    try {
      setSpeakingId(msgId);
      const r = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ text, voice, voiceId: customVoiceId.trim() || undefined }),
      });
      if (!r.ok) throw new Error("tts");
      const ct = r.headers.get("Content-Type") || "";
      let audioUrl: string;
      if (ct.startsWith("audio/")) {
        const blob = await r.blob();
        audioUrl = URL.createObjectURL(blob);
      } else {
        const data = await r.json();
        if (data?.fallback || !data?.audioContent) {
          browserSpeak(text, msgId);
          return;
        }
        audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      }
      if (audioRef.current) { audioRef.current.pause(); }
      stopMouthLoop();
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      // Lip sync wiring
      try {
        if (!audioCtxRef.current) {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current!;
        if (ctx.state === "suspended") await ctx.resume();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = src;
        analyserRef.current = analyser;
      } catch (e) {
        // ignore — playback still works without lip sync
      }

      audio.onplay = () => startMouthLoop();
      audio.onended = () => {
        stopMouthLoop();
        setSpeakingId((cur) => (cur === msgId ? null : cur));
      };
      audio.onerror = () => { stopMouthLoop(); setSpeakingId(null); };
      await audio.play();
    } catch {
      stopMouthLoop();
      setSpeakingId(null);
    }
  }

  function stopSpeaking() {
    audioRef.current?.pause();
    audioRef.current = null;
    stopMouthLoop();
    setSpeakingId(null);
  }

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
      // Commit final message
      const id = streamingId.current ?? crypto.randomUUID();
      const finalMsg: Msg = { id, role: "assistant", content: assembled };
      setMessages((prev) => [...prev, finalMsg]);
      setStreamRaw("");
      setVisibleLen(0);
      streamingId.current = null;
      // TTS after the message is committed
      if (assembled.trim()) speak(assembled, id);
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
    stopSpeaking();
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function toggleTts() {
    setTtsOn((v) => {
      const nv = !v;
      if (!nv) stopSpeaking();
      return nv;
    });
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
      {/* Inline component styles + accent token */}
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
        .baerbock-pulse {
          box-shadow: 0 0 0 0 hsl(var(--baerbock-accent) / 0.7);
          animation: bb-pulse 1.4s infinite;
        }
        @keyframes bb-pulse {
          70% { box-shadow: 0 0 0 12px hsl(var(--baerbock-accent) / 0); }
          100% { box-shadow: 0 0 0 0 hsl(var(--baerbock-accent) / 0); }
        }
      `}</style>

      {/* Sticky Header + Avatar */}
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
              onClick={() => setAvatarOn((v) => !v)}
              title={avatarOn ? "Avatar ausblenden" : "Avatar einblenden"}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
              aria-label="Avatar umschalten"
            >
              {avatarOn ? <User size={18} /> : <UserX size={18} />}
            </button>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              title="Stimme wählen"
              aria-label="Stimme wählen"
              disabled={!!customVoiceId.trim()}
              className="hidden sm:block bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/10 focus:outline-none focus:border-[hsl(var(--baerbock-accent)/0.5)] disabled:opacity-40"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.key} value={v.key} className="bg-[hsl(230_30%_8%)]">
                  {v.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={customVoiceId}
              onChange={(e) => setCustomVoiceId(e.target.value)}
              placeholder="Voice-ID (optional)"
              title="Eigene ElevenLabs Voice-ID (überschreibt die Auswahl)"
              className="hidden md:block bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 placeholder-white/30 w-32 focus:outline-none focus:border-[hsl(var(--baerbock-accent)/0.5)]"
            />
            <button
              onClick={() => setLiveMode((v) => !v)}
              title={liveMode ? "Live-Modus schließen" : "Live-Modus öffnen"}
              className={`p-2 rounded-lg transition-colors ${liveMode ? "bg-[hsl(var(--baerbock-accent)/0.2)] text-[hsl(var(--baerbock-accent))]" : "hover:bg-white/5 text-white/70 hover:text-white"}`}
              aria-label="Live-Modus umschalten"
            >
              <Mic size={18} />
            </button>
            <button
              onClick={toggleTts}
              title={ttsOn ? "Stimme aus" : "Stimme an"}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
              aria-label="Sprachausgabe umschalten"
            >
              {ttsOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
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

        {avatarOn && (
          <div className="border-t border-white/5 bg-gradient-to-b from-black/30 to-transparent">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className={`absolute inset-0 rounded-full ${speakingId ? "baerbock-pulse" : ""}`}
                  style={{ borderRadius: "9999px" }}
                />
                <BaerbockAvatar mouth={speakingId ? mouth : 0} speaking={!!speakingId} size={96} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight">ACAB-Bot — Annalena, [[stratigisch]] für euch da</div>
                <div className="text-xs text-white/60 mt-0.5 leading-snug">
                  {speakingId
                    ? "Spricht gerade — ganz [[ehrlich engagiert]]…"
                    : "Stell mir eine Frage — ich freu mich [[riesig riesig]]."}
                </div>
              </div>
            </div>
          </div>
        )}
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
                    <span className={`w-2 h-2 rounded-full bg-baerbock-accent ${speakingId === m.id ? "baerbock-pulse" : ""}`} />
                    <span className="text-[11px] uppercase tracking-wider text-white/40">ACAB-Bot</span>
                    {ttsOn && (
                      <button
                        onClick={() => (speakingId === m.id ? stopSpeaking() : speak(m.content, m.id))}
                        className="ml-auto text-white/40 hover:text-white/80 text-[11px] flex items-center gap-1"
                      >
                        {speakingId === m.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        {speakingId === m.id ? "Stop" : "Hören"}
                      </button>
                    )}
                  </div>
                )}
                <RenderMessage text={m.content} />
              </div>
            </div>
          ))}

          {/* Streaming bubble (typewriter) */}
          {streamRaw && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap baerbock-bubble-bot">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-baerbock-accent baerbock-pulse" />
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
            Satire · Sprachausgabe via ElevenLabs · Verhaspler sind hervorgehoben
          </div>
        </div>
      </div>
    </div>
  );
}
