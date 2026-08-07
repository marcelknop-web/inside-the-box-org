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
}

interface Suggestion { text: string; warum: string }

export default function NotnagelCoach({ guide, topics, findings, context }: Props) {
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
      {/* Auslöser */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-[5.5rem] right-4 z-30 flex items-center gap-2 rounded-full bg-[#0E4749] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-[#0b3a3c] sm:bottom-4"
      >
        <span aria-hidden>💡</span>
        <span className="hidden sm:inline">{open ? "Hilfe schließen" : "Hilfe & Vorschläge"}</span>
        <span className="sm:hidden">{open ? "Schließen" : "Hilfe"}</span>


        {!open && openFindings.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-[#0E4749] text-[10px] font-bold">{openFindings.length}</span>
        )}
      </button>

      {open && (
        <aside className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-20 z-40 w-full sm:w-[420px] max-h-[78vh] sm:max-h-[70vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="sticky top-0 bg-[#0E4749] text-white px-4 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-teal-100">Assistent</p>
              <p className="text-sm font-semibold">{guide.title}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-teal-100 text-lg leading-none">✕</button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-[13px] leading-relaxed text-neutral-700">{guide.intro}</p>

            <div>
              <p className="text-xs font-semibold text-[#0E4749] mb-1.5">So gehen Sie vor</p>
              <ol className="space-y-1.5">
                {guide.steps.map((sx, i) => (
                  <li key={i} className="text-[12px] leading-relaxed text-neutral-700 flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-teal-100 text-teal-900 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span>{sx}</span>
                  </li>
                ))}
              </ol>
            </div>

            {guide.pitfalls && guide.pitfalls.length > 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-amber-900 mb-1">Typische Fehler</p>
                <ul className="space-y-1">
                  {guide.pitfalls.map((p, i) => <li key={i} className="text-[11px] leading-relaxed text-amber-900">– {p}</li>)}
                </ul>
              </div>
            )}

            {openFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#0E4749] mb-1.5">Offene Punkte ({openFindings.length})</p>
                <ul className="space-y-1">
                  {openFindings.slice(0, 6).map((f, i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-neutral-700">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${f.severity === "blocker" ? "bg-red-600" : "bg-amber-500"}`} />
                      <strong>{f.where}:</strong> {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topics.length > 0 && (
              <div className="border-t border-neutral-200 pt-3">
                <p className="text-xs font-semibold text-[#0E4749]">Inhalte vorschlagen lassen</p>
                <p className="text-[11px] text-neutral-500 mb-2">Feld wählen – Sie erhalten drei fertige Formulierungen zur Übernahme.</p>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <button key={t.id} onClick={() => fetchSuggestions(t)}
                      className={`px-2.5 py-1.5 rounded text-[11px] border ${topicId === t.id ? "bg-[#0E4749] text-white border-[#0E4749]" : "border-neutral-300 text-neutral-700 hover:border-[#0E4749]"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {loading && <p className="text-[12px] text-neutral-600 mt-3">Vorschläge werden formuliert …</p>}
                {error && <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-2 mt-3">{error}</p>}

                {!loading && suggestions.length > 0 && topic && (
                  <div className="mt-3 space-y-2">
                    {suggestions.map((sg, i) => (
                      <div key={i} className="rounded border border-neutral-200 p-2.5">
                        <p className="text-[12px] leading-relaxed text-neutral-800 whitespace-pre-wrap">{sg.text}</p>
                        {sg.warum && <p className="text-[11px] text-neutral-500 mt-1 italic">{sg.warum}</p>}
                        <div className="flex gap-3 mt-2">
                          {topic.apply && (
                            <button onClick={() => { topic.apply?.(sg.text); setApplied(i); }}
                              className="text-[11px] font-medium text-[#0E4749] underline">
                              {applied === i ? "übernommen ✓" : "übernehmen"}
                            </button>
                          )}
                          <button onClick={() => navigator.clipboard?.writeText(sg.text)} className="text-[11px] text-neutral-500 underline">kopieren</button>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-neutral-500">Vorschläge sind Entwürfe – bitte auf die Realität im Bereich anpassen.</p>
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
