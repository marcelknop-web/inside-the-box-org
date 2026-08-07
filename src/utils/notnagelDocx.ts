// Notnagel – Word-Export der vier BCM-Ergebnistypen.
// Erzeugung vollständig im Browser (docx + JSZip). Keine Persistenz.

import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, PageNumber, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
} from "docx";
import {
  DAMAGE_CATEGORIES, HORIZONS, SCALE, deriveMtpd, priorityOf, maxByHorizon, deriveActivation,
  type NotnagelInput, type GeneratedContent, type ProcessEntry, type Finding,
} from "@/data/notnagelTypes";

const TEAL = "0E4749";
const ACCENT = "1F6F6B";
const HEADERGREY = "EFF3F2";
const ALTROW = "F7FAF9";
const font = "Calibri";

const CONTENT_W = 9360; // A4 mit 1" Rändern (Letter-kompatibel gerastert)

const T = (text: string, opt: Partial<{ bold: boolean; italics: boolean; color: string; size: number }> = {}) =>
  new TextRun({ text: text ?? "", font, bold: opt.bold, italics: opt.italics, color: opt.color, size: opt.size ?? 22 });

const P = (text: string, opt: Partial<{ bold: boolean; italics: boolean; size: number; color: string; after: number }> = {}) =>
  new Paragraph({ children: [T(text, opt)], spacing: { after: opt.after ?? 140 } });

const H1 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [T(text, { bold: true, color: TEAL, size: 38 })], spacing: { before: 240, after: 200 } });
const H2 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [T(text, { bold: true, color: TEAL, size: 28 })], spacing: { before: 300, after: 140 }, keepNext: true });
const H3 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [T(text, { bold: true, color: ACCENT, size: 24 })], spacing: { before: 220, after: 100 }, keepNext: true });

const bullets = (items: unknown[]) =>
  (Array.isArray(items) ? items : [])
    .map((i) => String(i ?? "").trim())
    .filter((s) => s.length > 0 && !/^(x{2,}|y{2,}|tbd|placeholder)$/i.test(s))
    .map((s) => new Paragraph({ children: [T(s)], bullet: { level: 0 }, spacing: { after: 80 } }));

const numbered = (items: unknown[]) =>
  (Array.isArray(items) ? items : [])
    .map((i) => String(i ?? "").trim())
    .filter(Boolean)
    .map((s, i) => new Paragraph({ children: [T(`${i + 1}. `, { bold: true }), T(s)], spacing: { after: 80 }, indent: { left: 360, hanging: 360 } }));

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CBD8D6" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function cell(text: string, width: number, opt: Partial<{ head: boolean; alt: boolean; bold: boolean; center: boolean; size: number }> = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opt.head ? HEADERGREY : opt.alt ? ALTROW : "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [T(text, { bold: opt.head || opt.bold, size: opt.size ?? 20, color: opt.head ? TEAL : undefined })],
      alignment: opt.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 0 },
    })],
  });
}

function table(headers: string[], rows: string[][], widths: number[]) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { head: true })) }),
      ...rows.map((r, ri) => new TableRow({
        cantSplit: true,
        children: r.map((v, i) => cell(v, widths[i], { alt: ri % 2 === 1 })),
      })),
    ],
  });
}

function kvTable(pairs: [string, string][]) {
  const widths = [3100, 6260];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: pairs.map(([k, v], i) => new TableRow({
      cantSplit: true,
      children: [cell(k, widths[0], { bold: true, alt: i % 2 === 1 }), cell(v || "Noch offen", widths[1], { alt: i % 2 === 1 })],
    })),
  });
}

const styleDoc = {
  default: { document: { run: { font, size: 22 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 38, bold: true, font, color: TEAL },
      paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font, color: TEAL },
      paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, font, color: ACCENT },
      paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2 } },
  ],
};

function docShell(titleLine: string, children: any[]) {
  return new Document({
    styles: styleDoc,
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1276, right: 1276, bottom: 1276, left: 1276 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [T(titleLine, { size: 16, color: "6B7C7A" })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 4 } },
            spacing: { after: 120 },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              T("Notnagel · inside-the-box.org · Entwurf, fachliche Freigabe erforderlich · Seite ", { size: 16, color: "6B7C7A" }),
              new TextRun({ children: [PageNumber.CURRENT], font, size: 16, color: "6B7C7A" }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

function coverBlock(kicker: string, title: string, subtitle: string, meta: [string, string][]) {
  return [
    P(kicker.toUpperCase(), { size: 18, color: ACCENT, bold: true, after: 80 }),
    new Paragraph({ children: [T(title, { bold: true, color: TEAL, size: 48 })], spacing: { after: 120 } }),
    P(subtitle, { size: 24, color: "44514F", after: 320 }),
    kvTable(meta),
    P("", { after: 200 }),
  ];
}

const dateLabel = () => new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
const slug = (s: string) =>
  (s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "Bereich";

function mtpdLabel(p: ProcessEntry) {
  const { horizon, hours } = deriveMtpd(p);
  return horizon ? `${horizon} (${hours} Std.)` : "im Betrachtungszeitraum nicht erreicht";
}

function curveLabel(p: ProcessEntry) {
  const m = maxByHorizon(p);
  return HORIZONS.map((h) => `${h}: S${m[h]}`).join(" · ");
}

// ─── 1. BCM-Leitlinie ───
function buildLeitlinie(input: NotnagelInput, c: GeneratedContent) {
  const { profile, processes } = input;
  const L = c.leitlinie ?? ({} as GeneratedContent["leitlinie"]);
  const children: any[] = [
    ...coverBlock("Business Continuity Management", "BCM-Leitlinie", `${profile.area || "Fachbereich"} · ${profile.organisation || "Organisation"}`, [
      ["Dokumententyp", "Leitlinie (Vorgabedokument)"],
      ["Geltungsbereich", `${profile.area}${profile.sites ? `, ${profile.sites}` : ""}`],
      ["Verantwortlich", `${profile.owner}${profile.ownerFunction ? `, ${profile.ownerFunction}` : ""}`],
      ["BC-Koordination", profile.coordinator],
      ["Normativer Bezug", profile.regulatory.join(", ")],
      ["Version / Stand", `Entwurf 1.0 · ${dateLabel()}`],
    ]),
    H2("1 Zweck"),
    P(L.zweck || ""),
    H2("2 Zielsetzung"),
    ...bullets(L.zielsetzung),
    H2("3 Geltungsbereich"),
    P(L.geltungsbereich || ""),
    P("Einbezogene Prozesse:", { bold: true }),
    table(
      ["Prozess", "MTPD", "RTO", "Einordnung"],
      processes.map((p) => [`${p.id} – ${p.name}`, mtpdLabel(p), p.rtoHours ? `${p.rtoHours} Std.` : "offen", priorityOf(p).label]),
      [3900, 1900, 1200, 2360],
    ),
    P("", { after: 200 }),
    H2("4 Normativer Rahmen"),
    ...(Array.isArray(L.rahmen) && L.rahmen.length
      ? [table(["Rahmenwerk", "Relevanz für den Bereich"], L.rahmen.map((r) => [r.rahmenwerk ?? "", r.relevanz ?? ""]), [2600, 6760]), P("", { after: 200 })]
      : []),
    H2("5 Grundsätze"),
    ...(Array.isArray(L.grundsaetze) ? L.grundsaetze.flatMap((g) => [H3(g.titel ?? ""), P(g.text ?? "")]) : []),
    H2("6 Rollen und Verantwortlichkeiten"),
    ...(Array.isArray(L.rollen) && L.rollen.length
      ? [table(["Rolle", "Verantwortung"], L.rollen.map((r) => [r.rolle ?? "", r.verantwortung ?? ""]), [2600, 6760]), P("", { after: 200 })]
      : []),
    H2("7 BCM-Lebenszyklus und Mindestanforderungen"),
    ...(Array.isArray(L.lebenszyklus) && L.lebenszyklus.length
      ? [table(["Schritt", "Mindestanforderung"], L.lebenszyklus.map((r) => [r.schritt ?? "", r.mindestanforderung ?? ""]), [2600, 6760]), P("", { after: 200 })]
      : []),
    H2("8 Kennzahlen und Wirksamkeitsprüfung"),
    ...bullets(L.kennzahlen),
    H2("9 Freigabe"),
    kvTable([
      ["Erstellt", `${profile.coordinator || "BC-Koordination"} · ${dateLabel()}`],
      ["Fachlich geprüft", profile.owner || "Noch offen"],
      ["Freigegeben", "Noch offen – Leitungsentscheidung"],
      ["Nächste Überprüfung", "Spätestens 12 Monate nach Freigabe oder bei wesentlichen Änderungen"],
    ]),
  ];
  return docShell(`BCM-Leitlinie · ${profile.area} · ${profile.organisation}`, children);
}

// ─── 2. Business Impact Analyse ───
function buildBia(input: NotnagelInput, c: GeneratedContent) {
  const { profile, processes } = input;
  const children: any[] = [
    ...coverBlock("Business Impact Analyse", "BIA", `${profile.area || "Fachbereich"} · ${profile.organisation || "Organisation"}`, [
      ["Dokumententyp", "Business Impact Analyse (Nachweisdokument)"],
      ["Fachbereich", profile.area],
      ["Verantwortlich", `${profile.owner}${profile.ownerFunction ? `, ${profile.ownerFunction}` : ""}`],
      ["Erfasste Prozesse", String(processes.length)],
      ["Methodik", "Schadensverlauf über 4 Zeithorizonte, Schadensstufen S1–S4; MTPD = erster Horizont, an dem eine Kategorie S3 erreicht"],
      ["Version / Stand", `Entwurf 1.0 · ${dateLabel()}`],
    ]),
    H2("Managementzusammenfassung"),
    P(c.managementSummary || ""),
    H2("Bewertungsskala der Schadensstufen"),
    table(
      ["Schadensstufe", "Bezeichnung", "Bedeutung"],
      SCALE.map((s) => [s.code, s.name, s.hint]),
      [900, 2200, 6260],
    ),
    P("", { after: 120 }),
    P("MTPD (Maximum Tolerable Period of Disruption) ist die längste Ausfalldauer, die der Bereich noch verkraftet. RTO (Recovery Time Objective) ist die angestrebte Wiederanlaufzeit und liegt bewusst darunter. RPO (Recovery Point Objective) beschreibt den maximal tolerierbaren Datenverlust.", { italics: true, size: 20 }),
    H2("Ergebnisübersicht"),
    table(
      ["Prozess", "MTPD", "RTO", "RPO", "Einordnung"],
      processes.map((p) => [`${p.id} – ${p.name}`, mtpdLabel(p), p.rtoHours ? `${p.rtoHours} Std.` : "offen", p.rpoHours ? `${p.rpoHours} Std.` : "offen", priorityOf(p).label]),
      [3200, 1700, 1100, 1100, 2260],
    ),
  ];

  processes.forEach((p, idx) => {
    const bia = (c.bia ?? []).find((b) => b.processId === p.id) ?? (c.bia ?? [])[idx];
    const m = maxByHorizon(p);
    children.push(
      new Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0 } }),
      H1(`${p.id} – ${p.name}`),
      H2("1 Prozesssteckbrief"),
      kvTable([
        ["Prozess", p.name],
        ["Kurzbeschreibung", p.description],
        ["Betriebszeiten", p.operatingHours],
        ["Leistungsempfänger", p.recipients],
        ["Prozessverantwortlich", `${profile.owner}${profile.ownerFunction ? `, ${profile.ownerFunction}` : ""}`],
      ]),
      H2("2 Schadensverlauf"),
      table(
        ["Schadenskategorie", ...HORIZONS],
        DAMAGE_CATEGORIES.map((cat) => [cat.label, ...HORIZONS.map((h) => String(p.matrix[cat.key][h]))]),
        [4560, 1200, 1200, 1200, 1200],
      ),
      P("", { after: 100 }),
      P(`Höchste Schadensstufe je Horizont: ${HORIZONS.map((h) => `${h} → S${m[h]}`).join(" · ")}`, { size: 20, italics: true }),
      P(bia?.interpretation || "", { after: 140 }),
      H2("3 Kontinuitätsanforderungen"),
      kvTable([
        ["MTPD (abgeleitet)", mtpdLabel(p)],
        ["Begründung MTPD", bia?.mtpdBegruendung || ""],
        ["RTO", p.rtoHours ? `${p.rtoHours} Stunden` : "Noch offen"],
        ["Begründung RTO", bia?.rtoBegruendung || ""],
        ["RPO", p.rpoHours ? `${p.rpoHours} Stunden` : "Noch offen"],
        ["Begründung RPO", bia?.rpoBegruendung || ""],
        ["Mindest-Notbetrieb", p.minimumService],
      ]),
      H2("4 Abhängigkeiten und vitale Ressourcen"),
      table(
        ["Art", "Ressource", "Kritikalität", "Single Point of Failure"],
        p.resources.map((r) => [r.kind, r.description, r.criticality, r.singlePointOfFailure ? "ja" : "nein"]),
        [1900, 4560, 1400, 1500],
      ),
      P("", { after: 160 }),
      H2("5 Notbetriebsverfahren"),
      table(
        ["Ausfallszenario", "Verfahren", "Tragfähig bis"],
        p.workarounds.map((w) => [w.scenario, w.procedure, w.limitHours ? `${w.limitHours} Std.` : "offen"]),
        [2400, 5460, 1500],
      ),
      P("", { after: 160 }),
      H2("6 Ergebnis und Handlungsbedarf"),
      P(bia?.ergebnis || ""),
      ...bullets(bia?.handlungsbedarf ?? []),
    );
  });

  children.push(
    H2("Bestätigung"),
    kvTable([
      ["Erhebung durchgeführt", `${profile.coordinator || "BC-Koordination"} · ${dateLabel()}`],
      ["Fachliche Bestätigung", `${profile.owner || "Noch offen"} (Unterschrift / Datum: ______________)`],
      ["Weitergabe an", "IT-Betrieb (RTO/RPO), BCM-Gesamtverantwortung, Krisenmanagement"],
    ]),
  );
  return docShell(`BIA · ${profile.area} · ${profile.organisation}`, children);
}

// ─── 3. Notfallplan / BCP ───
function buildBcp(input: NotnagelInput, c: GeneratedContent) {
  const { profile, processes, team } = input;
  const B = c.bcp ?? ({} as GeneratedContent["bcp"]);
  const children: any[] = [
    ...coverBlock("Notfallplan", "Business Continuity Plan", `${profile.area || "Fachbereich"} · ${profile.organisation || "Organisation"}`, [
      ["Dokumententyp", "Notfallplan (Handlungsdokument)"],
      ["Gültig für", `${profile.area}${profile.sites ? `, ${profile.sites}` : ""}`],
      ["Notfallleitung Bereich", team[0]?.primary || "Noch offen"],
      ["Alarmierungsweg", profile.alarmChannel],
      ["Anbindung", profile.crisisTeamRef],
      ["Version / Stand", `Entwurf 1.0 · ${dateLabel()}`],
    ]),
    H2("1 Zweck und Anwendung"),
    P(B.zweck || ""),
    H2("2 Aktivierung"),
    // Stufenbezeichnung und Auslösekriterium kommen regelbasiert aus BIA-Werten,
    // damit Notfallplan und BIA identische Zeitgrenzen nennen.
    table(
      ["Aktivierungsstufe", "Auslösekriterium", "Reaktion"],
      deriveActivation(processes).map((a, i) => [a.stufe, a.kriterium, B.aktivierung?.[i]?.reaktion?.trim() || a.reaktion]),
      [1900, 3730, 3730],
    ),
    P("", { after: 160 }),
    P("Die Aktivierungsstufen A1 bis A3 steuern die Eskalation und sind nicht mit den Schadensstufen S1 bis S4 der Business Impact Analyse zu verwechseln.", { italics: true, size: 20, after: 160 }),
    P("Zeitvorgaben aus der BIA:", { bold: true }),
    table(
      ["Prozess", "MTPD", "RTO", "RPO"],
      processes.map((p) => [`${p.id} – ${p.name}`, mtpdLabel(p), p.rtoHours ? `${p.rtoHours} Std.` : "offen", p.rpoHours ? `${p.rpoHours} Std.` : "offen"]),
      [4260, 1900, 1600, 1600],
    ),
    P("", { after: 160 }),
    H2("3 Alarmierung und Erreichbarkeit"),
    P(B.alarmierung || ""),
    table(
      ["Rolle", "Besetzung", "Vertretung", "Erreichbarkeit"],
      team.map((t) => [t.role, t.primary || "Noch offen", t.deputy || "Noch offen", "______________"]),
      [2400, 2500, 2500, 1960],
    ),
    P("", { after: 160 }),
    H2("4 Sofortmaßnahmen (erste 60 Minuten)"),
    ...numbered(B.sofortmassnahmen),
    H2("5 Notbetrieb"),
    P(B.notbetriebHinweis || ""),
  ];

  processes.forEach((p) => {
    children.push(
      H3(`${p.id} – ${p.name}`),
      P(`Mindest-Notbetrieb: ${p.minimumService || "Noch offen"}`, { size: 20 }),
      table(
        ["Ausfallszenario", "Notbetriebsverfahren", "Tragfähig bis"],
        p.workarounds.map((w) => [w.scenario, w.procedure, w.limitHours ? `${w.limitHours} Std.` : "offen"]),
        [2400, 5460, 1500],
      ),
      P("", { after: 160 }),
    );
  });

  children.push(
    H2("6 Wiederanlauf und Rückkehr in den Normalbetrieb"),
    ...numbered(B.wiederanlauf),
    H2("7 Schnittstellen"),
    ...bullets(B.schnittstellen),
    H2("8 Dokumentation im Ereignisfall"),
    table(
      ["Zeit", "Ereignis / Meldung", "Entscheidung", "Verantwortlich"],
      [["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""]],
      [1300, 3700, 2900, 1460],
    ),
    P("", { after: 160 }),
    P("Das Protokoll ist Nachweis gegenüber Aufsicht, Kunden und internen Prüfern. Es wird ab Aktivierung lückenlos geführt.", { italics: true, size: 20 }),
  );
  return docShell(`Notfallplan · ${profile.area} · ${profile.organisation}`, children);
}

// ─── 4. Tabletop-Drehbuch ───
function buildTabletop(input: NotnagelInput, c: GeneratedContent) {
  const { profile, exercise, team } = input;
  const X = c.tabletop ?? ({} as GeneratedContent["tabletop"]);
  const children: any[] = [
    ...coverBlock("Tabletop-Übung", "Übungsdrehbuch", `${profile.area || "Fachbereich"} · ${profile.organisation || "Organisation"}`, [
      ["Dokumententyp", "Drehbuch für die Übungsleitung (nicht an Teilnehmer verteilen)"],
      ["Dauer", exercise.duration],
      ["Szenario", exercise.scenario],
      ["Teilnehmer", exercise.participants],
      ["Übungsleitung", exercise.facilitator || "Noch offen"],
      ["Erfahrungsstand", exercise.level],
      ["Version / Stand", `Entwurf 1.0 · ${dateLabel()}`],
    ]),
    H2("1 Ziele und Rahmen"),
    ...bullets(X.lernziele),
    H2("2 Spielregeln"),
    ...bullets(X.spielregeln),
    H2("3 Ausgangslage (wird vorgelesen)"),
    P(X.ausgangslage || ""),
    H2("4 Inject-Plan"),
    ...(Array.isArray(X.injects) && X.injects.length
      ? [table(["Zeit", "Inject (wörtlich)", "Erwartete Reaktion"], X.injects.map((i) => [i.zeit ?? "", i.inject ?? "", i.erwarteteReaktion ?? ""]), [1200, 4880, 3280]), P("", { after: 160 })]
      : []),
    H2("5 Beobachtungskriterien"),
    ...bullets(X.beobachtungskriterien),
    H2("6 Auswertung (Hotwash)"),
    ...bullets(X.hotwashFragen),
    H2("7 Rollen im Übungsraum"),
    table(
      ["Rolle", "Besetzung", "Vertretung"],
      team.map((t) => [t.role, t.primary || "Noch offen", t.deputy || "Noch offen"]),
      [3100, 3130, 3130],
    ),
    P("", { after: 160 }),
    H2("8 Nachbereitung"),
    ...numbered(X.nachbereitung),
    H2("9 Maßnahmenliste aus der Übung"),
    table(
      ["Nr.", "Maßnahme", "Verantwortlich", "Frist"],
      [["1", "", "", ""], ["2", "", "", ""], ["3", "", "", ""], ["4", "", "", ""], ["5", "", "", ""]],
      [800, 5100, 2100, 1360],
    ),
  ];
  return docShell(`Tabletop-Drehbuch · ${profile.area} · ${profile.organisation}`, children);
}

// ─── 5. Prüfprotokoll (Qualitätssicherung) ───
function buildQaLog(input: NotnagelInput, findings: Finding[]) {
  const { profile } = input;
  const rows = findings.length
    ? findings.map((f) => [f.severity === "blocker" ? "Blocker" : f.severity === "warnung" ? "Warnung" : "Hinweis", f.where, f.text])
    : [["–", "–", "Keine Auffälligkeiten festgestellt."]];
  return docShell(`Prüfprotokoll · ${profile.area}`, [
    ...coverBlock("Qualitätssicherung", "Prüfprotokoll", `${profile.area || "Fachbereich"} · ${profile.organisation || "Organisation"}`, [
      ["Prüfzeitpunkt", dateLabel()],
      ["Prüfumfang", "Vollständigkeit, Plausibilität des Schadensverlaufs, Konsistenz von MTPD, RTO und RPO, Notbetrieb, Rollenbesetzung"],
      ["Prüfart", "Regelbasiert, automatisiert vor der Dokumenterzeugung"],
    ]),
    H2("Ergebnisse"),
    table(["Einstufung", "Fundstelle", "Feststellung"], rows, [1600, 2800, 4960]),
    P("", { after: 160 }),
    P("Blocker verhindern die Freigabe der Dokumente. Warnungen und Hinweise sind vom Fachbereich zu bewerten und zu dokumentieren.", { italics: true, size: 20 }),
  ]);
}

export async function buildNotnagelZip(
  input: NotnagelInput,
  content: GeneratedContent,
  findings: Finding[],
  onProgress?: (done: number, total: number, label: string) => void,
) {
  const base = `${slug(input.profile.organisation)}_${slug(input.profile.area)}`;
  const jobs: { label: string; file: string; doc: Document }[] = [
    { label: "BCM-Leitlinie wird erstellt …", file: `01_BCM-Leitlinie_${base}.docx`, doc: buildLeitlinie(input, content) },
    { label: "Business Impact Analyse wird erstellt …", file: `02_BIA_${base}.docx`, doc: buildBia(input, content) },
    { label: "Notfallplan wird erstellt …", file: `03_Notfallplan_BCP_${base}.docx`, doc: buildBcp(input, content) },
    { label: "Tabletop-Drehbuch wird erstellt …", file: `04_Tabletop_Drehbuch_${base}.docx`, doc: buildTabletop(input, content) },
    { label: "Prüfprotokoll wird erstellt …", file: `05_Pruefprotokoll_${base}.docx`, doc: buildQaLog(input, findings) },
  ];

  const zip = new JSZip();
  for (let i = 0; i < jobs.length; i++) {
    onProgress?.(i, jobs.length + 1, jobs[i].label);
    const blob = await Packer.toBlob(jobs[i].doc);
    zip.file(jobs[i].file, blob);
  }
  onProgress?.(jobs.length, jobs.length + 1, "Paket wird gepackt …");
  const out = await zip.generateAsync({ type: "blob" });
  saveAs(out, `Notnagel_BCM_${base}.zip`);
  onProgress?.(jobs.length + 1, jobs.length + 1, "Download bereit");
}

export async function downloadSingleDoc(
  which: "leitlinie" | "bia" | "bcp" | "tabletop" | "qa",
  input: NotnagelInput,
  content: GeneratedContent,
  findings: Finding[],
) {
  const base = `${slug(input.profile.organisation)}_${slug(input.profile.area)}`;
  const map = {
    leitlinie: { doc: () => buildLeitlinie(input, content), file: `01_BCM-Leitlinie_${base}.docx` },
    bia: { doc: () => buildBia(input, content), file: `02_BIA_${base}.docx` },
    bcp: { doc: () => buildBcp(input, content), file: `03_Notfallplan_BCP_${base}.docx` },
    tabletop: { doc: () => buildTabletop(input, content), file: `04_Tabletop_Drehbuch_${base}.docx` },
    qa: { doc: () => buildQaLog(input, findings), file: `05_Pruefprotokoll_${base}.docx` },
  } as const;
  const blob = await Packer.toBlob(map[which].doc());
  saveAs(blob, map[which].file);
}

export const notnagelCurveLabel = curveLabel;
