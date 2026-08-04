/**
 * MarSec Studio — sales-grade one-pager (A4, single page).
 * Pure jsPDF, core fonts only (Helvetica) so it renders identically everywhere.
 *
 * Layout system
 *  - 12-column grid, 18 mm margins, 4 mm gutter
 *  - Type scale: 20 / 11 / 9.6 / 8.6 / 7 pt, min body size 9.6 pt so the page
 *    stays readable when it is pinch-zoomed on a phone
 *  - Vertical rhythm in multiples of 2 mm, every block measured before it is
 *    drawn so nothing ever collides with the footer
 */
import jsPDF from "jspdf";
import type { Exercise } from "@/data/marsecTypes";

const NAVY: [number, number, number] = [11, 34, 57];
const CRIMSON: [number, number, number] = [214, 0, 60];
const LIGHT: [number, number, number] = [245, 247, 250];
const RULE: [number, number, number] = [223, 229, 236];
const MID: [number, number, number] = [108, 122, 138];
const INK: [number, number, number] = [38, 52, 68];

// Page geometry (mm)
const W = 210;
const H = 297;
const M = 18;
const CW = W - M * 2; // 174
const GUT = 6;
const COL = (CW - GUT) / 2; // 84
const FOOT_RULE = H - 16; // 281
const SAFE_BOTTOM = FOOT_RULE - 6;

// Type scale (pt) & line heights (mm)
const T = {
  title: 20,
  lead: 10.4,
  h: 7.4,
  body: 9.6,
  small: 8.6,
  micro: 7,
};
const LH = { body: 4.6, small: 4.1, micro: 3.3 };

export interface OnePagerMeta {
  orgName: string;
  sectorLabel: string;
  duration: string;
  injectCount: number;
  roleCount: number;
  difficulty: string;
}

/** Windows-1252 safe: strip characters the core fonts cannot render. */
const clean = (s: string) =>
  (s || "")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\xFF]/g, "")
    // never leak internal field names into a customer-facing document
    .replace(/classificationTime/gi, "classification")
    .replace(/\s+/g, " ")
    .trim();

export function buildOnePagerPdf(ex: Exercise, meta: OnePagerMeta): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const set = (
    size: number,
    style: "normal" | "bold" = "normal",
    color: [number, number, number] = INK,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  /**
   * Wrap text into at most `max` lines. If it does not fit, whole words are
   * dropped and a visible "..." is appended, so a sentence is never cut off
   * mid-word or mid-clause without the reader noticing.
   */
  const wrap = (text: string, width: number, max = 99): string[] => {
    const src = clean(text);
    if (!src) return [];
    const lines = doc.splitTextToSize(src, width) as string[];
    if (lines.length <= max) return lines;
    const words = src.split(" ");
    while (words.length > 1) {
      words.pop();
      const cand = `${words.join(" ").replace(/[\s.,;:\-/]+$/, "")} ...`;
      const test = doc.splitTextToSize(cand, width) as string[];
      if (test.length <= max) return test;
    }
    return lines.slice(0, max);
  };

  // ── Header band ─────────────────────────────────────────
  const titleLines = (() => {
    set(T.title, "bold");
    return wrap(ex.exerciseName || "Maritime tabletop exercise", CW, 2);
  })();
  const headerH = titleLines.length > 1 ? 48 : 41;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, headerH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(0, headerH, W, 1.4, "F");

  set(T.micro, "bold", [255, 255, 255]);
  doc.text("MARSEC STUDIO", M, 12);
  const kickerW = doc.getTextWidth("MARSEC STUDIO");
  set(T.micro, "normal", [255, 122, 152]);
  doc.text("MARITIME CRISIS EXERCISE   ·   EXERCISE BRIEF", M + kickerW + 6, 12);

  set(T.title, "bold", [255, 255, 255]);
  doc.text(titleLines, M, 24);

  set(T.lead, "normal", [176, 195, 214]);
  doc.text(
    clean(`${meta.orgName}   ·   ${meta.sectorLabel}`),
    M,
    headerH - 7,
  );

  let y = headerH + 10;

  // ── Fact strip ──────────────────────────────────────────
  const levelLabel = (() => {
    const d = clean(meta.difficulty).toLowerCase();
    if (/beginner|foundation|basic/.test(d)) return "Foundation tabletop";
    if (/expert|advanced/.test(d)) return "Advanced crisis exercise";
    return "Crisis leadership exercise";
  })();
  const facts: [string, string][] = [
    ["ROOM TIME", meta.duration],
    ["INJECTS", String(meta.injectCount)],
    ["ROLES", String(meta.roleCount)],
    ["FORMAT", levelLabel],
    [
      "CLASSIFIED AS MAJOR",
      ex.groundTruth?.classificationTime
        ? `${clean(ex.groundTruth.classificationTime)} sim clock`
        : "not reached",
    ],
  ];
  const stripH = 21;
  const bw = CW / facts.length;
  doc.setFillColor(...LIGHT);
  doc.rect(M, y, CW, stripH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, y, 1.4, stripH, "F");
  facts.forEach(([label, value], i) => {
    const x = M + i * bw + 5;
    if (i > 0) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(M + i * bw, y + 3.5, M + i * bw, y + stripH - 3.5);
    }
    set(T.micro - 0.6, "normal", MID);
    const lab = wrap(label, bw - 7, 2);
    doc.text(lab, x, y + 5.6, { lineHeightFactor: 1.15 });
    const long = clean(value).length > 12;
    set(long ? 8.4 : 11, "bold", NAVY);
    doc.text(wrap(value, bw - 7, 2), x, y + (lab.length > 1 ? 14.4 : 12.6), {
      lineHeightFactor: 1.2,
    });
  });
  y += stripH + 10;


  // ── Section heading helper ──────────────────────────────
  const heading = (label: string, x = M, width = CW) => {
    set(T.h, "bold", CRIMSON);
    doc.text(clean(label).toUpperCase(), x, y);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(x, y + 2, x + width, y + 2);
    return y + 8;
  };

  // ── Scenario ────────────────────────────────────────────
  y = heading("The scenario");
  set(T.body, "normal", INK);
  const scenario = wrap(ex.summary || ex.groundTruth?.adversaryOrCause || "", CW, 5);
  doc.text(scenario, M, y, { lineHeightFactor: 1.35 });
  y += scenario.length * LH.body + 3;
  if (ex.groundTruth?.architectureAssumption) {
    set(T.small, "normal", INK);
    const arch = wrap(`Technical premise: ${ex.groundTruth.architectureAssumption}`, CW, 3);
    doc.text(arch, M, y, { lineHeightFactor: 1.3 });
    y += arch.length * LH.small + 5;
  } else {
    y += 5;
  }

  // ── Objectives | Reporting (two columns) ────────────────
  const colTop = heading("Exercise objectives", M, COL);
  y = colTop - 8;
  heading("Notification clocks under test", M + COL + GUT, COL);
  y = colTop;

  let leftY = y;
  (ex.objectives ?? []).slice(0, 5).forEach((o) => {
    set(T.small, "normal", INK);
    const lines = wrap(o, COL - 6, 3);
    doc.setFillColor(...CRIMSON);
    doc.circle(M + 1.3, leftY - 1.2, 0.9, "F");
    doc.text(lines, M + 5, leftY, { lineHeightFactor: 1.3 });
    leftY += lines.length * LH.small + 2.6;
  });

  const rx = M + COL + GUT;
  let rightY = y;
  type Obligation = { kind?: string; addressee: string; basis?: string; deadline: string };
  /** Hour offsets below the statutory window cannot be a regulatory deadline. */
  const offsetHours = (d: string) => {
    const m = /t\s*\+\s*(\d+(?:[.,]\d+)?)\s*h/i.exec(d || "");
    return m ? parseFloat(m[1].replace(",", ".")) : null;
  };
  const kindOf = (r: Obligation) => {
    const s = `${r.addressee} ${r.basis ?? ""}`;
    const statutory = /nis2|nis 2|art\.?\s*23|gdpr|art\.?\s*33/i.test(s);
    const off = offsetHours(r.deadline);
    // NIS2 early warning is 24 h, GDPR 72 h: anything faster is an internal ambition.
    if (statutory && off !== null && off < 24) return "Internal escalation target";
    if (/imo|msc-fal|class|flag state|charter|sla|customer|cargo/i.test(s))
      return "Company / contract / class target";
    if (r.kind) return clean(r.kind);
    if (statutory) return "Regulatory deadline";
    return "Internal escalation target";
  };
  /** Show the legal window next to the clock so the offset cannot be read as the law. */
  const basisNote = (r: Obligation) => {
    const s = `${r.addressee} ${r.basis ?? ""}`;
    if (/gdpr|art\.?\s*33/i.test(s)) return "GDPR Art. 33: 72 h statutory window";
    if (/final report|1 month|one month/i.test(`${r.deadline} ${s}`))
      return "NIS2 Art. 23: 1 month final report";
    if (/72\s*h/i.test(r.deadline)) return "NIS2 Art. 23: 72 h incident notification";
    if (/nis2|nis 2|art\.?\s*23/i.test(s)) return "NIS2 Art. 23: 24 h early warning at the latest";
    if (/imo|msc-fal/i.test(s)) return "IMO MSC-FAL.1/Circ.3 is guidance, not a reporting clock";
    return clean(r.basis || "Exercise assumption, no statutory basis");
  };
  (ex.reportingObligations ?? []).slice(0, 4).forEach((r) => {
    set(T.small, "bold", NAVY);
    const addr = wrap(r.addressee, COL, 2);
    doc.text(addr, rx, rightY, { lineHeightFactor: 1.3 });
    rightY += addr.length * LH.small;
    set(T.micro, "normal", CRIMSON);
    const dl = wrap(r.deadline, COL, 2);
    doc.text(dl, rx, rightY + 1.2, { lineHeightFactor: 1.3 });
    rightY += dl.length * LH.micro + 1.2;
    set(T.micro - 0.6, "normal", MID);
    const kd = wrap(`${kindOf(r)} - ${basisNote(r)}`, COL, 2);
    doc.text(kd, rx, rightY + 1.2, { lineHeightFactor: 1.2 });
    rightY += kd.length * LH.micro + 3.4;
  });
  set(T.micro - 0.6, "normal", MID);
  doc.text(
    wrap(
      "Statutory clocks are fixed by law (NIS2 Art. 23: 24 h / 72 h / 1 month; GDPR Art. 33: 72 h). Faster hour-level targets, IMO guidance, class, charter and customer commitments are exercise targets, not regulatory deadlines.",
      COL,
      4,
    ),
    rx,
    rightY + 0.5,
    { lineHeightFactor: 1.25 },
  );
  rightY += 4 * LH.micro + 2;

  y = Math.max(leftY, rightY) + 4;

  // ── Value block geometry (anchored above the footer) ─────
  const boxH = 32;
  const boxY = SAFE_BOTTOM - boxH;

  // ── Inject flow ─────────────────────────────────────────
  const injects = ex.injects ?? [];
  y = heading("Inject flow");
  const trackY = y + 3;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(M, trackY, M + CW, trackY);
  const shown = injects.slice(0, 12);
  const n = Math.max(shown.length, 1);
  const labelEvery = n > 8 ? 2 : 1;
  // compact clock token, e.g. "T+15 (08:15)" -> "T+15"
  const tick = (t: string) => clean(t).split(/[\s(]/)[0].slice(0, 8);
  shown.forEach((inj, i) => {
    const x = M + CW * (n === 1 ? 0.5 : i / (n - 1));
    doc.setFillColor(...(inj.mandatory ? CRIMSON : NAVY));
    doc.circle(x, trackY, 1.5, "F");
    if (i % labelEvery === 0) {
      set(T.micro - 1, "normal", MID);
      const tx = Math.min(Math.max(x, M + 6), M + CW - 6);
      doc.text(tick(inj.time), tx, trackY + 5.4, { align: "center" });
    }
  });
  y = trackY + 12;

  // Inject list, two columns. Rows are capped to the space left above the
  // deliverables box (incl. the closing note) so nothing is ever overprinted.
  const ROW = 4.6;
  const NOTE_H = 6;
  const roomForRows = Math.max(0, boxY - 6 - NOTE_H - y);
  const maxRows = Math.max(1, Math.floor(roomForRows / ROW));
  const listed = injects.slice(0, Math.min(12, maxRows * 2));
  const rows = Math.min(maxRows, Math.ceil(listed.length / 2));
  const icw = (CW - GUT) / 2;
  listed.forEach((inj, i) => {
    const col = i < rows ? 0 : 1;
    const row = i < rows ? i : i - rows;
    const ix = M + col * (icw + GUT);
    const iy = y + row * ROW;
    set(T.micro, "bold", inj.mandatory ? CRIMSON : NAVY);
    doc.text(tick(inj.time), ix, iy);
    set(T.micro, "normal", INK);
    doc.text(wrap(`${inj.title} - ${inj.channel}`, icw - 15, 1), ix + 14, iy);
  });
  y += rows * ROW + 1;
  set(T.micro - 0.6, "normal", MID);
  const mandatoryCount = injects.filter((i) => i.mandatory).length;
  doc.text(
    clean(
      `${listed.length === injects.length ? `All ${injects.length} injects listed` : `${listed.length} of ${injects.length} injects listed`} - ${mandatoryCount} mandatory (red). Full content, expected responses and facilitator notes in the facilitator guide.`,
    ),
    M,
    Math.min(y, boxY - 4),
  );




  doc.setFillColor(...NAVY);
  doc.rect(M, boxY, CW, boxH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, boxY, 1.4, boxH, "F");
  set(T.small, "bold", [255, 255, 255]);
  doc.text("DELIVERABLES AFTER THE EXERCISE", M + 7, boxY + 7.5);
  const deliverables = [
    "After-action report with observed decisions and timings",
    "Prioritised remediation actions with owners and due dates",
    "Documented role, deputy and contact gaps",
    "Evidence of the notification paths tested (statutory, contractual, internal)",
  ];
  const dcw = (CW - 20) / 2;
  deliverables.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx = M + 7 + col * (dcw + 6);
    const dy = boxY + 14 + row * 8.4;
    doc.setFillColor(...CRIMSON);
    doc.circle(dx + 1, dy - 1.2, 0.9, "F");
    set(T.micro, "normal", [201, 216, 230]);
    doc.text(wrap(d, dcw - 6, 2), dx + 4.5, dy, { lineHeightFactor: 1.25 });
  });


  // ── Footer ──────────────────────────────────────────────
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(M, FOOT_RULE, M + CW, FOOT_RULE);
  set(T.micro, "normal", MID);
  doc.text(
    "MarSec Studio  ·  inside-the-box.org - Cybersecurity & Resilience Consulting",
    M,
    FOOT_RULE + 5,
  );
  doc.text(
    clean(
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ),
    M + CW,
    FOOT_RULE + 5,
    { align: "right" },
  );

  return doc;
}
