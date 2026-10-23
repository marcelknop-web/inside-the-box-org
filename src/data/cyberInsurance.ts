/**
 * AssistantZero — cyber insurance prospect assessment.
 * Deterministic and transparent: every score is derived from intake answers
 * and the fixed criteria below. Market segments are generic archetypes, not
 * real insurers, and no premium figures are produced (data integrity policy).
 */

export type Lang = 'de' | 'en';
export type Txt = { de: string; en: string };
export const tx = (t: Txt, lang: string): string => (lang === 'de' ? t.de : t.en);

export type ControlAnswer = 'yes' | 'partial' | 'no';

export interface Option { value: string; label: Txt; factor: number }

export const INDUSTRIES: Option[] = [
  { value: 'manufacturing', label: { de: 'Produktion / Industrie', en: 'Manufacturing / industry' }, factor: 3 },
  { value: 'retail', label: { de: 'Handel / E-Commerce', en: 'Retail / e-commerce' }, factor: 4 },
  { value: 'services', label: { de: 'Dienstleistung / Beratung', en: 'Professional services' }, factor: 2 },
  { value: 'health', label: { de: 'Gesundheitswesen', en: 'Healthcare' }, factor: 5 },
  { value: 'finance', label: { de: 'Finanzdienstleistung', en: 'Financial services' }, factor: 5 },
  { value: 'it', label: { de: 'IT / Software / MSP', en: 'IT / software / MSP' }, factor: 4 },
  { value: 'public', label: { de: 'Öffentlicher Sektor / Kommune', en: 'Public sector / municipality' }, factor: 5 },
  { value: 'logistics', label: { de: 'Logistik / Transport', en: 'Logistics / transport' }, factor: 3 },
];

export const REVENUE: Option[] = [
  { value: 'lt10', label: { de: '< 10 Mio. €', en: '< €10m' }, factor: 1 },
  { value: '10to50', label: { de: '10–50 Mio. €', en: '€10–50m' }, factor: 2 },
  { value: '50to250', label: { de: '50–250 Mio. €', en: '€50–250m' }, factor: 3 },
  { value: 'gt250', label: { de: '> 250 Mio. €', en: '> €250m' }, factor: 4 },
];

export const RECORDS: Option[] = [
  { value: 'lt10k', label: { de: '< 10.000', en: '< 10,000' }, factor: 1 },
  { value: '10kto100k', label: { de: '10.000–100.000', en: '10,000–100,000' }, factor: 2 },
  { value: '100kto1m', label: { de: '100.000–1 Mio.', en: '100,000–1m' }, factor: 3 },
  { value: 'gt1m', label: { de: '> 1 Mio.', en: '> 1m' }, factor: 4 },
];

export const DOWNTIME: Option[] = [
  { value: 'lt4h', label: { de: 'Stillstand nach < 4 Std.', en: 'Standstill within 4 h' }, factor: 4 },
  { value: '4to24h', label: { de: 'Stillstand nach 4–24 Std.', en: 'Standstill within 4–24 h' }, factor: 3 },
  { value: '1to3d', label: { de: 'Stillstand nach 1–3 Tagen', en: 'Standstill within 1–3 days' }, factor: 2 },
  { value: 'gt3d', label: { de: 'Länger als 3 Tage überbrückbar', en: 'Can bridge more than 3 days' }, factor: 1 },
];

export const INCIDENTS: Option[] = [
  { value: '0', label: { de: 'Keine', en: 'None' }, factor: 0 },
  { value: '1', label: { de: 'Ein Vorfall', en: 'One incident' }, factor: 1 },
  { value: '2', label: { de: 'Zwei oder mehr', en: 'Two or more' }, factor: 2 },
];

export const LIMITS: Option[] = [
  { value: '1', label: { de: '1 Mio. €', en: '€1m' }, factor: 1 },
  { value: '2', label: { de: '2–3 Mio. €', en: '€2–3m' }, factor: 2 },
  { value: '5', label: { de: '5 Mio. €', en: '€5m' }, factor: 3 },
  { value: '10', label: { de: '10 Mio. € und mehr', en: '€10m and above' }, factor: 4 },
];

export interface Control { id: string; label: Txt; hint: Txt; weight: number; knockout: boolean }

export const CONTROLS: Control[] = [
  { id: 'mfa_remote', weight: 3, knockout: true, label: { de: 'MFA für Fernzugriff und E-Mail', en: 'MFA for remote access and email' }, hint: { de: 'VPN, Remote Desktop, Webmail, Cloud-Konten', en: 'VPN, remote desktop, webmail, cloud accounts' } },
  { id: 'mfa_admin', weight: 3, knockout: false, label: { de: 'MFA für Administratorkonten', en: 'MFA for admin accounts' }, hint: { de: 'Domänen-, Cloud- und Backup-Admins', en: 'Domain, cloud and backup admins' } },
  { id: 'backup', weight: 3, knockout: true, label: { de: 'Offline- oder unveränderbare Backups, getestet', en: 'Offline or immutable backups, tested' }, hint: { de: 'Wiederherstellung mindestens jährlich geübt', en: 'Restore tested at least yearly' } },
  { id: 'edr', weight: 3, knockout: true, label: { de: 'EDR auf Endgeräten und Servern', en: 'EDR on endpoints and servers' }, hint: { de: 'Mit Überwachung, idealerweise 24/7', en: 'Monitored, ideally 24/7' } },
  { id: 'patch', weight: 2, knockout: true, label: { de: 'Kritische Patches innerhalb 14 Tagen', en: 'Critical patches within 14 days' }, hint: { de: 'Besonders für Systeme mit Internetzugang', en: 'Especially internet-facing systems' } },
  { id: 'eol', weight: 2, knockout: false, label: { de: 'Keine nicht mehr unterstützten Systeme', en: 'No end-of-life systems' }, hint: { de: 'Oder isoliert und dokumentiert', en: 'Or isolated and documented' } },
  { id: 'email', weight: 1, knockout: false, label: { de: 'E-Mail-Filter und Anhangsprüfung', en: 'Email filtering and attachment sandboxing' }, hint: { de: 'Inkl. SPF, DKIM, DMARC', en: 'Incl. SPF, DKIM, DMARC' } },
  { id: 'training', weight: 1, knockout: false, label: { de: 'Phishing-Schulung für alle Mitarbeitenden', en: 'Phishing training for all staff' }, hint: { de: 'Mindestens jährlich, mit Simulation', en: 'At least yearly, with simulation' } },
  { id: 'irp', weight: 2, knockout: false, label: { de: 'Notfallplan für Cyberangriffe, geübt', en: 'Cyber incident response plan, exercised' }, hint: { de: 'Rollen, Meldewege, Wiederanlauf', en: 'Roles, reporting lines, recovery' } },
  { id: 'segmentation', weight: 2, knockout: false, label: { de: 'Netzwerksegmentierung', en: 'Network segmentation' }, hint: { de: 'Trennung Büro, Produktion, Backups', en: 'Separate office, production, backups' } },
  { id: 'payments', weight: 1, knockout: false, label: { de: 'Vier-Augen-Prinzip bei Zahlungen', en: 'Dual control on payments' }, hint: { de: 'Rückruf bei geänderten Bankdaten', en: 'Call-back on changed bank details' } },
  { id: 'vendors', weight: 1, knockout: false, label: { de: 'Steuerung von IT-Dienstleistern', en: 'IT supplier management' }, hint: { de: 'Zugriffe, Verträge, Sicherheitsanforderungen', en: 'Access, contracts, security requirements' } },
];

export interface CoverageModule { id: string; label: Txt }
export const MODULES: CoverageModule[] = [
  { id: 'bi', label: { de: 'Betriebsunterbrechung', en: 'Business interruption' } },
  { id: 'liability', label: { de: 'Haftpflicht gegenüber Dritten', en: 'Third-party liability' } },
  { id: 'extortion', label: { de: 'Cyber-Erpressung', en: 'Cyber extortion' } },
  { id: 'response', label: { de: 'Forensik und Krisenhilfe', en: 'Forensics and crisis response' } },
  { id: 'restoration', label: { de: 'Datenwiederherstellung', en: 'Data restoration' } },
  { id: 'socialeng', label: { de: 'Betrug / Fake President', en: 'Social engineering fraud' } },
  { id: 'pci', label: { de: 'Kartenzahlungs-Vertragsstrafen', en: 'Payment card penalties' } },
  { id: 'contingent', label: { de: 'Ausfall bei IT-Dienstleistern', en: 'Contingent business interruption' } },
];

export interface Weights { coverage: number; price: number; service: number; limit: number }

export interface Intake {
  company: string;
  industry: string;
  revenue: string;
  usExposure: boolean;
  records: string;
  cardData: boolean;
  downtime: string;
  incidents: string;
  controls: Record<string, ControlAnswer>;
  limit: string;
  modules: string[];
  weights: Weights;
}

export const emptyIntake = (): Intake => ({
  company: '', industry: '', revenue: '', usExposure: false, records: '', cardData: false,
  downtime: '', incidents: '', controls: {}, limit: '', modules: ['bi', 'extortion', 'response', 'restoration'],
  weights: { coverage: 4, price: 3, service: 3, limit: 3 },
});

const f = (opts: Option[], v: string) => opts.find((o) => o.value === v)?.factor ?? 0;

/** Generic market segments. Values are relative 1–5 scales, not tariffs. */
export interface Segment {
  id: string;
  name: Txt;
  description: Txt;
  minMaturity: number;          // minimum control maturity (0–100)
  maxLimit: number;             // highest limit factor offered (1–4)
  minRevenue: number;           // lowest revenue factor served
  maxRevenue: number;
  usOk: boolean;
  excluded: string[];           // industries outside appetite
  maxIncidents: number;         // tolerated prior-incident factor
  coverage: Record<string, 0 | 0.5 | 1>;
  price: number;                // 1 = low price level … 5 = high
  service: number;              // 1–5 assistance / claims service
}

export const SEGMENTS: Segment[] = [
  {
    id: 'specialist', name: { de: 'Cyber-Spezialversicherer', en: 'Cyber specialist insurer' },
    description: { de: 'Eigenständige Cyber-Police, breite Deckung, eigenes Krisennetzwerk, strenge Risikoprüfung.', en: 'Standalone cyber policy, broad cover, own response network, strict underwriting.' },
    minMaturity: 65, maxLimit: 4, minRevenue: 1, maxRevenue: 4, usOk: true, excluded: [], maxIncidents: 1,
    coverage: { bi: 1, liability: 1, extortion: 1, response: 1, restoration: 1, socialeng: 1, pci: 1, contingent: 1 },
    price: 4, service: 5,
  },
  {
    id: 'composite', name: { de: 'Kompositversicherer (Mittelstand)', en: 'Composite insurer (mid-market)' },
    description: { de: 'Cyber als Baustein im Firmenpaket, solide Grunddeckung, moderate Anforderungen.', en: 'Cyber as part of a commercial package, solid base cover, moderate requirements.' },
    minMaturity: 50, maxLimit: 3, minRevenue: 1, maxRevenue: 3, usOk: false, excluded: ['public'], maxIncidents: 1,
    coverage: { bi: 1, liability: 1, extortion: 0.5, response: 1, restoration: 1, socialeng: 0.5, pci: 0, contingent: 0.5 },
    price: 2, service: 3,
  },
  {
    id: 'mga', name: { de: 'Digitaler Assekuradeur (KMU)', en: 'Digital MGA (SME)' },
    description: { de: 'Standardisierter Online-Fragebogen, schnelle Zeichnung, niedrigere Limits, harte Ausschlusskriterien.', en: 'Standardised online questionnaire, fast binding, lower limits, hard knock-out criteria.' },
    minMaturity: 55, maxLimit: 2, minRevenue: 1, maxRevenue: 2, usOk: false, excluded: ['finance', 'public', 'health'], maxIncidents: 0,
    coverage: { bi: 1, liability: 1, extortion: 1, response: 1, restoration: 1, socialeng: 0.5, pci: 0.5, contingent: 0 },
    price: 1, service: 3,
  },
  {
    id: 'international', name: { de: 'Internationaler Lead-Markt', en: 'International lead market' },
    description: { de: 'Hohe Kapazitäten und Programmlösungen für Konzerne, globale Deckung inkl. USA.', en: 'High capacity and programme solutions for large groups, global cover incl. US.' },
    minMaturity: 70, maxLimit: 4, minRevenue: 3, maxRevenue: 4, usOk: true, excluded: [], maxIncidents: 2,
    coverage: { bi: 1, liability: 1, extortion: 1, response: 1, restoration: 1, socialeng: 1, pci: 1, contingent: 1 },
    price: 5, service: 4,
  },
  {
    id: 'sector', name: { de: 'Branchen- oder Verbandskonzept', en: 'Sector / association scheme' },
    description: { de: 'Auf eine Branche zugeschnittene Rahmenvereinbarung mit Sonderkonditionen, eingeschränkte Flexibilität.', en: 'Framework tailored to one sector with special terms, limited flexibility.' },
    minMaturity: 45, maxLimit: 2, minRevenue: 1, maxRevenue: 3, usOk: false, excluded: ['it', 'finance'], maxIncidents: 1,
    coverage: { bi: 1, liability: 1, extortion: 0.5, response: 1, restoration: 0.5, socialeng: 0, pci: 0, contingent: 0 },
    price: 2, service: 2,
  },
];

export type Tone = 'pass' | 'partial' | 'fail';

export interface Condition { controlId: string; label: Txt; timing: 'binding' | 'ninety'; answer: ControlAnswer }

export interface SegmentResult {
  segment: Segment;
  eligible: boolean;
  knockouts: Txt[];
  criteria: { key: keyof Weights; label: Txt; score: number; weight: number }[];
  fit: number; // 0–100
}

export interface Assessment {
  exposure: number;
  maturity: number;
  insurability: number;
  verdict: Tone;
  verdictLabel: Txt;
  controlCounts: { pass: number; partial: number; fail: number };
  exposureDrivers: { label: Txt; value: number }[];
  conditions: Condition[];
  segments: SegmentResult[];
  recommended?: SegmentResult;
}

export const CONTROL_POINTS: Record<ControlAnswer, number> = { yes: 1, partial: 0.5, no: 0 };

export function controlMaturity(controls: Record<string, ControlAnswer>): number {
  const total = CONTROLS.reduce((s, c) => s + c.weight, 0);
  const got = CONTROLS.reduce((s, c) => s + c.weight * CONTROL_POINTS[controls[c.id] ?? 'no'], 0);
  return Math.round((got / total) * 100);
}

/** Exposure 0–100: share of the maximum on each driver, averaged. */
export function exposureDrivers(i: Intake): { label: Txt; value: number }[] {
  return [
    { label: { de: 'Branche', en: 'Industry' }, value: (f(INDUSTRIES, i.industry) / 5) * 100 },
    { label: { de: 'Unternehmensgröße', en: 'Company size' }, value: (f(REVENUE, i.revenue) / 4) * 100 },
    { label: { de: 'Personenbezogene Daten', en: 'Personal data' }, value: (f(RECORDS, i.records) / 4) * 100 },
    { label: { de: 'IT-Abhängigkeit', en: 'IT dependency' }, value: (f(DOWNTIME, i.downtime) / 4) * 100 },
    { label: { de: 'Vorschäden', en: 'Prior incidents' }, value: (f(INCIDENTS, i.incidents) / 2) * 100 },
    { label: { de: 'Karten / USA', en: 'Cards / US' }, value: ((i.cardData ? 1 : 0) + (i.usExposure ? 1 : 0)) * 50 },
  ].map((d) => ({ ...d, value: Math.round(d.value) }));
}

export function assess(i: Intake): Assessment {
  const maturity = controlMaturity(i.controls);
  const drivers = exposureDrivers(i);
  const exposure = Math.round(drivers.reduce((s, d) => s + d.value, 0) / drivers.length);
  const insurability = Math.round(maturity * 0.6 + (100 - exposure) * 0.4);

  const answer = (id: string): ControlAnswer => i.controls[id] ?? 'no';
  const knockoutMissing = CONTROLS.filter((c) => c.knockout && answer(c.id) === 'no').length;
  const knockoutPartial = CONTROLS.filter((c) => c.knockout && answer(c.id) === 'partial').length;

  let verdict: Tone;
  if (knockoutMissing >= 2 || insurability < 45) verdict = 'fail';
  else if (knockoutMissing === 1 || knockoutPartial > 0 || insurability < 70) verdict = 'partial';
  else verdict = 'pass';

  const verdictLabel: Txt = verdict === 'pass'
    ? { de: 'Versicherbar', en: 'Insurable' }
    : verdict === 'partial'
      ? { de: 'Versicherbar mit Auflagen', en: 'Insurable with conditions' }
      : { de: 'Derzeit kaum versicherbar', en: 'Currently hard to insure' };

  const counts = { pass: 0, partial: 0, fail: 0 };
  CONTROLS.forEach((c) => {
    const a = answer(c.id);
    if (a === 'yes') counts.pass++; else if (a === 'partial') counts.partial++; else counts.fail++;
  });

  const conditions: Condition[] = CONTROLS
    .filter((c) => answer(c.id) !== 'yes')
    .map((c) => ({ controlId: c.id, label: c.label, answer: answer(c.id), timing: (c.knockout ? 'binding' : 'ninety') as Condition['timing'] }))
    .sort((a, b) => (a.timing === b.timing ? 0 : a.timing === 'binding' ? -1 : 1));

  const segments = SEGMENTS.map((s) => evaluateSegment(s, i, maturity, knockoutMissing));
  const ranked = [...segments].sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.fit - a.fit);
  const recommended = ranked.find((r) => r.eligible);

  return {
    exposure, maturity, insurability, verdict, verdictLabel, controlCounts: counts,
    exposureDrivers: drivers, conditions, segments: ranked, recommended,
  };
}

export function evaluateSegment(s: Segment, i: Intake, maturity: number, knockoutMissing: number): SegmentResult {
  const ko: Txt[] = [];
  const rev = f(REVENUE, i.revenue);
  const lim = f(LIMITS, i.limit);
  if (maturity < s.minMaturity) ko.push({ de: `Sicherheitsniveau ${maturity} % unter Mindestwert ${s.minMaturity} %`, en: `Security maturity ${maturity}% below minimum ${s.minMaturity}%` });
  if (knockoutMissing > 0) ko.push({ de: 'Mindestens eine Pflichtmaßnahme fehlt', en: 'At least one mandatory control missing' });
  if (s.excluded.includes(i.industry)) ko.push({ de: 'Branche außerhalb des Zeichnungsappetits', en: 'Industry outside underwriting appetite' });
  if (rev && (rev < s.minRevenue || rev > s.maxRevenue)) ko.push({ de: 'Unternehmensgröße außerhalb der Zielgruppe', en: 'Company size outside target group' });
  if (i.usExposure && !s.usOk) ko.push({ de: 'USA-Geschäft nicht abgedeckt', en: 'US exposure not covered' });
  if (f(INCIDENTS, i.incidents) > s.maxIncidents) ko.push({ de: 'Vorschadenlage über Toleranz', en: 'Loss history above tolerance' });

  const needed = i.modules.length ? i.modules : MODULES.map((m) => m.id);
  const coverage = (needed.reduce((sum, m) => sum + (s.coverage[m] ?? 0), 0) / needed.length) * 100;
  const price = ((5 - s.price) / 4) * 100;
  const service = ((s.service - 1) / 4) * 100;
  const limit = lim ? Math.min(100, (s.maxLimit / lim) * 100) : 100;

  const criteria: SegmentResult['criteria'] = [
    { key: 'coverage', label: { de: 'Deckungsumfang', en: 'Coverage fit' }, score: Math.round(coverage), weight: i.weights.coverage },
    { key: 'price', label: { de: 'Preisniveau', en: 'Price level' }, score: Math.round(price), weight: i.weights.price },
    { key: 'service', label: { de: 'Service & Schadenhilfe', en: 'Service & claims' }, score: Math.round(service), weight: i.weights.service },
    { key: 'limit', label: { de: 'Versicherungssumme', en: 'Limit capacity' }, score: Math.round(limit), weight: i.weights.limit },
  ];
  const wsum = criteria.reduce((a, c) => a + c.weight, 0) || 1;
  const fit = Math.round(criteria.reduce((a, c) => a + c.score * c.weight, 0) / wsum);
  return { segment: s, eligible: ko.length === 0, knockouts: ko, criteria, fit };
}

export function intakeComplete(i: Intake): boolean {
  return !!(i.company.trim() && i.industry && i.revenue && i.records && i.downtime && i.incidents && i.limit)
    && CONTROLS.every((c) => !!i.controls[c.id]);
}
