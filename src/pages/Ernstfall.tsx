import { useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, PageNumber, HeadingLevel, LevelFormat, BorderStyle, WidthType, ShadingType,
  PageBreak, TableOfContents,
} from "docx";

// ─── Design tokens (strict brand: only ERNSTLFALL / inside-the-box.org) ───
const DARKBLUE = "1F3864";
const HEADERGREY = "F2F2F2";
const ALTROW = "F7F9FC";
const RED = "C00000";

// ─── Topic catalog ───
const TOPICS = [
  "Ransomware / Verschlüsselung interner Systeme",
  "Ausfall des zentralen IT-Dienstleisters (Kernbankverfahren)",
  "Störung des Zahlungsverkehrs (SEPA, Karten, Instant Payments)",
  "DDoS auf Online-Banking und Website",
  "CEO-Fraud / Zahlungsbetrug",
  "Datenabfluss / Erpressung mit Kundendaten",
  "Innentäter",
  "Social Engineering in der Filiale",
  "Cloud-/SaaS-Ausfall (M365, Telefonie)",
  "Physisches Ereignis (Brand, Stromausfall Hauptstelle)",
];

type Weight = "Randthema" | "Kernthema" | "Leitthema";
interface BankProfile {
  name: string;
  bilanzsumme: string;
  mitarbeiter: string;
  filialen: string;
  itDienstleister: string;
  besonderheiten: string;
}
interface Inject {
  id: string; zeitpunkt: string; phase: string; pflicht: boolean; titel: string;
  themaTag: string; einspielkanal: string; inhalt: string; erwarteteReaktion: string;
  regieanweisung: string; diskussionsimpulse: string[]; rueckfragen: { frage: string; antwort: string }[];
  beobachtungsfokus: string;
  abhaengigVon?: string;
}
interface Rolle { name: string; profil: string; aufgaben: string[]; spannungsfeld: string }
interface Exercise {
  uebungsname: string;
  kurzbeschreibung: string;
  groundTruth: { bankProfil: string; angreiferOderUrsache: string; timeline: {zeitpunkt:string;ereignis:string}[]; erschwernisse: string[]; klassifizierungsZeitpunkt?: string };
  uebungsziele: string[];
  ablaufplan: { zeit: string; abschnitt: string; inhalt: string }[];
  injects: Inject[];
  rollen: Rolle[];
  meldepflichten: { adressat: string; frist: string }[];
  hotwashHinweise: string[];
}

const DEFAULT_BANK: BankProfile = {
  name: "Volksbank Musterregion eG",
  bilanzsumme: "2,1 Mrd. EUR",
  mitarbeiter: "320",
  filialen: "14",
  itDienstleister: "genoDATA eG (fiktiv)",
  besonderheiten: "",
};

function slug(s: string) {
  return (s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "Bank";
}

// ─── docx helpers ───
const font = "Calibri";
const T = (text: string, opt: Partial<{ bold: boolean; italics: boolean; color: string; size: number }> = {}) =>
  new TextRun({ text, font, bold: opt.bold, italics: opt.italics, color: opt.color, size: opt.size ?? 22 });

const P = (children: TextRun[], opt: Partial<{ heading: (typeof HeadingLevel)[keyof typeof HeadingLevel]; align: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing: number }> = {}) =>
  new Paragraph({ children, heading: opt.heading, alignment: opt.align, spacing: { after: opt.spacing ?? 120 } });

const H1 = (text: string) =>
  new Paragraph({ children: [new TextRun({ text, font, bold: true, color: DARKBLUE, size: 40 })], spacing: { before: 240, after: 200 } });
const H2 = (text: string) =>
  new Paragraph({ children: [new TextRun({ text, font, bold: true, color: DARKBLUE, size: 30 })], spacing: { before: 280, after: 140 } });
const H3 = (text: string) =>
  new Paragraph({ children: [new TextRun({ text, font, bold: true, color: DARKBLUE, size: 26 })], spacing: { before: 200, after: 100 } });

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function cell(text: string | Paragraph[], opts: { width: number; header?: boolean; alt?: boolean; bold?: boolean } = { width: 3000 }) {
  const children = Array.isArray(text) ? text : [new Paragraph({
    children: [new TextRun({ text: text || "", font, size: 22, bold: opts.bold || opts.header, color: opts.header ? "FFFFFF" : "000000" })],
    spacing: { after: 60 },
  })];
  return new TableCell({
    borders: cellBorders,
    width: { size: opts.width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: opts.header ? { fill: DARKBLUE, type: ShadingType.CLEAR } : opts.alt ? { fill: ALTROW, type: ShadingType.CLEAR } : undefined,
    children,
  });
}

function kvTable(rows: [string, string][], colA = 3000, colB = 6360) {
  return new Table({
    width: { size: colA + colB, type: WidthType.DXA },
    columnWidths: [colA, colB],
    rows: rows.map(([k, v], i) => new TableRow({
      children: [
        cell(k, { width: colA, bold: true, alt: i % 2 === 1 }),
        cell(v, { width: colB, alt: i % 2 === 1 }),
      ],
    })),
  });
}

function dataTable(headers: string[], rows: string[][], widths: number[]) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { width: widths[i], header: true })) }),
      ...rows.map((r, ri) => new TableRow({
        children: r.map((v, i) => cell(v, { width: widths[i], alt: ri % 2 === 1 })),
      })),
    ],
  });
}

function bulletsNumbering() {
  return {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  };
}

function bullet(text: string, ref: "bullets" | "numbers" = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun({ text, font, size: 22 })],
    spacing: { after: 60 },
  });
}

function titleBlock(docTitle: string, uebungsname: string, classification: string) {
  return [
    new Paragraph({ children: [new TextRun({ text: "inside-the-box.org · Krisenstabsübung", font, size: 18, color: "808080" })], spacing: { after: 60 } }),
    H1(docTitle),
    new Paragraph({ children: [new TextRun({ text: `${uebungsname} · ERNSTLFALL`, font, size: 22, bold: true, color: DARKBLUE })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: classification, font, size: 22, bold: true, color: RED })], spacing: { after: 300 } }),
  ];
}

function makeSection(uebungsname: string, children: any[]) {
  return {
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
    },
    headers: {},
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${uebungsname} · inside-the-box.org · Seite `, font, size: 18, color: "808080" }),
            new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: "808080" }),
          ],
        })],
      }),
    },
    children,
  };
}

// ─── Document builders ───
function buildTrainerGuide(ex: Exercise, bank: BankProfile): Document {
  const children: any[] = [
    ...titleBlock("Trainer Guide", ex.uebungsname, "NUR FÜR DIE ÜBUNGSLEITUNG"),
    H2("Übungsübersicht"),
    kvTable([
      ["Übungsname", ex.uebungsname],
      ["Bank", bank.name],
      ["Storyline", ex.kurzbeschreibung],
      ["Anzahl Injects", String(ex.injects.length)],
      ["Rollen", String(ex.rollen.length)],
    ]),
    H2("Übungsziele"),
    ...ex.uebungsziele.map((z) => bullet(z, "numbers")),
    H2("Ground Truth – Bankprofil"),
    P([T(ex.groundTruth.bankProfil)]),
    H3("Angreifer / Ursache"),
    P([T(ex.groundTruth.angreiferOderUrsache)]),
    H3("Timeline (nur für Übungsleitung)"),
    dataTable(["Zeitpunkt", "Ereignis"], ex.groundTruth.timeline.map((t) => [t.zeitpunkt, t.ereignis]), [2200, 7160]),
    H3("Erschwernisse"),
    ...ex.groundTruth.erschwernisse.map((e) => bullet(e)),
    H2("Ablaufplan"),
    dataTable(["Zeit", "Abschnitt", "Inhalt"], ex.ablaufplan.map((a) => [a.zeit, a.abschnitt, a.inhalt]), [1600, 2400, 5360]),
    H2("Übungsregeln"),
    ...[
      "Zeit im Übungsraum entspricht der Simulationszeit; Übungsleitung steuert Sprünge.",
      "Reale Systeme werden nicht angefasst; alle Aktionen werden protokolliert, nicht ausgeführt.",
      "Annahmen werden explizit als Annahme markiert und im Lagebild getrennt von Fakten geführt.",
      "Regieanweisungen sind nur für die Übungsleitung. Teilnehmer erhalten ausschließlich Inject-Inhalt.",
      "Meldepflichten werden auf dem Arbeitsblatt dokumentiert, keine echten Meldungen ausgelöst.",
    ].map((r) => bullet(r)),
    H2("Bewertungskriterien"),
    ...[
      "Lagebild – Vollständigkeit, Aktualität, Trennung Fakt/Annahme",
      "Entscheidungsqualität – Grundlage, Alternativen, Zeitpunkt",
      "Kommunikation – intern, extern, Aufsicht, Medien",
      "Rollenklarheit – Zuständigkeiten, Übergaben, Eskalation",
      "Meldepflichten – Fristen erkannt und dokumentiert",
      "Auftragsmanagement – Aufträge klar, priorisiert, nachverfolgt",
    ].map((r) => bullet(r)),
    H2("Hotwash-Anleitung"),
    P([T("Direkt im Anschluss an die Übung. Reihenfolge: Was ist passiert? Was hat funktioniert? Was hat nicht funktioniert? Was nehmen wir mit?")]),
    ...ex.hotwashHinweise.map((h) => bullet(h)),
  ];

  return new Document({
    creator: "ERNSTLFALL", title: `${ex.uebungsname} – Trainer Guide`,
    styles: { default: { document: { run: { font, size: 22 } } } },
    numbering: bulletsNumbering(),
    sections: [makeSection(ex.uebungsname, children)],
  });
}

function buildInjectCards(ex: Exercise): Document {
  const kids: any[] = [
    ...titleBlock("Inject-Karten", ex.uebungsname, "NUR FÜR DIE ÜBUNGSLEITUNG"),
  ];
  ex.injects.forEach((inj, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H2(`${inj.id} – ${inj.titel}`));
    kids.push(kvTable([
      ["Zeitpunkt", inj.zeitpunkt],
      ["Phase", inj.pflicht ? `${inj.phase} · PFLICHT-INJECT` : inj.phase],
      ["Thema", inj.themaTag],
      ["Einspielkanal", inj.einspielkanal],
    ], 2400, 6960));
    kids.push(H3("Inhalt (ausspielen)"));
    kids.push(P([T(inj.inhalt)]));
    kids.push(H3("Erwartete Reaktion"));
    kids.push(P([T(inj.erwarteteReaktion)]));
  });
  return new Document({
    creator: "ERNSTLFALL", title: `${ex.uebungsname} – Inject-Karten`,
    styles: { default: { document: { run: { font, size: 22 } } } },
    numbering: bulletsNumbering(),
    sections: [makeSection(ex.uebungsname, kids)],
  });
}

function buildRollenkarten(ex: Exercise): Document {
  const kids: any[] = [
    ...titleBlock("Rollenkarten", ex.uebungsname, "JEDE KARTE NUR AN DEN JEWEILIGEN ROLLENINHABER"),
  ];
  ex.rollen.forEach((r, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H2(r.name));
    kids.push(H3("Ihre Rolle"));
    kids.push(P([T(r.profil)]));
    kids.push(H3("Ihre Aufgaben"));
    r.aufgaben.forEach((a) => kids.push(bullet(a)));
    kids.push(H3("Ihr Spannungsfeld (vertraulich – nicht teilen)"));
    kids.push(P([T(r.spannungsfeld, { italics: true })]));
  });
  return new Document({
    creator: "ERNSTLFALL", title: `${ex.uebungsname} – Rollenkarten`,
    styles: { default: { document: { run: { font, size: 22 } } } },
    numbering: bulletsNumbering(),
    sections: [makeSection(ex.uebungsname, kids)],
  });
}

function buildWorksheet(ex: Exercise): Document {
  const firstInject = ex.injects[0];
  const emptyRows = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => ""));
  const kids: any[] = [
    ...titleBlock("Teilnehmer-Arbeitsbuch", ex.uebungsname, "AN ALLE TEILNEHMER"),
    H2("Ausgangslage"),
    P([T(firstInject?.inhalt || "")]),
    H2("Spielregeln"),
    ...[
      "Sie arbeiten mit den Informationen, die Ihnen ausgespielt werden.",
      "Trennen Sie im Lagebild klar zwischen Fakt und Annahme.",
      "Entscheidungen und Aufträge dokumentieren – nicht real auslösen.",
      "Fragen an die Übungsleitung, nicht an reale Ansprechpartner.",
    ].map((s) => bullet(s)),
    H2("Leitfragen"),
    ...[
      "Wer hat die Führung im Krisenstab?",
      "Welche Informationen fehlen aktuell, wer beschafft sie bis wann?",
      "Welche Meldepflichten sind einschlägig, welche Fristen laufen bereits?",
      "Wer kommuniziert intern, extern, gegenüber Aufsicht und Medien?",
      "Welche Sofortmaßnahmen sind reversibel, welche nicht?",
    ].map((s) => bullet(s)),
    H2("Lagebild"),
    dataTable(["Uhrzeit", "Information", "Quelle", "Fakt/Annahme"], emptyRows(14, 4), [1600, 4400, 1800, 1560]),
    H2("Entscheidungslog"),
    dataTable(["Uhrzeit", "Entscheidung", "Begründung", "Verantwortlich"], emptyRows(10, 4), [1600, 3800, 2400, 1560]),
    H2("Auftragsliste"),
    dataTable(["Auftrag", "Verantwortlich", "Fällig", "Status"], emptyRows(10, 4), [4200, 2400, 1400, 1360]),
    H2("Meldepflichten – Arbeitsblatt"),
    dataTable(
      ["Adressat", "Frist (Vorgabe)", "Fällig um", "Verantwortlich", "Status"],
      ex.meldepflichten.map((m) => [m.adressat, m.frist, "", "", ""]),
      [2800, 2200, 1600, 1400, 1360],
    ),
    H2("Reflexionsfragen"),
    ...[
      "Wo haben wir Zeit verloren – und warum?",
      "Welche Entscheidung würden wir mit Wissen von heute anders treffen?",
      "Welche Rolle war überlastet, welche unterausgelastet?",
      "Welche Informationen kamen zu spät oder gar nicht?",
      "Welche drei Maßnahmen setzen wir bis nächste Woche um?",
    ].map((s) => bullet(s)),
  ];
  return new Document({
    creator: "ERNSTLFALL", title: `${ex.uebungsname} – Teilnehmer-Arbeitsbuch`,
    styles: { default: { document: { run: { font, size: 22 } } } },
    numbering: bulletsNumbering(),
    sections: [makeSection(ex.uebungsname, kids)],
  });
}

function buildDrehbuch(ex: Exercise): Document {
  const kids: any[] = [
    ...titleBlock("Trainer-Drehbuch", ex.uebungsname, "NUR FÜR DIE ÜBUNGSLEITUNG"),
    H2("Moderations-Grundhaltung"),
    ...[
      "Ruhe halten, Fragen zurückspiegeln, nicht Lösungen liefern.",
      "Zeitdruck erzeugen ohne den Kopf zu drücken – Fristen laut aussprechen.",
      "Beobachten statt eingreifen, Erschwernisse nur dosiert nachschieben.",
      "Bei Sackgassen: gezielte Rückfrage aus der Liste unten, kein Auflösen der Ground Truth.",
    ].map((s) => bullet(s)),
    H2("Briefing-Ablauf"),
    ...[
      "Begrüßung, Zweck, Vertraulichkeit klarstellen.",
      "Rollen ausgeben, Spielregeln durchgehen, Uhr auf T+00 stellen.",
      "Arbeitsblätter verteilen, Übersicht Lagebild/Entscheidungslog erklären.",
      "Erstes Inject einspielen, Uhr starten.",
    ].map((s) => bullet(s, "numbers")),
    H2("Injects – Regie"),
  ];
  ex.injects.forEach((inj, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H3(`${inj.id} – ${inj.titel} (${inj.zeitpunkt})`));
    kids.push(P([T("Regieanweisung", { bold: true })]));
    kids.push(P([T(inj.regieanweisung)]));
    kids.push(P([T("Diskussionsimpulse", { bold: true })]));
    inj.diskussionsimpulse.forEach((d) => kids.push(bullet(d)));
    kids.push(P([T("Rückfragen und Antworten", { bold: true })]));
    kids.push(dataTable(["Rückfrage", "Antwort"], inj.rueckfragen.map((r) => [r.frage, r.antwort]), [4200, 5160]));
    kids.push(P([T(`Beobachtungsfokus: ${inj.beobachtungsfokus}`, { italics: true })]));
  });
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(H2("Hotwash-Moderation"),
    ...[
      "Zeitfenster 45–60 Minuten unmittelbar nach der Übung.",
      "Runde 1: Emotionale Entlastung – jeder ein Satz.",
      "Runde 2: Fakten – was ist passiert, was hat funktioniert.",
      "Runde 3: Verbesserungen – konkret, benannt, mit Verantwortlichen.",
      "Abschluss: drei Maßnahmen mit Datum, in schriftliche Nachbereitung überführen.",
    ].map((s) => bullet(s)));
  ex.hotwashHinweise.forEach((h) => kids.push(bullet(h)));
  return new Document({
    creator: "ERNSTLFALL", title: `${ex.uebungsname} – Trainer-Drehbuch`,
    styles: { default: { document: { run: { font, size: 22 } } } },
    numbering: bulletsNumbering(),
    sections: [makeSection(ex.uebungsname, kids)],
  });
}

async function buildZip(
  ex: Exercise,
  bank: BankProfile,
  onProgress?: (done: number, total: number, label: string) => void,
) {
  const zip = new JSZip();
  const files: [string, () => Document][] = [
    ["01_Trainer_Guide.docx", () => buildTrainerGuide(ex, bank)],
    ["02_Inject_Cards.docx", () => buildInjectCards(ex)],
    ["03_Rollenkarten.docx", () => buildRollenkarten(ex)],
    ["04_Teilnehmer_Worksheet.docx", () => buildWorksheet(ex)],
    ["05_Trainer_Drehbuch.docx", () => buildDrehbuch(ex)],
  ];
  const total = files.length + 1;
  let done = 0;
  for (const [name, factory] of files) {
    onProgress?.(done, total, `Erzeuge ${name} …`);
    const blob = await Packer.toBlob(factory());
    zip.file(name, blob);
    done++;
    onProgress?.(done, total, `${name} fertig`);
    await new Promise((r) => setTimeout(r, 0));
  }
  onProgress?.(done, total, "ZIP-Archiv wird gepackt …");
  const out = await zip.generateAsync({ type: "blob" });
  done++;
  onProgress?.(done, total, "Fertig – Download startet");
  saveAs(out, `TTX_${slug(bank.name)}_${slug(ex.uebungsname)}.zip`);
}

// ─── UI ───
export default function Ernstfall() {
  const [step, setStep] = useState(1);
  const [bank, setBank] = useState<BankProfile>(DEFAULT_BANK);
  const [sheetRows, setSheetRows] = useState<Record<string, any>[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [selectedBankIdx, setSelectedBankIdx] = useState<number | null>(null);
  const [topics, setTopics] = useState<Record<string, Weight>>({});
  const [dauer, setDauer] = useState<"2h" | "3h" | "4h">("3h");
  const [rollenumfang, setRollenumfang] = useState<"kompakt" | "voll">("voll");
  const [difficulty, setDifficulty] = useState<"Einsteiger" | "Fortgeschritten" | "Experte">("Fortgeschritten");
  const [dora, setDora] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [log, setLog] = useState<{ t: string; msg: string }[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const genTimerRef = useRef<number | null>(null);

  function pushLog(msg: string) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLog((l) => [...l, { t, msg }].slice(-20));
  }

  function resetAll() {
    if (!confirm("Alle Eingaben verwerfen und von vorne beginnen?")) return;
    setStep(1);
    setBank(DEFAULT_BANK);
    setSheetRows([]); setSheetHeaders([]); setSelectedBankIdx(null);
    setTopics({});
    setDauer("3h"); setRollenumfang("voll"); setDifficulty("Fortgeschritten"); setDora(true);
    setExercise(null); setError(null);
    setProgress(""); setProgressPct(0); setLog([]);
  }

  const injectCount = dauer === "2h" ? 8 : dauer === "3h" ? 11 : 14;
  const selectedTopics = useMemo(() => Object.entries(topics), [topics]);
  const canGenerate = selectedTopics.length >= 1 && !!bank.name;

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      const headers = json.length ? Object.keys(json[0]) : [];
      setSheetRows(json);
      setSheetHeaders(headers);
      setSelectedBankIdx(null);
    };
    reader.readAsArrayBuffer(f);
  }

  function applyBankRow(idx: number) {
    setSelectedBankIdx(idx);
    const row = sheetRows[idx];
    if (!row) return;
    const find = (needle: string) => {
      const key = sheetHeaders.find((h) => h.toLowerCase().includes(needle.toLowerCase()));
      return key ? String(row[key] ?? "") : "";
    };
    setBank({
      name: String(row[sheetHeaders[0]] ?? "") || bank.name,
      bilanzsumme: find("bilanz") || bank.bilanzsumme,
      mitarbeiter: find("mitarbeiter") || bank.mitarbeiter,
      filialen: find("filial") || bank.filialen,
      itDienstleister: find("dienstleister") || find("it") || bank.itDienstleister,
      besonderheiten: find("besonderheit") || bank.besonderheiten,
    });
  }

  async function generate() {
    setError(null);
    setLoading(true);
    setExercise(null);
    setLog([]);
    setProgressPct(2);
    setProgress("Anfrage wird vorbereitet …");
    pushLog("Bankprofil und Themen an KI übergeben");

    const stages = [
      { pct: 12, msg: "Szenario-Grundgerüst wird entworfen …", log: "Kausale Ereigniskette wird konstruiert" },
      { pct: 28, msg: "Injects werden ausformuliert …", log: `${injectCount} Injects werden generiert` },
      { pct: 48, msg: "Rollenkarten werden erstellt …", log: `${rollenumfang === "voll" ? 8 : 6} Rollen für Krisenstab` },
      { pct: 66, msg: "Regieanweisungen & Diskussionsimpulse …", log: "Trainer-Hinweise werden ergänzt" },
      { pct: 82, msg: "Konsistenzprüfung der Zeitachse …", log: "Prüfe Kausalität und Zeitpunkte" },
      { pct: 92, msg: "Feinschliff durch die KI …", log: "Finalisierung der Übung" },
    ];
    let idx = 0;
    if (genTimerRef.current) window.clearInterval(genTimerRef.current);
    genTimerRef.current = window.setInterval(() => {
      if (idx >= stages.length) return;
      const s = stages[idx++];
      setProgressPct(s.pct);
      setProgress(s.msg);
      pushLog(s.log);
    }, 4500) as unknown as number;

    try {
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/ernstfall-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
        body: JSON.stringify({
          bank,
          topics: selectedTopics.map(([name, weight]) => ({ name, weight })),
          dauer, injectCount, rollenumfang, difficulty, dora,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generierung fehlgeschlagen");
      setExercise(data.exercise);
      setProgressPct(100);
      setProgress("Übung erfolgreich generiert");
      pushLog(`Übung "${data.exercise?.uebungsname ?? ""}" erhalten`);
    } catch (e: any) {
      setError(e.message || "Fehler bei der Generierung");
      pushLog("Fehler: " + (e.message || "unbekannt"));
    } finally {
      if (genTimerRef.current) { window.clearInterval(genTimerRef.current); genTimerRef.current = null; }
      setLoading(false);
    }
  }

  async function downloadZip() {
    if (!exercise) return;
    setDownloading(true);
    setLog([]);
    setProgressPct(0);
    setProgress("Word-Paket wird erstellt …");
    pushLog("Start Word-Paket-Erstellung");
    try {
      await buildZip(exercise, bank, (done, total, label) => {
        setProgressPct(Math.round((done / total) * 100));
        setProgress(label);
        pushLog(label);
      });
    } catch (e: any) {
      console.error(e);
      setError("Word-Paket konnte nicht erzeugt werden.");
      pushLog("Fehler beim Erstellen des ZIP");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Helmet>
        <title>ERNSTLFALL – TTX Generator | inside-the-box.org</title>
        <meta name="description" content="ERNSTLFALL: KI-gestützter Generator für Krisenstabsübungen deutscher Genossenschaftsbanken. Vollständige Word-Pakete in wenigen Minuten." />
      </Helmet>

      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "#1F3864" }}>ERNSTLFALL</h1>
            <p className="text-[11px] sm:text-xs text-neutral-500">by inside-the-box.org</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              disabled={loading || downloading}
              className="text-xs px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              title="Alle Eingaben verwerfen und neu starten"
            >
              ↺ Neu starten
            </button>
            <Link to="/" className="text-sm text-[#1F3864] hover:underline">← zurück</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <p className="text-sm text-neutral-600 italic">Wir machen den Ernstfall.</p>
          <p className="text-xs text-neutral-500 mt-2">Alle Daten bleiben in dieser Browser-Sitzung und werden nicht gespeichert.</p>
        </div>

        {/* Stepper */}
        <ol className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 flex-wrap">
          {["Bankprofil", "Themen", "Parameter", "Generierung"].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label}>
                <button
                  onClick={() => setStep(n)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium border transition ${
                    active
                      ? "bg-[#1F3864] text-white border-[#1F3864]"
                      : done
                      ? "bg-white text-[#1F3864] border-[#1F3864]"
                      : "bg-white text-neutral-500 border-neutral-200"
                  }`}
                >
                  {n}. {label}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step 1 */}
        {step === 1 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F3864]">Bankprofil</h2>
            <div className="rounded-lg border border-neutral-200 p-5 space-y-3">
              <p className="text-sm text-neutral-600">Optional: Excel mit Bankdaten hochladen. Verarbeitung ausschließlich lokal im Browser.</p>
              <div className="flex gap-3 items-center flex-wrap">
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded border border-neutral-300 text-sm">Excel wählen …</button>
                {sheetRows.length > 0 && (
                  <select className="px-3 py-2 rounded border border-neutral-300 text-sm w-full sm:flex-1 sm:w-auto" value={selectedBankIdx ?? ""} onChange={(e) => applyBankRow(Number(e.target.value))}>
                    <option value="">Bank aus Datei wählen …</option>
                    {sheetRows.map((r, i) => <option key={i} value={i}>{String(r[sheetHeaders[0]] ?? `Zeile ${i + 1}`)}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                ["Bankname", "name"],
                ["Bilanzsumme (in Mio. EUR)", "bilanzsumme"],
                ["Mitarbeiterzahl (VZÄ, gerundet)", "mitarbeiter"],
                ["Anzahl Filialen (inkl. SB-Standorte)", "filialen"],
                ["IT-Dienstleister (z. B. Atruvia, FI-TS)", "itDienstleister"],
              ] as [string, keyof BankProfile][]).map(([label, key]) => (
                <label key={key} className="block">
                  <span className="text-xs text-neutral-600">{label}</span>
                  <input value={bank[key]} onChange={(e) => setBank({ ...bank, [key]: e.target.value })} className="mt-1 w-full px-3 py-2 rounded border border-neutral-300 text-sm" />
                </label>
              ))}
              <label className="block md:col-span-2">
                <span className="text-xs text-neutral-600">Besonderheiten <span className="text-neutral-400">(optional – Regionalfokus, Kundenstruktur, laufende Projekte)</span></span>
                <textarea value={bank.besonderheiten} onChange={(e) => setBank({ ...bank, besonderheiten: e.target.value })} rows={2} placeholder="z. B. starker Firmenkundenanteil, Migration Kernbanksystem 2027, Zweigstelle in Grenzregion …" className="mt-1 w-full px-3 py-2 rounded border border-neutral-300 text-sm" />
              </label>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded bg-[#1F3864] text-white text-sm font-medium">Weiter →</button>
            </div>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F3864]">Themen</h2>
            <p className="text-sm text-neutral-600">
              Wählen Sie 1–4 Themen und legen Sie deren <strong>Rolle im Szenario</strong> fest:
              <span className="ml-1"><em>Randthema</em> (taucht am Rand auf), <em>Kernthema</em> (mehrere Injects), <em>Leitthema</em> (roter Faden der Übung).</span>
            </p>
            {selectedTopics.length > 4 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Mehr als 4 Themen verwässern den durchgehenden Fall.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOPICS.map((t) => {
                const selected = topics[t];
                return (
                  <div key={t} className={`rounded-lg border p-4 transition ${selected ? "border-[#1F3864] bg-[#1F3864]/5" : "border-neutral-200"}`}>
                    <button onClick={() => {
                      const next = { ...topics };
                      if (selected) delete next[t]; else next[t] = "Kernthema";
                      setTopics(next);
                    }} className="text-left w-full">
                      <p className="text-sm font-medium text-neutral-900">{t}</p>
                    </button>
                    {selected && (
                      <div className="mt-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Rolle im Szenario</p>
                        <div className="flex gap-1 flex-wrap">
                          {(["Randthema", "Kernthema", "Leitthema"] as Weight[]).map((w) => (
                            <button key={w} onClick={() => setTopics({ ...topics, [t]: w })}
                              className={`px-3 py-1 rounded text-xs border ${selected === w ? "bg-[#1F3864] text-white border-[#1F3864]" : "border-neutral-300 text-neutral-600"}`}>
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(3)} disabled={selectedTopics.length === 0} className="px-4 py-2 rounded bg-[#1F3864] text-white text-sm font-medium disabled:opacity-40">Weiter →</button>
            </div>
          </section>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F3864]">Übungsparameter</h2>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium">Dauer der Übung</p>
                <p className="text-xs text-neutral-500 mb-2">Reine Übungszeit ohne Briefing/Debriefing. Ein Inject = ein Ereignis, das der Trainer einspielt.</p>
                <div className="flex gap-2 flex-wrap">
                  {([["2h", "Kurz – 2 h · 8 Injects"], ["3h", "Standard – 3 h · 11 Injects"], ["4h", "Ausführlich – 4 h · 14 Injects"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setDauer(v)} className={`px-3 py-2 rounded border text-sm ${dauer === v ? "bg-[#1F3864] text-white border-[#1F3864]" : "border-neutral-300"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Rollenumfang</p>
                <p className="text-xs text-neutral-500 mb-2">Anzahl der Rollenkarten für den Krisenstab. Kompakt = Kernstab; Voll = Kernstab + erweiterte Rollen (Recht, Kommunikation, Auslagerungsmanagement, Notfallbeauftragter).</p>
                <div className="flex gap-2 flex-wrap">
                  {([["kompakt", "Kompakt – 6 Rollen (Kernstab)"], ["voll", "Voll – 8 Rollen (mit erweitertem Stab)"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setRollenumfang(v)} className={`px-3 py-2 rounded border text-sm ${rollenumfang === v ? "bg-[#1F3864] text-white border-[#1F3864]" : "border-neutral-300"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Schwierigkeitsgrad</p>
                <p className="text-xs text-neutral-500 mb-2">Steuert Komplexität, Zeitdruck und Mehrdeutigkeit der Injects.</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ["Einsteiger", "Einsteiger – erste TTX-Erfahrung, klare Handlungsoptionen"],
                    ["Fortgeschritten", "Fortgeschritten – geübter Stab, mehrdeutige Lagen"],
                    ["Experte", "Experte – Zeitdruck, widersprüchliche Meldungen, Presseanfragen"],
                  ] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setDifficulty(v)} className={`px-3 py-2 rounded border text-sm ${difficulty === v ? "bg-[#1F3864] text-white border-[#1F3864]" : "border-neutral-300"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={dora} onChange={(e) => setDora(e.target.checked)} className="mt-1" />
                  <span>
                    <span className="text-sm font-medium">DORA-Meldepflichten einbeziehen</span>
                    <span className="block text-xs text-neutral-500 mt-0.5">Ergänzt Injects und Rollen um die aufsichtsrechtlichen Fristen nach DORA (Erst-, Zwischen- und Abschlussmeldung an BaFin/Bundesbank). Für Genossenschaftsbanken empfohlen.</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded border border-neutral-300 text-sm">← zurück</button>
              <button onClick={() => setStep(4)} className="px-4 py-2 rounded bg-[#1F3864] text-white text-sm font-medium">Weiter →</button>
            </div>
          </section>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F3864]">Generierung, Vorschau & Export</h2>

            <div className="rounded-lg border border-neutral-200 p-4 text-sm space-y-1">
              <p><strong>Bank:</strong> {bank.name}</p>
              <p><strong>Themen:</strong> {selectedTopics.map(([t, w]) => `${t} (${w})`).join("; ") || "—"}</p>
              <p><strong>Dauer:</strong> {dauer} · {injectCount} Injects · {rollenumfang === "voll" ? "8 Rollen" : "6 Rollen"} · {difficulty} · DORA: {dora ? "an" : "aus"}</p>
            </div>

            {!exercise && (
              <button disabled={!canGenerate || loading} onClick={generate}
                className="px-5 py-3 rounded bg-[#1F3864] text-white text-sm font-medium disabled:opacity-40">
                {loading ? "Generiere …" : "Übung generieren"}
              </button>
            )}
            {(loading || downloading) && (
              <div className="rounded-lg border border-[#1F3864]/30 bg-[#1F3864]/5 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#1F3864]">{progress || "Verarbeite …"}</span>
                  <span className="font-mono text-xs text-neutral-600">{progressPct}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#1F3864] transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {log.length > 0 && (
                  <div className="rounded bg-neutral-900 text-neutral-100 font-mono text-[11px] leading-relaxed p-3 max-h-40 overflow-y-auto">
                    {log.map((l, i) => (
                      <div key={i}>
                        <span className="text-neutral-500">[{l.t}]</span> {l.msg}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-neutral-500">
                  Bitte warten – je nach Umfang dauert die Generierung 30–90 Sekunden.
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

            {exercise && (
              <div className="space-y-6">
                <div className="rounded-lg border border-[#1F3864]/30 bg-[#1F3864]/5 p-5">
                  <h3 className="text-lg font-semibold text-[#1F3864]">{exercise.uebungsname}</h3>
                  <p className="text-sm mt-2 whitespace-pre-line">{exercise.kurzbeschreibung}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#1F3864] mb-2">Inject-Timeline</h4>
                  <div className="rounded-lg border border-neutral-200 overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead className="bg-neutral-100"><tr>
                        <th className="text-left px-3 py-2 w-20">ID</th>
                        <th className="text-left px-3 py-2 w-32 sm:w-44">Zeit</th>
                        <th className="text-left px-3 py-2">Titel</th>
                        <th className="text-left px-3 py-2 w-40 sm:w-56">Thema</th>
                      </tr></thead>
                      <tbody>
                        {exercise.injects.map((i, idx) => (
                          <tr key={i.id} className={idx % 2 ? "bg-neutral-50" : ""}>
                            <td className="px-3 py-2 font-mono text-xs">{i.id}</td>
                            <td className="px-3 py-2 text-xs">{i.zeitpunkt}</td>
                            <td className="px-3 py-2">{i.titel}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{i.themaTag}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#1F3864] mb-2">Rollen</h4>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {exercise.rollen.map((r) => <li key={r.name}><strong>{r.name}</strong> — {r.profil}</li>)}
                  </ul>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button onClick={generate} disabled={loading} className="px-4 py-2 rounded border border-neutral-300 text-sm">Neu generieren</button>
                  <button onClick={downloadZip} disabled={downloading} className="px-5 py-2 rounded bg-[#1F3864] text-white text-sm font-medium disabled:opacity-40 flex-1 sm:flex-none">
                    {downloading ? "Erzeuge Word-Paket …" : "Word-Paket herunterladen (ZIP)"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 flex-wrap pt-4 border-t border-neutral-200">
              <button onClick={() => setStep(3)} disabled={loading || downloading} className="px-4 py-2 rounded border border-neutral-300 text-sm disabled:opacity-40">← zurück zu Parametern</button>
              <button onClick={resetAll} disabled={loading || downloading} className="px-4 py-2 rounded border border-neutral-300 text-sm text-neutral-600 disabled:opacity-40">↺ Neue Übung starten</button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-neutral-200 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-neutral-500">
          © inside-the-box.org – Cybersecurity &amp; Resilience Consulting
        </div>
      </footer>
    </div>
  );
}
