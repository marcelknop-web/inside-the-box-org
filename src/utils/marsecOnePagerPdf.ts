/**
 * MarSec Studio — tailored exercise brief (A4, single page, sales-grade).
 * Pure jsPDF, core fonts only (Helvetica) so it renders identically everywhere.
 *
 * Editorial intent
 *  - reads as a description of ONE exercise designed for ONE organisation,
 *    not as a list of disconnected statements
 *  - every section is introduced by a short narrative line, then evidence
 *  - blocks are measured before they are drawn, so nothing ever collides
 *
 * Layout system
 *  - 17 mm margins, two-column body (104 / 64 mm) with an 8 mm gutter
 *  - type scale 22 / 10.6 / 9.6 / 8.5 / 7.2 pt, body never below 8.5 pt
 *  - vertical rhythm in multiples of 2 mm
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
const M = 17;
const CW = W - M * 2; // 176
const GUT = 8;
const LCOL = 104;
const RCOL = CW - LCOL - GUT; // 64
const FOOT_RULE = H - 15;
const SAFE_BOTTOM = FOOT_RULE - 6;

// Type scale (pt) & line heights (mm)
const T = {
  title: 22,
  lead: 10.6,
  h: 7.4,
  body: 9.6,
  small: 8.5,
  micro: 7.2,
};
const LH = { lead: 5.1, body: 4.6, small: 4.05, micro: 3.35 };

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

/** First sentence(s) of a text, up to `maxChars`, always ending cleanly. */
const firstSentences = (s: string, maxChars: number) => {
  const src = clean(s);
  if (src.length <= maxChars) return src;
  const cut = src.slice(0, maxChars);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  if (stop > maxChars * 0.5) return cut.slice(0, stop + 1);
  return `${cut.replace(/[\s.,;:\-/]+\S*$/, "")} ...`;
};

export function buildOnePagerPdf(ex: Exercise, meta: OnePagerMeta): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const set = (
    size: number,
    style: "normal" | "bold" | "italic" = "normal",
    color: [number, number, number] = INK,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  /**
   * Wrap text into at most `max` lines. If it does not fit, whole words are
   * dropped and a visible "..." is appended, so a sentence is never cut off
   * mid-word without the reader noticing.
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
  const headerH = titleLines.length > 1 ? 50 : 43;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, headerH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(0, headerH, W, 1.4, "F");

  set(T.micro, "bold", [255, 255, 255]);
  doc.text("MARSEC STUDIO", M, 12, { charSpace: 0.5 });
  const kickerW = doc.getTextWidth("MARSEC STUDIO") + 0.5 * "MARSEC STUDIO".length;
  set(T.micro, "normal", [255, 122, 152]);
  doc.text("TAILORED MARITIME CRISIS EXERCISE", M + kickerW + 6, 12, { charSpace: 0.5 });

  set(T.title, "bold", [255, 255, 255]);
  doc.text(titleLines, M, titleLines.length > 1 ? 25 : 26);

  set(T.lead, "normal", [176, 195, 214]);
  doc.text(clean(`Designed for ${meta.orgName}   ·   ${meta.sectorLabel}`), M, headerH - 8);

  let y = headerH + 11;

  // ── Lead paragraph: the tailored promise ────────────────
  const levelLabel = (() => {
    const d = clean(meta.difficulty).toLowerCase();
    if (/beginner|foundation|basic/.test(d)) return "Foundation tabletop";
    if (/expert|advanced/.test(d)) return "Advanced crisis exercise";
    return "Crisis leadership exercise";
  })();
  const lead =
    `A discussion-based crisis exercise written around ${clean(meta.orgName)}'s own operating reality. ` +
    `In ${clean(meta.duration)} of facilitated room time, ${meta.roleCount} leadership roles work through ` +
    `${meta.injectCount} timed injects - from first detection to the decision to resume normal operations.`;
  set(T.lead, "normal", INK);
  const leadLines = wrap(lead, CW, 3);
  doc.text(leadLines, M, y, { lineHeightFactor: 1.35 });
  y += leadLines.length * LH.lead + 5;

  // ── Fact strip ──────────────────────────────────────────
  const facts: [string, string][] = [
    ["ROOM TIME", meta.duration],
    ["INJECTS", String(meta.injectCount)],
    ["ROLES AT THE TABLE", String(meta.roleCount)],
    ["FORMAT", levelLabel],
  ];
  const stripH = 20;
  const bw = CW / facts.length;
  doc.setFillColor(...LIGHT);
  doc.rect(M, y, CW, stripH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, y, 1.4, stripH, "F");
  facts.forEach(([label, value], i) => {
    const x = M + i * bw + 6;
    if (i > 0) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(M + i * bw, y + 3.5, M + i * bw, y + stripH - 3.5);
    }
    set(T.micro - 0.8, "normal", MID);
    doc.text(wrap(label, bw - 9, 1), x, y + 6, { charSpace: 0.3 });
    const long = clean(value).length > 12;
    set(long ? 9 : 12, "bold", NAVY);
    doc.text(wrap(value, bw - 9, 2), x, y + 13.4, { lineHeightFactor: 1.15 });
  });
  y += stripH + 11;

  // ── Section heading helper ──────────────────────────────
  const heading = (label: string, x = M, width = CW) => {
    set(T.h, "bold", CRIMSON);
    doc.text(clean(label).toUpperCase(), x, y, { charSpace: 0.6 });
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(x, y + 2.2, x + width, y + 2.2);
    return y + 8;
  };

  // ── The situation ───────────────────────────────────────
  y = heading("The situation the team walks into");
  set(T.body, "normal", INK);
  const scenario = wrap(
    firstSentences(ex.summary || ex.groundTruth?.adversaryOrCause || "", 660),
    CW,
    5,
  );
  doc.text(scenario, M, y, { lineHeightFactor: 1.36 });
  y += scenario.length * LH.body + 2.6;
  if (ex.groundTruth?.architectureAssumption) {
    set(T.small, "italic", MID);
    const arch = wrap(
      `Technical premise held by the facilitator: ${firstSentences(ex.groundTruth.architectureAssumption, 165)}`,
      CW,
      2,
    );
    doc.text(arch, M, y + 1, { lineHeightFactor: 1.3 });
    y += arch.length * LH.small + 7;
  } else {
    y += 6;
  }

  // ── Two columns: decisions | notification clocks ────────
  const colTop = heading("What the room has to decide", M, LCOL);
  y = colTop - 8;
  heading("Notification clocks under test", M + LCOL + GUT, RCOL);
  y = colTop;

  // Hard bottom limit for both columns: the run-of-play band (27 mm) and the
  // deliverables box own the page from here down, so nothing may cross it.
  const COL_LIMIT = SAFE_BOTTOM - 28 - 25 - 2;

  let leftY = y;
  set(T.small, "normal", MID);
  const objIntro = wrap(
    "The exercise is scored against decisions, not knowledge. Participants are expected to reach and record:",
    LCOL,
    2,
  );
  doc.text(objIntro, M, leftY, { lineHeightFactor: 1.3 });
  leftY += objIntro.length * LH.small + 3.4;
  (ex.objectives ?? []).slice(0, 3).forEach((o) => {
    set(T.small, "normal", INK);
    const lines = wrap(firstSentences(o, 175), LCOL - 6, 4);
    if (leftY + lines.length * LH.small > COL_LIMIT) return;
    doc.setFillColor(...CRIMSON);
    doc.circle(M + 1.3, leftY - 1.2, 0.9, "F");
    doc.text(lines, M + 5, leftY, { lineHeightFactor: 1.32 });
    leftY += lines.length * LH.small + 2.8;
  });

  const rx = M + LCOL + GUT;
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
    if (/flag state|solas|isps|designated authority|coast guard|port state|33 cfr|mtsa/i.test(s))
      return "Statutory duty, no fixed clock";
    if (/imo|msc-fal|class|charter|sla|customer|cargo/i.test(s))
      return "Company / contract / class target";
    if (r.kind) return clean(r.kind);
    if (statutory) return "Regulatory deadline";
    return "Internal escalation target";
  };
  /** Show the legal window next to the clock so the offset cannot be read as the law. */
  const basisNote = (r: Obligation) => {
    const s = `${r.addressee} ${r.basis ?? ""}`;
    if (/gdpr|art\.?\s*33/i.test(s)) return "GDPR Art. 33: 72 h";
    if (/final report|1 month|one month/i.test(`${r.deadline} ${s}`))
      return "NIS2 Art. 23: 1 month final report";
    if (/72\s*h/i.test(r.deadline)) return "NIS2 Art. 23: 72 h notification";
    if (/nis2|nis 2|art\.?\s*23/i.test(s)) return "NIS2 Art. 23: 24 h early warning";
    if (/imo|msc-fal|msc\.428/i.test(s)) return "IMO guidance / SMS duty";
    if (/flag state|flag administration|solas|isps|designated authority/i.test(s))
      return "ISPS / SOLAS XI-2: without delay";
    if (/coast guard|national response center|33 cfr|mtsa|port state/i.test(s))
      return "33 CFR 101.305: without delay";
    if (/mar art\.?\s*17|8-k|inside information|ad-hoc/i.test(s))
      return "MAR Art. 17 / SEC 8-K Item 1.05";
    if (/class|charter|sla|customer|cargo/i.test(s)) return "Contractual, not statutory";
    if (r.basis) return firstSentences(r.basis, 60);
    return "Internal target";
  };
  /** Keep the clock column readable: one clear statement, never a compound trace. */
  const compactDeadline = (d: string) => {
    const src = clean(d);
    const head = src.split(/\s*(?:->|,|;)\s*/)[0];
    return firstSentences(head || src, 54);
  };

  set(T.small, "normal", MID);
  const clockIntro = wrap(
    "Exercised live, with the statutory window named next to each target.",
    RCOL,
    2,
  );
  doc.text(clockIntro, rx, rightY, { lineHeightFactor: 1.3 });
  rightY += clockIntro.length * LH.small + 3.4;

  (ex.reportingObligations ?? []).slice(0, 3).forEach((r) => {
    set(T.small, "bold", NAVY);
    const addr = wrap(firstSentences(r.addressee, 70), RCOL, 2);
    // 3 measured bands (name, clock, basis) must still fit above the limit
    if (rightY + addr.length * LH.small + 4 * LH.micro + 5 > COL_LIMIT) return;
    doc.text(addr, rx, rightY, { lineHeightFactor: 1.28 });
    rightY += addr.length * LH.small;
    set(T.micro, "normal", CRIMSON);
    const dl = wrap(compactDeadline(r.deadline), RCOL, 2);
    doc.text(dl, rx, rightY + 1.4, { lineHeightFactor: 1.28 });
    rightY += dl.length * LH.micro + 1.4;
    set(T.micro - 0.8, "normal", MID);
    const kd = wrap(`${kindOf(r)} - ${basisNote(r)}`, RCOL, 2);
    doc.text(kd, rx, rightY + 1.4, { lineHeightFactor: 1.2 });
    rightY += kd.length * LH.micro + 3.6;
  });

  // ── Value block geometry (anchored above the footer) ─────
  const boxH = 28;
  const boxY = SAFE_BOTTOM - boxH;

  // The run-of-play band needs 24 mm (heading, track, tick labels, caption).
  // Clamping guarantees it always sits fully above the deliverables box, no
  // matter how long the objectives or notification entries turn out.
  y = Math.min(Math.max(leftY, rightY) + 6, boxY - 25);

  // ── Run of play ─────────────────────────────────────────
  const injects = ex.injects ?? [];
  y = heading("How the exercise unfolds");
  const trackY = y + 3.4;
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
      set(T.micro - 1.2, "normal", MID);
      const tx = Math.min(Math.max(x, M + 7), M + CW - 7);
      doc.text(tick(inj.time), tx, trackY + 5.2, { align: "center" });
    }
  });
  const phases = ["Detection", "Containment", "Operational impact", "Communication", "Recovery"];
  set(T.micro - 0.4, "normal", MID);
  doc.text(
    wrap(
      `The scenario runs through ${phases.join(" - ").toLowerCase()}. Every inject arrives with its content, the expected response, discussion prompts and facilitator notes in the accompanying facilitator guide.`,
      CW,
      2,
    ),
    M,
    Math.min(trackY + 11.5, boxY - 8),
    { lineHeightFactor: 1.25 },
  );

  // ── Deliverables ────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(M, boxY, CW, boxH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, boxY, 1.4, boxH, "F");
  set(T.small, "bold", [255, 255, 255]);
  doc.text("WHAT YOU KEEP AFTER THE EXERCISE", M + 7, boxY + 7, { charSpace: 0.4 });
  const deliverables = [
    "After-action report with observed decisions and timings",
    "Prioritised remediation actions with owners and due dates",
    "Documented role, deputy and contact gaps",
    "Evidence of every notification path that was tested",
  ];
  const dcw = (CW - 20) / 2;
  deliverables.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx = M + 7 + col * (dcw + 6);
    const dy = boxY + 14 + row * 7.2;
    doc.setFillColor(...CRIMSON);
    doc.circle(dx + 1, dy - 1.2, 0.9, "F");
    set(T.micro, "normal", [201, 216, 230]);
    doc.text(wrap(d, dcw - 6, 1), dx + 4.5, dy);
  });

  // ── Footer ──────────────────────────────────────────────
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(M, FOOT_RULE, M + CW, FOOT_RULE);
  set(T.micro - 0.4, "normal", MID);
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
