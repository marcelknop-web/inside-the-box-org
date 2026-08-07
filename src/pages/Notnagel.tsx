import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  DAMAGE_CATEGORIES, HORIZONS, SCALE, DEFAULT_PROFILE, DEFAULT_TEAM, DEFAULT_EXERCISE,
  DEMO_SCENARIOS, newProcess, deriveMtpd, suggestRto, priorityOf, maxByHorizon,
  curveDetail, driversAtMtpd, deriveActivation,
  runQualityCheck, qualityScore,
  type AreaProfile, type ProcessEntry, type TeamRole, type ExerciseParams,
  type NotnagelInput, type GeneratedContent, type ResourceEntry, type Finding, type Horizon,
} from "@/data/notnagelTypes";
import { buildNotnagelZip, downloadSingleDoc } from "@/utils/notnagelDocx";

const STEPS = ["Bereich", "Prozesse", "Notfallteam", "Übung", "Ergebnisse"];
const REGULATORY = ["ISO 22301", "BSI-Standard 200-4", "ISO/IEC 27001", "NIS-2 / nationale Umsetzung", "DORA", "KRITIS-Verordnung", "Kundenanforderung / Vertrag"];
const RESOURCE_KINDS: ResourceEntry["kind"][] = ["IT-Anwendungen", "Daten", "Personal", "Standorte", "Dienstleister", "Sonstiges"];

const DRAFT_KEY = "notnagel.draft.v1";

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-relaxed text-teal-900/70 bg-teal-50 border border-teal-100 rounded px-3 py-2">{children}</p>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-700">{label}</span>
      {hint && <span className="block text-[11px] text-neutral-500 mb-1">{hint}</span>}
      <div className={hint ? "" : "mt-1"}>{children}</div>
    </label>
  );
}

const inputCls = "w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700";

export default function Notnagel() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<AreaProfile>(DEFAULT_PROFILE);
  const [processes, setProcesses] = useState<ProcessEntry[]>([]);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamRole[]>(DEFAULT_TEAM);
  const [exercise, setExercise] = useState<ExerciseParams>(DEFAULT_EXERCISE);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const genTimer = useRef<number | null>(null);

  const input: NotnagelInput = useMemo(() => ({ profile, processes, team, exercise }), [profile, processes, team, exercise]);
  const findings = useMemo(() => runQualityCheck(input), [input]);
  const score = useMemo(() => qualityScore(findings), [findings]);

  // Entwurf lokal sichern
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (Array.isArray(d.processes)) setProcesses(d.processes);
        if (Array.isArray(d.team)) setTeam(d.team);
        if (d.exercise) setExercise(d.exercise);
      }
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ profile, processes, team, exercise })); } catch { /* ignore */ }
  }, [profile, processes, team, exercise]);

  useEffect(() => () => { if (genTimer.current) window.clearInterval(genTimer.current); }, []);

  function loadDemo(idx: number) {
    const d = DEMO_SCENARIOS[idx].build();
    setProfile(d.profile);
    setProcesses(d.processes);
    setActiveProcess(d.processes[0]?.id ?? null);
    setTeam(d.team);
    setExercise(d.exercise);
    setContent(null);
    setStep(1);
  }

  function resetAll() {
    if (!confirm("Alle Eingaben verwerfen und neu beginnen?")) return;
    setProfile(DEFAULT_PROFILE); setProcesses([]); setTeam(DEFAULT_TEAM);
    setExercise(DEFAULT_EXERCISE); setContent(null); setError(null); setStep(0);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  function updateProcess(id: string, patch: Partial<ProcessEntry>) {
    setProcesses((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addProcess() {
    const p = newProcess();
    setProcesses((ps) => [...ps, p]);
    setActiveProcess(p.id);
  }

  async function generate() {
    setError(null); setContent(null); setLoading(true); setProgressPct(4);
    setProgress("Eingaben werden geprüft …");

    const stages = [
      { pct: 15, msg: "Leitlinie wird formuliert …" },
      { pct: 35, msg: "Schadensverlauf wird interpretiert …" },
      { pct: 55, msg: "Notfallplan wird abgeleitet …" },
      { pct: 75, msg: "Übungsdrehbuch wird geschrieben …" },
      { pct: 88, msg: "Konsistenzprüfung der Kennzahlen …" },
    ];
    let i = 0;
    if (genTimer.current) window.clearInterval(genTimer.current);
    genTimer.current = window.setInterval(() => {
      if (i >= stages.length) return;
      const s = stages[i++];
      setProgressPct(s.pct); setProgress(s.msg);
    }, 4000) as unknown as number;

    try {
      const derived = processes.map((p) => {
        const { horizon, hours } = deriveMtpd(p);
        const m = maxByHorizon(p);
        return {
          mtpdLabel: horizon ?? null,
          mtpdHours: hours,
          priority: priorityOf(p).label,
          curve: HORIZONS.map((h) => `${h}=S${m[h]}`).join(", "),
          curveDetail: curveDetail(p),
          drivers: driversAtMtpd(p),
        };
      });

      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/notnagel-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
        body: JSON.stringify({ profile, processes, team, exercise, derived, activation: deriveActivation(processes) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generierung fehlgeschlagen");
      setContent(data.content);
      setProgressPct(100);
      setProgress("Dokumentinhalte erstellt");
    } catch (e: any) {
      setError(e.message || "Fehler bei der Generierung");
      setProgress("Abgebrochen");
    } finally {
      if (genTimer.current) { window.clearInterval(genTimer.current); genTimer.current = null; }
      setLoading(false);
    }
  }

  async function downloadAll() {
    if (!content) return;
    setDownloading(true);
    try {
      await buildNotnagelZip(input, content, findings, (done, total, label) => {
        setProgressPct(Math.round((done / total) * 100));
        setProgress(label);
      });
    } catch (e) {
      console.error(e);
      setError("Word-Paket konnte nicht erzeugt werden.");
    } finally {
      setDownloading(false);
    }
  }

  const active = processes.find((p) => p.id === activeProcess) ?? null;

  return (
    <div className="min-h-screen bg-[#FBFCFC] text-neutral-900">
      <Helmet>
        <title>Notnagel – BCM-Assistent für Fachbereiche | inside-the-box</title>
        <meta name="description" content="Notnagel führt Fachbereichsverantwortliche durch den BCM-Prozess: Business Impact Analyse, Notfallplan, BCM-Leitlinie und Tabletop-Drehbuch als fertige Word-Dokumente." />
      </Helmet>

      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0E4749]">Notnagel</h1>
            <p className="text-[11px] text-neutral-500">BCM-Assistent für Fachbereiche · inside-the-box.org</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">↺ Neu starten</button>
            <Link to="/" className="text-sm text-[#0E4749] hover:underline">← zurück</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step > 0 && (
          <ol className="flex gap-1.5 sm:gap-2 mb-6 flex-wrap">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const activeStep = step === n;
              return (
                <li key={label}>
                  <button
                    onClick={() => setStep(n)}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium border transition ${
                      activeStep ? "bg-[#0E4749] text-white border-[#0E4749]"
                        : step > n ? "bg-white text-[#0E4749] border-[#0E4749]"
                        : "bg-white text-neutral-500 border-neutral-200"
                    }`}
                  >{n}. {label}</button>
                </li>
              );
            })}
          </ol>
        )}

        {/* Step 0 – Einstieg */}
        {step === 0 && (
          <section className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Business Continuity Management</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0E4749] leading-tight">Der Notnagel für Ihren Fachbereich.</h2>
              <p className="text-base text-neutral-700 leading-relaxed">
                Notnagel führt Sie Schritt für Schritt durch den BCM-Prozess – ohne BCM-Vorkenntnisse. Sie beschreiben Ihre Prozesse,
                Notnagel leitet Kennzahlen wie MTPD, RTO und RPO regelbasiert ab, prüft Ihre Angaben auf Widersprüche und erzeugt
                daraus vier freigabefähige Word-Dokumente.
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  ["BCM-Leitlinie", "Zweck, Geltungsbereich, Rollen, Kennzahlen"],
                  ["Business Impact Analyse", "Schadensverlauf, MTPD, RTO, RPO, Abhängigkeiten"],
                  ["Notfallplan (BCP)", "Aktivierungsstufen, Sofortmaßnahmen, Notbetrieb"],
                  ["Tabletop-Drehbuch", "Lage, Injects, Auswertung, Maßnahmenliste"],
                ].map(([t, d]) => (
                  <li key={t} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-sm font-semibold text-[#0E4749]">{t}</p>
                    <p className="text-xs text-neutral-600 mt-1">{d}</p>
                  </li>
                ))}
              </ul>
              <Hint>
                Alle Eingaben bleiben in dieser Browser-Sitzung. Für die Ausformulierung der Texte wird ein anonymer KI-Aufruf genutzt –
                Kennzahlen werden dabei nicht von der KI erfunden, sondern aus Ihren Angaben berechnet.
              </Hint>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setStep(1); }} className="px-5 py-2.5 rounded bg-[#0E4749] text-white text-sm font-medium">Assistent starten →</button>
              {DEMO_SCENARIOS.map((d, i) => (
                <button key={d.label} onClick={() => loadDemo(i)} className="px-4 py-2.5 rounded border border-neutral-300 text-sm text-left">
                  <span className="font-medium">Beispiel: {d.label}</span>
                  <span className="block text-[11px] text-neutral-500">{d.hint}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 1 – Bereich */}
        {step === 1 && (
          <section className="space-y-6 max-w-4xl">
            <h2 className="text-xl font-semibold text-[#0E4749]">Bereichsprofil</h2>
            <Hint>Diese Angaben erscheinen auf jedem Deckblatt und legen den Geltungsbereich fest. „Fachbereich“ ist die Organisationseinheit, für die Sie verantwortlich sind.</Hint>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Organisation"><input className={inputCls} value={profile.organisation} onChange={(e) => setProfile({ ...profile, organisation: e.target.value })} /></Field>
              <Field label="Fachbereich"><input className={inputCls} value={profile.area} onChange={(e) => setProfile({ ...profile, area: e.target.value })} /></Field>
              <Field label="Verantwortlich (Name)"><input className={inputCls} value={profile.owner} onChange={(e) => setProfile({ ...profile, owner: e.target.value })} /></Field>
              <Field label="Funktion"><input className={inputCls} value={profile.ownerFunction} onChange={(e) => setProfile({ ...profile, ownerFunction: e.target.value })} /></Field>
              <Field label="BC-Koordination" hint="Wer begleitet das Thema methodisch? Falls unbekannt: leer lassen."><input className={inputCls} value={profile.coordinator} onChange={(e) => setProfile({ ...profile, coordinator: e.target.value })} /></Field>
              <Field label="Standorte"><input className={inputCls} value={profile.sites} onChange={(e) => setProfile({ ...profile, sites: e.target.value })} /></Field>
              <Field label="Branche / Geschäftsmodell"><input className={inputCls} value={profile.sector} onChange={(e) => setProfile({ ...profile, sector: e.target.value })} /></Field>
              <Field label="Alarmierungsweg" hint="Wie wird das Team im Ernstfall erreicht?"><input className={inputCls} value={profile.alarmChannel} onChange={(e) => setProfile({ ...profile, alarmChannel: e.target.value })} /></Field>
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-700 mb-1">Normativer Rahmen</p>
              <p className="text-[11px] text-neutral-500 mb-2">Woran wird sich die Leitlinie messen lassen? Mehrfachauswahl.</p>
              <div className="flex flex-wrap gap-2">
                {REGULATORY.map((r) => {
                  const on = profile.regulatory.includes(r);
                  return (
                    <button key={r} onClick={() => setProfile({ ...profile, regulatory: on ? profile.regulatory.filter((x) => x !== r) : [...profile.regulatory, r] })}
                      className={`px-3 py-1.5 rounded text-xs border ${on ? "bg-[#0E4749] text-white border-[#0E4749]" : "border-neutral-300 text-neutral-600"}`}>{r}</button>
                  );
                })}
              </div>
            </div>

            <Field label="Besonderheiten" hint="Saisonalität, kritische Kunden, laufende Projekte, bekannte Schwachstellen.">
              <textarea rows={3} className={inputCls} value={profile.particularities} onChange={(e) => setProfile({ ...profile, particularities: e.target.value })} />
            </Field>
            <Field label="Anbindung an das Krisenmanagement" hint="An wen eskaliert der Bereich, wenn die eigene Reaktion nicht reicht?">
              <input className={inputCls} value={profile.crisisTeamRef} onChange={(e) => setProfile({ ...profile, crisisTeamRef: e.target.value })} />
            </Field>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded bg-[#0E4749] text-white text-sm font-medium">Weiter zu den Prozessen →</button>
            </div>
          </section>
        )}

        {/* Step 2 – Prozesse */}
        {step === 2 && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-[#0E4749]">Prozesse und Auswirkungen</h2>
            <Hint>
              Erfassen Sie die Prozesse, für die Ihr Bereich gegenüber anderen einsteht. Zwei bis fünf Prozesse reichen für den Anfang.
              Bewerten Sie je Zeithorizont, wie stark der Schaden wäre, wenn der Prozess ab jetzt ausfällt. Notnagel leitet daraus die MTPD ab.
            </Hint>

            <div className="grid lg:grid-cols-[260px_1fr] gap-5">
              <aside className="space-y-2">
                {processes.map((p) => {
                  const pr = priorityOf(p);
                  return (
                    <button key={p.id} onClick={() => setActiveProcess(p.id)}
                      className={`w-full text-left px-3 py-2.5 rounded border text-sm ${activeProcess === p.id ? "border-[#0E4749] bg-[#0E4749]/5" : "border-neutral-200 bg-white"}`}>
                      <span className="block font-medium">{p.name || `${p.id} (ohne Namen)`}</span>
                      <span className={`block text-[11px] mt-0.5 ${pr.level === 1 ? "text-red-700" : pr.level === 2 ? "text-amber-700" : "text-neutral-500"}`}>{pr.label}</span>
                    </button>
                  );
                })}
                <button onClick={addProcess} className="w-full px-3 py-2.5 rounded border border-dashed border-neutral-400 text-sm text-neutral-600 hover:bg-white">+ Prozess hinzufügen</button>
              </aside>

              <div className="space-y-6">
                {!active && <p className="text-sm text-neutral-500">Bitte einen Prozess anlegen oder auswählen.</p>}
                {active && (
                  <>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[#0E4749]">{active.id} · Prozesssteckbrief</p>
                        <button onClick={() => { setProcesses((ps) => ps.filter((p) => p.id !== active.id)); setActiveProcess(null); }}
                          className="text-xs text-red-700 hover:underline">entfernen</button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Prozessname"><input className={inputCls} value={active.name} onChange={(e) => updateProcess(active.id, { name: e.target.value })} /></Field>
                        <Field label="Betriebszeiten"><input className={inputCls} value={active.operatingHours} onChange={(e) => updateProcess(active.id, { operatingHours: e.target.value })} /></Field>
                        <div className="sm:col-span-2">
                          <Field label="Kurzbeschreibung" hint="Was leistet der Prozess, für wen, mit welcher Zusage?">
                            <textarea rows={2} className={inputCls} value={active.description} onChange={(e) => updateProcess(active.id, { description: e.target.value })} />
                          </Field>
                        </div>
                        <div className="sm:col-span-2">
                          <Field label="Leistungsempfänger"><input className={inputCls} value={active.recipients} onChange={(e) => updateProcess(active.id, { recipients: e.target.value })} /></Field>
                        </div>
                      </div>
                    </div>

                    {/* Schadensverlauf */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                      <p className="text-sm font-semibold text-[#0E4749]">Schadensverlauf</p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-neutral-600">
                        {SCALE.map((s) => <span key={s.level}><strong>{s.code} = {s.name}:</strong> {s.hint}</span>)}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[560px]">
                          <thead>
                            <tr className="text-left text-neutral-500">
                              <th className="py-2 pr-2 font-medium">Auswirkung nach …</th>
                              {HORIZONS.map((h) => <th key={h} className="py-2 px-2 font-medium text-center">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {DAMAGE_CATEGORIES.map((cat) => (
                              <tr key={cat.key} className="border-t border-neutral-100">
                                <td className="py-2 pr-2 text-neutral-700">{cat.label}</td>
                                {HORIZONS.map((h) => (
                                  <td key={h} className="py-2 px-1 text-center">
                                    <div className="inline-flex gap-1">
                                      {[1, 2, 3, 4].map((v) => {
                                        const on = active.matrix[cat.key][h] === v;
                                        return (
                                          <button key={v} title={SCALE[v - 1].hint}
                                            onClick={() => {
                                              const m = { ...active.matrix, [cat.key]: { ...active.matrix[cat.key], [h as Horizon]: v } };
                                              updateProcess(active.id, { matrix: m });
                                            }}
                                            className={`w-6 h-6 rounded text-[11px] border ${on
                                              ? v >= 3 ? "bg-red-700 text-white border-red-700" : v === 2 ? "bg-amber-500 text-white border-amber-500" : "bg-[#0E4749] text-white border-[#0E4749]"
                                              : "border-neutral-300 text-neutral-500 hover:border-neutral-500"}`}>{v}</button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const { horizon, hours } = deriveMtpd(active);
                        const sugg = suggestRto(hours);
                        return (
                          <div className="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900 flex flex-wrap gap-x-4 gap-y-1 items-center">
                            <span><strong>Abgeleitete MTPD:</strong> {horizon ? `${horizon} (${hours} Std.)` : "im Betrachtungszeitraum nicht erreicht"}</span>
                            <span><strong>Einordnung:</strong> {priorityOf(active).label}</span>
                            {sugg && <span><strong>RTO-Vorschlag:</strong> {sugg} Std.
                              <button onClick={() => updateProcess(active.id, { rtoHours: String(sugg) })} className="ml-1 underline">übernehmen</button></span>}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Kontinuitätsanforderungen */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 grid sm:grid-cols-3 gap-4">
                      <Field label="RTO in Stunden" hint="Angestrebte Wiederanlaufzeit – muss unter der MTPD liegen.">
                        <input className={inputCls} inputMode="numeric" value={active.rtoHours} onChange={(e) => updateProcess(active.id, { rtoHours: e.target.value })} />
                      </Field>
                      <Field label="RPO in Stunden" hint="Maximal tolerierbarer Datenverlust.">
                        <input className={inputCls} inputMode="numeric" value={active.rpoHours} onChange={(e) => updateProcess(active.id, { rpoHours: e.target.value })} />
                      </Field>
                      <div className="sm:col-span-3">
                        <Field label="Mindest-Notbetrieb" hint="Welche Leistung muss im Notfall zwingend erbracht werden – und für wen?">
                          <textarea rows={2} className={inputCls} value={active.minimumService} onChange={(e) => updateProcess(active.id, { minimumService: e.target.value })} />
                        </Field>
                      </div>
                    </div>

                    {/* Ressourcen */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0E4749]">Vitale Ressourcen</p>
                        <button onClick={() => updateProcess(active.id, { resources: [...active.resources, { kind: "IT-Anwendungen", description: "", criticality: "hoch", singlePointOfFailure: false }] })}
                          className="text-xs px-2.5 py-1 rounded border border-neutral-300">+ Ressource</button>
                      </div>
                      <p className="text-[11px] text-neutral-500">Ohne welche IT, Daten, Personen, Standorte oder Dienstleister läuft der Prozess nicht?</p>
                      {active.resources.map((r, i) => (
                        <div key={i} className="grid sm:grid-cols-[150px_1fr_120px_auto_auto] gap-2 items-center">
                          <select className={inputCls} value={r.kind} onChange={(e) => {
                            const rs = [...active.resources]; rs[i] = { ...r, kind: e.target.value as ResourceEntry["kind"] }; updateProcess(active.id, { resources: rs });
                          }}>{RESOURCE_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
                          <input className={inputCls} placeholder="Bezeichnung" value={r.description} onChange={(e) => {
                            const rs = [...active.resources]; rs[i] = { ...r, description: e.target.value }; updateProcess(active.id, { resources: rs });
                          }} />
                          <select className={inputCls} value={r.criticality} onChange={(e) => {
                            const rs = [...active.resources]; rs[i] = { ...r, criticality: e.target.value as ResourceEntry["criticality"] }; updateProcess(active.id, { resources: rs });
                          }}><option value="hoch">hoch</option><option value="mittel">mittel</option><option value="niedrig">niedrig</option></select>
                          <label className="text-[11px] text-neutral-600 flex items-center gap-1 whitespace-nowrap">
                            <input type="checkbox" checked={r.singlePointOfFailure} onChange={(e) => {
                              const rs = [...active.resources]; rs[i] = { ...r, singlePointOfFailure: e.target.checked }; updateProcess(active.id, { resources: rs });
                            }} /> nur einfach vorhanden
                          </label>
                          <button onClick={() => updateProcess(active.id, { resources: active.resources.filter((_, j) => j !== i) })} className="text-xs text-red-700">✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Notbetrieb */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0E4749]">Notbetriebsverfahren</p>
                        <button onClick={() => updateProcess(active.id, { workarounds: [...active.workarounds, { scenario: "", procedure: "", limitHours: "" }] })}
                          className="text-xs px-2.5 py-1 rounded border border-neutral-300">+ Verfahren</button>
                      </div>
                      <p className="text-[11px] text-neutral-500">Was tut der Bereich konkret, wenn eine dieser Ressourcen fehlt? Auch „Papier und Telefon“ ist ein gültiges Verfahren.</p>
                      {active.workarounds.map((w, i) => (
                        <div key={i} className="grid sm:grid-cols-[220px_1fr_110px_auto] gap-2 items-start">
                          <input className={inputCls} placeholder="Ausfallszenario" value={w.scenario} onChange={(e) => {
                            const ws = [...active.workarounds]; ws[i] = { ...w, scenario: e.target.value }; updateProcess(active.id, { workarounds: ws });
                          }} />
                          <textarea rows={2} className={inputCls} placeholder="Verfahren" value={w.procedure} onChange={(e) => {
                            const ws = [...active.workarounds]; ws[i] = { ...w, procedure: e.target.value }; updateProcess(active.id, { workarounds: ws });
                          }} />
                          <input className={inputCls} placeholder="Std." inputMode="numeric" value={w.limitHours} onChange={(e) => {
                            const ws = [...active.workarounds]; ws[i] = { ...w, limitHours: e.target.value }; updateProcess(active.id, { workarounds: ws });
                          }} />
                          <button onClick={() => updateProcess(active.id, { workarounds: active.workarounds.filter((_, j) => j !== i) })} className="text-xs text-red-700 pt-2">✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(3)} disabled={processes.length === 0} className="px-4 py-2 rounded bg-[#0E4749] text-white text-sm font-medium disabled:opacity-40">Weiter →</button>
            </div>
          </section>
        )}

        {/* Step 3 – Team */}
        {step === 3 && (
          <section className="space-y-5 max-w-3xl">
            <h2 className="text-xl font-semibold text-[#0E4749]">Notfallteam des Bereichs</h2>
            <Hint>Im Ernstfall zählt, wer entscheidet. Jede Rolle braucht eine Vertretung – sonst hängt der Plan an einer einzigen Person.</Hint>
            <div className="space-y-2">
              {team.map((t, i) => (
                <div key={i} className="grid sm:grid-cols-[200px_1fr_1fr_auto] gap-2 items-center">
                  <input className={inputCls} value={t.role} onChange={(e) => { const ts = [...team]; ts[i] = { ...t, role: e.target.value }; setTeam(ts); }} />
                  <input className={inputCls} placeholder="Besetzung" value={t.primary} onChange={(e) => { const ts = [...team]; ts[i] = { ...t, primary: e.target.value }; setTeam(ts); }} />
                  <input className={inputCls} placeholder="Vertretung" value={t.deputy} onChange={(e) => { const ts = [...team]; ts[i] = { ...t, deputy: e.target.value }; setTeam(ts); }} />
                  <button onClick={() => setTeam(team.filter((_, j) => j !== i))} className="text-xs text-red-700">✕</button>
                </div>
              ))}
              <button onClick={() => setTeam([...team, { role: "", primary: "", deputy: "" }])} className="text-xs px-3 py-1.5 rounded border border-dashed border-neutral-400">+ Rolle</button>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(4)} className="px-4 py-2 rounded bg-[#0E4749] text-white text-sm font-medium">Weiter →</button>
            </div>
          </section>
        )}

        {/* Step 4 – Übung */}
        {step === 4 && (
          <section className="space-y-5 max-w-3xl">
            <h2 className="text-xl font-semibold text-[#0E4749]">Tabletop-Übung</h2>
            <Hint>Ein Plan, der nie geübt wurde, ist eine Vermutung. Das Drehbuch testet genau die Prozesse und Notbetriebsverfahren, die Sie erfasst haben.</Hint>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dauer">
                <div className="flex gap-2 flex-wrap">
                  {(["90 Min.", "2,5 Std.", "4 Std."] as const).map((d) => (
                    <button key={d} onClick={() => setExercise({ ...exercise, duration: d, injectCount: d === "90 Min." ? 4 : d === "2,5 Std." ? 6 : 9 })}
                      className={`px-3 py-2 rounded border text-sm ${exercise.duration === d ? "bg-[#0E4749] text-white border-[#0E4749]" : "border-neutral-300"}`}>{d}</button>
                  ))}
                </div>
              </Field>
              <Field label="Erfahrungsstand des Teams">
                <div className="flex gap-2 flex-wrap">
                  {(["Einsteiger", "Geübtes Team", "Erfahrenes Team"] as const).map((l) => (
                    <button key={l} onClick={() => setExercise({ ...exercise, level: l })}
                      className={`px-3 py-2 rounded border text-sm ${exercise.level === l ? "bg-[#0E4749] text-white border-[#0E4749]" : "border-neutral-300"}`}>{l}</button>
                  ))}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Szenario" hint="Was soll das Team erleben? Notnagel verknüpft es mit Ihren Ressourcen und Notbetriebsverfahren.">
                  <textarea rows={2} className={inputCls} value={exercise.scenario} onChange={(e) => setExercise({ ...exercise, scenario: e.target.value })} />
                </Field>
              </div>
              <Field label="Teilnehmer"><input className={inputCls} value={exercise.participants} onChange={(e) => setExercise({ ...exercise, participants: e.target.value })} /></Field>
              <Field label="Übungsleitung"><input className={inputCls} value={exercise.facilitator} onChange={(e) => setExercise({ ...exercise, facilitator: e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(5)} className="px-4 py-2 rounded bg-[#0E4749] text-white text-sm font-medium">Zur Auswertung →</button>
            </div>
          </section>
        )}

        {/* Step 5 – Ergebnisse */}
        {step === 5 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-[#0E4749]">Prüfung und Dokumente</h2>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-sm font-semibold text-[#0E4749]">Automatische Qualitätsprüfung</p>
                <div className="flex gap-3 text-xs">
                  <span className={`px-2 py-1 rounded ${score.blockers ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{score.blockers} Blocker</span>
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">{score.warnings} Warnungen</span>
                  <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">{score.hints} Hinweise</span>
                </div>
                <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {findings.length === 0 && <li className="text-sm text-emerald-800">Keine Auffälligkeiten.</li>}
                  {findings.map((f: Finding, i) => (
                    <li key={i} className="text-xs leading-relaxed">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${f.severity === "blocker" ? "bg-red-600" : f.severity === "warnung" ? "bg-amber-500" : "bg-neutral-400"}`} />
                      <strong className="text-neutral-700">{f.where}:</strong> <span className="text-neutral-600">{f.text}</span>
                    </li>
                  ))}
                </ul>
                {!score.ready && <p className="text-xs text-red-700">Blocker bitte beheben – sie machen die Dokumente fachlich angreifbar.</p>}
              </div>

              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-sm font-semibold text-[#0E4749]">Prozessübersicht</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-neutral-500"><th className="py-1">Prozess</th><th>MTPD</th><th>RTO</th><th>RPO</th></tr></thead>
                  <tbody>
                    {processes.map((p) => {
                      const { horizon, hours } = deriveMtpd(p);
                      return (
                        <tr key={p.id} className="border-t border-neutral-100">
                          <td className="py-1.5 pr-2">{p.name || p.id}</td>
                          <td>{horizon ? `${horizon} (${hours} h)` : "–"}</td>
                          <td>{p.rtoHours ? `${p.rtoHours} h` : "–"}</td>
                          <td>{p.rpoHours ? `${p.rpoHours} h` : "–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <button onClick={generate} disabled={loading || !score.ready}
                  className="px-5 py-2.5 rounded bg-[#0E4749] text-white text-sm font-medium disabled:opacity-40">
                  {loading ? "Dokumente werden formuliert …" : content ? "Neu generieren" : "Dokumente erstellen"}
                </button>
                {content && (
                  <button onClick={downloadAll} disabled={downloading} className="px-5 py-2.5 rounded border border-[#0E4749] text-[#0E4749] text-sm font-medium disabled:opacity-40">
                    {downloading ? "Paket wird gepackt …" : "Alle Dokumente als ZIP"}
                  </button>
                )}
              </div>
              {(loading || downloading || progressPct > 0) && (
                <div>
                  <div className="h-1.5 bg-neutral-200 rounded overflow-hidden">
                    <div className="h-full bg-[#0E4749] transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-neutral-600 mt-1.5">{progress}</p>
                </div>
              )}
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

              {content && (
                <div className="space-y-4 pt-2">
                  <div className="rounded border border-neutral-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Managementzusammenfassung</p>
                    <p className="text-sm text-neutral-800 leading-relaxed">{content.managementSummary}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {([
                      ["leitlinie", "BCM-Leitlinie", "Zweck, Rollen, Kennzahlen"],
                      ["bia", "Business Impact Analyse", "Steckbriefe, MTPD/RTO/RPO"],
                      ["bcp", "Notfallplan (BCP)", "Aktivierung, Sofortmaßnahmen"],
                      ["tabletop", "Tabletop-Drehbuch", "Lage, Injects, Auswertung"],
                    ] as const).map(([key, title, desc]) => (
                      <button key={key} onClick={() => downloadSingleDoc(key, input, content, findings)}
                        className="text-left rounded border border-neutral-200 p-3 hover:border-[#0E4749] transition">
                        <p className="text-sm font-semibold text-[#0E4749]">{title}</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5">{desc}</p>
                        <p className="text-[11px] text-teal-700 mt-2">Word herunterladen ↓</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Die Dokumente sind Entwürfe. Kennzahlen stammen aus Ihren Angaben, die Texte sind KI-formuliert und vor der Freigabe fachlich zu prüfen.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(4)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
