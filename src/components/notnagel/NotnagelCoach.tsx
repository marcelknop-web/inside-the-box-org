/**
 * Notnagel-Assistent: kontextsensitive Hilfe am Wizard.
 * Zeigt je Schritt eine kurze Anleitung, die offenen Punkte aus der Qualitätsprüfung
 * und liefert auf Wunsch konkrete Formulierungsvorschläge für einzelne Felder.
 */
import { useEffect, useState } from "react";
import type { Finding } from "@/data/notnagelTypes";

export interface CoachTopic {
  id: string;
  /** Feldbezeichnung, wie sie im Formular steht */
  label: string;
  /** Was in das Feld gehört – geht als Vorgabe an die KI */
  help: string;
  /** aktueller Feldinhalt, damit die KI nicht am Bestehenden vorbei formuliert */
  current?: string;
  /** Übernehmen-Aktion; fehlt sie, kann der Vorschlag nur kopiert werden */
  apply?: (text: string) => void;
}

export interface CoachStep {
  title: string;
  intro: string;
  /** kurze, prüfbare Anleitung für diesen Schritt */
  steps: string[];
  /** typische Fehler */
  pitfalls?: string[];
}

interface Props {
  guide: CoachStep;
  topics: CoachTopic[];
  findings: Finding[];
  /** kompakter Kontext für die Vorschläge (Branche, Bereich, Prozesse …) */
  context: string;
  /** Trigger wird erst eingeblendet, wenn die Seite vollständig aufgebaut ist. */
  visible?: boolean;
}

interface Suggestion { text: string; warum: string }

export default function NotnagelCoach({ guide, topics, findings, context, visible = true }: Props) {
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [applied, setApplied] = useState<number | null>(null);

  // Beim Schrittwechsel Vorschläge verwerfen, damit keine fremden Inhalte stehen bleiben
  useEffect(() => {
    setTopicId(null); setSuggestions([]); setError(null); setApplied(null);
  }, [guide.title]);

  const topic = topics.find((t) => t.id === topicId) ?? null;
  const openFindings = findings.filter((f) => f.severity !== "hinweis");

  async function fetchSuggestions(t: CoachTopic) {
    setTopicId(t.id); setLoading(true); setError(null); setSuggestions([]); setApplied(null);
    try {
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/notnagel-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
        body: JSON.stringify({ field: t.label, help: t.help, current: t.current ?? "", context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vorschläge nicht verfügbar");
      setSuggestions(data.suggestions ?? []);
    } catch (e: any) {
      setError(e.message || "Vorschläge nicht verfügbar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Auslöser – erscheint immer als letztes Element einer Seite. */}
      <div
        className={`fixed bottom-[5.5rem] right-4 z-30 transition-opacity duration-500 sm:bottom-4 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="voxel-press voxel-bevel-gold flex items-center gap-2 rounded-none border-2 border-[#ffd23f] bg-[#f5b800] px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.1em] text-[#0a0e14] transition hover:bg-[#ffd23f]"
        >
          <span aria-hidden>💡</span>
          <span className="hidden sm:inline">{open ? "Hilfe schließen" : "Hilfe & Vorschläge"}</span>
          <span className="sm:hidden">{open ? "Schließen" : "Hilfe"}</span>

          {!open && openFindings.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-none bg-[#16202e] text-[#f5b800] text-[10px] font-bold">{openFindings.length}</span>
          )}
        </button>
      </div>

      {open && (
        <aside className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-20 z-40 w-full sm:w-[420px] max-h-[78vh] sm:max-h-[70vh] overflow-y-auto rounded-none sm:rounded-none border border-[#22303f] bg-[#16202e] shadow-voxel-lg">
          <div className="sticky top-0 bg-[#f5b800] text-[#080b10] px-4 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#bfeaf2]">Assistent</p>
              <p className="text-sm font-semibold">{guide.title}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#bfeaf2] text-lg leading-none">✕</button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-[13px] leading-relaxed text-[#d6e0ee]">{guide.intro}</p>

            <div>
              <p className="text-xs font-semibold text-[#f5b800] mb-1.5">So gehen Sie vor</p>
              <ol className="space-y-1.5">
                {guide.steps.map((sx, i) => (
                  <li key={i} className="text-[12px] leading-relaxed text-[#d6e0ee] flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-none bg-[#00bcd4]/20 text-[#bfeaf2] text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span>{sx}</span>
                  </li>
                ))}
              </ol>
            </div>

            {guide.pitfalls && guide.pitfalls.length > 0 && (
              <div className="rounded border border-amber-400/40 bg-amber-400/10 px-3 py-2">
                <p className="text-[11px] font-semibold text-amber-200 mb-1">Typische Fehler</p>
                <ul className="space-y-1">
                  {guide.pitfalls.map((p, i) => <li key={i} className="text-[11px] leading-relaxed text-amber-200">– {p}</li>)}
                </ul>
              </div>
            )}

            {openFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#f5b800] mb-1.5">Offene Punkte ({openFindings.length})</p>
                <ul className="space-y-1">
                  {openFindings.slice(0, 6).map((f, i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-[#d6e0ee]">
                      <span className={`inline-block w-1.5 h-1.5 rounded-none mr-1.5 align-middle ${f.severity === "blocker" ? "bg-[#ef4444]" : "bg-amber-400/100"}`} />
                      <strong>{f.where}:</strong> {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topics.length > 0 && (
              <div className="border-t border-[#22303f] pt-3">
                <p className="text-xs font-semibold text-[#f5b800]">Inhalte vorschlagen lassen</p>
                <p className="text-[11px] text-[#93a4bb] mb-2">Feld wählen – Sie erhalten drei fertige Formulierungen zur Übernahme.</p>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <button key={t.id} onClick={() => fetchSuggestions(t)}
                      className={`px-2.5 py-1.5 rounded text-[11px] border ${topicId === t.id ? "bg-[#f5b800] text-[#080b10] border-[#f5b800]" : "border-[#33455c] text-[#d6e0ee] hover:border-[#f5b800]"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {loading && <p className="text-[12px] text-[#b7c5d6] mt-3">Vorschläge werden formuliert …</p>}
                {error && <p className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/40 rounded px-2.5 py-2 mt-3">{error}</p>}

                {!loading && suggestions.length > 0 && topic && (
                  <div className="mt-3 space-y-2">
                    {suggestions.map((sg, i) => (
                      <div key={i} className="rounded border border-[#22303f] p-2.5">
                        <p className="text-[12px] leading-relaxed text-[#dbe4f0] whitespace-pre-wrap">{sg.text}</p>
                        {sg.warum && <p className="text-[11px] text-[#93a4bb] mt-1 italic">{sg.warum}</p>}
                        <div className="flex gap-3 mt-2">
                          {topic.apply && (
                            <button onClick={() => { topic.apply?.(sg.text); setApplied(i); }}
                              className="text-[11px] font-medium text-[#f5b800] underline">
                              {applied === i ? "übernommen ✓" : "übernehmen"}
                            </button>
                          )}
                          <button onClick={() => navigator.clipboard?.writeText(sg.text)} className="text-[11px] text-[#93a4bb] underline">kopieren</button>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-[#93a4bb]">Vorschläge sind Entwürfe – bitte auf die Realität im Bereich anpassen.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
