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

  const wrap = (text: string, width: number, max = 99) =>
    doc.splitTextToSize(clean(text), width).slice(0, max) as string[];

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
    ["DURATION", meta.duration],
    ["INJECTS", String(meta.injectCount)],
    ["ROLES", String(meta.roleCount)],
    ["FORMAT", levelLabel],
    ["INITIAL CLASSIFICATION", ex.groundTruth?.classificationTime || "n/a"],
  ];
  const stripH = 19;
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
    doc.text(wrap(label, bw - 7, 1), x, y + 6.2);
    const long = clean(value).length > 12;
    set(long ? 8.6 : 11, "bold", NAVY);
    doc.text(wrap(value, bw - 7, 2), x, y + (long ? 11.4 : 13), { lineHeightFactor: 1.2 });
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
    const arch = wrap(`Technical premise: ${ex.groundTruth.architectureAssumption}`, CW, 2);
    doc.text(arch, M, y, { lineHeightFactor: 1.3 });
    y += arch.length * LH.small + 5;
  } else {
    y += 5;
  }

  // ── Objectives | Reporting (two columns) ────────────────
  const colTop = heading("Exercise objectives", M, COL);
  y = colTop - 8;
  heading("Reporting clocks under test", M + COL + GUT, COL);
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
  (ex.reportingObligations ?? []).slice(0, 4).forEach((r) => {
    set(T.small, "bold", NAVY);
    const addr = wrap(r.addressee, COL, 2);
    doc.text(addr, rx, rightY, { lineHeightFactor: 1.3 });
    rightY += addr.length * LH.small;
    set(T.micro, "normal", CRIMSON);
    const dl = wrap(r.deadline, COL, 2);
    doc.text(dl, rx, rightY + 1.2, { lineHeightFactor: 1.3 });
    rightY += dl.length * LH.micro + 5;
  });

  y = Math.max(leftY, rightY) + 4;

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

  injects.slice(0, 3).forEach((inj) => {
    set(T.small, "bold", NAVY);
    doc.text(tick(inj.time), M, y);
    set(T.small, "normal", INK);
    doc.text(wrap(`${inj.title} - ${inj.channel}`, CW - 20, 1), M + 18, y);
    y += 5.4;
  });
  y += 3;

  // ── Delivery at a glance (single row of four metrics) ────
  const channels = [...new Set(injects.map((i) => clean(i.channel)).filter(Boolean))];
  const phases = [...new Set(injects.map((i) => clean(i.phase)).filter(Boolean))];
  const stats: [string, string][] = [
    ["MANDATORY INJECTS", `${injects.filter((i) => i.mandatory).length} of ${injects.length}`],
    ["DELIVERY CHANNELS", String(channels.length)],
    ["EXERCISE PHASES", phases.length ? String(phases.length) : "-"],
    ["GROUND-TRUTH EVENTS", String((ex.groundTruth?.timeline ?? []).length)],
  ];
  y = heading("Delivery at a glance");
  const stw = CW / stats.length;
  stats.forEach(([k, v], i) => {
    const x = M + i * stw;
    set(T.micro, "normal", MID);
    doc.text(clean(k), x, y + 1);
    set(11, "bold", NAVY);
    doc.text(wrap(v, stw - 4, 1), x, y + 7.5);
  });
  y += 12;

  // ── Value block (anchored above the footer) ─────────────
  const boxH = 28;
  const boxY = SAFE_BOTTOM - boxH;

  doc.setFillColor(...NAVY);
  doc.rect(M, boxY, CW, boxH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, boxY, 1.4, boxH, "F");
  set(T.small, "bold", [255, 255, 255]);
  doc.text("WHAT THE ORGANISATION TAKES AWAY", M + 7, boxY + 8);
  set(T.small, "normal", [193, 209, 224]);
  const take = wrap(
    (ex.hotwashNotes ?? []).slice(0, 2).join(" ") ||
      "A tested decision chain, evidenced reporting timelines and a documented view of where the crisis organisation breaks under pressure.",
    CW - 14,
    3,
  );
  doc.text(take, M + 7, boxY + 14.5, { lineHeightFactor: 1.3 });

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
