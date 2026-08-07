import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Typewriter from "@/components/Typewriter";
import {
  DAMAGE_CATEGORIES, HORIZONS, SCALE, DEFAULT_PROFILE, DEFAULT_TEAM, DEFAULT_EXERCISE,
  DEMO_SCENARIOS, newProcess, deriveMtpd, suggestRto, priorityOf, maxByHorizon,
  curveDetail, driversAtMtpd, deriveActivation,
  runQualityCheck, qualityScore,
  type AreaProfile, type ProcessEntry, type TeamRole, type ExerciseParams,
  type NotnagelInput, type GeneratedContent, type ResourceEntry, type Finding, type Horizon,
} from "@/data/notnagelTypes";
import { buildNotnagelZip, downloadSingleDoc } from "@/utils/notnagelDocx";
import { checkGeneratedContent, repairInstructions } from "@/utils/notnagelContentCheck";

import NotnagelCoach, { type CoachStep, type CoachTopic } from "@/components/notnagel/NotnagelCoach";

/** Anleitung je Wizard-Schritt – bewusst kurz und prüfbar gehalten. */
const COACH_GUIDES: Record<number, CoachStep> = {
  0: {
    title: "Einstieg",
    intro: "Notnagel begleitet vier Ergebnisse: Leitlinie, Business Impact Analyse, Notfallplan und Tabletop-Drehbuch. Der Aufwand liegt bei rund 30 bis 45 Minuten je Bereich.",
    steps: [
      "Ein Beispielszenario laden, wenn die Methodik noch neu ist – alle Werte bleiben danach änderbar.",
      "Sonst direkt starten: das Bereichsprofil legt den Geltungsbereich der Dokumente fest.",
      "Unterlagen bereitlegen: Prozessliste, verwendete IT-Anwendungen, Dienstleisterverträge, Erreichbarkeiten.",
    ],
    pitfalls: ["Den gesamten Konzern beschreiben. Notnagel arbeitet auf Ebene eines Fachbereichs."],
  },
  1: {
    title: "Bereichsprofil",
    intro: "Diese Angaben erscheinen auf jedem Deckblatt und bestimmen, worauf sich die Dokumente beziehen.",
    steps: [
      "Fachbereich so benennen, wie er im Organigramm heißt.",
      "Verantwortliche Person und Funktion eintragen – ohne Namen ist die Leitlinie nicht freigabefähig.",
      "Normativen Rahmen wählen: nur, woran der Bereich tatsächlich gemessen wird.",
      "Alarmierungsweg und Eskalation an das Krisenmanagement konkret beschreiben (Kanal, Nummer, Vertretung).",
    ],
    pitfalls: [
      "Alle Rahmenwerke ankreuzen. Das erzeugt Nachweispflichten, die niemand erfüllt.",
      "Alarmierung über einen Kanal, der bei IT-Ausfall selbst nicht verfügbar ist.",
    ],
  },
  2: {
    title: "Prozesse und Auswirkungen",
    intro: "Hier entsteht die Business Impact Analyse. Bewertet wird nicht die Wahrscheinlichkeit eines Ausfalls, sondern allein die Auswirkung über die Zeit.",
    steps: [
      "Zwei bis fünf Prozesse erfassen, für die der Bereich gegenüber anderen einsteht.",
      "Je Zeithorizont die Schadensstufe S1 bis S4 setzen – die Stufen dürfen über die Zeit nur steigen.",
      "MTPD wird abgeleitet, sobald eine Kategorie S3 erreicht. RTO-Vorschlag übernehmen oder begründet unterschreiten.",
      "Vitale Ressourcen benennen und markieren, was nur einfach vorhanden ist.",
      "Für jede kritische Ressource ein Notbetriebsverfahren mit realistischer Tragfähigkeit in Stunden hinterlegen.",
    ],
    pitfalls: [
      "Alles auf S4 setzen. Dann gibt es keine Priorisierung und der Notfallplan wird beliebig.",
      "RTO gleich oder größer als die MTPD wählen – der Wiederanlauf käme zu spät.",
      "Notbetrieb beschreiben, der dieselbe ausgefallene Ressource benötigt.",
    ],
  },
  3: {
    title: "Notfallteam",
    intro: "Das Notfallteam trifft im Ernstfall Entscheidungen für den Bereich. Wichtig ist nicht die Größe, sondern die durchgehende Erreichbarkeit.",
    steps: [
      "Je Rolle eine Person und eine Vertretung benennen – ohne Vertretung fällt die Rolle bei Urlaub aus.",
      "Rollen an Aufgaben binden, nicht an Hierarchie: Lagebild, Notbetrieb, Kommunikation, Protokoll.",
      "Prüfen, ob die Personen außerhalb der Betriebszeiten erreichbar sind.",
    ],
    pitfalls: ["Eine Person in mehreren Rollen. Im Ernstfall ist sie mehrfach gebunden."],
  },
  4: {
    title: "Tabletop-Übung",
    intro: "Die Übung prüft, ob Notfallplan und Notbetrieb im Bereich tragen. Das Szenario wird mit den erfassten Ressourcen verknüpft.",
    steps: [
      "Szenario an einer erfassten kritischen Ressource aufhängen, möglichst an einem Single Point of Failure.",
      "Dauer und Zahl der Injects zum Erfahrungsstand passend wählen.",
      "Teilnehmerkreis auf das Notfallteam plus benötigte Schnittstellen begrenzen.",
      "Übungsleitung benennen: sie spielt die Lage, entscheidet aber nicht mit.",
    ],
    pitfalls: [
      "Szenario ohne Bezug zu den erfassten Ressourcen – dann prüft die Übung nichts.",
      "Zu viele Injects für die Zeit. Diskussion ist wichtiger als Vollständigkeit.",
    ],
  },
  5: {
    title: "Prüfung und Dokumente",
    intro: "Die Prüfung läuft automatisch bei jeder Eingabe. Blocker verhindern die Generierung, weil sie die Dokumente fachlich angreifbar machen.",
    steps: [
      "Blocker beheben, Warnungen bewerten und bewusst annehmen oder korrigieren.",
      "Dokumente erstellen – Kennzahlen stammen aus den Eingaben, die KI formuliert nur die Texte.",
      "Word-Dateien einzeln oder als Paket herunterladen und fachlich prüfen, bevor sie in die Freigabe gehen.",
    ],
    pitfalls: ["Dokumente ungeprüft freigeben. Sie sind Entwürfe, keine Beschlüsse."],
  },
};


const STEPS = ["Bereich", "Prozesse", "Notfallteam", "Übung", "Ergebnisse"];
const REGULATORY = ["ISO 22301", "BSI-Standard 200-4", "ISO/IEC 27001", "NIS-2 / nationale Umsetzung", "DORA", "KRITIS-Verordnung", "Kundenanforderung / Vertrag"];
const RESOURCE_KINDS: ResourceEntry["kind"][] = ["IT-Anwendungen", "Daten", "Personal", "Standorte", "Dienstleister", "Sonstiges"];

const DRAFT_KEY = "notnagel.draft.v1";

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-teal-100 bg-teal-50/70 px-3.5 py-3">
      <span aria-hidden className="mt-px flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#0E4749] text-[10px] font-bold text-white">i</span>
      <p className="text-[12.5px] leading-relaxed text-teal-900/80">{children}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold tracking-tight text-neutral-800">{label}</span>
      {hint && <span className="mb-1.5 block text-[11px] leading-relaxed text-neutral-500">{hint}</span>}
      <div className={hint ? "" : "mt-1.5"}>{children}</div>
    </label>
  );
}

/** Karte mit einheitlichem Rahmen, Radius und Schatten */
function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] ${className}`}>
      {(title || action) && (
        <div className="mb-3.5 flex items-start justify-between gap-3">
          {title && <p className="text-[13px] font-semibold tracking-tight text-[#0E4749]">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** Schrittkopf: Nummer, Titel, Kurzbeschreibung – erscheint der Reihe nach. */
function SectionHead({ step, title, lead }: { step: number; title: string; lead?: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => { setPhase(0); }, [title]);
  const advance = (pause: number) => () => window.setTimeout(() => setPhase((p) => p + 1), pause);
  return (
    <div className="space-y-1.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-teal-700">
        <Typewriter key={`e-${title}`} text={`Schritt ${step} von 5`} charDelay={14} cursor={false} onDone={advance(280)} />
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-[#0E4749]">
        {phase >= 1 ? <Typewriter key={`t-${title}`} text={title} charDelay={18} cursor={false} onDone={advance(420)} /> : <span>&nbsp;</span>}
      </h2>
      {lead && (
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          {phase >= 2 && <Typewriter key={`l-${title}`} text={lead} charDelay={7} cursor={false} />}
        </p>
      )}
    </div>
  );
}


/** Fußnavigation eines Schritts – auf Mobil volle Breite, auf Desktop links/rechts */
function StepNav({ onBack, next }: { onBack?: () => void; next?: { label: string; onClick: () => void; disabled?: boolean; hint?: string } }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-neutral-200 bg-[#FBFCFC]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {onBack ? (
          <button onClick={onBack} className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 sm:w-auto">← zurück</button>
        ) : <span className="hidden sm:block" />}
        {next && (
          <div className="flex w-full items-center gap-3 sm:w-auto">
            {next.hint && <span className="hidden text-[11px] text-neutral-500 sm:inline">{next.hint}</span>}
            <button onClick={next.onClick} disabled={next.disabled}
              className="w-full rounded-lg bg-[#0E4749] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3a3c] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5">
              {next.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/** Typewriter reveal for a title + description pair, calling onDone after the body finishes. */
function TypewriterReveal({ title, body, onDone }: { title: string; body: string; onDone?: () => void }) {
  const [titleDone, setTitleDone] = useState(false);
  return (
    <>
      <p className="text-sm font-semibold tracking-tight text-[#0E4749]">
        <Typewriter text={title} charDelay={10} cursor={false} onDone={() => setTitleDone(true)} />
      </p>
      {titleDone && (
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          <Typewriter text={body} charDelay={5} cursor={false} onDone={onDone} />
        </p>
      )}
    </>
  );
}

/** Reveals a list of title/description tiles one after another with a typewriter effect. */
function TypewriterTileStack({ items, onDone }: { items: { title: string; body: string }[]; onDone?: () => void }) {
  const [doneCount, setDoneCount] = useState(0);
  return (
    <>
      {items.map((item, i) => (
        <li
          key={item.title}
          className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-teal-300"
        >
          {i <= doneCount && (
            <TypewriterReveal
              title={item.title}
              body={item.body}
              onDone={() => {
                const next = i + 1;
                setDoneCount(c => Math.max(c, next));
                if (next >= items.length) onDone?.();
              }}
            />
          )}
        </li>
      ))}
    </>
  );
}

/** Reveals a row of buttons one after another with a typewriter effect. */
function TypewriterButtonStack({ items, onSelect }: { items: { label: string; body: string }[]; onSelect: (i: number) => void }) {
  const [doneCount, setDoneCount] = useState(0);
  return (
    <>
      {items.map((item, i) => (
        <button
          key={item.label}
          disabled={i > doneCount}
          onClick={() => onSelect(i)}
          className="max-w-xs rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-left text-sm transition hover:border-[#0E4749] hover:shadow-sm disabled:opacity-50"
        >
          {i <= doneCount && (
            <TypewriterReveal
              title={item.label}
              body={item.body}
              onDone={() => setDoneCount(c => Math.max(c, i + 1))}
            />
          )}
        </button>
      ))}
    </>
  );
}

/**
 * Ein Textblock innerhalb einer Reveal-Sequenz. Erscheint erst, wenn `current === order`,
 * tippt sich ein und gibt nach `pause` ms an den nächsten Block weiter.
 * Pause nach Bedeutung: kurz innerhalb eines Absatzes, länger vor einem neuen Abschnitt.
 */
function SeqText({
  order, current, advance, text, className = "", pause = 320, charDelay = 8, as: Tag = "p",
}: {
  order: number; current: number; advance: (order: number, pause: number) => void;
  text: string; className?: string; pause?: number; charDelay?: number;
  as?: "p" | "h2" | "h3" | "span";
}) {
  if (current < order) return null;
  return (
    <Tag className={className}>
      <Typewriter text={text} charDelay={charDelay} cursor={false} onDone={() => advance(order, pause)} />
    </Tag>
  );
}

/** Nicht-Text-Block in der Sequenz: kurz einblenden, danach weitergeben. */
function SeqBlock({
  order, current, advance, pause = 320, hold = 260, className = "", children,
}: {
  order: number; current: number; advance: (order: number, pause: number) => void;
  pause?: number; hold?: number; className?: string; children: React.ReactNode;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (current !== order || fired.current) return;
    fired.current = true;
    const t = window.setTimeout(() => advance(order, pause), hold);
    return () => window.clearTimeout(t);
  }, [current, order, advance, pause, hold]);
  if (current < order) return null;
  return <div className={`animate-fade-in ${className}`}>{children}</div>;
}


const inputCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_1px_rgba(16,24,40,0.03)] transition focus:outline-none focus:ring-2 focus:ring-teal-700/25 focus:border-teal-700";

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
  const [contentFindings, setContentFindings] = useState<Finding[]>([]);
  const [tilesDone, setTilesDone] = useState(false);

  /** Reveal-Sequenz der Startseite: jeder Block gibt an den nächsten weiter. */
  const [seq, setSeq] = useState(0);
  const advance = useCallback((order: number, pause: number) => {
    window.setTimeout(() => setSeq((s) => (s > order ? s : order + 1)), pause);
  }, []);


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

  async function callGenerate(fixes: string[], derived: unknown[]) {
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/notnagel-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ profile, processes, team, exercise, derived, activation: deriveActivation(processes), fixes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generierung fehlgeschlagen");
    return data.content as GeneratedContent;
  }

  async function generate() {
    setError(null); setContent(null); setContentFindings([]); setLoading(true); setProgressPct(4);
    setProgress("Eingaben werden geprüft …");
    if (genTimer.current) window.clearInterval(genTimer.current);

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

      const MAX_PASSES = 3;
      let draft: GeneratedContent | null = null;
      let issues: Finding[] = [];

      for (let pass = 1; pass <= MAX_PASSES; pass++) {
        const base = pass === 1 ? 8 : 40 + (pass - 2) * 25;
        setProgressPct(base);
        setProgress(pass === 1 ? "Dokumente werden formuliert …" : `Nachbesserung ${pass - 1}: Befunde werden behoben …`);
        draft = await callGenerate(pass === 1 ? [] : repairInstructions(issues), derived);

        setProgressPct(base + 18);
        setProgress(`Qualitätssicherung über alle Dokumente (Durchlauf ${pass}) …`);
        issues = checkGeneratedContent(input, draft);
        const blockers = issues.filter((f) => f.severity === "blocker").length;
        const warnings = issues.filter((f) => f.severity === "warnung").length;
        if (blockers === 0 && warnings === 0) break;
        if (pass === MAX_PASSES) break;
      }

      setContent(draft);
      setContentFindings(issues);
      setProgressPct(100);
      const blockers = issues.filter((f) => f.severity === "blocker").length;
      setProgress(blockers === 0
        ? "Qualitätssicherung bestanden – Dokumente freigegeben"
        : `Qualitätssicherung abgeschlossen – ${blockers} Befund(e) bleiben offen`);
    } catch (e: any) {
      setError(e.message || "Fehler bei der Generierung");
      setProgress("Abgebrochen");
    } finally {
      if (genTimer.current) { window.clearInterval(genTimer.current); genTimer.current = null; }
      setLoading(false);
    }
  }

  /** Eingabeprüfung plus Dokumentenprüfung – Grundlage für das Prüfprotokoll. */
  const allFindings = useMemo(() => [...findings, ...contentFindings], [findings, contentFindings]);
  const contentScore = useMemo(() => ({
    blockers: contentFindings.filter((f) => f.severity === "blocker").length,
    warnings: contentFindings.filter((f) => f.severity === "warnung").length,
  }), [contentFindings]);


  async function downloadAll() {
    if (!content) return;
    setDownloading(true);
    try {
      await buildNotnagelZip(input, content, allFindings, (done, total, label) => {
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

  /** Kompakter Kontext für die Vorschlagsfunktion – nur bereits erfasste Angaben. */
  const coachContext = useMemo(() => {
    const lines = [
      `Organisation: ${profile.organisation || "noch offen"}`,
      `Fachbereich: ${profile.area || "noch offen"}`,
      `Branche: ${profile.sector || "noch offen"}`,
      `Standorte: ${profile.sites || "noch offen"}`,
      `Rahmenwerke: ${profile.regulatory.join(", ") || "keine"}`,
      `Besonderheiten: ${profile.particularities || "noch offen"}`,
      `Übungsszenario: ${exercise.scenario || "noch offen"} (Dauer ${exercise.duration}, Erfahrungsstand ${exercise.level})`,
    ];
    processes.forEach((p) => {
      const { horizon } = deriveMtpd(p);
      lines.push(
        `Prozess ${p.id} "${p.name || "ohne Namen"}": ${p.description || "keine Beschreibung"} | Empfänger: ${p.recipients || "offen"} | MTPD: ${horizon ?? "nicht erreicht"} | RTO: ${p.rtoHours || "offen"} Std. | Ressourcen: ${p.resources.map((r) => `${r.kind}/${r.description || "unbenannt"}${r.singlePointOfFailure ? " (einfach vorhanden)" : ""}`).join("; ") || "keine"} | Notbetrieb: ${p.workarounds.map((w) => w.scenario || "unbenannt").join("; ") || "keiner"}`,
      );
    });
    return lines.join("\n");
  }, [profile, processes, exercise]);

  const coachTopics: CoachTopic[] = useMemo(() => {
    if (step === 1) {
      return [
        { id: "sector", label: "Branche / Geschäftsmodell", help: "Kurze Einordnung des Geschäftsmodells und der Leistung, die der Bereich dazu beiträgt.", current: profile.sector, apply: (t) => setProfile((pr) => ({ ...pr, sector: t })) },
        { id: "particularities", label: "Besonderheiten", help: "Saisonalität, kritische Kunden, laufende Projekte, bekannte Schwachstellen und Abhängigkeiten des Bereichs.", current: profile.particularities, apply: (t) => setProfile((pr) => ({ ...pr, particularities: t })) },
        { id: "alarmChannel", label: "Alarmierungsweg", help: "Wie das Notfallteam erreicht wird, inklusive Rückfallkanal bei IT- oder Telefonieausfall.", current: profile.alarmChannel, apply: (t) => setProfile((pr) => ({ ...pr, alarmChannel: t })) },
        { id: "crisisTeamRef", label: "Anbindung an das Krisenmanagement", help: "An wen der Bereich eskaliert, wenn die eigene Reaktion nicht reicht, und in welchem Takt Lagebilder geliefert werden.", current: profile.crisisTeamRef, apply: (t) => setProfile((pr) => ({ ...pr, crisisTeamRef: t })) },
      ];
    }
    if (step === 2 && active) {
      return [
        { id: "description", label: `Kurzbeschreibung (${active.id})`, help: "Was der Prozess leistet, für wen und mit welcher Zusage. Zwei bis drei Sätze.", current: active.description, apply: (t) => updateProcess(active.id, { description: t }) },
        { id: "recipients", label: `Leistungsempfänger (${active.id})`, help: "Wer die Leistung abnimmt: interne Bereiche, Kunden, Aufsicht, Lieferanten.", current: active.recipients, apply: (t) => updateProcess(active.id, { recipients: t }) },
        { id: "minimumService", label: `Mindest-Notbetrieb (${active.id})`, help: "Welche Teilleistung im Notfall zwingend erbracht werden muss, für wen und in welchem Umfang.", current: active.minimumService, apply: (t) => updateProcess(active.id, { minimumService: t }) },
        { id: "resource", label: `Vitale Ressource ergänzen (${active.id})`, help: "Eine einzelne Ressource, ohne die der Prozess nicht läuft – knappe Bezeichnung, keine Erklärung.", current: active.resources.map((r) => r.description).join("; "), apply: (t) => updateProcess(active.id, { resources: [...active.resources, { kind: "IT-Anwendungen", description: t, criticality: "hoch", singlePointOfFailure: false }] }) },
        { id: "workaround", label: `Notbetriebsverfahren ergänzen (${active.id})`, help: "Ein konkretes Verfahren für den Ausfall einer erfassten Ressource: welche Handlung, mit welchem Hilfsmittel, durch wen.", current: active.workarounds.map((w) => w.procedure).join("; "), apply: (t) => updateProcess(active.id, { workarounds: [...active.workarounds, { scenario: "", procedure: t, limitHours: "" }] }) },
      ];
    }
    if (step === 4) {
      return [
        { id: "scenario", label: "Übungsszenario", help: "Ein Szenario, das genau die erfassten kritischen Ressourcen und Notbetriebsverfahren des Bereichs trifft. Zwei bis vier Sätze, ohne Lösung.", current: exercise.scenario, apply: (t) => setExercise((ex) => ({ ...ex, scenario: t })) },
        { id: "participants", label: "Teilnehmer", help: "Rollen und Schnittstellen, die für die Übung im Raum sein müssen.", current: exercise.participants, apply: (t) => setExercise((ex) => ({ ...ex, participants: t })) },
      ];
    }
    return [];
  }, [step, profile, active, exercise]);

  return (
    <div className="min-h-screen bg-[#FBFCFC] text-neutral-900">
      <Helmet>
        <title>Notnagel – BCM-Assistent für Fachbereiche | inside-the-box</title>
        <meta name="description" content="Notnagel führt Fachbereichsverantwortliche durch den BCM-Prozess: Business Impact Analyse, Notfallplan, BCM-Leitlinie und Tabletop-Drehbuch als fertige Word-Dokumente." />
      </Helmet>

      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E4749] text-sm font-bold text-white">N</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0E4749]">Notnagel</h1>
              <p className="text-[11px] text-neutral-500">BCM-Assistent für Fachbereiche · inside-the-box.org</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && <span className="hidden rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800 sm:inline">Schritt {step}/5 · {STEPS[step - 1]}</span>}
            <button onClick={resetAll} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50">↺ Neu starten</button>
            <Link to="/" className="text-sm text-[#0E4749] hover:underline">← zurück</Link>
          </div>
        </div>
        {step > 0 && (
          <div className="h-0.5 w-full bg-neutral-200">
            <div className="h-full bg-[#0E4749] transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step > 0 && (
          <ol className="mb-7 flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const activeStep = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex flex-shrink-0 items-center">
                  <button
                    onClick={() => setStep(n)}
                    aria-current={activeStep ? "step" : undefined}
                    className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-[13px] ${
                      activeStep ? "border-[#0E4749] bg-[#0E4749] text-white shadow-sm"
                        : done ? "border-teal-200 bg-teal-50 text-[#0E4749] hover:border-[#0E4749]"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      activeStep ? "bg-white/20 text-white" : done ? "bg-[#0E4749] text-white" : "bg-neutral-100 text-neutral-500"
                    }`}>{done ? "✓" : n}</span>
                    {label}
                  </button>
                  {n < STEPS.length && <span aria-hidden className={`mx-1 h-px w-3 sm:w-5 ${done ? "bg-[#0E4749]/40" : "bg-neutral-200"}`} />}
                </li>
              );
            })}
          </ol>
        )}

        {/* Step 0 – Einstieg */}
        {step === 0 && (
          <section className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <SeqText
                order={0} current={seq} advance={advance} pause={480} charDelay={16}
                className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-teal-700"
                text="Business Continuity Management"
              />
              <SeqText
                order={1} current={seq} advance={advance} pause={640} charDelay={22} as="h2"
                className="text-3xl sm:text-[2.6rem] font-bold leading-[1.1] tracking-tight text-[#0E4749]"
                text="Der Notnagel für Ihren Fachbereich."
              />
              <SeqText
                order={2} current={seq} advance={advance} pause={700} charDelay={6}
                className="text-[16.5px] leading-relaxed text-neutral-700"
                text="Notnagel führt Sie Schritt für Schritt durch den BCM-Prozess – ohne BCM-Vorkenntnisse. Sie beschreiben Ihre Prozesse, Notnagel leitet Kennzahlen wie MTPD, RTO und RPO regelbasiert ab, prüft Ihre Angaben auf Widersprüche und erzeugt daraus vier freigabefähige Word-Dokumente."
              />
              <SeqBlock order={3} current={seq} advance={advance} pause={560} hold={700}
                className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[12px] text-neutral-600">
                {["5 Schritte", "ca. 20–30 Minuten", "4 Word-Dokumente", "Automatische Qualitätsprüfung"].map((f, i) => (
                  <span key={f} className="flex animate-fade-in items-center gap-1.5" style={{ animationDelay: `${i * 160}ms` }}>
                    <span aria-hidden className="text-[#0E4749]">●</span>{f}
                  </span>
                ))}
              </SeqBlock>
              {seq >= 4 && (
                <ul className="grid gap-3 pt-2 sm:grid-cols-2">
                  <TypewriterTileStack
                    items={[
                      { title: "BCM-Leitlinie", body: "Zweck, Geltungsbereich, Rollen, Kennzahlen" },
                      { title: "Business Impact Analyse", body: "Schadensverlauf, MTPD, RTO, RPO, Abhängigkeiten" },
                      { title: "Notfallplan (BCP)", body: "Aktivierungsstufen, Sofortmaßnahmen, Notbetrieb" },
                      { title: "Tabletop-Drehbuch", body: "Lage, Injects, Auswertung, Maßnahmenliste" },
                    ]}
                    onDone={() => { setTilesDone(true); advance(4, 760); }}
                  />
                </ul>
              )}
              {seq >= 5 && (
                <Hint>
                  <Typewriter
                    charDelay={5} cursor={false}
                    text="Alle Eingaben bleiben in dieser Browser-Sitzung. Für die Ausformulierung der Texte wird ein anonymer KI-Aufruf genutzt – Kennzahlen werden dabei nicht von der KI erfunden, sondern aus Ihren Angaben berechnet."
                    onDone={() => advance(5, 700)}
                  />
                </Hint>
              )}
            </div>

            {seq >= 6 && (
              <div className="animate-fade-in space-y-3">
                <button onClick={() => { setStep(1); }} className="rounded-lg bg-[#0E4749] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3a3c]">Assistent starten →</button>
                {tilesDone && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <Typewriter text="Oder mit einem Beispiel starten" charDelay={12} cursor={false} />
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <TypewriterButtonStack items={DEMO_SCENARIOS.map(d => ({ label: d.label, body: d.hint }))} onSelect={loadDemo} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}


        {/* Step 1 – Bereich */}
        {step === 1 && (
          <section className="space-y-5 max-w-4xl">
            <SectionHead step={1} title="Bereichsprofil" lead="Diese Angaben erscheinen auf jedem Deckblatt und legen den Geltungsbereich der Dokumente fest." />
            <Hint>„Fachbereich“ ist die Organisationseinheit, für die Sie verantwortlich sind. Felder, die Sie nicht kennen, können leer bleiben.</Hint>
            <Card title="Verantwortung und Geltungsbereich">
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
            </Card>

            <Card title="Normativer Rahmen">
              <p className="mb-2.5 text-[11px] text-neutral-500">Woran wird sich die Leitlinie messen lassen? Mehrfachauswahl.</p>
              <div className="flex flex-wrap gap-2">
                {REGULATORY.map((r) => {
                  const on = profile.regulatory.includes(r);
                  return (
                    <button key={r} onClick={() => setProfile({ ...profile, regulatory: on ? profile.regulatory.filter((x) => x !== r) : [...profile.regulatory, r] })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-[#0E4749] bg-[#0E4749] text-white" : "border-neutral-300 text-neutral-600 hover:border-neutral-400"}`}>{on ? "✓ " : ""}{r}</button>
                  );
                })}
              </div>
            </Card>

            <Card title="Kontext und Eskalation" className="space-y-4">
              <Field label="Besonderheiten" hint="Saisonalität, kritische Kunden, laufende Projekte, bekannte Schwachstellen.">
                <textarea rows={3} className={inputCls} value={profile.particularities} onChange={(e) => setProfile({ ...profile, particularities: e.target.value })} />
              </Field>
              <Field label="Anbindung an das Krisenmanagement" hint="An wen eskaliert der Bereich, wenn die eigene Reaktion nicht reicht?">
                <input className={inputCls} value={profile.crisisTeamRef} onChange={(e) => setProfile({ ...profile, crisisTeamRef: e.target.value })} />
              </Field>
            </Card>

            <StepNav onBack={() => setStep(0)} next={{ label: "Weiter zu den Prozessen →", onClick: () => setStep(2) }} />

          </section>
        )}

        {/* Step 2 – Prozesse */}
        {step === 2 && (
          <section className="space-y-5">
            <SectionHead step={2} title="Prozesse und Auswirkungen" lead="Erfassen Sie die Prozesse, für die Ihr Bereich gegenüber anderen einsteht. Zwei bis fünf Prozesse reichen für den Anfang." />
            <Hint>
              Bewerten Sie je Zeithorizont, wie stark der Schaden wäre, wenn der Prozess ab jetzt ausfällt. Notnagel leitet daraus die MTPD ab.
            </Hint>

            <div className="grid lg:grid-cols-[264px_1fr] gap-5">
              <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
                <p className="px-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">Prozesse ({processes.length})</p>
                {processes.map((p) => {
                  const pr = priorityOf(p);
                  return (
                    <button key={p.id} onClick={() => setActiveProcess(p.id)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm transition ${activeProcess === p.id ? "border-[#0E4749] bg-teal-50/80 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
                      <span className="block font-medium text-neutral-800">{p.name || `${p.id} (ohne Namen)`}</span>
                      <span className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium ${pr.level === 1 ? "text-red-700" : pr.level === 2 ? "text-amber-700" : "text-neutral-500"}`}>
                        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${pr.level === 1 ? "bg-red-600" : pr.level === 2 ? "bg-amber-500" : "bg-neutral-400"}`} />
                        {pr.label}
                      </span>
                    </button>
                  );
                })}
                <button onClick={addProcess} className="w-full rounded-xl border border-dashed border-neutral-400 px-3 py-3 text-sm font-medium text-neutral-600 transition hover:border-[#0E4749] hover:bg-white hover:text-[#0E4749]">+ Prozess hinzufügen</button>
              </aside>


              <div className="space-y-6">
                {!active && (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-14 text-center">
                    <p className="text-sm font-medium text-neutral-700">Noch kein Prozess ausgewählt</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">Legen Sie links einen Prozess an – zum Beispiel „Kundenauftragsbearbeitung“ – und bewerten Sie anschließend den Schadensverlauf.</p>
                    <button onClick={addProcess} className="mt-4 rounded-lg bg-[#0E4749] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b3a3c]">+ Ersten Prozess anlegen</button>
                  </div>
                )}
                {active && (
                  <>
                    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-4">
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
                    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-3">
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
                                            className={`w-7 h-7 rounded-md text-[11px] font-semibold border transition ${on
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
                    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 grid sm:grid-cols-3 gap-4">
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
                    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-3">
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
                    <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-3">
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

            <StepNav onBack={() => setStep(1)} next={{ label: "Weiter zum Notfallteam →", onClick: () => setStep(3), disabled: processes.length === 0, hint: processes.length === 0 ? "Mindestens ein Prozess nötig" : undefined }} />
          </section>
        )}

        {/* Step 3 – Team */}
        {step === 3 && (
          <section className="space-y-5 max-w-3xl">
            <SectionHead step={3} title="Notfallteam des Bereichs" lead="Wer entscheidet, wer informiert, wer vertritt – knapp und eindeutig besetzt." />
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
            <StepNav onBack={() => setStep(2)} next={{ label: "Weiter zur Übung →", onClick: () => setStep(4) }} />
          </section>
        )}

        {/* Step 4 – Übung */}
        {step === 4 && (
          <section className="space-y-5 max-w-3xl">
            <SectionHead step={4} title="Tabletop-Übung" lead="Parameter für das Drehbuch, mit dem Sie den Plan erstmals belasten." />
            <Hint>Ein Plan, der nie geübt wurde, ist eine Vermutung. Das Drehbuch testet genau die Prozesse und Notbetriebsverfahren, die Sie erfasst haben.</Hint>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dauer">
                <div className="flex gap-2 flex-wrap">
                  {(["90 Min.", "2,5 Std.", "4 Std."] as const).map((d) => (
                    <button key={d} onClick={() => setExercise({ ...exercise, duration: d, injectCount: d === "90 Min." ? 4 : d === "2,5 Std." ? 6 : 9 })}
                      className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium transition ${exercise.duration === d ? "border-[#0E4749] bg-[#0E4749] text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"}`}>{d}</button>
                  ))}
                </div>
              </Field>
              <Field label="Erfahrungsstand des Teams">
                <div className="flex gap-2 flex-wrap">
                  {(["Einsteiger", "Geübtes Team", "Erfahrenes Team"] as const).map((l) => (
                    <button key={l} onClick={() => setExercise({ ...exercise, level: l })}
                      className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium transition ${exercise.level === l ? "border-[#0E4749] bg-[#0E4749] text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"}`}>{l}</button>
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
            <StepNav onBack={() => setStep(3)} next={{ label: "Zur Prüfung und Ausgabe →", onClick: () => setStep(5) }} />
          </section>
        )}

        {/* Step 5 – Ergebnisse */}
        {step === 5 && (
          <section className="space-y-6">
            <SectionHead step={5} title="Prüfung und Dokumente" lead="Notnagel prüft Ihre Angaben, formuliert die Texte und erzeugt die vier Word-Dokumente." />

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-3">
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

              <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-3">
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

            <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <button onClick={generate} disabled={loading || !score.ready}
                  className="rounded-lg bg-[#0E4749] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3a3c] disabled:cursor-not-allowed disabled:opacity-40">
                  {loading ? "Dokumente werden formuliert …" : content ? "Neu generieren" : "Dokumente erstellen"}
                </button>
                {content && (
                  <button onClick={downloadAll} disabled={downloading} className="rounded-lg border border-[#0E4749] px-5 py-3 text-sm font-semibold text-[#0E4749] transition hover:bg-teal-50 disabled:opacity-40">
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
                <div className={`rounded border p-3 text-xs space-y-1.5 ${contentScore.blockers ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                  <p className="font-semibold text-neutral-800">
                    Dokumentenprüfung: {contentScore.blockers} Blocker, {contentScore.warnings} Warnungen
                  </p>
                  {contentFindings.length === 0 ? (
                    <p className="text-emerald-800">Alle vier Dokumente sind gegen die erfassten Kennzahlen geprüft – keine Befunde.</p>
                  ) : (
                    <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {contentFindings.map((f, i) => (
                        <li key={i}>
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${f.severity === "blocker" ? "bg-red-600" : f.severity === "warnung" ? "bg-amber-500" : "bg-neutral-400"}`} />
                          <strong className="text-neutral-700">{f.where}:</strong> <span className="text-neutral-600">{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-neutral-500">Die Prüfung lief automatisch vor der Ausgabe; erkannte Befunde wurden in bis zu zwei Nachbesserungsläufen behoben. Verbleibende Befunde stehen im Prüfprotokoll des Downloads.</p>
                </div>
              )}


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
                      <button key={key} onClick={() => downloadSingleDoc(key, input, content, allFindings)}
                        className="rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition hover:border-[#0E4749] hover:shadow-sm">
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

            <StepNav onBack={() => setStep(4)} />
          </section>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold text-[#0E4749]">Dokumente werden erstellt und geprüft</p>
            <div className="h-2 bg-neutral-200 rounded overflow-hidden">
              <div className="h-full bg-[#0E4749] transition-all duration-500" style={{ width: `${Math.max(progressPct, 4)}%` }} />
            </div>
            <p className="text-xs text-neutral-700">{progress}</p>
            <p className="text-[11px] text-neutral-500">
              Nach der Formulierung läuft automatisch eine Qualitätssicherung über alle vier Dokumente. Erkannte Blocker werden in bis zu zwei Nachbesserungsläufen behoben – das kann eine bis zwei Minuten dauern.
            </p>
          </div>
        </div>
      )}



      <NotnagelCoach
        guide={COACH_GUIDES[step] ?? COACH_GUIDES[0]}
        topics={coachTopics}
        findings={findings}
        context={coachContext}
      />
    </div>
  );
}
