/**
 * MarSec Studio — sales-grade one-pager (A4, single page).
 * Pure jsPDF, core fonts only (Helvetica) so it renders identically everywhere.
 */
import jsPDF from "jspdf";
import type { Exercise } from "@/data/marsecTypes";

const NAVY: [number, number, number] = [11, 34, 57];
const CRIMSON: [number, number, number] = [214, 0, 60];
const LIGHT: [number, number, number] = [245, 247, 250];
const MID: [number, number, number] = [110, 124, 140];

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
    .trim();

export function buildOnePagerPdf(ex: Exercise, meta: OnePagerMeta): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;
  const CW = W - M * 2;

  // ── Header band ─────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 40, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(0, 40, W, 1.6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MARSEC STUDIO", M, 13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 120, 150);
  doc.text("MARITIME CRISIS EXERCISE  ·  EXERCISE BRIEF", M + 32, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  const title = doc.splitTextToSize(clean(ex.exerciseName || "Maritime tabletop exercise"), CW);
  doc.text(title.slice(0, 2), M, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(190, 205, 220);
  doc.text(clean(`${meta.orgName} · ${meta.sectorLabel}`), M, title.length > 1 ? 35.5 : 32);

  let y = 52;

  // ── Fact strip ──────────────────────────────────────────
  const facts: [string, string][] = [
    ["DURATION", meta.duration],
    ["INJECTS", String(meta.injectCount)],
    ["ROLES", String(meta.roleCount)],
    ["LEVEL", meta.difficulty],
    ["CLASSIFIED", ex.groundTruth?.classificationTime || "n/a"],
  ];
  const bw = CW / facts.length;
  facts.forEach(([label, value], i) => {
    const x = M + i * bw;
    doc.setFillColor(...LIGHT);
    doc.rect(x, y, bw - 2, 16, "F");
    doc.setFillColor(...CRIMSON);
    doc.rect(x, y, 1.2, 16, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MID);
    doc.text(label, x + 4, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(clean(value).slice(0, 14), x + 4, y + 12.4);
  });
  y += 24;

  // ── Section helper ──────────────────────────────────────
  const section = (label: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...CRIMSON);
    doc.text(clean(label).toUpperCase(), M, y);
    doc.setDrawColor(225, 230, 236);
    doc.setLineWidth(0.3);
    doc.line(M, y + 1.8, M + CW, y + 1.8);
    y += 7;
  };

  const body = (text: string, width = CW, maxLines = 6) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 60, 76);
    const lines = doc.splitTextToSize(clean(text), width).slice(0, maxLines);
    doc.text(lines, M, y);
    y += lines.length * 4.3 + 4;
  };

  // ── Scenario ────────────────────────────────────────────
  section("The scenario");
  body(ex.summary || ex.groundTruth?.adversaryOrCause || "", CW, 5);

  // ── Objectives + reporting side by side ─────────────────
  const colW = (CW - 8) / 2;
  const startY = y;
  const objectives = (ex.objectives ?? []).slice(0, 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...CRIMSON);
  doc.text("EXERCISE OBJECTIVES", M, y);
  doc.text("REPORTING CLOCKS UNDER TEST", M + colW + 8, y);
  doc.setDrawColor(225, 230, 236);
  doc.line(M, y + 1.8, M + colW, y + 1.8);
  doc.line(M + colW + 8, y + 1.8, M + CW, y + 1.8);
  y += 7;

  let leftY = y;
  doc.setFontSize(8.6);
  objectives.forEach((o) => {
    doc.setFillColor(...CRIMSON);
    doc.circle(M + 1.2, leftY - 1.1, 0.9, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 60, 76);
    const lines = doc.splitTextToSize(clean(o), colW - 6).slice(0, 3);
    doc.text(lines, M + 4.5, leftY);
    leftY += lines.length * 3.9 + 2.4;
  });

  let rightY = y;
  (ex.reportingObligations ?? []).slice(0, 5).forEach((r) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.setTextColor(...NAVY);
    const addr = doc.splitTextToSize(clean(r.addressee), colW - 4).slice(0, 2);
    doc.text(addr, M + colW + 8, rightY);
    rightY += addr.length * 3.9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CRIMSON);
    doc.text(clean(r.deadline).slice(0, 46), M + colW + 8, rightY + 1.2);
    rightY += 7.4;
  });

  y = Math.max(leftY, rightY) + 4;

  // ── Inject flow ─────────────────────────────────────────
  section("Inject flow");
  const injects = ex.injects ?? [];
  const trackY = y + 2;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(M, trackY, M + CW, trackY);
  const n = Math.max(injects.length, 1);
  injects.forEach((inj, i) => {
    const x = M + (CW * (n === 1 ? 0.5 : i / (n - 1)));
    doc.setFillColor(...(inj.mandatory ? CRIMSON : NAVY));
    doc.circle(x, trackY, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.setTextColor(...MID);
    doc.text(clean(inj.time).slice(0, 9), x, trackY + 5, { align: "center" });
  });
  y = trackY + 11;

  // Highlighted first three injects
  doc.setFontSize(8.4);
  injects.slice(0, 3).forEach((inj) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(clean(`${inj.time}`).slice(0, 10), M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 60, 76);
    const lines = doc.splitTextToSize(clean(`${inj.title} — ${inj.channel}`), CW - 24).slice(0, 1);
    doc.text(lines, M + 22, y);
    y += 5;
  });
  y += 2;

  // ── Delivery at a glance ────────────────────────────────
  section("Delivery at a glance");
  const channels = [...new Set(injects.map((i) => clean(i.channel)).filter(Boolean))];
  const phases = [...new Set(injects.map((i) => clean(i.phase)).filter(Boolean))];
  const stats: [string, string][] = [
    ["Mandatory injects", `${injects.filter((i) => i.mandatory).length} of ${injects.length}`],
    ["Delivery channels", String(channels.length)],
    ["Exercise phases", phases.length ? phases.join(", ") : "-"],
    ["Ground-truth events", String((ex.groundTruth?.timeline ?? []).length)],
  ];
  const sw = CW / 2;
  stats.forEach(([k, v], i) => {
    const x = M + (i % 2) * sw;
    const sy = y + Math.floor(i / 2) * 7.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...MID);
    doc.text(clean(k), x, sy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(doc.splitTextToSize(clean(v), sw - 42).slice(0, 1), x + 40, sy);
  });
  y += 18;

  // ── Value block ─────────────────────────────────────────
  const boxH = 26;
  const boxY = Math.max(y, 244 - boxH);
  doc.setFillColor(...NAVY);
  doc.rect(M, boxY, CW, boxH, "F");
  doc.setFillColor(...CRIMSON);
  doc.rect(M, boxY, 1.6, boxH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WHAT THE ORGANISATION TAKES AWAY", M + 6, boxY + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(200, 213, 226);
  const take = doc.splitTextToSize(
    clean(
      (ex.hotwashNotes ?? []).slice(0, 2).join(" ") ||
        "A tested decision chain, evidenced reporting timelines and a documented view of where the crisis organisation breaks under pressure.",
    ),
    CW - 12,
  ).slice(0, 3);
  doc.text(take, M + 6, boxY + 13.5);

  // ── Footer ──────────────────────────────────────────────
  doc.setDrawColor(225, 230, 236);
  doc.setLineWidth(0.3);
  doc.line(M, 282, M + CW, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("MarSec Studio · inside-the-box.org — Cybersecurity & Resilience Consulting", M, 287);
  doc.text(clean(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })), M + CW, 287, { align: "right" });

  return doc;
}
