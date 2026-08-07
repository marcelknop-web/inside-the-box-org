import type { Finding, GeneratedContent, NotnagelInput } from "@/data/notnagelTypes";
import { deriveMtpd, deriveActivation } from "@/data/notnagelTypes";

/** Verbotene Platzhalter und typische KI-Floskeln in den generierten Dokumenten. */
const PLACEHOLDERS = /\b(xxx+|yyy+|zzz+|lorem ipsum|tbd|n\/a|\[[^\]]{0,40}\]|\{\{[^}]*\}\})/i;
const HOLLOW = /(state of the art|ganzheitlich|revolution|best practice|synerg)/i;
/** "Stufe 3" ohne S/A-Präfix ist eine unklare Skalenangabe. */
const BARE_STAGE = /(?<![SA])\bStufe\s?[1-4]\b/;

function texts(c: GeneratedContent): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const push = (where: string, v: unknown) => {
    if (typeof v === "string" && v.trim()) out.push({ where, text: v });
    else if (Array.isArray(v)) v.forEach((x) => push(where, typeof x === "string" ? x : Object.values(x ?? {}).join(" ")));
  };
  push("Managementzusammenfassung", c.managementSummary);
  const l = c.leitlinie ?? ({} as GeneratedContent["leitlinie"]);
  push("Leitlinie", l.zweck); push("Leitlinie", l.geltungsbereich);
  push("Leitlinie", l.zielsetzung); push("Leitlinie", l.kennzahlen);
  push("Leitlinie", (l.grundsaetze ?? []).map((g) => `${g.titel} ${g.text}`));
  push("Leitlinie", (l.rollen ?? []).map((r) => `${r.rolle} ${r.verantwortung}`));
  push("Leitlinie", (l.rahmen ?? []).map((r) => `${r.rahmenwerk} ${r.relevanz}`));
  push("Leitlinie", (l.lebenszyklus ?? []).map((r) => `${r.schritt} ${r.mindestanforderung}`));
  (c.bia ?? []).forEach((b) => {
    const w = `BIA ${b.processId}`;
    push(w, b.interpretation); push(w, b.mtpdBegruendung); push(w, b.rtoBegruendung);
    push(w, b.rpoBegruendung); push(w, b.ergebnis); push(w, b.handlungsbedarf);
  });
  const p = c.bcp ?? ({} as GeneratedContent["bcp"]);
  push("Notfallplan", p.zweck); push("Notfallplan", p.alarmierung); push("Notfallplan", p.notbetriebHinweis);
  push("Notfallplan", p.sofortmassnahmen); push("Notfallplan", p.wiederanlauf); push("Notfallplan", p.schnittstellen);
  push("Notfallplan", (p.aktivierung ?? []).map((a) => `${a.stufe} ${a.kriterium} ${a.reaktion}`));
  const t = c.tabletop ?? ({} as GeneratedContent["tabletop"]);
  push("Drehbuch", t.ausgangslage); push("Drehbuch", t.lernziele); push("Drehbuch", t.spielregeln);
  push("Drehbuch", t.hotwashFragen); push("Drehbuch", t.beobachtungskriterien); push("Drehbuch", t.nachbereitung);
  push("Drehbuch", (t.injects ?? []).map((i) => `${i.zeit} ${i.inject} ${i.erwarteteReaktion}`));
  return out;
}

function minutes(stamp: string): number | null {
  const m = /T\+\s*(\d{1,3})(?::(\d{2}))?/.exec(stamp || "");
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2] ?? 0);
}

/**
 * Fachliche Endprüfung der generierten Dokumentinhalte gegen die Eingaben.
 * Erzeugt Blocker, wenn ein Dokument unvollständig ist oder Kennzahlen von den
 * regelbasiert abgeleiteten Werten abweichen.
 */
export function checkGeneratedContent(input: NotnagelInput, c: GeneratedContent | null): Finding[] {
  const f: Finding[] = [];
  if (!c) return [{ severity: "blocker", where: "Dokumente", text: "Es liegen keine generierten Inhalte vor." }];

  // 1 Vollständigkeit
  if (!c.managementSummary || c.managementSummary.trim().length < 200)
    f.push({ severity: "blocker", where: "Managementzusammenfassung", text: "Zusammenfassung fehlt oder ist zu knapp für eine Managementvorlage." });
  const l = c.leitlinie;
  if (!l?.zweck || (l?.zielsetzung ?? []).length < 3)
    f.push({ severity: "blocker", where: "Leitlinie", text: "Zweck oder Zielsetzung der Leitlinie ist unvollständig." });
  if ((l?.rollen ?? []).length < 2)
    f.push({ severity: "warnung", where: "Leitlinie", text: "Weniger als zwei Rollen beschrieben – Verantwortlichkeiten bleiben unklar." });
  if ((l?.kennzahlen ?? []).length < 3)
    f.push({ severity: "warnung", where: "Leitlinie", text: "Zu wenige überprüfbare Kennzahlen für eine Wirksamkeitsbewertung." });

  // 2 BIA je Prozess
  const ids = new Set((c.bia ?? []).map((b) => b.processId));
  input.processes.forEach((p) => {
    if (!ids.has(p.id))
      f.push({ severity: "blocker", where: `BIA ${p.id}`, text: `Für "${p.name || p.id}" fehlt der BIA-Steckbrief.` });
  });
  (c.bia ?? []).forEach((b) => {
    const p = input.processes.find((x) => x.id === b.processId);
    if (!p) {
      f.push({ severity: "blocker", where: `BIA ${b.processId}`, text: "BIA-Eintrag ohne zugehörigen Prozess in den Eingaben." });
      return;
    }
    const { horizon, hours } = deriveMtpd(p);
    const all = `${b.mtpdBegruendung} ${b.rtoBegruendung} ${b.ergebnis} ${b.interpretation}`;
    if (!b.mtpdBegruendung || b.mtpdBegruendung.trim().length < 60)
      f.push({ severity: "blocker", where: `BIA ${b.processId}`, text: "MTPD-Begründung fehlt oder ist nicht prüfbar formuliert." });
    if (horizon && !all.includes(horizon) && !(hours && all.includes(String(hours))))
      f.push({ severity: "blocker", where: `BIA ${b.processId}`, text: `Der abgeleitete MTPD (${horizon}) wird im Text nicht aufgegriffen.` });
    const rto = Number(p.rtoHours);
    if (Number.isFinite(rto) && rto > 0) {
      const nums = (all.match(/(\d{1,3})\s*(?:Std|Stunden|h\b)/gi) ?? []).map((x) => Number(/\d+/.exec(x)![0]));
      if (nums.length && !nums.includes(rto) && hours && !nums.includes(hours))
        f.push({ severity: "warnung", where: `BIA ${b.processId}`, text: `Genannte Stundenwerte (${nums.join(", ")}) weichen von RTO ${rto} h / MTPD ${hours} h ab.` });
      if (hours && rto > hours)
        f.push({ severity: "blocker", where: `BIA ${b.processId}`, text: `RTO (${rto} h) liegt über dem MTPD (${hours} h).` });
    }

    if ((b.handlungsbedarf ?? []).length < 2)
      f.push({ severity: "warnung", where: `BIA ${b.processId}`, text: "Weniger als zwei Maßnahmen im Handlungsbedarf." });
  });

  // 3 Notfallplan gegen die regelbasierten Aktivierungsstufen
  const act = deriveActivation(input.processes);
  const stages = c.bcp?.aktivierung ?? [];
  if (stages.length !== 3)
    f.push({ severity: "blocker", where: "Notfallplan", text: `Es müssen genau drei Aktivierungsstufen (A1–A3) beschrieben sein, gefunden: ${stages.length}.` });
  act.forEach((a) => {
    const code = /A[1-3]/.exec(a.stufe)?.[0];
    const hit = stages.find((s) => code && s.stufe?.includes(code));
    if (!hit) {
      f.push({ severity: "blocker", where: "Notfallplan", text: `Aktivierungsstufe ${code ?? a.stufe} fehlt oder ist umbenannt.` });
      return;
    }
    if (!hit.reaktion || hit.reaktion.trim().length < 40)
      f.push({ severity: "warnung", where: "Notfallplan", text: `Reaktion zu ${code} ist zu unspezifisch.` });
  });
  if ((c.bcp?.sofortmassnahmen ?? []).length < 4)
    f.push({ severity: "blocker", where: "Notfallplan", text: "Weniger als vier Sofortmaßnahmen – die erste Stunde ist nicht abgedeckt." });
  if ((c.bcp?.wiederanlauf ?? []).length < 3)
    f.push({ severity: "warnung", where: "Notfallplan", text: "Wiederanlauf ist zu knapp beschrieben." });
  if (!c.bcp?.alarmierung || c.bcp.alarmierung.trim().length < 60)
    f.push({ severity: "warnung", where: "Notfallplan", text: "Alarmierungsweg ist nicht nachvollziehbar beschrieben." });

  // 4 Drehbuch
  const injects = c.tabletop?.injects ?? [];
  const wanted = Math.min(Math.max(Number(input.exercise.injectCount) || 6, 4), 10);
  if (injects.length < Math.min(4, wanted))
    f.push({ severity: "blocker", where: "Drehbuch", text: `Nur ${injects.length} Injects vorhanden, erwartet ${wanted}.` });
  else if (injects.length !== wanted)
    f.push({ severity: "warnung", where: "Drehbuch", text: `${injects.length} statt ${wanted} Injects.` });
  let last = -1;
  injects.forEach((i, idx) => {
    const m = minutes(i.zeit);
    if (m === null) f.push({ severity: "blocker", where: "Drehbuch", text: `Inject ${idx + 1} hat keinen T+-Zeitstempel.` });
    else {
      if (m < last) f.push({ severity: "blocker", where: "Drehbuch", text: `Inject ${idx + 1} (${i.zeit}) liegt zeitlich vor dem vorherigen Inject.` });
      last = Math.max(last, m);
    }
    if (!i.erwarteteReaktion || i.erwarteteReaktion.trim().length < 25)
      f.push({ severity: "warnung", where: "Drehbuch", text: `Inject ${idx + 1}: erwartete Reaktion ist zu unkonkret.` });
  });
  if (!c.tabletop?.ausgangslage || c.tabletop.ausgangslage.trim().length < 200)
    f.push({ severity: "blocker", where: "Drehbuch", text: "Ausgangslage ist zu knapp für einen Übungsstart." });
  if ((c.tabletop?.lernziele ?? []).length < 3)
    f.push({ severity: "warnung", where: "Drehbuch", text: "Weniger als drei Lernziele." });
  if ((c.tabletop?.hotwashFragen ?? []).length < 4)
    f.push({ severity: "warnung", where: "Drehbuch", text: "Auswertung (Hotwash) ist zu dünn." });

  // 5 Textqualität über alle Dokumente
  texts(c).forEach(({ where, text }) => {
    if (PLACEHOLDERS.test(text))
      f.push({ severity: "blocker", where, text: `Platzhalter im Text: "${text.slice(0, 80)}…"` });
    if (BARE_STAGE.test(text))
      f.push({ severity: "blocker", where, text: "Skalenangabe ohne Präfix (S… bzw. A…) – Schadens- und Aktivierungsstufe sind verwechselbar." });
    if (HOLLOW.test(text))
      f.push({ severity: "warnung", where, text: "Werbliche oder inhaltsleere Formulierung enthalten." });
  });

  return f;
}

/** Kurze, maschinenlesbare Korrekturaufträge für den Nachbesserungslauf. */
export function repairInstructions(findings: Finding[]): string[] {
  return findings
    .filter((f) => f.severity === "blocker" || f.severity === "warnung")
    .slice(0, 20)
    .map((f) => `${f.where}: ${f.text}`);
}
