import { createPdfDoc } from './pdfCore';
import {
  assess, tx, CONTROLS, MODULES, INDUSTRIES, REVENUE, RECORDS, DOWNTIME, INCIDENTS, LIMITS,
  type Intake, type Option,
} from '@/data/cyberInsurance';

const opt = (o: Option[], v: string, lang: string) => { const x = o.find((p) => p.value === v); return x ? tx(x.label, lang) : '-'; };

export async function generateCyberInsuranceReport(intake: Intake, language: string) {
  const lang = language === 'de' ? 'de' : 'en';
  const L = (de: string, en: string) => (lang === 'de' ? de : en);
  const r = assess(intake);
  const pdf = await createPdfDoc({
    lang: lang as 'de' | 'en',
    reportPrefix: 'AZ',
    confidentialLabel: L('Vertraulich — Cyber-Versicherbarkeit', 'Confidential — cyber insurability'),
    pageLabel: L('Seite', 'Page'),
    draftWatermark: L('ENTWURF', 'DRAFT'),
    runningHeader: true,
    documentLabel: 'AssistantZero',
  });
  const date = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  pdf.coverPage({
    title: L('Cyber-Versicherbarkeit und Marktvergleich', 'Cyber insurability and market comparison'),
    subtitle: L('Risiko- und Anforderungsprofil', 'Risk and requirements profile'),
    entityName: intake.company,
    fields: [
      [L('Interessent', 'Prospect'), intake.company],
      [L('Branche', 'Industry'), opt(INDUSTRIES, intake.industry, lang)],
      [L('Berichtsart', 'Report type'), L('Vorprüfung Versicherbarkeit', 'Insurability pre-assessment')],
      [L('Datum', 'Date'), date],
      [L('Erstellt mit', 'Prepared with'), 'AssistantZero · Inside the Box'],
    ],
    confidentialNote: L('Vertraulich', 'Confidential'),
  });

  // 1 Ergebnis
  pdf.newPage();
  pdf.heading(L('1  Gesamturteil', '1  Overall opinion'), 1);
  pdf.addBookmark(L('Gesamturteil', 'Overall opinion'));
  pdf.verdictBox(`${tx(r.verdictLabel, lang)} — ${L('Versicherbarkeit', 'Insurability')} ${r.insurability} / 100`);
  pdf.chapterHeaderBar('', '', [
    [`${r.insurability}`, L('Versicherbarkeit', 'Insurability')],
    [`${r.maturity} %`, L('Sicherheitsniveau', 'Security maturity')],
    [`${r.exposure} %`, L('Risiko-Exposition', 'Risk exposure')],
  ]);
  pdf.bodyParagraph(L(
    `Auf Basis der erfassten Angaben erreicht ${intake.company} ein Sicherheitsniveau von ${r.maturity} % bei einer Risiko-Exposition von ${r.exposure} %. ${r.conditions.filter((c) => c.timing === 'binding').length} Auflagen sind vor Vertragsbindung zu erfüllen, ${r.conditions.filter((c) => c.timing === 'ninety').length} innerhalb von 90 Tagen. ${r.recommended ? `Am besten passt das Marktsegment „${tx(r.recommended.segment.name, lang)}“ (Eignung ${r.recommended.fit} %).` : 'Derzeit erfüllt kein Marktsegment alle Zeichnungsvoraussetzungen.'}`,
    `Based on the information captured, ${intake.company} reaches a security maturity of ${r.maturity}% with a risk exposure of ${r.exposure}%. ${r.conditions.filter((c) => c.timing === 'binding').length} conditions must be met before binding, ${r.conditions.filter((c) => c.timing === 'ninety').length} within 90 days. ${r.recommended ? `The best-fitting market segment is "${tx(r.recommended.segment.name, lang)}" (fit ${r.recommended.fit}%).` : 'No market segment currently meets all underwriting prerequisites.'}`,
  ));
  pdf.readinessPanel(r.maturity, r.controlCounts, {
    title: L('Sicherheitsmaßnahmen', 'Security controls'),
    pass: L('Umgesetzt', 'In place'), partial: L('Teilweise', 'Partial'), fail: L('Fehlt', 'Missing'),
    caption: L(`${CONTROLS.length} versicherungsrelevante Maßnahmen, gewichtet`, `${CONTROLS.length} insurance-relevant controls, weighted`),
  });

  // 2 Risikoprofil
  pdf.heading(L('2  Risikoprofil', '2  Risk profile'), 1);
  pdf.addBookmark(L('Risikoprofil', 'Risk profile'));
  pdf.fieldInline(L('Branche', 'Industry'), opt(INDUSTRIES, intake.industry, lang));
  pdf.fieldInline(L('Umsatz', 'Revenue'), opt(REVENUE, intake.revenue, lang));
  pdf.fieldInline(L('Datensätze', 'Data records'), opt(RECORDS, intake.records, lang));
  pdf.fieldInline(L('IT-Abhängigkeit', 'IT dependency'), opt(DOWNTIME, intake.downtime, lang));
  pdf.fieldInline(L('Vorschäden (3 Jahre)', 'Prior incidents (3 yrs)'), opt(INCIDENTS, intake.incidents, lang));
  pdf.fieldInline(L('Kartenzahlungen / USA', 'Card data / US'), `${intake.cardData ? L('ja', 'yes') : L('nein', 'no')} / ${intake.usExposure ? L('ja', 'yes') : L('nein', 'no')}`);
  pdf.rankedBars(r.exposureDrivers.map((d) => ({ label: tx(d.label, lang), value: d.value, tone: d.value >= 70 ? 'fail' : d.value >= 40 ? 'partial' : 'pass' })), {
    title: L('Treiber der Risiko-Exposition (0–100)', 'Exposure drivers (0–100)'),
  });

  // 3 Maßnahmen und Auflagen
  pdf.heading(L('3  Sicherheitsmaßnahmen und Auflagen', '3  Controls and conditions'), 1);
  pdf.addBookmark(L('Auflagen', 'Conditions'));
  CONTROLS.forEach((c) => {
    const a = intake.controls[c.id] ?? 'no';
    pdf.fieldInline(`${c.knockout ? '* ' : ''}${tx(c.label, lang)}`, a === 'yes' ? L('umgesetzt', 'in place') : a === 'partial' ? L('teilweise', 'partial') : L('fehlt', 'missing'));
  });
  pdf.metaLine(L('* Pflichtmaßnahme: Fehlen führt bei den meisten Versicherern zur Ablehnung.', '* Mandatory control: absence leads most insurers to decline.'));
  if (r.conditions.length) {
    pdf.sectionLabel(L('Auflagen', 'Conditions'));
    r.conditions.forEach((c) => pdf.bulletItem(`${c.timing === 'binding' ? L('Vor Bindung', 'Before binding') : L('Innerhalb 90 Tagen', 'Within 90 days')}: ${tx(c.label, lang)}${c.answer === 'partial' ? L(' vollständig umsetzen', ' — complete implementation') : L(' einführen', ' — implement')}`));
  }

  // 4 Anforderungsprofil
  pdf.heading(L('4  Anforderungsprofil', '4  Requirements profile'), 1);
  pdf.addBookmark(L('Anforderungen', 'Requirements'));
  pdf.fieldInline(L('Gewünschte Summe', 'Desired limit'), opt(LIMITS, intake.limit, lang));
  pdf.fieldInline(L('Benötigte Bausteine', 'Required modules'), intake.modules.map((m) => tx(MODULES.find((x) => x.id === m)!.label, lang)).join(', ') || '-');
  pdf.fieldInline(L('Gewichtung', 'Weighting'), L(
    `Deckung ${intake.weights.coverage} · Preis ${intake.weights.price} · Service ${intake.weights.service} · Summe ${intake.weights.limit} (Skala 1–5)`,
    `Coverage ${intake.weights.coverage} · Price ${intake.weights.price} · Service ${intake.weights.service} · Limit ${intake.weights.limit} (scale 1–5)`,
  ));

  // 5 Marktvergleich
  pdf.heading(L('5  Marktvergleich', '5  Market comparison'), 1);
  pdf.addBookmark(L('Marktvergleich', 'Market comparison'));
  pdf.introText(L(
    'Vergleich mit typischen Marktsegmenten, nicht mit einzelnen Versicherern. Erst werden Ausschlusskriterien geprüft, dann die gewichtete Eignung berechnet. Konkrete Prämien erfordern ein Angebot.',
    'Comparison against typical market segments, not individual insurers. Knock-out criteria are checked first, then the weighted fit is calculated. Actual premiums require a quote.',
  ));
  pdf.rankedBars(r.segments.map((s) => ({
    label: tx(s.segment.name, lang), value: s.eligible ? s.fit : 0,
    tone: s.eligible ? (s.fit >= 70 ? 'pass' : 'partial') : 'fail',
    note: s.eligible ? undefined : L('nicht zeichnungsfähig', 'not eligible'),
  })), { title: L('Gewichtete Eignung (%)', 'Weighted fit (%)'), unit: '%' });
  r.segments.forEach((s) => {
    pdf.heading(`${tx(s.segment.name, lang)} — ${s.eligible ? `${s.fit} %` : L('ausgeschlossen', 'excluded')}`, 2);
    pdf.bodyText(tx(s.segment.description, lang));
    s.criteria.forEach((c) => pdf.fieldInline(tx(c.label, lang), `${c.score} / 100  ·  ${L('Gewicht', 'weight')} ${c.weight}`));
    s.knockouts.forEach((k) => pdf.bulletItem(`${L('Ausschluss', 'Knock-out')}: ${tx(k, lang)}`));
  });

  // 6 Methodik
  pdf.heading(L('6  Methodik und Grenzen', '6  Method and limitations'), 1);
  pdf.addBookmark(L('Methodik', 'Method'));
  pdf.bulletItem(L('Sicherheitsniveau: gewichteter Anteil umgesetzter Maßnahmen (umgesetzt 1, teilweise 0,5, fehlt 0).', 'Security maturity: weighted share of controls in place (in place 1, partial 0.5, missing 0).'));
  pdf.bulletItem(L('Risiko-Exposition: Mittelwert von sechs Treibern, jeweils auf 0–100 normiert.', 'Risk exposure: mean of six drivers, each normalised to 0–100.'));
  pdf.bulletItem(L('Versicherbarkeit = 60 % Sicherheitsniveau + 40 % (100 − Exposition).', 'Insurability = 60% security maturity + 40% (100 − exposure).'));
  pdf.bulletItem(L('Urteil: ab 70 und alle Pflichtmaßnahmen umgesetzt = versicherbar; unter 45 oder zwei fehlende Pflichtmaßnahmen = kaum versicherbar; sonst mit Auflagen.', 'Verdict: 70+ with all mandatory controls = insurable; below 45 or two missing mandatory controls = hard to insure; otherwise with conditions.'));
  pdf.bulletItem(L('Eignung je Segment: gewichteter Mittelwert aus Deckungsumfang, Preisniveau, Service und Summenkapazität.', 'Segment fit: weighted mean of coverage, price level, service and limit capacity.'));
  pdf.bodyParagraph(L('Diese Vorprüfung beruht ausschließlich auf Selbstauskünften und ersetzt weder Risikodialog noch Angebot eines Versicherers.', 'This pre-assessment relies solely on self-declared information and replaces neither an underwriting dialogue nor an insurer quote.'));

  pdf.save(`AssistantZero_${intake.company.replace(/[^a-z0-9]+/gi, '_') || 'report'}.pdf`);
}
