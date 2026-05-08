import { useCallback, useEffect, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, PhoneOff, Loader2 } from "lucide-react";

const TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/baerbock-realtime-token`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const STORE_AGENT = "baerbock-agent-id";

export default function BaerbockLiveMode({ onClose }: { onClose: () => void }) {
  const [agentId, setAgentId] = useState<string>(() => {
    try { return localStorage.getItem(STORE_AGENT) || ""; } catch { return ""; }
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onError: (e: any) => setError(typeof e === "string" ? e : e?.message || "Verbindung fehlgeschlagen"),
  });

  useEffect(() => {
    try { localStorage.setItem(STORE_AGENT, agentId); } catch {}
  }, [agentId]);

  const start = useCallback(async () => {
    setError(null);
    if (!agentId.trim()) { setError("Bitte Agent-ID eingeben."); return; }
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ agentId: agentId.trim() }),
      });
      const data = await r.json();
      if (!r.ok || !data?.token) throw new Error(data?.error || "Kein Token erhalten");
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (e: any) {
      setError(e?.message || "Konnte Live-Modus nicht starten.");
    } finally {
      setConnecting(false);
    }
  }, [agentId, conversation]);

  const stop = useCallback(async () => {
    try { await conversation.endSession(); } catch {}
  }, [conversation]);

  const status = conversation.status;
  const isConnected = status === "connected";
  const isSpeaking = (conversation as any).isSpeaking;

  return (
    <div className="border-t border-white/5 bg-black/40">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Live-Modus — Sprich mit der Bot:in</div>
          <button onClick={onClose} className="text-xs text-white/50 hover:text-white/80">Schließen</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="ElevenLabs Agent-ID (aus deinem ElevenLabs Dashboard)"
            disabled={isConnected}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[hsl(var(--baerbock-accent)/0.5)]"
          />
          {!isConnected ? (
            <button
              onClick={start}
              disabled={connecting || !agentId.trim()}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--baerbock-accent))] text-black font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {connecting ? <Loader2 className="animate-spin" size={16} /> : <Mic size={16} />}
              {connecting ? "Verbinde…" : "Anrufen"}
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-semibold text-sm flex items-center gap-2"
            >
              <PhoneOff size={16} /> Auflegen
            </button>
          )}
        </div>
        <div className="text-xs text-white/50">
          {isConnected
            ? isSpeaking ? "🎙️ Spricht gerade …" : "🎧 Hört zu — sprich einfach los."
            : "Tipp: Erstelle einen Agent in elevenlabs.io → Conversational AI, kopiere die Agent-ID hier rein."}
        </div>
        {error && <div className="text-xs text-red-300">{error}</div>}
      </div>
    </div>
  );
}
