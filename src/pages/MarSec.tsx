import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Footer,
  AlignmentType, PageNumber, HeadingLevel, LevelFormat, BorderStyle, WidthType, ShadingType,
  PageBreak, TableOfContents,
} from "docx";
import heroImg from "@/assets/marsec-hero.jpg";
import { SECTORS, OBLIGATIONS, getSector, type SectorId, type Weight } from "@/data/marsecSectors";

// ─── Brand tokens (MarSec Studio) ───
const NAVY = "0B2239";
const CRIMSON = "D6003C";
const ALTROW = "F5F7FA";

interface Inject {
  id: string; time: string; phase: string; mandatory: boolean; title: string;
  topicTag: string; channel: string; content: string; expectedResponse: string;
  facilitatorNote: string; discussionPrompts: string[]; clarifications: { question: string; answer: string }[];
  observationFocus: string;
  dependsOn?: string;
}
interface Role { name: string; profile: string; tasks: string[]; tension: string }
interface Exercise {
  exerciseName: string;
  summary: string;
  groundTruth: {
    organisationProfile: string; adversaryOrCause: string;
    timeline: { time: string; event: string }[]; complications: string[];
    classificationTime?: string;
  };
  objectives: string[];
  schedule: { time: string; segment: string; content: string }[];
  injects: Inject[];
  roles: Role[];
  reportingObligations: { addressee: string; deadline: string; basis?: string }[];
  hotwashNotes: string[];
}

function slug(s: string) {
  return (s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "Organisation";
}

// ─── docx helpers ───
const font = "Calibri";
const T = (text: string, opt: Partial<{ bold: boolean; italics: boolean; color: string; size: number }> = {}) =>
  new TextRun({ text, font, bold: opt.bold, italics: opt.italics, color: opt.color, size: opt.size ?? 22 });

const P = (children: TextRun[], opt: Partial<{ align: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing: number }> = {}) =>
  new Paragraph({ children, alignment: opt.align, spacing: { after: opt.spacing ?? 120 } });

const H1 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font, bold: true, color: NAVY, size: 40 })], spacing: { before: 240, after: 200 } });
const H2 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font, bold: true, color: NAVY, size: 30 })], spacing: { before: 280, after: 140 }, keepNext: true });
const H3 = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font, bold: true, color: CRIMSON, size: 26 })], spacing: { before: 200, after: 100 }, keepNext: true });

function computeDeadlineClock(classification: string | undefined, deadline: string): string {
  if (!classification || !/^\d{1,2}:\d{2}$/.test(classification)) return "";
  const [hh, mm] = classification.split(":").map((n) => parseInt(n, 10));
  const base = new Date(2025, 0, 1, hh, mm);
  const mHour = /T\s*\+\s*(\d+)\s*h/i.exec(deadline);
  if (mHour) {
    const h = parseInt(mHour[1], 10);
    const d = new Date(base.getTime() + h * 3600_000);
    const day = h >= 24 ? ` (+${Math.floor(h / 24)}d)` : "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}${day}`;
  }
  return "";
}

const styleDoc = {
  default: { document: { run: { font, size: 22 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 40, bold: true, font, color: NAVY },
      paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 30, bold: true, font, color: NAVY },
      paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, font, color: CRIMSON },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
  ],
};

const nowLabel = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
    shading: opts.header ? { fill: NAVY, type: ShadingType.CLEAR } : opts.alt ? { fill: ALTROW, type: ShadingType.CLEAR } : undefined,
    children,
  });
}

function kvTable(rows: [string, string][], colA = 3000, colB = 6360) {
  return new Table({
    width: { size: colA + colB, type: WidthType.DXA },
    columnWidths: [colA, colB],
    rows: rows.map(([k, v], i) => new TableRow({
      children: [cell(k, { width: colA, bold: true, alt: i % 2 === 1 }), cell(v, { width: colB, alt: i % 2 === 1 })],
    })),
  });
}

function dataTable(headers: string[], rows: string[][], widths: number[]) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { width: widths[i], header: true })) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((v, i) => cell(v, { width: widths[i], alt: ri % 2 === 1 })) })),
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

function titleBlock(docTitle: string, exerciseName: string, classification: string) {
  return [
    new Paragraph({ children: [new TextRun({ text: "inside-the-box.org · MarSec Studio · Maritime crisis exercise", font, size: 18, color: "808080" })], spacing: { after: 60 } }),
    H1(docTitle),
    new Paragraph({ children: [new TextRun({ text: exerciseName, font, size: 22, bold: true, color: NAVY })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: classification, font, size: 22, bold: true, color: CRIMSON })], spacing: { after: 300 } }),
  ];
}

function makeSection(exerciseName: string, children: any[]) {
  return {
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } },
    headers: {},
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${exerciseName} · MarSec Studio · created ${nowLabel()} · page `, font, size: 18, color: "808080" }),
            new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: "808080" }),
          ],
        })],
      }),
    },
    children,
  };
}

// ─── Document builders ───
function buildFacilitatorGuide(ex: Exercise, orgName: string): Document {
  const klass = ex.groundTruth?.classificationTime;
  const rows = (ex.reportingObligations ?? []).map((m) => [m.addressee, m.deadline, computeDeadlineClock(klass, m.deadline) || "—", m.basis || "—"]);
  const children: any[] = [
    ...titleBlock("Facilitator Guide", ex.exerciseName, "FACILITATOR EYES ONLY"),
    H2("Table of contents"),
    new TableOfContents("Table of contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
    H2("Exercise overview"),
    kvTable([
      ["Exercise", ex.exerciseName],
      ["Organisation", orgName],
      ["Storyline", ex.summary],
      ["Injects", String(ex.injects.length)],
      ["Roles", String(ex.roles?.length ?? 0)],
      ["Classified as major at", klass || "—"],
    ]),
    H2("Exercise objectives"),
    ...(ex.objectives ?? []).map((z) => bullet(z, "numbers")),
    H2("Ground truth — organisation profile"),
    P([T(ex.groundTruth?.organisationProfile || "")]),
    H3("Adversary / cause"),
    P([T(ex.groundTruth?.adversaryOrCause || "")]),
    H3("Timeline (facilitator only)"),
    dataTable(["Time", "Event"], (ex.groundTruth?.timeline ?? []).map((t) => [t.time, t.event]), [2200, 7160]),
    H3("Complications"),
    ...(ex.groundTruth?.complications ?? []).map((e) => bullet(e)),
    H2("Run of show"),
    dataTable(["Time", "Segment", "Content"], (ex.schedule ?? []).map((a) => [a.time, a.segment, a.content]), [1600, 2400, 5360]),
    H2("Reporting obligations & deadlines"),
    P([T(klass ? `Anchor point: incident classified as major at ${klass}.` : "Classification time not set — calculate clock times manually.", { italics: true })]),
    dataTable(["Addressee", "Deadline", "Clock time", "Basis"], rows, [2600, 2200, 1800, 2760]),
    H2("Exercise rules"),
    ...[
      "Room time equals simulation time; the facilitator controls any time jumps.",
      "No real system is touched — all actions are logged, never executed.",
      "Assumptions are marked as assumptions and kept apart from facts in the common operating picture.",
      "Facilitator notes are for the facilitation team only. Participants receive inject content only.",
      "Reporting obligations are documented on the worksheet; no real notification is sent.",
    ].map((r) => bullet(r)),
    H2("Assessment criteria"),
    ...[
      "Situational picture — completeness, currency, fact/assumption separation",
      "Decision quality — basis, alternatives, timing",
      "Communication — internal, customers, authorities, media",
      "Role clarity — responsibilities, handovers, escalation",
      "Reporting obligations — deadlines recognised and documented",
      "Ship–shore coordination — Master's authority, satcom constraints",
      "Task management — clear, prioritised, tracked",
    ].map((r) => bullet(r)),
    H2("Hotwash guidance"),
    P([T("Immediately after the exercise. Sequence: What happened? What worked? What did not work? What do we take away?")]),
    ...(ex.hotwashNotes ?? []).map((h) => bullet(h)),
  ];
  return new Document({
    creator: "MarSec Studio", title: `${ex.exerciseName} – Facilitator Guide`,
    features: { updateFields: true }, styles: styleDoc, numbering: bulletsNumbering(),
    sections: [makeSection(ex.exerciseName, children)],
  });
}

function buildInjectCards(ex: Exercise): Document {
  const kids: any[] = [...titleBlock("Inject Cards", ex.exerciseName, "FACILITATOR EYES ONLY")];
  ex.injects.forEach((inj, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H2(`${inj.id} – ${inj.title}`));
    const rows: [string, string][] = [
      ["Time", inj.time],
      ["Phase", inj.mandatory ? `${inj.phase} · MANDATORY INJECT` : inj.phase],
      ["Topic", inj.topicTag],
      ["Channel", inj.channel],
    ];
    if (inj.dependsOn) rows.push(["Follows on from", inj.dependsOn]);
    kids.push(kvTable(rows, 2400, 6960));
    kids.push(H3("Content (deliver verbatim)"));
    kids.push(P([T(inj.content)]));
    kids.push(H3("Expected response"));
    kids.push(P([T(inj.expectedResponse)]));
  });
  return new Document({
    creator: "MarSec Studio", title: `${ex.exerciseName} – Inject Cards`,
    styles: styleDoc, numbering: bulletsNumbering(),
    sections: [makeSection(ex.exerciseName, kids)],
  });
}

function buildRoleCards(ex: Exercise): Document {
  const kids: any[] = [...titleBlock("Role Cards", ex.exerciseName, "EACH CARD ONLY TO ITS ROLE HOLDER")];
  (ex.roles ?? []).forEach((r, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H2(r.name));
    kids.push(H3("Your role"));
    kids.push(P([T(r.profile)]));
    kids.push(H3("Your tasks"));
    (r.tasks ?? []).forEach((a) => kids.push(bullet(a)));
    kids.push(H3("Your tension field (confidential — do not share)"));
    kids.push(P([T(r.tension, { italics: true })]));
  });
  return new Document({
    creator: "MarSec Studio", title: `${ex.exerciseName} – Role Cards`,
    styles: styleDoc, numbering: bulletsNumbering(),
    sections: [makeSection(ex.exerciseName, kids)],
  });
}

function buildWorksheet(ex: Exercise): Document {
  const first = ex.injects[0];
  const emptyRows = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => ""));
  const kids: any[] = [
    ...titleBlock("Participant Workbook", ex.exerciseName, "FOR ALL PARTICIPANTS"),
    H2("Starting situation"),
    P([T(first?.content || "")]),
    H2("Ground rules"),
    ...[
      "Work only with the information delivered to you.",
      "Separate fact from assumption in the situational picture.",
      "Document decisions and tasks — never trigger them for real.",
      "Direct questions to the facilitator, not to real contacts ashore or on board.",
    ].map((s) => bullet(s)),
    H2("Guiding questions"),
    ...[
      "Who leads the crisis team, and who deputises?",
      "Which information is missing, who obtains it and by when?",
      "Which reporting obligations apply, and which clocks are already running?",
      "Who communicates internally, to customers and charterers, to authorities and to media?",
      "What is decided ashore, what stays with the Master on board?",
      "Which immediate measures are reversible, which are not?",
    ].map((s) => bullet(s)),
    H2("Situational picture"),
    dataTable(["Time", "Information", "Source", "Fact / assumption"], emptyRows(14, 4), [1600, 4400, 1800, 1560]),
    H2("Decision log"),
    dataTable(["Time", "Decision", "Rationale", "Owner"], emptyRows(10, 4), [1600, 3800, 2400, 1560]),
    H2("Task list"),
    dataTable(["Task", "Owner", "Due", "Status"], emptyRows(10, 4), [4200, 2400, 1400, 1360]),
    H2("Reporting obligations — worksheet"),
    dataTable(
      ["Addressee", "Deadline", "Due at", "Owner", "Status"],
      (ex.reportingObligations ?? []).map((m) => [m.addressee, m.deadline, "", "", ""]),
      [2800, 2200, 1600, 1400, 1360],
    ),
    H2("Reflection"),
    ...[
      "Where did we lose time — and why?",
      "Which decision would we take differently with today's knowledge?",
      "Which role was overloaded, which underused?",
      "Which information arrived late or not at all?",
      "Which three measures do we implement within the next week?",
    ].map((s) => bullet(s)),
  ];
  return new Document({
    creator: "MarSec Studio", title: `${ex.exerciseName} – Participant Workbook`,
    styles: styleDoc, numbering: bulletsNumbering(),
    sections: [makeSection(ex.exerciseName, kids)],
  });
}

function buildScript(ex: Exercise): Document {
  const kids: any[] = [
    ...titleBlock("Facilitator Script", ex.exerciseName, "FACILITATOR EYES ONLY"),
    H2("Table of contents"),
    new TableOfContents("Table of contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
    H2("Facilitation stance"),
    ...[
      "Stay calm, mirror questions back, do not supply solutions.",
      "Create time pressure without crushing the team — say deadlines out loud.",
      "Observe rather than intervene; add complications in measured doses.",
      "In a deadlock: use a targeted clarification question from the list, never reveal the ground truth.",
    ].map((s) => bullet(s)),
    H2("Briefing sequence"),
    ...[
      "Welcome, purpose, confidentiality.",
      "Hand out roles, walk through the ground rules, set the clock to T+00.",
      "Distribute worksheets, explain situational picture and decision log.",
      "Deliver the first inject, start the clock.",
    ].map((s) => bullet(s, "numbers")),
    H2("Injects — direction"),
  ];
  ex.injects.forEach((inj, idx) => {
    if (idx > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(H3(`${inj.id} – ${inj.title} (${inj.time})`));
    kids.push(P([T("Facilitator note", { bold: true })]));
    kids.push(P([T(inj.facilitatorNote)]));
    kids.push(P([T("Discussion prompts", { bold: true })]));
    (inj.discussionPrompts ?? []).forEach((d) => kids.push(bullet(d)));
    kids.push(P([T("Clarification questions and answers", { bold: true })]));
    kids.push(dataTable(["Question", "Answer"], (inj.clarifications ?? []).map((r) => [r.question, r.answer]), [4200, 5160]));
    kids.push(P([T(`Observation focus: ${inj.observationFocus}`, { italics: true })]));
  });
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(H2("Hotwash facilitation"),
    ...[
      "45–60 minutes immediately after the exercise.",
      "Round 1: emotional decompression — one sentence each.",
      "Round 2: facts — what happened, what worked.",
      "Round 3: improvements — concrete, named, with owners.",
      "Close with three measures, each with a date, carried into the written after-action report.",
    ].map((s) => bullet(s)));
  (ex.hotwashNotes ?? []).forEach((h) => kids.push(bullet(h)));
  return new Document({
    creator: "MarSec Studio", title: `${ex.exerciseName} – Facilitator Script`,
    features: { updateFields: true }, styles: styleDoc, numbering: bulletsNumbering(),
    sections: [makeSection(ex.exerciseName, kids)],
  });
}

async function buildZip(ex: Exercise, orgName: string, onProgress?: (done: number, total: number, label: string) => void) {
  const zip = new JSZip();
  const files: [string, () => Document][] = [
    ["01_Facilitator_Guide.docx", () => buildFacilitatorGuide(ex, orgName)],
    ["02_Inject_Cards.docx", () => buildInjectCards(ex)],
    ["03_Role_Cards.docx", () => buildRoleCards(ex)],
    ["04_Participant_Workbook.docx", () => buildWorksheet(ex)],
    ["05_Facilitator_Script.docx", () => buildScript(ex)],
  ];
  const total = files.length + 1;
  let done = 0;
  for (const [name, factory] of files) {
    onProgress?.(done, total, `Building ${name} …`);
    const blob = await Packer.toBlob(factory());
    zip.file(name, blob);
    done++;
    onProgress?.(done, total, `${name} done`);
    await new Promise((r) => setTimeout(r, 0));
  }
  onProgress?.(done, total, "Packing ZIP archive …");
  const out = await zip.generateAsync({ type: "blob" });
  done++;
  onProgress?.(done, total, "Ready — download starting");
  saveAs(out, `MarSec_TTX_${slug(orgName)}_${slug(ex.exerciseName)}.zip`);
}

// ─── UI ───
const STEPS = ["Sector", "Profile", "Scenario", "Parameters", "Generate"];
const DRAFT_KEY = "marsec.draft.v1";

export default function MarSec() {
  const [step, setStep] = useState(0);
  const [sectorId, setSectorId] = useState<SectorId | null>(null);
  const sector = sectorId ? getSector(sectorId) : null;

  const [profile, setProfile] = useState<Record<string, string>>({});
  const [sheetRows, setSheetRows] = useState<Record<string, any>[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [topics, setTopics] = useState<Record<string, Weight>>({});
  const [duration, setDuration] = useState<"2h" | "3h" | "4h">("3h");
  const [roleScope, setRoleScope] = useState<"compact" | "full">("full");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");
  const [obligations, setObligations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [log, setLog] = useState<{ t: string; msg: string }[]>([]);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const genTimerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const draftLoaded = useRef(false);

  function pushLog(msg: string) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLog((l) => [...l, { t, msg }].slice(-20));
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.sectorId) setSectorId(d.sectorId);
        if (d.profile) setProfile(d.profile);
        if (d.topics) setTopics(d.topics);
        if (d.duration) setDuration(d.duration);
        if (d.roleScope) setRoleScope(d.roleScope);
        if (d.difficulty) setDifficulty(d.difficulty);
        if (Array.isArray(d.obligations)) setObligations(d.obligations);
      }
    } catch { /* ignore */ }
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ sectorId, profile, topics, duration, roleScope, difficulty, obligations }));
    } catch { /* ignore */ }
  }, [sectorId, profile, topics, duration, roleScope, difficulty, obligations]);

  function chooseSector(id: SectorId) {
    const def = getSector(id);
    setSectorId(id);
    setProfile((prev) => (Object.keys(prev).length && sectorId === id ? prev : { ...def.defaults }));
    setTopics({});
    setObligations(def.defaultObligations);
    setStep(2);
  }

  function cancelGeneration() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      pushLog("Generation cancelled by user");
    }
  }

  function resetAll() {
    if (!confirm("Discard all input and start over?")) return;
    setStep(0); setSectorId(null); setProfile({});
    setSheetRows([]); setSheetHeaders([]); setSelectedRowIdx(null);
    setTopics({}); setDuration("3h"); setRoleScope("full"); setDifficulty("Intermediate"); setObligations([]);
    setExercise(null); setError(null); setProgress(""); setProgressPct(0); setLog([]);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  const injectCount = duration === "2h" ? 8 : duration === "3h" ? 11 : 14;
  const selectedTopics = useMemo(() => Object.entries(topics), [topics]);
  const orgName = profile.name || sector?.defaults.name || "Organisation";
  const canGenerate = !!sector && selectedTopics.length >= 1 && !!profile.name;

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      setSheetRows(json);
      setSheetHeaders(json.length ? Object.keys(json[0]) : []);
      setSelectedRowIdx(null);
    };
    reader.readAsArrayBuffer(f);
  }

  function applyRow(idx: number) {
    setSelectedRowIdx(idx);
    const row = sheetRows[idx];
    if (!row || !sector) return;
    const find = (needle: string) => {
      const key = sheetHeaders.find((h) => h.toLowerCase().includes(needle.toLowerCase()));
      return key ? String(row[key] ?? "") : "";
    };
    const next: Record<string, string> = { ...profile };
    sector.fields.forEach((f) => {
      const v = f.key === "name" ? String(row[sheetHeaders[0]] ?? "") : find(f.key);
      if (v) next[f.key] = v;
    });
    setProfile(next);
  }

  async function generate() {
    if (!sector) return;
    setError(null); setLoading(true); setExercise(null); setLog([]);
    setProgressPct(2);
    setProgress("Preparing request …");
    pushLog("Organisation profile and topics handed to the model");

    const stages = [
      { pct: 12, msg: "Drafting the scenario backbone …", log: "Building the causal event chain" },
      { pct: 28, msg: "Writing injects …", log: `${injectCount} injects being generated` },
      { pct: 48, msg: "Creating role cards …", log: `${roleScope === "full" ? 8 : 6} crisis team roles` },
      { pct: 66, msg: "Facilitator notes & discussion prompts …", log: "Adding facilitation guidance" },
      { pct: 82, msg: "Checking timeline consistency …", log: "Verifying causality and clock times" },
      { pct: 92, msg: "Final polish …", log: "Finalising the exercise" },
    ];
    let idx = 0;
    if (genTimerRef.current) window.clearInterval(genTimerRef.current);
    genTimerRef.current = window.setInterval(() => {
      if (idx >= stages.length) return;
      const s = stages[idx++];
      setProgressPct(s.pct); setProgress(s.msg); pushLog(s.log);
    }, 4500) as unknown as number;

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/marsec-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
        body: JSON.stringify({
          sector: sector.name,
          sectorContext: sector.aiContext,
          profile,
          topics: selectedTopics.map(([name, weight]) => ({ name, weight })),
          duration,
          injectCount,
          roleScope,
          roles: roleScope === "full" ? sector.roles.full : sector.roles.compact,
          difficulty,
          obligations: OBLIGATIONS.filter((o) => obligations.includes(o.id)).map((o) => o.prompt),
        }),
        signal: ac.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setExercise(data.exercise);
      setProgressPct(100);
      setProgress("Exercise generated");
      pushLog(`Received "${data.exercise?.exerciseName ?? ""}"`);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Generation cancelled");
        setProgress("Cancelled");
      } else {
        setError(e.message || "Generation error");
        pushLog("Error: " + (e.message || "unknown"));
      }
    } finally {
      if (genTimerRef.current) { window.clearInterval(genTimerRef.current); genTimerRef.current = null; }
      abortRef.current = null;
      setLoading(false);
    }
  }

  async function downloadZip() {
    if (!exercise) return;
    setDownloading(true); setLog([]); setProgressPct(0);
    setProgress("Building the Word package …");
    pushLog("Starting Word package build");
    try {
      await buildZip(exercise, orgName, (done, total, label) => {
        setProgressPct(Math.round((done / total) * 100));
        setProgress(label);
        pushLog(label);
      });
    } catch (e) {
      console.error(e);
      setError("The Word package could not be created.");
      pushLog("Error while creating the ZIP");
    } finally {
      setDownloading(false);
    }
  }

  const btnPrimary = "px-5 py-2.5 rounded-full bg-[#D6003C] text-white text-sm font-semibold tracking-wide hover:bg-[#b30032] transition disabled:opacity-40";
  const btnGhost = "px-5 py-2.5 rounded-full border border-[#0B2239]/20 text-[#0B2239] text-sm font-medium hover:bg-[#0B2239]/5 transition disabled:opacity-40";

  return (
    <div className={`min-h-screen flex flex-col text-[#0B2239] ${step === 0 ? "bg-[#0B2239]" : "bg-[#F5F7FA]"}`}>
      <Helmet>
        <title>MarSec Studio – Maritime TTX Generator | inside-the-box.org</title>
        <meta name="description" content="MarSec Studio generates full maritime cyber crisis tabletop exercises for container lines, port operators and cruise lines — facilitator guide, injects, role cards and worksheets as Word documents." />
        <meta property="og:title" content="MarSec Studio – Maritime TTX Generator" />
        <meta property="og:description" content="AI-generated maritime cyber crisis exercises for container shipping, ports and cruise operations." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0B2239]/95 backdrop-blur text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold tracking-[0.18em]">MAR<span className="text-[#D6003C]">SEC</span></span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.22em] text-white/50">Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} disabled={loading || downloading} className="text-xs px-3 py-1.5 rounded-full border border-white/25 text-white/80 hover:bg-white/10 disabled:opacity-40">
              ↺ Restart
            </button>
            <Link to="/" className="text-xs px-4 py-1.5 rounded-full bg-[#D6003C] text-white font-semibold">Back to site</Link>
          </div>
        </div>
      </header>

      {/* Hero — landing only */}
      {step === 0 && (
      <section className="relative flex-1 flex items-center">
        <img src={heroImg} alt="Container vessel at sea under an overcast dawn sky" width={1920} height={1088} {...{ fetchpriority: "high" }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2239]/90 via-[#0B2239]/70 to-[#0B2239]/25" />
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D6003C] font-semibold mb-4">Maritime crisis exercises</p>
          <h1 className="text-white font-extrabold leading-[0.95] tracking-tight text-4xl sm:text-6xl md:text-7xl max-w-3xl">
            Rehearse the<br />worst day at sea.
          </h1>
          <p className="mt-6 text-white/75 text-base sm:text-lg max-w-xl">
            A full tabletop exercise for container lines, port operators and cruise lines — scenario, injects, role cards and worksheets, generated in minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 rounded-full bg-[#D6003C] text-white text-sm font-semibold hover:bg-[#b30032] transition">Start the wizard</button>
            <span className="px-6 py-3 rounded-full border border-white/25 text-white/70 text-sm">All input stays in this browser session</span>
          </div>
        </div>
      </section>
      )}

      {step > 0 && (
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Stepper */}
        <ol className="flex gap-1.5 sm:gap-2 mb-8 flex-wrap">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label}>
                <button
                  onClick={() => setStep(n)}
                  disabled={n > 1 && !sectorId}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition disabled:opacity-40 ${
                    active ? "bg-[#D6003C] text-white border-[#D6003C]"
                      : done ? "bg-white text-[#0B2239] border-[#0B2239]/30"
                      : "bg-white text-[#0B2239]/45 border-[#0B2239]/10"
                  }`}
                >
                  {n}. {label}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step 1 — Sector */}
        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Choose your sector</h2>
              <p className="text-sm text-[#0B2239]/60 mt-1">The sector drives the scenario catalog, the profile fields, the crisis team roles and the reporting obligations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SECTORS.map((s) => {
                const active = sectorId === s.id;
                return (
                  <button key={s.id} onClick={() => chooseSector(s.id)}
                    className={`text-left rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-[#D6003C] ring-1 ring-[#D6003C]" : "border-[#0B2239]/10"}`}>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#D6003C] font-semibold">{s.tagline}</span>
                    <h3 className="mt-3 text-lg font-bold leading-tight">{s.name}</h3>
                    <p className="mt-2 text-sm text-[#0B2239]/65">{s.description}</p>
                    <span className="mt-5 inline-block text-sm font-semibold text-[#D6003C]">Select →</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && sector && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Organisation profile</h2>
              <p className="text-sm text-[#0B2239]/60 mt-1">{sector.name} — fictional data is fine and recommended.</p>
            </div>

            <div className="rounded-2xl border border-[#0B2239]/10 bg-white p-5 space-y-3">
              <p className="text-sm text-[#0B2239]/65">Optional: upload an Excel file. Parsed locally in your browser only.</p>
              <div className="flex gap-3 items-center flex-wrap">
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className={btnGhost}>Choose Excel …</button>
                {sheetRows.length > 0 && (
                  <select className="px-3 py-2 rounded-lg border border-[#0B2239]/20 text-sm w-full sm:flex-1 sm:w-auto bg-white" value={selectedRowIdx ?? ""} onChange={(e) => applyRow(Number(e.target.value))}>
                    <option value="">Pick a row …</option>
                    {sheetRows.map((r, i) => <option key={i} value={i}>{String(r[sheetHeaders[0]] ?? `Row ${i + 1}`)}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sector.fields.map((f) => (
                <label key={f.key} className={`block ${f.wide ? "md:col-span-2" : ""}`}>
                  <span className="text-xs font-medium text-[#0B2239]/60">{f.label}</span>
                  {f.wide ? (
                    <textarea rows={2} value={profile[f.key] ?? ""} placeholder={f.placeholder}
                      onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#0B2239]/20 text-sm bg-white" />
                  ) : (
                    <input value={profile[f.key] ?? ""} placeholder={f.placeholder}
                      onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#0B2239]/20 text-sm bg-white" />
                  )}
                </label>
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(1)} className={btnGhost}>← Back</button>
              <button onClick={() => setStep(3)} className={btnPrimary}>Continue →</button>
            </div>
          </section>
        )}

        {/* Step 3 — Scenario topics */}
        {step === 3 && sector && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Scenario topics</h2>
              <p className="text-sm text-[#0B2239]/60 mt-1">
                Pick 1–4 topics and set their role in the story: <em>Side thread</em> (appears at the edge), <em>Core thread</em> (several injects), <em>Lead thread</em> (the spine of the exercise).
              </p>
            </div>
            {selectedTopics.length > 4 && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                More than four topics dilute a single continuous case.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sector.topics.map((t) => {
                const selected = topics[t];
                return (
                  <div key={t} className={`rounded-2xl border bg-white p-4 transition ${selected ? "border-[#D6003C] ring-1 ring-[#D6003C]/40" : "border-[#0B2239]/10"}`}>
                    <button onClick={() => {
                      const next = { ...topics };
                      if (selected) delete next[t]; else next[t] = "Core thread";
                      setTopics(next);
                    }} className="text-left w-full">
                      <p className="text-sm font-semibold">{t}</p>
                    </button>
                    {selected && (
                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#0B2239]/45 mb-1.5">Role in the story</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(["Side thread", "Core thread", "Lead thread"] as Weight[]).map((w) => (
                            <button key={w} onClick={() => setTopics({ ...topics, [t]: w })}
                              className={`px-3 py-1 rounded-full text-xs border transition ${selected === w ? "bg-[#0B2239] text-white border-[#0B2239]" : "border-[#0B2239]/20 text-[#0B2239]/70"}`}>
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
            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(2)} className={btnGhost}>← Back</button>
              <button onClick={() => setStep(4)} disabled={selectedTopics.length === 0} className={btnPrimary}>Continue →</button>
            </div>
          </section>
        )}

        {/* Step 4 — Parameters */}
        {step === 4 && sector && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Exercise parameters</h2>

            <div className="rounded-2xl border border-[#0B2239]/10 bg-white p-5 space-y-6">
              <div>
                <p className="text-sm font-semibold">Duration</p>
                <p className="text-xs text-[#0B2239]/55 mb-2">Play time excluding briefing and hotwash. One inject = one event delivered by the facilitator.</p>
                <div className="flex gap-2 flex-wrap">
                  {([["2h", "Short — 2 h · 8 injects"], ["3h", "Standard — 3 h · 11 injects"], ["4h", "Extended — 4 h · 14 injects"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setDuration(v)} className={`px-4 py-2 rounded-full border text-sm ${duration === v ? "bg-[#0B2239] text-white border-[#0B2239]" : "border-[#0B2239]/20"}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Role scope</p>
                <p className="text-xs text-[#0B2239]/55 mb-2">Number of role cards for the crisis team.</p>
                <div className="flex gap-2 flex-wrap">
                  {([["compact", "Compact — 6 roles (core team)"], ["full", "Full — 8 roles (extended team)"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setRoleScope(v)} className={`px-4 py-2 rounded-full border text-sm ${roleScope === v ? "bg-[#0B2239] text-white border-[#0B2239]" : "border-[#0B2239]/20"}`}>{l}</button>
                  ))}
                </div>
                <p className="text-xs text-[#0B2239]/55 mt-2">{(roleScope === "full" ? sector.roles.full : sector.roles.compact).join(" · ")}</p>
              </div>

              <div>
                <p className="text-sm font-semibold">Difficulty</p>
                <p className="text-xs text-[#0B2239]/55 mb-2">Drives complexity, time pressure and ambiguity of the injects.</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ["Beginner", "Beginner — first TTX, clear options"],
                    ["Intermediate", "Intermediate — practised team, ambiguous situations"],
                    ["Expert", "Expert — time pressure, conflicting reports, media"],
                  ] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setDifficulty(v)} className={`px-4 py-2 rounded-full border text-sm ${difficulty === v ? "bg-[#0B2239] text-white border-[#0B2239]" : "border-[#0B2239]/20"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0B2239]/10 bg-white p-5">
              <p className="text-sm font-semibold">Reporting obligations in scope</p>
              <p className="text-xs text-[#0B2239]/55 mb-3">Deadlines are anchored to the moment the incident is classified as major and appear as concrete clock times in the documents.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {OBLIGATIONS.map((o) => {
                  const on = obligations.includes(o.id);
                  return (
                    <label key={o.id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${on ? "border-[#D6003C] bg-[#D6003C]/5" : "border-[#0B2239]/10"}`}>
                      <input type="checkbox" checked={on} className="mt-1 accent-[#D6003C]"
                        onChange={(e) => setObligations((prev) => e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id))} />
                      <span>
                        <span className="text-sm font-medium block">{o.label}</span>
                        <span className="text-xs text-[#0B2239]/55">{o.detail}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(3)} className={btnGhost}>← Back</button>
              <button onClick={() => setStep(5)} className={btnPrimary}>Continue →</button>
            </div>
          </section>
        )}

        {/* Step 5 — Generate */}
        {step === 5 && sector && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Generate, preview & export</h2>

            <div className="rounded-2xl border border-[#0B2239]/10 bg-white p-5 text-sm space-y-1">
              <p><strong>Sector:</strong> {sector.name}</p>
              <p><strong>Organisation:</strong> {orgName}</p>
              <p><strong>Topics:</strong> {selectedTopics.map(([t, w]) => `${t} (${w})`).join("; ") || "—"}</p>
              <p><strong>Setup:</strong> {duration} · {injectCount} injects · {roleScope === "full" ? "8 roles" : "6 roles"} · {difficulty}</p>
              <p><strong>Reporting:</strong> {OBLIGATIONS.filter((o) => obligations.includes(o.id)).map((o) => o.label).join(", ") || "internal escalation only"}</p>
            </div>

            {!exercise && (
              <button disabled={!canGenerate || loading} onClick={generate} className={btnPrimary}>
                {loading ? "Generating …" : "Generate exercise"}
              </button>
            )}

            {(loading || downloading) && (
              <div className="rounded-2xl border border-[#0B2239]/15 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{progress || "Working …"}</span>
                  <span className="font-mono text-xs text-[#0B2239]/60">{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#0B2239]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D6003C] transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
                {log.length > 0 && (
                  <div className="rounded-xl bg-[#0B2239] text-neutral-100 font-mono text-[11px] leading-relaxed p-3 max-h-40 overflow-y-auto">
                    {log.map((l, i) => (
                      <div key={i}><span className="text-white/40">[{l.t}]</span> {l.msg}</div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[11px] text-[#0B2239]/55">Generation takes 30–90 seconds depending on scope.</p>
                  {loading && (
                    <button onClick={cancelGeneration} className="px-3 py-1.5 rounded-full border border-[#D6003C]/40 text-[#D6003C] text-xs hover:bg-[#D6003C]/5">✕ Cancel</button>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-[#D6003C] bg-[#D6003C]/5 border border-[#D6003C]/30 rounded-lg px-3 py-2">{error}</p>}

            {exercise && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#0B2239]/10 bg-white p-6">
                  <h3 className="text-xl font-bold">{exercise.exerciseName}</h3>
                  <p className="text-sm mt-2 whitespace-pre-line text-[#0B2239]/75">{exercise.summary}</p>
                  {exercise.groundTruth?.classificationTime && (
                    <p className="text-xs mt-3 text-[#0B2239]/55">Classified as major at {exercise.groundTruth.classificationTime}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 uppercase tracking-[0.18em] text-[#0B2239]/60">Inject timeline</h4>
                  <div className="rounded-2xl border border-[#0B2239]/10 bg-white overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead className="bg-[#0B2239] text-white"><tr>
                        <th className="text-left px-3 py-2 w-20">ID</th>
                        <th className="text-left px-3 py-2 w-28 sm:w-36">Time</th>
                        <th className="text-left px-3 py-2">Title</th>
                        <th className="text-left px-3 py-2 w-40 sm:w-56">Topic</th>
                      </tr></thead>
                      <tbody>
                        {exercise.injects.map((i, idx) => (
                          <tr key={i.id} className={idx % 2 ? "bg-[#F5F7FA]" : ""}>
                            <td className="px-3 py-2 font-mono text-xs">{i.id}</td>
                            <td className="px-3 py-2 text-xs">{i.time}</td>
                            <td className="px-3 py-2">{i.title}</td>
                            <td className="px-3 py-2 text-xs text-[#0B2239]/60">{i.topicTag}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 uppercase tracking-[0.18em] text-[#0B2239]/60">Roles</h4>
                  <ul className="text-sm space-y-1.5">
                    {(exercise.roles ?? []).map((r) => (
                      <li key={r.name} className="rounded-xl bg-white border border-[#0B2239]/10 px-4 py-2.5">
                        <strong>{r.name}</strong> — <span className="text-[#0B2239]/70">{r.profile}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(exercise.reportingObligations ?? []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-[0.18em] text-[#0B2239]/60">Reporting obligations</h4>
                    <ul className="text-sm space-y-1.5">
                      {exercise.reportingObligations.map((m, i) => (
                        <li key={i} className="rounded-xl bg-white border border-[#0B2239]/10 px-4 py-2.5">
                          <strong>{m.addressee}</strong> — {m.deadline}
                          {computeDeadlineClock(exercise.groundTruth?.classificationTime, m.deadline) && (
                            <span className="text-[#D6003C]"> · due {computeDeadlineClock(exercise.groundTruth?.classificationTime, m.deadline)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button onClick={generate} disabled={loading} className={btnGhost}>Regenerate</button>
                  <button onClick={downloadZip} disabled={downloading} className={`${btnPrimary} flex-1 sm:flex-none`}>
                    {downloading ? "Building Word package …" : "Download Word package (ZIP)"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 flex-wrap pt-4 border-t border-[#0B2239]/10">
              <button onClick={() => setStep(4)} disabled={loading || downloading} className={btnGhost}>← Back to parameters</button>
              <button onClick={resetAll} disabled={loading || downloading} className={btnGhost}>↺ Start a new exercise</button>
            </div>
          </section>
        )}
      </main>
      )}

      <footer className="bg-[#0B2239] text-white/60 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-xs flex flex-wrap gap-2 justify-between">
          <span>© inside-the-box.org — Cybersecurity &amp; Resilience Consulting</span>
          <span>MarSec Studio · maritime tabletop exercise generator</span>
        </div>
      </footer>
    </div>
  );
}
