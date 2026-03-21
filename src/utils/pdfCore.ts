/**
 * pdfCore.ts — Shared PDF layout engine for DORA & NIS-2 compliance reports
 * 
 * Professional typography: IBM Plex Serif (body), Instrument Sans (headings), IBM Plex Mono (data)
 * Layout: A4, generous margins, banking-grade whitespace, deep navy accent palette
 */
import jsPDF from 'jspdf';

/* ════════════════════════════════════════════════════════════
   Prose Helpers — turn raw user input into readable sentences
   ════════════════════════════════════════════════════════════ */

/** Turn a list of items into a readable sentence.
 *  e.g. ['Firewall', 'SIEM', 'WAF'] → "Die Infrastruktur umfasst Firewall, SIEM und WAF."
 */
export function humanizeList(items: string[], lang: string, context: 'infra' | 'providers' | 'roles' | 'generic' = 'generic'): string {
  if (!items || items.length === 0) return '';
  const joined = items.length <= 2
    ? items.join(lang === 'de' ? ' und ' : lang === 'fr' ? ' et ' : ' and ')
    : items.slice(0, -1).join(', ') + (lang === 'de' ? ' und ' : lang === 'fr' ? ' et ' : ' and ') + items[items.length - 1];

  if (lang === 'de') {
    switch (context) {
      case 'infra': return `Die IKT-Infrastruktur des Unternehmens umfasst die folgenden Komponenten: ${joined}.`;
      case 'providers': return `Im Rahmen der Leistungserbringung werden die folgenden Drittanbieter eingesetzt: ${joined}.`;
      case 'roles': return `An der Prüfung waren die folgenden Rollen beteiligt: ${joined}.`;
      default: return joined;
    }
  }
  switch (context) {
    case 'infra': return `The entity's ICT infrastructure encompasses the following components: ${joined}.`;
    case 'providers': return `The following third-party providers are engaged in service delivery: ${joined}.`;
    case 'roles': return `The following roles participated in the assessment: ${joined}.`;
    default: return joined;
  }
}

/** Turn raw user-entered text (which may be staccato or bullet-like) into a readable paragraph. */
export function humanizeText(raw: string, lang: string, context: 'issues' | 'description' = 'description'): string {
  if (!raw || !raw.trim()) return '';
  const trimmed = raw.trim();
  // If it already looks like a proper sentence (ends with period, multiple words), return as-is
  if (trimmed.length > 40 && /[.!?]$/.test(trimmed)) return trimmed;
  // Wrap in context sentence
  if (lang === 'de') {
    if (context === 'issues') return `Die folgenden Schwachstellen wurden vom Unternehmen im Vorfeld der Prüfung benannt: ${trimmed}${trimmed.endsWith('.') ? '' : '.'}`;
    return `Zum geprüften Unternehmen wurde die folgende Beschreibung angegeben: ${trimmed}${trimmed.endsWith('.') ? '' : '.'}`;
  }
  if (context === 'issues') return `The following weaknesses were reported by the entity prior to the assessment: ${trimmed}${trimmed.endsWith('.') ? '' : '.'}`;
  return `The following description was provided for the assessed entity: ${trimmed}${trimmed.endsWith('.') ? '' : '.'}`;
}

/* ════════════════════════════════════════════════════════════
   Font System
   ════════════════════════════════════════════════════════════ */

const FONT_FILES = [
  { file: 'IBMPlexSerif-Regular.ttf', family: 'IBMPlexSerif', style: 'normal' },
  { file: 'IBMPlexSerif-Bold.ttf', family: 'IBMPlexSerif', style: 'bold' },
  { file: 'IBMPlexSerif-Italic.ttf', family: 'IBMPlexSerif', style: 'italic' },
  { file: 'InstrumentSans-Regular.ttf', family: 'InstrumentSans', style: 'normal' },
  { file: 'InstrumentSans-Bold.ttf', family: 'InstrumentSans', style: 'bold' },
  { file: 'IBMPlexMono-Regular.ttf', family: 'IBMPlexMono', style: 'normal' },
  { file: 'IBMPlexMono-Bold.ttf', family: 'IBMPlexMono', style: 'bold' },
];

let fontsLoaded = false;
let fontCache: Record<string, string> = {};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFonts(): Promise<void> {
  if (fontsLoaded) return;
  const results = await Promise.all(
    FONT_FILES.map(async (f) => {
      const resp = await fetch(`/fonts/${f.file}`);
      if (!resp.ok) throw new Error(`Font load failed: ${f.file}`);
      const buf = await resp.arrayBuffer();
      return { ...f, base64: arrayBufferToBase64(buf) };
    })
  );
  results.forEach(r => {
    fontCache[`${r.family}-${r.style}`] = r.base64;
  });
  fontsLoaded = true;
}

function registerFonts(doc: jsPDF): void {
  FONT_FILES.forEach(f => {
    const key = `${f.family}-${f.style}`;
    const b64 = fontCache[key];
    if (b64) {
      doc.addFileToVFS(f.file, b64);
      doc.addFont(f.file, f.family, f.style);
    }
  });
}

/* ════════════════════════════════════════════════════════════
   Font Names
   ════════════════════════════════════════════════════════════ */
export const FONTS = {
  body: 'IBMPlexSerif',      // Elegant serif for body prose
  head: 'InstrumentSans',    // Clean sans for headings & labels
  data: 'IBMPlexMono',       // Monospace for structured data
  // Fallbacks if custom fonts fail to load
  bodyFallback: 'times',
  headFallback: 'helvetica',
  dataFallback: 'courier',
};

/* ════════════════════════════════════════════════════════════
   Color Palette — Deep navy + warm grays (banking SV aesthetic)
   ════════════════════════════════════════════════════════════ */
export const C = {
  navy:    [15, 30, 55] as [number, number, number],
  dark:    [30, 35, 42] as [number, number, number],
  mid:     [100, 105, 115] as [number, number, number],
  light:   [155, 160, 168] as [number, number, number],
  rule:    [200, 205, 210] as [number, number, number],
  bg:      [245, 246, 248] as [number, number, number],
  white:   [255, 255, 255] as [number, number, number],
  accent:  [22, 78, 140] as [number, number, number],
  pass:    [34, 120, 70] as [number, number, number],
  partial: [180, 130, 20] as [number, number, number],
  fail:    [180, 45, 45] as [number, number, number],
};

/* ════════════════════════════════════════════════════════════
   Layout Constants
   ════════════════════════════════════════════════════════════ */
export const LAYOUT = {
  LEFT: 25,
  RIGHT: 185,
  WIDTH: 160,    // RIGHT - LEFT
  TOP: 32,
  BOTTOM: 272,
  BODY_SIZE: 9.2,
  BODY_LEADING: 4.0,
  H1_SIZE: 13,
  H2_SIZE: 10.5,
  H3_SIZE: 9,
  LABEL_SIZE: 6.5,
  DATA_SIZE: 7,
  FOOTER_SIZE: 6,
};

/* ════════════════════════════════════════════════════════════
   PDF Document Builder
   ════════════════════════════════════════════════════════════ */
export interface PdfDocOptions {
  lang: 'de' | 'en' | 'fr';
  isDraft?: boolean;
  reportPrefix: string;   // e.g. 'DORA' or 'NIS2'
  confidentialLabel: string;
  pageLabel: string;
  draftWatermark: string;
}

export class PdfDoc {
  doc: jsPDF;
  y: number = LAYOUT.TOP;
  pageNum: number = 0;
  reportId: string;
  opts: PdfDocOptions;
  fontsAvailable: boolean = false;

  private bodyFont: string;
  private headFont: string;
  private dataFont: string;

  constructor(opts: PdfDocOptions) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.opts = opts;
    this.reportId = `${opts.reportPrefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Will be set after font registration
    this.bodyFont = FONTS.bodyFallback;
    this.headFont = FONTS.headFallback;
    this.dataFont = FONTS.dataFallback;
  }

  async init(): Promise<void> {
    try {
      await loadFonts();
      registerFonts(this.doc);
      this.bodyFont = FONTS.body;
      this.headFont = FONTS.head;
      this.dataFont = FONTS.data;
      this.fontsAvailable = true;
    } catch (e) {
      console.warn('Custom fonts failed to load, using fallbacks:', e);
      this.bodyFont = FONTS.bodyFallback;
      this.headFont = FONTS.headFallback;
      this.dataFont = FONTS.dataFallback;
    }
  }

  /* ── Page Management ─────────────────────────────────────── */

  newPage(): void {
    if (this.pageNum > 0) this.doc.addPage();
    this.pageNum++;
    this.y = LAYOUT.TOP;

    const d = this.doc;

    // Top rule — thin accent line
    d.setDrawColor(...C.navy);
    d.setLineWidth(0.5);
    d.line(LAYOUT.LEFT, LAYOUT.TOP - 10, LAYOUT.LEFT + 28, LAYOUT.TOP - 10);

    // Subtle top-right report ID
    d.setFontSize(5.5);
    d.setTextColor(...C.light);
    d.setFont(this.headFont, 'normal');
    d.text(this.reportId, LAYOUT.RIGHT, LAYOUT.TOP - 10, { align: 'right' });

    // Footer
    d.setFontSize(LAYOUT.FOOTER_SIZE);
    d.setTextColor(...C.light);
    d.setFont(this.headFont, 'normal');
    d.text(this.opts.confidentialLabel, LAYOUT.LEFT, LAYOUT.BOTTOM + 9);
    d.text(`${this.opts.pageLabel} ${this.pageNum}`, LAYOUT.RIGHT, LAYOUT.BOTTOM + 9, { align: 'right' });

    // Bottom hairline
    d.setDrawColor(...C.rule);
    d.setLineWidth(0.1);
    d.line(LAYOUT.LEFT, LAYOUT.BOTTOM + 5, LAYOUT.RIGHT, LAYOUT.BOTTOM + 5);

    d.setTextColor(...C.dark);

    // Draft watermark
    if (this.opts.isDraft) {
      d.setFontSize(48);
      d.setTextColor(235, 235, 235);
      d.setFont(this.headFont, 'bold');
      d.text(this.opts.draftWatermark, 105, 160, { align: 'center', angle: 45 });
      d.setTextColor(...C.dark);
    }
  }

  checkSpace(needed: number): void {
    if (this.y + needed > LAYOUT.BOTTOM) this.newPage();
  }

  /* ── Typography Primitives ───────────────────────────────── */

  heading(text: string, level: 1 | 2 | 3 = 1): void {
    const sizes = { 1: LAYOUT.H1_SIZE, 2: LAYOUT.H2_SIZE, 3: LAYOUT.H3_SIZE };
    const spaceBefore = { 1: 10, 2: 7, 3: 5 };
    const spaceAfter = { 1: 5, 2: 3.5, 3: 2.5 };
    const lineHeight = { 1: 5.5, 2: 4.8, 3: 4.2 };

    this.checkSpace(level === 1 ? 22 : 16);

    if (level === 1) {
      this.y += spaceBefore[1];
      this.doc.setDrawColor(...C.navy);
      this.doc.setLineWidth(0.7);
      this.doc.line(LAYOUT.LEFT, this.y - 4, LAYOUT.LEFT + 20, this.y - 4);
      this.y += 2;
    } else {
      this.y += spaceBefore[level];
    }

    this.doc.setFontSize(sizes[level]);
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setTextColor(...C.navy);
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH);
    this.doc.text(lines, LAYOUT.LEFT, this.y);
    this.y += lines.length * lineHeight[level] + spaceAfter[level];

    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setTextColor(...C.dark);
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
  }

  introText(text: string): void {
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(...C.mid);
    this.doc.setFont(this.bodyFont, 'italic');
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH);
    this.checkSpace(lines.length * 3.6 + 5);
    this.doc.text(lines, LAYOUT.LEFT, this.y);
    this.y += lines.length * 3.6 + 6;
    this.doc.setTextColor(...C.dark);
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
  }

  bodyText(text: string, indent = 0): void {
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setTextColor(...C.dark);
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH - indent);
    this.checkSpace(lines.length * LAYOUT.BODY_LEADING + 2);
    this.doc.text(lines, LAYOUT.LEFT + indent, this.y);
    this.y += lines.length * LAYOUT.BODY_LEADING + 2;
  }

  bodyParagraph(text: string): void {
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setTextColor(...C.dark);
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH);
    this.checkSpace(lines.length * LAYOUT.BODY_LEADING + 4);
    this.doc.text(lines, LAYOUT.LEFT, this.y);
    this.y += lines.length * LAYOUT.BODY_LEADING + 6;
  }

  /** Two-line field: small label above, value below */
  field(label: string, value: string): void {
    this.checkSpace(13);
    this.doc.setFont(this.headFont, 'normal');
    this.doc.setFontSize(LAYOUT.LABEL_SIZE);
    this.doc.setTextColor(...C.mid);
    this.doc.text(label.toUpperCase(), LAYOUT.LEFT, this.y);
    this.y += 3.8;
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    this.doc.setTextColor(...C.dark);
    const lines = this.doc.splitTextToSize(value, LAYOUT.WIDTH);
    this.doc.text(lines, LAYOUT.LEFT, this.y);
    this.y += lines.length * LAYOUT.BODY_LEADING + 3.5;
  }

  /** Inline label: value on same line */
  fieldInline(label: string, value: string, indent = 0): void {
    this.checkSpace(10);
    const labelW = Math.min(this.doc.getTextWidth(label + ':  ') + 2, 48);
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...C.mid);
    this.doc.text(label, LAYOUT.LEFT + indent, this.y);
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...C.dark);
    const valLines = this.doc.splitTextToSize(value, LAYOUT.WIDTH - indent - labelW - 2);
    this.doc.text(valLines, LAYOUT.LEFT + indent + labelW, this.y);
    this.y += Math.max(valLines.length * 3.8, 4.5) + 1.5;
  }

  separator(): void {
    this.checkSpace(8);
    this.doc.setDrawColor(...C.rule);
    this.doc.setLineWidth(0.08);
    this.doc.line(LAYOUT.LEFT, this.y, LAYOUT.RIGHT, this.y);
    this.y += 7;
  }

  bulletItem(text: string, indent = 6): void {
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    this.doc.setFont(this.bodyFont, 'normal');
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH - indent - 5);
    this.checkSpace(lines.length * LAYOUT.BODY_LEADING + 2);
    this.doc.setTextColor(...C.mid);
    this.doc.setFontSize(6);
    this.doc.text('▸', LAYOUT.LEFT + indent, this.y);
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    this.doc.setTextColor(...C.dark);
    this.doc.text(lines, LAYOUT.LEFT + indent + 5, this.y);
    this.y += lines.length * LAYOUT.BODY_LEADING + 2;
  }

  /* ── Structural Elements ─────────────────────────────────── */

  /** Navy verdict box with white text */
  verdictBox(text: string): void {
    this.doc.setFontSize(9.5);
    this.doc.setFont(this.headFont, 'bold');
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH - 16);
    const boxH = Math.max(16, lines.length * 4.5 + 10);
    this.checkSpace(boxH + 4);
    const boxY = this.y;
    this.doc.setFillColor(...C.navy);
    this.doc.roundedRect(LAYOUT.LEFT, boxY, LAYOUT.WIDTH, boxH, 2, 2, 'F');
    this.doc.setTextColor(...C.white);
    this.doc.text(lines, LAYOUT.LEFT + 8, boxY + 7);
    this.y = boxY + boxH + 5;
    this.doc.setTextColor(...C.dark);
  }

  /** KPI row — 4 metric cards */
  kpiRow(kpis: [string, string][]): void {
    this.checkSpace(24);
    const count = kpis.length;
    const gap = 3;
    const kpiW = (LAYOUT.WIDTH - (count - 1) * gap) / count;

    kpis.forEach(([val, label], i) => {
      const x = LAYOUT.LEFT + i * (kpiW + gap);
      this.doc.setFillColor(...C.bg);
      this.doc.roundedRect(x, this.y, kpiW, 20, 1.2, 1.2, 'F');
      this.doc.setDrawColor(...C.rule);
      this.doc.setLineWidth(0.1);
      this.doc.roundedRect(x, this.y, kpiW, 20, 1.2, 1.2, 'S');

      this.doc.setFont(this.headFont, 'bold');
      this.doc.setFontSize(15);
      this.doc.setTextColor(...C.navy);
      this.doc.text(val, x + kpiW / 2, this.y + 10, { align: 'center' });

      this.doc.setFont(this.headFont, 'normal');
      this.doc.setFontSize(6);
      this.doc.setTextColor(...C.mid);
      this.doc.text(label, x + kpiW / 2, this.y + 16, { align: 'center' });
    });
    this.y += 26;
    this.doc.setTextColor(...C.dark);
  }

  /** Status badge (PASS/PARTIAL/FAIL) */
  statusBadge(status: 'pass' | 'partial' | 'fail', x?: number): number {
    const label = status === 'pass' ? 'PASS' : status === 'partial' ? 'PARTIAL' : 'FAIL';
    const color = status === 'pass' ? C.pass : status === 'partial' ? C.partial : C.fail;
    const startX = x ?? LAYOUT.LEFT;

    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(6);
    const badgeW = this.doc.getTextWidth(label) + 5;
    this.doc.setFillColor(...color);
    this.doc.roundedRect(startX, this.y - 3.2, badgeW, 5.2, 0.7, 0.7, 'F');
    this.doc.setTextColor(...C.white);
    this.doc.text(label, startX + 2.5, this.y);
    this.doc.setTextColor(...C.dark);

    return startX + badgeW + 3;
  }

  /** Small meta text (category, severity, references) */
  metaLine(text: string): void {
    this.doc.setFontSize(6.5);
    this.doc.setFont(this.headFont, 'normal');
    this.doc.setTextColor(...C.light);
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH);
    this.doc.text(lines, LAYOUT.LEFT, this.y);
    this.y += lines.length * 3 + 2;
    this.doc.setTextColor(...C.dark);
  }

  /** Score bar with background */
  scoreBar(text: string): void {
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(8);
    const lines = this.doc.splitTextToSize(text, LAYOUT.WIDTH - 10);
    const barH = Math.max(8, lines.length * 4 + 4);
    this.checkSpace(barH + 3);
    this.doc.setFillColor(...C.bg);
    this.doc.roundedRect(LAYOUT.LEFT, this.y - 1.5, LAYOUT.WIDTH, barH, 1, 1, 'F');
    this.doc.setTextColor(...C.navy);
    this.doc.text(lines, LAYOUT.LEFT + 5, this.y + 2.5);
    this.doc.setTextColor(...C.dark);
    this.y += barH + 3;
  }

  /** Section label (small uppercase) */
  sectionLabel(text: string): void {
    this.checkSpace(8);
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(...C.mid);
    this.doc.text(text.toUpperCase(), LAYOUT.LEFT, this.y);
    this.y += 4;
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setTextColor(...C.dark);
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
  }

  /** Data table header row (monospace) */
  dataTableHeader(text: string): void {
    this.checkSpace(8);
    this.doc.setFont(this.dataFont, 'bold');
    this.doc.setFontSize(LAYOUT.DATA_SIZE);
    this.doc.setTextColor(...C.mid);
    this.doc.text(text, LAYOUT.LEFT, this.y);
    this.y += 2;
    this.doc.setDrawColor(...C.navy);
    this.doc.setLineWidth(0.2);
    this.doc.line(LAYOUT.LEFT, this.y, LAYOUT.RIGHT, this.y);
    this.y += 3;
  }

  /** Data table row (monospace) */
  dataTableRow(text: string): void {
    this.checkSpace(5);
    this.doc.setFont(this.dataFont, 'normal');
    this.doc.setFontSize(LAYOUT.DATA_SIZE);
    this.doc.setTextColor(...C.dark);
    this.doc.text(text, LAYOUT.LEFT, this.y);
    this.y += 3.8;
  }

  /** Measures table with column headers */
  measuresTable(
    entries: [string, { active: boolean; documented: boolean; audited: boolean; certified: boolean }][],
    labels: { measure: string; active: string; doc: string; audit: string; cert: string; yes: string; no: string }
  ): void {
    if (entries.length === 0) return;
    this.checkSpace(10);
    const colX = {
      name: LAYOUT.LEFT,
      active: LAYOUT.LEFT + 88,
      doc: LAYOUT.LEFT + 106,
      audit: LAYOUT.LEFT + 122,
      cert: LAYOUT.LEFT + 138,
    };

    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(LAYOUT.LABEL_SIZE);
    this.doc.setTextColor(...C.mid);
    this.doc.text(labels.measure.toUpperCase(), colX.name, this.y);
    this.doc.text(labels.active.toUpperCase(), colX.active, this.y);
    this.doc.text(labels.doc.toUpperCase(), colX.doc, this.y);
    this.doc.text(labels.audit.toUpperCase(), colX.audit, this.y);
    this.doc.text(labels.cert.toUpperCase(), colX.cert, this.y);
    this.y += 2;
    this.doc.setDrawColor(...C.navy);
    this.doc.setLineWidth(0.25);
    this.doc.line(LAYOUT.LEFT, this.y, LAYOUT.RIGHT, this.y);
    this.y += 4;

    entries.forEach(([id, entry], idx) => {
      this.checkSpace(6);
      // Alternate row background
      if (idx % 2 === 0) {
        this.doc.setFillColor(...C.bg);
        this.doc.rect(LAYOUT.LEFT, this.y - 3, LAYOUT.WIDTH, 5.5, 'F');
      }
      this.doc.setFont(this.bodyFont, 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...C.dark);
      this.doc.text(id.replace(/_/g, ' '), colX.name, this.y);
      this.doc.setFont(this.headFont, 'normal');
      this.doc.setFontSize(7.5);
      this.doc.text(entry.active ? labels.yes : labels.no, colX.active, this.y);
      this.doc.text(entry.documented ? labels.yes : labels.no, colX.doc, this.y);
      this.doc.text(entry.audited ? labels.yes : labels.no, colX.audit, this.y);
      this.doc.text(entry.certified ? labels.yes : labels.no, colX.cert, this.y);
      this.y += 5;
    });
    this.y += 4;
  }

  /** Metadata box (3-column, used in working papers) */
  metaBox(rows: { labels: string[]; values: string[]; badge?: { status: 'pass' | 'partial' | 'fail'; col: number } }[]): void {
    const rowH = 10;
    const totalH = rows.length * rowH + 4;
    this.checkSpace(totalH + 4);

    const boxY = this.y - 2;
    this.doc.setFillColor(...C.bg);
    this.doc.roundedRect(LAYOUT.LEFT, boxY, LAYOUT.WIDTH, totalH, 1.2, 1.2, 'F');
    this.doc.setDrawColor(...C.rule);
    this.doc.setLineWidth(0.1);
    this.doc.roundedRect(LAYOUT.LEFT, boxY, LAYOUT.WIDTH, totalH, 1.2, 1.2, 'S');

    const colW = (LAYOUT.WIDTH - 10) / 3;
    const col1 = LAYOUT.LEFT + 5;
    const col2 = col1 + colW;
    const col3 = col2 + colW;
    const cols = [col1, col2, col3];

    rows.forEach((row, ri) => {
      const baseY = this.y + ri * rowH;
      // Labels
      this.doc.setFont(this.headFont, 'normal');
      this.doc.setFontSize(LAYOUT.LABEL_SIZE);
      this.doc.setTextColor(...C.mid);
      row.labels.forEach((label, ci) => {
        if (ci < 3) this.doc.text(label, cols[ci], baseY + 1);
      });
      // Values
      this.doc.setFont(this.headFont, 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...C.navy);
      row.values.forEach((val, ci) => {
        if (ci < 3 && !(row.badge && ci === row.badge.col)) {
          const valLines = this.doc.splitTextToSize(val, colW - 4);
          this.doc.text(valLines[0] || '', cols[ci], baseY + 5.5);
        }
      });
      // Badge
      if (row.badge) {
        const bx = cols[row.badge.col];
        const statusLabel = row.badge.status === 'pass' ? 'PASS' : row.badge.status === 'partial' ? 'PARTIAL' : 'FAIL';
        const color = row.badge.status === 'pass' ? C.pass : row.badge.status === 'partial' ? C.partial : C.fail;
        this.doc.setFont(this.headFont, 'bold');
        this.doc.setFontSize(6);
        const bw = this.doc.getTextWidth(statusLabel) + 5;
        this.doc.setFillColor(...color);
        this.doc.roundedRect(bx, baseY + 2.5, bw, 5, 0.6, 0.6, 'F');
        this.doc.setTextColor(...C.white);
        this.doc.text(statusLabel, bx + 2.5, baseY + 5.5);
      }
    });

    this.y += totalH + 2;
    this.doc.setTextColor(...C.dark);
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
  }

  /** Effort estimation box with assumptions */
  effortBox(opts: {
    header: string;
    rangeText: string;
    assumptions: string[];
    uncertainties: string[];
    validation: string;
    assumptionsLabel: string;
    uncertaintiesLabel: string;
    validationLabel: string;
  }): void {
    const innerWidth = LAYOUT.WIDTH - 10;

    // Pre-calculate actual content height
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(8.5);
    const rangeLinesCount = this.doc.splitTextToSize(opts.rangeText, innerWidth - 4).length;
    let contentH = 6 + rangeLinesCount * 3.8 + 2; // header + range
    // Assumptions
    contentH += 4; // label
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(7.5);
    opts.assumptions.forEach(a => {
      const lines = this.doc.splitTextToSize(`· ${a}`, innerWidth - 4);
      contentH += lines.length * 3.2 + 0.5;
    });
    // Uncertainties
    contentH += 5; // gap + label
    opts.uncertainties.forEach(u => {
      const lines = this.doc.splitTextToSize(`· ${u}`, innerWidth - 4);
      contentH += lines.length * 3.2 + 0.5;
    });
    // Validation
    contentH += 5; // gap + label
    const vLinesCalc = this.doc.splitTextToSize(opts.validation, innerWidth - 4);
    contentH += vLinesCalc.length * 3.2 + 4;

    const boxH = Math.max(30, contentH + 4);
    this.checkSpace(boxH + 4);

    const boxY = this.y - 1;
    this.doc.setFillColor(...C.bg);
    this.doc.roundedRect(LAYOUT.LEFT, boxY, LAYOUT.WIDTH, boxH, 1, 1, 'F');
    this.doc.setDrawColor(...C.rule);
    this.doc.setLineWidth(0.08);
    this.doc.roundedRect(LAYOUT.LEFT, boxY, LAYOUT.WIDTH, boxH, 1, 1, 'S');

    const innerLeft = LAYOUT.LEFT + 5;

    // Header
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...C.navy);
    this.doc.text(opts.header, innerLeft, this.y + 3);
    this.y += 6;

    // Range
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...C.dark);
    const rangeLines = this.doc.splitTextToSize(opts.rangeText, innerWidth - 4);
    this.doc.text(rangeLines, innerLeft, this.y);
    this.y += rangeLines.length * 3.8 + 2;

    // Assumptions
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(...C.mid);
    this.doc.text(opts.assumptionsLabel.toUpperCase(), innerLeft, this.y);
    this.y += 3.5;
    opts.assumptions.forEach(a => {
      this.doc.setFont(this.bodyFont, 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...C.dark);
      const lines = this.doc.splitTextToSize(`· ${a}`, innerWidth - 4);
      this.doc.text(lines, innerLeft + 2, this.y);
      this.y += lines.length * 3.2 + 0.5;
    });

    // Uncertainties
    this.y += 1;
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(...C.mid);
    this.doc.text(opts.uncertaintiesLabel.toUpperCase(), innerLeft, this.y);
    this.y += 3.5;
    opts.uncertainties.forEach(u => {
      this.doc.setFont(this.bodyFont, 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...C.dark);
      const lines = this.doc.splitTextToSize(`· ${u}`, innerWidth - 4);
      this.doc.text(lines, innerLeft + 2, this.y);
      this.y += lines.length * 3.2 + 0.5;
    });

    // Validation
    this.y += 1;
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(...C.mid);
    this.doc.text(opts.validationLabel.toUpperCase(), innerLeft, this.y);
    this.y += 3.5;
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...C.dark);
    const vLines = this.doc.splitTextToSize(opts.validation, innerWidth - 4);
    this.doc.text(vLines, innerLeft + 2, this.y);
    this.y += vLines.length * 3.2 + 4;

    // Ensure cursor is past the box bottom to prevent overlap with next element
    const boxBottom = boxY + boxH;
    this.y = Math.max(this.y, boxBottom + 4);
  }

  /** QA checks by category */
  qaChecks(checks: { id: string; label: string; passed: boolean; category: string; detail: string; severity?: string }[],
           categories: string[],
           catLabels: Record<string, string>,
           iterationsLabel?: string,
           iterations?: number): void {
    if (iterations && iterationsLabel) {
      this.bodyText(`${iterationsLabel}: ${iterations}`, 0);
    }
    const passedCount = checks.filter(c => c.passed).length;
    const qaVerdict = passedCount === checks.length ? 'PASSED' : `FAILED (${passedCount}/${checks.length})`;
    this.bodyText(`Result: ${qaVerdict}`, 0);
    this.separator();

    categories.forEach(cat => {
      const catChecks = checks.filter(c => c.category === cat);
      if (catChecks.length === 0) return;
      this.checkSpace(15);
      this.doc.setFont(this.headFont, 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...C.navy);
      this.doc.text(catLabels[cat] || cat, LAYOUT.LEFT, this.y);
      this.y += 5;
      catChecks.forEach(c => {
        this.checkSpace(10);
        const badgeCol = c.passed ? C.pass : C.fail;
        this.doc.setFillColor(...badgeCol);
        this.doc.roundedRect(LAYOUT.LEFT, this.y - 3, 14, 5, 0.6, 0.6, 'F');
        this.doc.setFont(this.headFont, 'bold');
        this.doc.setFontSize(5.5);
        this.doc.setTextColor(...C.white);
        this.doc.text(c.passed ? 'PASS' : 'FAIL', LAYOUT.LEFT + 2.5, this.y);
        this.doc.setFont(this.bodyFont, 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(...C.dark);
        const detail = `${c.id}: ${c.label}`;
        const detailLines = this.doc.splitTextToSize(detail, LAYOUT.WIDTH - 20);
        this.doc.text(detailLines, LAYOUT.LEFT + 18, this.y);
        this.y += detailLines.length * 3.5 + 2;
        if (!c.passed && c.detail) {
          this.doc.setFontSize(7);
          this.doc.setTextColor(...C.mid);
          const dl = this.doc.splitTextToSize(c.detail, LAYOUT.WIDTH - 24);
          this.doc.text(dl, LAYOUT.LEFT + 20, this.y);
          this.y += dl.length * 3 + 2;
          this.doc.setTextColor(...C.dark);
        }
      });
      this.y += 3;
    });
  }

  /** Fix log */
  fixLog(fixes: string[]): void {
    fixes.forEach((fix, i) => {
      this.checkSpace(8);
      this.doc.setFontSize(7.5);
      this.doc.setFont(this.bodyFont, 'normal');
      const lines = this.doc.splitTextToSize(`${i + 1}. ${fix}`, LAYOUT.WIDTH - 8);
      this.doc.text(lines, LAYOUT.LEFT + 4, this.y);
      this.y += lines.length * 3.5 + 2;
    });
  }

  /* ── Cover Page ──────────────────────────────────────────── */

  coverPage(opts: {
    title: string;
    subtitle: string;
    entityName: string;
    fields: [string, string][];
    confidentialNote: string;
  }): void {
    this.newPage();
    this.y = 55;

    // Heavy accent bar
    this.doc.setDrawColor(...C.navy);
    this.doc.setLineWidth(2.5);
    this.doc.line(LAYOUT.LEFT, 42, LAYOUT.LEFT + 35, 42);

    // Title
    this.doc.setFontSize(22);
    this.doc.setFont(this.headFont, 'bold');
    this.doc.setTextColor(...C.navy);
    this.doc.text(opts.title, LAYOUT.LEFT, this.y);
    this.y += 9;

    // Subtitle
    this.doc.setFontSize(9.5);
    this.doc.setFont(this.bodyFont, 'italic');
    this.doc.setTextColor(...C.mid);
    this.doc.text(opts.subtitle, LAYOUT.LEFT, this.y);
    this.y += 24;

    // Entity name
    this.doc.setTextColor(...C.dark);
    this.doc.setFontSize(16);
    this.doc.setFont(this.headFont, 'bold');
    this.doc.text(opts.entityName, LAYOUT.LEFT, this.y);
    this.y += 16;

    // Metadata fields
    this.doc.setFontSize(LAYOUT.BODY_SIZE);
    opts.fields.forEach(([label, value]) => this.field(label, value));

    // Confidential box
    this.y += 8;
    this.doc.setFillColor(...C.bg);
    this.doc.roundedRect(LAYOUT.LEFT, this.y, LAYOUT.WIDTH, 13, 1.2, 1.2, 'F');
    this.doc.setDrawColor(...C.rule);
    this.doc.setLineWidth(0.1);
    this.doc.roundedRect(LAYOUT.LEFT, this.y, LAYOUT.WIDTH, 13, 1.2, 1.2, 'S');
    this.doc.setFontSize(6.5);
    this.doc.setFont(this.headFont, 'normal');
    this.doc.setTextColor(...C.mid);
    this.doc.text(opts.confidentialNote, LAYOUT.LEFT + 5, this.y + 8);
    this.doc.setTextColor(...C.dark);
  }

  /** Table of Contents */
  tableOfContents(title: string, entries: (string | null)[]): void {
    this.newPage();
    this.heading(title);
    this.y += 3;
    entries.forEach(entry => {
      if (entry === null || entry === '') { this.y += 5; return; }
      const isSub = entry.startsWith('    ');
      this.doc.setFontSize(8.5);
      this.doc.setFont(this.headFont, isSub ? 'normal' : 'bold');
      this.doc.setTextColor(isSub ? C.dark[0] : C.navy[0], isSub ? C.dark[1] : C.navy[1], isSub ? C.dark[2] : C.navy[2]);
      this.doc.text(entry, LAYOUT.LEFT, this.y);
      this.y += isSub ? 5 : 6;
    });
    this.doc.setFont(this.bodyFont, 'normal');
    this.doc.setTextColor(...C.dark);
  }

  /* ── Save ─────────────────────────────────────────────────── */

  save(filename: string): void {
    this.doc.save(filename);
  }

  /* ── Getters for direct doc access ────────────────────────── */
  get bodyFontName(): string { return this.bodyFont; }
  get headFontName(): string { return this.headFont; }
  get dataFontName(): string { return this.dataFont; }
}

/* ════════════════════════════════════════════════════════════
   Factory
   ════════════════════════════════════════════════════════════ */
export async function createPdfDoc(opts: PdfDocOptions): Promise<PdfDoc> {
  const pdf = new PdfDoc(opts);
  await pdf.init();
  return pdf;
}
