// ── EU AI Act Readiness Assessment — Constants, Types & Demo Data ──────────
// Based on Regulation (EU) 2024/1689 — Artificial Intelligence Act
// Combines best-of patterns from NIS-2 / CRA / IEC 62443 compliance tools.
// All copy is trilingual via simple { de, en, fr } maps.

type T = (key: string) => string;
export type Lang = 'de' | 'en' | 'fr';

const tx = (m: { de: string; en?: string; fr?: string }, lang: Lang) =>
  m[lang] ?? m.en ?? m.de;

// ── Provider role under AI Act (Art. 3) ─────────────────────────
const ROLES = [
  { id: 'provider', icon: '🏗️', de: 'Anbieter', en: 'Provider', fr: 'Fournisseur',
    descDe: 'Entwickelt KI-System / GPAI-Modell und bringt es in Verkehr.',
    descEn: 'Develops AI system / GPAI model and places it on the market.',
    descFr: 'Développe le système d\'IA / modèle GPAI et le met sur le marché.' },
  { id: 'deployer', icon: '⚙️', de: 'Betreiber', en: 'Deployer', fr: 'Déployeur',
    descDe: 'Setzt KI-System unter eigener Verantwortung in der EU ein.',
    descEn: 'Uses an AI system under its own authority within the EU.',
    descFr: 'Utilise un système d\'IA sous sa propre responsabilité dans l\'UE.' },
  { id: 'importer', icon: '📦', de: 'Importeur', en: 'Importer', fr: 'Importateur',
    descDe: 'Bringt KI-System aus Drittland in den EU-Markt.',
    descEn: 'Places an AI system from a third country on the EU market.',
    descFr: 'Met un système d\'IA d\'un pays tiers sur le marché de l\'UE.' },
  { id: 'distributor', icon: '🔁', de: 'Händler', en: 'Distributor', fr: 'Distributeur',
    descDe: 'Stellt KI-System in der EU bereit, ohne Eigenschaften zu verändern.',
    descEn: 'Makes an AI system available on the EU market without altering it.',
    descFr: 'Met un système d\'IA à disposition sans en modifier les propriétés.' },
] as const;

export function getRoleOpts(t: T, lang: Lang) {
  return ROLES.map(r => ({
    id: r.id,
    label: tx({ de: r.de, en: r.en, fr: r.fr }, lang),
    icon: r.icon,
    desc: tx({ de: r.descDe, en: r.descEn, fr: r.descFr }, lang),
  }));
}

// ── Annex III high-risk domains (Art. 6 + Annex III) ────────────
const ANNEX_III = [
  { id: 'biometrics', de: 'Biometrische Identifizierung', en: 'Biometric identification', fr: 'Identification biométrique', icon: '👁️' },
  { id: 'critical_infra', de: 'Kritische Infrastruktur', en: 'Critical infrastructure', fr: 'Infrastructure critique', icon: '⚡' },
  { id: 'education', de: 'Bildung & Berufsausbildung', en: 'Education & vocational training', fr: 'Éducation et formation', icon: '🎓' },
  { id: 'employment', de: 'Beschäftigung & Personalmanagement', en: 'Employment & worker management', fr: 'Emploi et gestion du personnel', icon: '💼' },
  { id: 'essential_services', de: 'Wesentliche private/öffentliche Dienste', en: 'Essential private/public services', fr: 'Services essentiels', icon: '🏛️' },
  { id: 'law_enforcement', de: 'Strafverfolgung', en: 'Law enforcement', fr: 'Application de la loi', icon: '⚖️' },
  { id: 'migration', de: 'Migration, Asyl & Grenzkontrolle', en: 'Migration, asylum & border control', fr: 'Migration et contrôle aux frontières', icon: '🛂' },
  { id: 'justice', de: 'Justiz & demokratische Prozesse', en: 'Justice & democratic processes', fr: 'Justice et processus démocratiques', icon: '🏛️' },
  { id: 'product_safety', de: 'Sicherheitskomponente in regulierten Produkten', en: 'Safety component in regulated products', fr: 'Composant de sécurité dans produits réglementés', icon: '🛡️' },
] as const;

export function getAnnexIIIOpts(lang: Lang) {
  return ANNEX_III.map(a => ({ id: a.id, label: tx({ de: a.de, en: a.en, fr: a.fr }, lang), icon: a.icon }));
}

// ── Prohibited practices indicators (Art. 5) ────────────────────
const PROHIBITED = [
  { id: 'subliminal', de: 'Unterschwellige / manipulative Techniken', en: 'Subliminal / manipulative techniques', fr: 'Techniques subliminales / manipulatrices' },
  { id: 'vulnerability', de: 'Ausnutzung von Schwächen (Alter, Behinderung, sozioökonomisch)', en: 'Exploitation of vulnerabilities (age, disability, socio-economic)', fr: 'Exploitation de vulnérabilités' },
  { id: 'social_scoring', de: 'Soziale Bewertung durch Behörden', en: 'Social scoring by public authorities', fr: 'Notation sociale par les autorités' },
  { id: 'predictive_policing', de: 'Predictive Policing rein auf Profiling', en: 'Predictive policing based solely on profiling', fr: 'Police prédictive basée uniquement sur le profilage' },
  { id: 'facial_scraping', de: 'Untargetiertes Scraping von Gesichtsbildern', en: 'Untargeted scraping of facial images', fr: 'Récupération non ciblée d\'images faciales' },
  { id: 'emotion_workplace', de: 'Emotionserkennung am Arbeitsplatz/Schule', en: 'Emotion recognition at workplace/school', fr: 'Reconnaissance d\'émotions au travail/école' },
  { id: 'biometric_categ', de: 'Biometrische Kategorisierung sensibler Merkmale', en: 'Biometric categorisation of sensitive attributes', fr: 'Catégorisation biométrique d\'attributs sensibles' },
  { id: 'realtime_rbi', de: 'Echtzeit-Fernidentifizierung im öffentlichen Raum', en: 'Real-time remote biometric identification in public spaces', fr: 'Identification biométrique en temps réel dans l\'espace public' },
] as const;

export function getProhibitedOpts(lang: Lang) {
  return PROHIBITED.map(p => ({ id: p.id, label: tx({ de: p.de, en: p.en, fr: p.fr }, lang) }));
}

// ── Implemented Measures (Art. 9–15) ────────────────────────────
const MEASURES = [
  { id: 'risk_mgmt', cat: 'governance', de: 'Risikomanagementsystem (Art. 9)', en: 'Risk management system (Art. 9)', fr: 'Système de gestion des risques (Art. 9)' },
  { id: 'data_governance', cat: 'data', de: 'Daten- und Datengovernance (Art. 10)', en: 'Data and data governance (Art. 10)', fr: 'Gouvernance des données (Art. 10)' },
  { id: 'tech_doc', cat: 'documentation', de: 'Technische Dokumentation (Art. 11)', en: 'Technical documentation (Art. 11)', fr: 'Documentation technique (Art. 11)' },
  { id: 'logging', cat: 'documentation', de: 'Aufzeichnungspflichten / Logging (Art. 12)', en: 'Record-keeping / logging (Art. 12)', fr: 'Enregistrements (Art. 12)' },
  { id: 'transparency', cat: 'transparency', de: 'Transparenz & Nutzerinformation (Art. 13)', en: 'Transparency & user information (Art. 13)', fr: 'Transparence (Art. 13)' },
  { id: 'human_oversight', cat: 'oversight', de: 'Menschliche Aufsicht (Art. 14)', en: 'Human oversight (Art. 14)', fr: 'Surveillance humaine (Art. 14)' },
  { id: 'accuracy', cat: 'robustness', de: 'Genauigkeit, Robustheit, Cybersicherheit (Art. 15)', en: 'Accuracy, robustness, cybersecurity (Art. 15)', fr: 'Exactitude, robustesse, cybersécurité (Art. 15)' },
  { id: 'qms', cat: 'governance', de: 'Qualitätsmanagementsystem (Art. 17)', en: 'Quality management system (Art. 17)', fr: 'Système de gestion de la qualité (Art. 17)' },
  { id: 'conformity', cat: 'documentation', de: 'Konformitätsbewertung & CE (Art. 43, 48)', en: 'Conformity assessment & CE (Art. 43, 48)', fr: 'Évaluation de conformité & CE' },
  { id: 'post_market', cat: 'oversight', de: 'Post-Market Monitoring (Art. 72)', en: 'Post-market monitoring (Art. 72)', fr: 'Surveillance post-commercialisation (Art. 72)' },
  { id: 'incident_reporting', cat: 'oversight', de: 'Meldung schwerwiegender Vorfälle (Art. 73)', en: 'Serious incident reporting (Art. 73)', fr: 'Signalement d\'incidents graves (Art. 73)' },
  { id: 'gpai_doc', cat: 'governance', de: 'GPAI-Modell-Dokumentation (Art. 53)', en: 'GPAI model documentation (Art. 53)', fr: 'Documentation modèle GPAI (Art. 53)' },
] as const;

const MEASURE_CATS: Record<string, { de: string; en: string; fr: string }> = {
  governance: { de: 'Governance', en: 'Governance', fr: 'Gouvernance' },
  data: { de: 'Daten', en: 'Data', fr: 'Données' },
  documentation: { de: 'Dokumentation', en: 'Documentation', fr: 'Documentation' },
  transparency: { de: 'Transparenz', en: 'Transparency', fr: 'Transparence' },
  oversight: { de: 'Aufsicht', en: 'Oversight', fr: 'Surveillance' },
  robustness: { de: 'Robustheit', en: 'Robustness', fr: 'Robustesse' },
};

export function getAiActMeasures(lang: Lang) {
  return MEASURES.map(m => ({ id: m.id, label: tx({ de: m.de, en: m.en, fr: m.fr }, lang), cat: tx(MEASURE_CATS[m.cat], lang) }));
}
export function getAiActMeasureCats(lang: Lang) {
  return [...new Set(getAiActMeasures(lang).map(m => m.cat))];
}

// ── Attach Types (uploads) ──────────────────────────────────────
const ATTACHES = [
  { id: 'tech_doc', icon: '📘', accept: '.pdf,.docx', de: 'Technische Dokumentation (Anhang IV)', en: 'Technical documentation (Annex IV)', fr: 'Documentation technique (Annexe IV)' },
  { id: 'risk_mgmt_plan', icon: '📋', accept: '.pdf,.docx', de: 'Risikomanagement-Plan', en: 'Risk management plan', fr: 'Plan de gestion des risques' },
  { id: 'data_card', icon: '🗂️', accept: '.pdf,.docx', de: 'Data-Sheet / Data Card', en: 'Data sheet / data card', fr: 'Fiche de données' },
  { id: 'model_card', icon: '🧠', accept: '.pdf,.md', de: 'Model Card / Eval-Bericht', en: 'Model card / eval report', fr: 'Model card / rapport d\'évaluation' },
  { id: 'dpia', icon: '🛡️', accept: '.pdf,.docx', de: 'DSFA / FRIA (Art. 27)', en: 'DPIA / FRIA (Art. 27)', fr: 'AIPD / FRIA (Art. 27)' },
  { id: 'other', icon: '📎', accept: '*', de: 'Sonstiges Dokument', en: 'Other document', fr: 'Autre document' },
] as const;

export function getAiActAttachTypes(lang: Lang) {
  return ATTACHES.map(a => ({ id: a.id, label: tx({ de: a.de, en: a.en, fr: a.fr }, lang), icon: a.icon, accept: a.accept }));
}

// ── Types ───────────────────────────────────────────────────────
export interface MeasureEntry {
  active: boolean; documented: boolean; audited: boolean; certified: boolean;
}

export interface AiActIntakeData {
  entityName: string;
  role: string[];                     // provider / deployer / importer / distributor
  systemName: string;
  systemPurpose: string;
  domain: string;                     // free text
  annexIII: string[];                 // selected Annex III domains
  prohibitedFlags: string[];          // selected prohibited indicators
  isGpai: boolean;                    // foundation / GPAI model?
  flopsThreshold: boolean;            // ≥ 10^25 FLOPS → systemic risk
  realtimeBiometricsPublic: boolean;
  affectsFundamentalRights: boolean;
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: AiActIntakeData = {
  entityName: '', role: [], systemName: '', systemPurpose: '', domain: '',
  annexIII: [], prohibitedFlags: [], isGpai: false, flopsThreshold: false,
  realtimeBiometricsPublic: false, affectsFundamentalRights: false,
  measures: {}, knownIssues: '', files: [],
};

// ── Risk Categories (BRTPSGE) ───────────────────────────────────
export const RISK_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  B: { label: { de: 'Bias & Fairness', en: 'Bias & Fairness', fr: 'Biais & équité' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  R: { label: { de: 'Robustheit', en: 'Robustness', fr: 'Robustesse' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  T: { label: { de: 'Transparenz', en: 'Transparency', fr: 'Transparence' }, dot: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  P: { label: { de: 'Datenschutz', en: 'Privacy', fr: 'Vie privée' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  S: { label: { de: 'Cybersicherheit', en: 'Security', fr: 'Sécurité' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  G: { label: { de: 'Governance & Aufsicht', en: 'Governance & Oversight', fr: 'Gouvernance' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  E: { label: { de: 'Umweltauswirkung', en: 'Environmental Impact', fr: 'Impact environnemental' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
};

export interface AiActRisk {
  id: number;
  category: string; // B R T P S G E
  name: string;
  component: string;
  attacker: string;       // threat actor / driver
  path: string;
  aiActRef: string;       // e.g. "Art. 9", "Art. 10 Abs. 3"
  likelihood: number;     // 1-5
  impact: number;         // 1-5
  evidence: string;
  rationale: string;
  sources: string[];
  evidenceQuality: number;
  reproducibility: 'easy' | 'medium' | 'hard';
}

export function riskId(r: AiActRisk): string {
  return `${r.category}-${String(r.id).padStart(3, '0')}`;
}

export interface AiActReq {
  id: string;
  article: string;
  name: string;
  status: 'pass' | 'partial' | 'fail';
  gap: string;
  measure: string;
  evidence: string;
  rationale: string;
  criteria: string[];
  effort: string;
  priority: string;
}

// ── Classification Verdict ──────────────────────────────────────
export type AiRiskClass = 'prohibited' | 'highRisk' | 'gpaiSystemic' | 'gpai' | 'limited' | 'minimal';

export function classifyAiSystem(d: AiActIntakeData): AiRiskClass {
  if (d.prohibitedFlags.length > 0) return 'prohibited';
  if (d.isGpai && d.flopsThreshold) return 'gpaiSystemic';
  if (d.annexIII.length > 0 || d.realtimeBiometricsPublic || d.affectsFundamentalRights) return 'highRisk';
  if (d.isGpai) return 'gpai';
  // Heuristic: chatbots / generative content → limited transparency obligations
  if ((d.systemPurpose + ' ' + d.domain).toLowerCase().match(/chat|generativ|deepfake|content/)) return 'limited';
  return 'minimal';
}

export const CLASS_META: Record<AiRiskClass, { de: string; en: string; fr: string; color: string; sev: 'critical'|'high'|'medium'|'low' }> = {
  prohibited:    { de: 'Verbotene Praxis', en: 'Prohibited practice', fr: 'Pratique interdite',
                   color: 'border-destructive bg-destructive/10 text-destructive', sev: 'critical' },
  highRisk:      { de: 'Hochrisiko-System', en: 'High-risk system', fr: 'Système à haut risque',
                   color: 'border-orange-500 bg-orange-500/10 text-orange-400', sev: 'high' },
  gpaiSystemic:  { de: 'GPAI mit systemischem Risiko', en: 'GPAI with systemic risk', fr: 'GPAI à risque systémique',
                   color: 'border-orange-500 bg-orange-500/10 text-orange-400', sev: 'high' },
  gpai:          { de: 'GPAI-Modell (Art. 53)', en: 'GPAI model (Art. 53)', fr: 'Modèle GPAI (Art. 53)',
                   color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', sev: 'medium' },
  limited:       { de: 'Begrenztes Risiko (Transparenz)', en: 'Limited risk (transparency)', fr: 'Risque limité',
                   color: 'border-cyan-500 bg-cyan-500/10 text-cyan-400', sev: 'medium' },
  minimal:       { de: 'Minimales Risiko', en: 'Minimal risk', fr: 'Risque minimal',
                   color: 'border-green-500 bg-green-500/10 text-green-400', sev: 'low' },
};

// ── DEMO RISKS (12, generic, AI Act-themed) ─────────────────────
export const AI_ACT_RISKS: AiActRisk[] = [
  { id: 1, category: 'B', name: 'Verzerrte Trainingsdaten führen zu diskriminierenden Ergebnissen', component: 'Trainingsdaten-Pipeline', attacker: 'Datenqualitätsmangel / historische Verzerrung', path: 'Unausgewogene Trainingsdaten → Modell lernt diskriminierende Muster → benachteiligte Gruppen erhalten schlechtere Ergebnisse', aiActRef: 'Art. 10 Abs. 2',
    likelihood: 4, impact: 5,
    evidence: 'Datenanalyse: Trainingskorpus enthält 78% Datenpunkte einer demografischen Gruppe. Keine dokumentierten Bias-Tests nach Art. 10 Abs. 2 lit. f. Statistische Disparität in Modell-Outputs: 23 Prozentpunkte zwischen Gruppen.',
    rationale: 'Likelihood 4: Bias in unausgewogenen Datensätzen ist statistisch dokumentiert (Buolamwini/Gebru 2018). Impact 5: Diskriminierende Entscheidungen verletzen Grundrechte und führen zu Sanktionen nach Art. 99 (bis 35 Mio. EUR oder 7% Umsatz).',
    sources: ['AI Act Art. 10 Abs. 2 lit. f', 'NIST AI RMF', 'ISO/IEC 24027:2021'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, category: 'B', name: 'Fehlende Repräsentativität für betroffene Personengruppen', component: 'Datensatz-Auswahl', attacker: 'Sampling-Bias', path: 'Unterrepräsentation von Minderheiten → schlechte Modellleistung für diese Gruppen → ungleiche Behandlung', aiActRef: 'Art. 10 Abs. 3',
    likelihood: 4, impact: 4,
    evidence: 'Datasheet zeigt: 92% der Trainingsdaten aus Region A, geographische und kulturelle Diversität nicht dokumentiert.',
    rationale: 'Likelihood 4: Repräsentativitätslücken sind in Praxis verbreitet. Impact 4: Verletzt Art. 10 Abs. 3 (relevant, repräsentativ, fehlerfrei, vollständig).',
    sources: ['AI Act Art. 10 Abs. 3', 'Datasheets for Datasets (Gebru et al.)'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 3, category: 'R', name: 'Mangelnde Robustheit gegenüber adversarialen Eingaben', component: 'Modell-Inferenz', attacker: 'Adversarial Attacker', path: 'Gezielte Eingabemanipulation → Modell-Fehlklassifikation → falsche Entscheidung', aiActRef: 'Art. 15 Abs. 4',
    likelihood: 3, impact: 5,
    evidence: 'Sicherheitstests: Adversarial-Robustheits-Benchmark (FGSM, PGD) nicht durchgeführt. Keine Eingabe-Validierung in Produktion. POC-Angriff mit ε=0.03 verändert Klassifikation in 67% der Testfälle.',
    rationale: 'Likelihood 3: Adversariale Tools (Foolbox, ART) sind frei verfügbar; Angriff wirtschaftlich attraktiv. Impact 5: Sicherheitskritische Fehlentscheidung in regulierter Anwendung.',
    sources: ['AI Act Art. 15 Abs. 4', 'NIST IR 8269', 'OWASP ML Top 10'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 4, category: 'R', name: 'Modelldrift ohne kontinuierliche Validierung', component: 'Production-Monitoring', attacker: 'Datenverteilungsverschiebung', path: 'Eingabeverteilung ändert sich → Modellgenauigkeit sinkt unbemerkt → fehlerhafte Outputs', aiActRef: 'Art. 15 Abs. 1',
    likelihood: 4, impact: 4,
    evidence: 'Monitoring-Stack: kein Drift-Detection-Mechanismus. Letzte Re-Validierung gegen Held-Out-Set: 11 Monate alt. Performance-Metriken werden in Produktion nicht erfasst.',
    rationale: 'Likelihood 4: Modelldrift ist statistisch erwartbar in dynamischen Domänen. Impact 4: Nicht-erkannte Genauigkeitsverluste verletzen Art. 15 Abs. 1.',
    sources: ['AI Act Art. 15 Abs. 1', 'ISO/IEC 5338:2023'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 5, category: 'T', name: 'Nutzer werden nicht über KI-Interaktion informiert', component: 'User Interface', attacker: 'Mangelnde Transparenz', path: 'Nutzer interagiert mit System ohne KI-Kenntnis → falsche Erwartung → Fehlentscheidung', aiActRef: 'Art. 50 Abs. 1',
    likelihood: 5, impact: 3,
    evidence: 'UI-Audit: Chatbot-Interface enthält keinen Hinweis auf KI-Natur des Gesprächspartners. Art. 50 Abs. 1 verlangt explizite Kenntlichmachung.',
    rationale: 'Likelihood 5: Häufiger Designfehler in Chat-/Voicebots. Impact 3: Regulatorische Verletzung mit direkter Sanktionsfolge nach Art. 99.',
    sources: ['AI Act Art. 50 Abs. 1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 6, category: 'T', name: 'Fehlende Kennzeichnung synthetischer/manipulierter Inhalte', component: 'Output-Pipeline', attacker: 'Deepfake-Risiko', path: 'KI-generierte Bilder/Audio/Video ohne Wasserzeichen → Verwechselbarkeit mit realen Inhalten → Desinformation', aiActRef: 'Art. 50 Abs. 2 + 4',
    likelihood: 4, impact: 4,
    evidence: 'Output-Pipeline: kein C2PA-Wasserzeichen, keine Maschinen-lesbare Markierung gemäß Art. 50 Abs. 2.',
    rationale: 'Likelihood 4: Deepfake-Vorwürfe nehmen exponentiell zu. Impact 4: Verletzung der Transparenzpflicht und gesellschaftliches Schadenspotential.',
    sources: ['AI Act Art. 50 Abs. 2 und 4', 'C2PA Specification 1.3'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 7, category: 'P', name: 'Personenbezogene Daten im Trainingskorpus ohne Rechtsgrundlage', component: 'Trainingsdaten', attacker: 'DSGVO-Risiko', path: 'Web-Scraping personenbezogener Daten → keine Rechtsgrundlage Art. 6 DSGVO → DSGVO-Verstoß', aiActRef: 'Art. 10 Abs. 5',
    likelihood: 4, impact: 5,
    evidence: 'Datenherkunfts-Audit: 14% der Trainingsdaten aus Web-Scraping ohne dokumentierte Rechtsgrundlage. Keine TIA (Transfer Impact Assessment) für US-basierte Datenquellen.',
    rationale: 'Likelihood 4: EDSA und nationale DPAs prüfen aktiv. Impact 5: DSGVO-Bußgeld bis 4% Umsatz, kumuliert mit AI-Act-Sanktion.',
    sources: ['AI Act Art. 10 Abs. 5', 'DSGVO Art. 5 + 6', 'EDSA-Stellungnahme 28/2024'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 8, category: 'S', name: 'Modell-Inversion erlaubt Rückschluss auf Trainingsdaten', component: 'Modell-API', attacker: 'Externer Angreifer', path: 'Wiederholte API-Abfragen → Membership Inference / Model Inversion → Rekonstruktion personenbezogener Trainingsdaten', aiActRef: 'Art. 15 Abs. 5',
    likelihood: 3, impact: 5,
    evidence: 'Sicherheitstest: Membership-Inference-Attack zeigt 84% Genauigkeit auf Trainings-Subset. Keine Differential Privacy implementiert.',
    rationale: 'Likelihood 3: Erfordert Black-Box-Zugang, akademisch und praktisch demonstriert. Impact 5: Datenschutzverletzung mit DSGVO-Folgen.',
    sources: ['AI Act Art. 15 Abs. 5', 'ENISA Threat Landscape AI 2023'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 9, category: 'S', name: 'Prompt-Injection ermöglicht Umgehung der System-Policy', component: 'LLM-Frontend', attacker: 'Externer Angreifer', path: 'Eingebettete Anweisungen in Nutzereingabe → Override der System-Prompt → Datenexfiltration / Policy-Verletzung', aiActRef: 'Art. 15 Abs. 5',
    likelihood: 5, impact: 4,
    evidence: 'Pentest: 8 von 10 getesteten Prompt-Injection-Payloads (OWASP LLM01) erfolgreich. Keine Input-Sanitisierung. Keine Output-Filterung.',
    rationale: 'Likelihood 5: Prompt-Injection ist OWASP-LLM-Risiko Nr. 1. Impact 4: Reputations- und Datenschutzschaden.',
    sources: ['AI Act Art. 15 Abs. 5', 'OWASP LLM Top 10 (LLM01)'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 10, category: 'G', name: 'Keine dokumentierte menschliche Aufsicht über kritische Entscheidungen', component: 'Decision-Workflow', attacker: 'Governance-Lücke', path: 'Vollautomatisierte Entscheidung ohne Eingriffsmöglichkeit → fehlerhafte Entscheidung wird vollzogen → Schaden für Betroffene', aiActRef: 'Art. 14',
    likelihood: 5, impact: 4,
    evidence: 'Workflow-Analyse: 92% der Modell-Entscheidungen werden ohne menschliche Validierung umgesetzt. Kein Eskalationsprozess. Keine Dokumentation der Aufsichtsmaßnahmen.',
    rationale: 'Likelihood 5: Art. 14 verlangt explizit wirksame Aufsicht durch natürliche Personen. Impact 4: Direkt sanktionsbewehrt nach Art. 99.',
    sources: ['AI Act Art. 14', 'BSI AIC4 Katalog'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 11, category: 'G', name: 'Unzureichende Aufzeichnungen / Logs gemäß Art. 12', component: 'Logging-Infrastruktur', attacker: 'Compliance-Risiko', path: 'Modell-Outputs ohne ausreichende Logs → Nachvollziehbarkeit verletzt → keine Post-Mortem möglich', aiActRef: 'Art. 12',
    likelihood: 4, impact: 4,
    evidence: 'Logging-Audit: Inputs werden geloggt, Modell-Outputs jedoch nur 7 Tage retentiert. Keine automatische Erfassung der Identifikatoren des Modells und Datensatzes.',
    rationale: 'Likelihood 4: Logging-Lücken sind in produktiven LLM-Stacks häufig. Impact 4: Verletzt Aufzeichnungspflicht und behindert Post-Market-Monitoring.',
    sources: ['AI Act Art. 12', 'Art. 19 (Aufbewahrungsfristen)'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 12, category: 'E', name: 'Hoher Energieverbrauch ohne dokumentierte Effizienzmaßnahmen', component: 'Trainings-Cluster', attacker: 'Nachhaltigkeits-Risiko', path: 'Großmodell-Training ohne Effizienz-Optimierung → unverhältnismäßiger CO₂-Fußabdruck → Reputations- und Regulierungsrisiko', aiActRef: 'Art. 53 Abs. 1 lit. d',
    likelihood: 3, impact: 3,
    evidence: 'Training-Logs: Geschätzter CO₂-Footprint 320 t CO₂eq. Keine PUE-Optimierung dokumentiert. Keine Trainings-Footprint-Berichte gemäß Annex XI.',
    rationale: 'Likelihood 3: GPAI-Anbieter werden zunehmend auf Energiebilanz geprüft. Impact 3: Regulatorisches Risiko (GPAI-Code of Practice) und Reputationsschaden.',
    sources: ['AI Act Art. 53 Abs. 1 lit. d', 'Annex XI', 'GPAI Code of Practice'], evidenceQuality: 3, reproducibility: 'medium' },
];

// EN/FR translations for risk fields (concise form, name + rationale only — full localization
// for evidence/path stays in the DE source for the demo, with English fallback in localizer).
export const AI_ACT_RISKS_EN: Record<string, Partial<AiActRisk>> = {
  '1': { name: 'Biased training data leads to discriminatory outcomes', rationale: 'Likelihood 4: bias in imbalanced datasets is well documented. Impact 5: discriminatory outcomes violate fundamental rights and trigger Art. 99 sanctions (up to EUR 35M or 7% turnover).' },
  '2': { name: 'Lack of representativeness for affected groups', rationale: 'Likelihood 4: representativeness gaps are common. Impact 4: violates Art. 10(3) (relevant, representative, error-free, complete).' },
  '3': { name: 'Insufficient robustness against adversarial inputs', rationale: 'Likelihood 3: adversarial tools are freely available; attack is economically attractive. Impact 5: safety-critical misclassification.' },
  '4': { name: 'Model drift without continuous validation', rationale: 'Likelihood 4: drift is statistically expected. Impact 4: undetected accuracy loss violates Art. 15(1).' },
  '5': { name: 'Users not informed about AI interaction', rationale: 'Likelihood 5: common design oversight in bots. Impact 3: regulatory violation with direct sanction.' },
  '6': { name: 'Missing labelling of synthetic/manipulated content', rationale: 'Likelihood 4: deepfake claims are rising sharply. Impact 4: violates transparency duty.' },
  '7': { name: 'Personal data in training corpus without lawful basis', rationale: 'Likelihood 4: EDPB and national DPAs are actively reviewing. Impact 5: GDPR fines up to 4% turnover, cumulative with AI Act sanctions.' },
  '8': { name: 'Model inversion enables inference of training data', rationale: 'Likelihood 3: requires black-box access; demonstrated. Impact 5: data protection breach.' },
  '9': { name: 'Prompt injection bypasses system policy', rationale: 'Likelihood 5: OWASP LLM01 top risk. Impact 4: reputation and data protection damage.' },
  '10': { name: 'No documented human oversight over critical decisions', rationale: 'Likelihood 5: Art. 14 explicitly requires effective human oversight. Impact 4: directly sanctioned.' },
  '11': { name: 'Insufficient record-keeping under Art. 12', rationale: 'Likelihood 4: logging gaps are common in production LLM stacks. Impact 4: hampers post-market monitoring.' },
  '12': { name: 'High energy consumption without documented efficiency measures', rationale: 'Likelihood 3: GPAI providers face energy scrutiny. Impact 3: regulatory and reputational risk.' },
};
export const AI_ACT_RISKS_FR: Record<string, Partial<AiActRisk>> = {
  '1': { name: 'Données d\'entraînement biaisées entraînent des résultats discriminatoires', rationale: 'Probabilité 4 : biais documenté. Impact 5 : viole les droits fondamentaux, sanctions Art. 99 jusqu\'à 35 M EUR ou 7% du CA.' },
  '2': { name: 'Manque de représentativité pour les groupes concernés', rationale: 'Probabilité 4 : lacunes courantes. Impact 4 : viole Art. 10(3).' },
  '3': { name: 'Robustesse insuffisante face aux entrées adversariales', rationale: 'Probabilité 3 : outils adversariaux disponibles. Impact 5 : erreur critique de sécurité.' },
  '4': { name: 'Dérive du modèle sans validation continue', rationale: 'Probabilité 4 : dérive statistiquement attendue. Impact 4 : perte de précision non détectée, viole Art. 15(1).' },
  '5': { name: 'Utilisateurs non informés de l\'interaction avec une IA', rationale: 'Probabilité 5 : oubli courant. Impact 3 : violation réglementaire.' },
  '6': { name: 'Absence d\'étiquetage du contenu synthétique/manipulé', rationale: 'Probabilité 4 : risque deepfake croissant. Impact 4 : viole la transparence.' },
  '7': { name: 'Données personnelles dans le corpus d\'entraînement sans base légale', rationale: 'Probabilité 4 : autorités contrôlent activement. Impact 5 : amendes RGPD jusqu\'à 4% du CA.' },
  '8': { name: 'L\'inversion du modèle permet de déduire les données d\'entraînement', rationale: 'Probabilité 3 : accès black-box requis. Impact 5 : violation de protection des données.' },
  '9': { name: 'L\'injection de prompts contourne la politique du système', rationale: 'Probabilité 5 : OWASP LLM01. Impact 4 : dommage réputationnel.' },
  '10': { name: 'Aucune surveillance humaine documentée sur les décisions critiques', rationale: 'Probabilité 5 : Art. 14 exige une surveillance effective. Impact 4 : sanctionné.' },
  '11': { name: 'Enregistrements insuffisants selon Art. 12', rationale: 'Probabilité 4 : lacunes de journalisation courantes. Impact 4 : entrave la surveillance.' },
  '12': { name: 'Consommation énergétique élevée sans mesures d\'efficacité', rationale: 'Probabilité 3 : fournisseurs GPAI sous surveillance. Impact 3 : risque réglementaire.' },
};

// ── DEMO REQUIREMENTS (15 representative AI Act articles) ───────
export const AI_ACT_REQS: AiActReq[] = [
  { id: 'A09-1', article: 'Art. 9', name: 'Risikomanagementsystem für Hochrisiko-KI', status: 'fail',
    gap: 'Kein dokumentiertes, kontinuierliches Risikomanagementsystem nach Art. 9.',
    evidence: 'Prozessanalyse: Punktuelle Risikoanalyse aus 2024, kein iterativer Lebenszyklus, keine Aktualisierung nach Modell-Updates.',
    rationale: 'Nicht erfüllt: Art. 9 verlangt iteratives, dokumentiertes RMS über den gesamten Lebenszyklus.',
    measure: 'RMS gemäß Art. 9 etablieren, an Lebenszyklus koppeln, halbjährliche Reviews einführen.',
    criteria: ['RMS-Verfahren dokumentiert', 'Iterationszyklus festgelegt', 'Risikoregister aktiv geführt'],
    effort: '40-60h', priority: 'P0' },
  { id: 'A10-1', article: 'Art. 10 Abs. 2', name: 'Daten- und Datengovernance — Bias-Tests', status: 'fail',
    gap: 'Keine Bias-Tests nach Art. 10 Abs. 2 lit. f durchgeführt oder dokumentiert.',
    evidence: 'Datasheet: keine Repräsentativitätsanalyse, keine Disparitätsmetriken, keine Mitigation-Strategie.',
    rationale: 'Nicht erfüllt: Art. 10 Abs. 2 verlangt explizite Identifikation und Minderung möglicher Bias.',
    measure: 'Bias-Test-Pipeline einführen (Disparate Impact, Equal Opportunity), Ergebnisse versionieren.',
    criteria: ['Disparate-Impact-Metrik < 0,8 dokumentiert', 'Mitigation-Strategie umgesetzt', 'Test in CI/CD integriert'],
    effort: '30-50h', priority: 'P0' },
  { id: 'A10-2', article: 'Art. 10 Abs. 3', name: 'Datenqualität — relevant, repräsentativ, vollständig', status: 'partial',
    gap: 'Datasheet vorhanden, aber Repräsentativitätsnachweis nur lückenhaft.',
    evidence: 'Datasheet beschreibt Quellen, jedoch keine demografische / geografische Vollständigkeitsanalyse.',
    rationale: 'Teilweise erfüllt: Art. 10 Abs. 3 fordert nachweisliche Repräsentativität.',
    measure: 'Repräsentativitäts-Report mit demografischer Verteilungsanalyse ergänzen.',
    criteria: ['Verteilungsanalyse mind. 5 Dimensionen', 'Lücken dokumentiert', 'Mitigation festgelegt'],
    effort: '20-30h', priority: 'P1' },
  { id: 'A11-1', article: 'Art. 11', name: 'Technische Dokumentation (Anhang IV)', status: 'partial',
    gap: 'Modellbeschreibung vorhanden, aber Anhang-IV-Vollständigkeit nicht geprüft.',
    evidence: 'Model Card existiert, jedoch fehlen u.a. Sicherheitsmaßnahmen-Beschreibung und Cybersecurity-Annexe.',
    rationale: 'Teilweise erfüllt: Art. 11 verlangt vollständige Anhang-IV-konforme Dokumentation.',
    measure: 'Anhang-IV-Checkliste durchgehen, fehlende Abschnitte ergänzen.',
    criteria: ['Anhang-IV-Mapping vorhanden', 'Alle 9 Abschnitte abgedeckt', 'Versionierung etabliert'],
    effort: '25-40h', priority: 'P1' },
  { id: 'A12-1', article: 'Art. 12', name: 'Aufzeichnungen und Logging-Pflichten', status: 'fail',
    gap: 'Logging unvollständig — Modell-Outputs nicht ausreichend retentiert.',
    evidence: 'Logging-Audit: Inputs ja, Outputs nur 7 Tage. Keine Modell-/Datensatz-Identifikatoren.',
    rationale: 'Nicht erfüllt: Art. 12 verlangt automatische Aufzeichnung über die gesamte Lebensdauer mit angemessener Retention.',
    measure: 'Vollständiges Logging implementieren (Input, Output, Modell-ID, Timestamp), Retention auf min. 6 Monate.',
    criteria: ['Output-Retention >= 6 Monate', 'Modell-ID in jedem Log-Eintrag', 'Manipulationssichere Speicherung'],
    effort: '30-50h', priority: 'P0' },
  { id: 'A13-1', article: 'Art. 13', name: 'Transparenz und Nutzerinformation', status: 'partial',
    gap: 'Gebrauchsanweisung vorhanden, aber unvollständige Angaben zu Genauigkeit und bekannten Limitationen.',
    evidence: 'User Guide enthält Funktionsbeschreibung, jedoch keine Performance-Metriken pro Eingabesegment.',
    rationale: 'Teilweise erfüllt: Art. 13 Abs. 3 verlangt Informationen über Genauigkeit, Robustheit und Limitationen.',
    measure: 'Gebrauchsanweisung um Performance-Metriken und Limitationen je Anwendungsbereich erweitern.',
    criteria: ['Genauigkeitsmetriken pro Segment', 'Limitationen explizit benannt', 'Reviewzyklus definiert'],
    effort: '15-25h', priority: 'P2' },
  { id: 'A14-1', article: 'Art. 14', name: 'Wirksame menschliche Aufsicht', status: 'fail',
    gap: 'Keine dokumentierte menschliche Aufsicht über kritische Entscheidungen.',
    evidence: 'Workflow-Analyse: 92% Vollautomatisierung, kein Eskalationspfad, keine Aufsichtsdokumentation.',
    rationale: 'Nicht erfüllt: Art. 14 verlangt wirksame Aufsicht durch natürliche Personen mit Eingriffsmöglichkeit.',
    measure: 'Human-in-the-loop für kritische Entscheidungspfade einführen, Aufsichtsmaßnahmen dokumentieren.',
    criteria: ['Human-Review für High-Stakes-Entscheidungen', 'Eingriffsmöglichkeit implementiert', 'Schulung der Aufsichtspersonen'],
    effort: '40-60h', priority: 'P0' },
  { id: 'A15-1', article: 'Art. 15 Abs. 1', name: 'Genauigkeit über den Lebenszyklus', status: 'partial',
    gap: 'Initial-Evaluation vorhanden, aber kein kontinuierliches Monitoring.',
    evidence: 'Eval-Report aus 2024 vorhanden, keine produktive Performance-Überwachung, kein Drift-Detection.',
    rationale: 'Teilweise erfüllt: Art. 15 Abs. 1 verlangt konsistente Genauigkeit über den gesamten Lebenszyklus.',
    measure: 'Production-Monitoring mit Drift-Detection und Re-Validierungs-Trigger einführen.',
    criteria: ['Drift-Detection aktiv', 'Re-Validierungs-SLA definiert', 'Alarme auf Performance-Degradation'],
    effort: '30-45h', priority: 'P1' },
  { id: 'A15-4', article: 'Art. 15 Abs. 4', name: 'Robustheit gegen adversariale Eingaben', status: 'fail',
    gap: 'Keine Adversarial-Robustness-Tests, keine Input-Sanitisierung in Produktion.',
    evidence: 'Sicherheitstests fehlen vollständig. POC-Adversarial-Angriff erfolgreich in 67% der Fälle.',
    rationale: 'Nicht erfüllt: Art. 15 Abs. 4 verlangt Robustheit gegen Fehler, Inkonsistenzen und unerwartete Situationen.',
    measure: 'Adversarial-Robustness-Tests etablieren, Input-Sanitisierung implementieren.',
    criteria: ['Robustheits-Benchmark dokumentiert', 'Input-Validierung produktiv', 'Quartalsweise Tests'],
    effort: '35-55h', priority: 'P0' },
  { id: 'A15-5', article: 'Art. 15 Abs. 5', name: 'Cybersicherheit der KI-Systeme', status: 'fail',
    gap: 'Prompt-Injection-Schutz fehlt, keine Output-Filterung, keine Threat-Modeling.',
    evidence: 'Pentest: 8/10 OWASP-LLM-Tests erfolgreich. Keine Threat-Model-Dokumentation.',
    rationale: 'Nicht erfüllt: Art. 15 Abs. 5 verlangt Schutz gegen unbefugte Veränderungen und Angriffe (Data Poisoning, Model Evasion, Adversarial Examples).',
    measure: 'Threat-Modeling, Input-Sanitisierung, Output-Filterung, Model-Inversion-Schutz einführen.',
    criteria: ['Threat-Model dokumentiert', 'OWASP-LLM-Top-10 abgedeckt', 'Pentest erfolgreich bestanden'],
    effort: '40-60h', priority: 'P0' },
  { id: 'A17-1', article: 'Art. 17', name: 'Qualitätsmanagementsystem (QMS)', status: 'partial',
    gap: 'ISO-9001-QMS vorhanden, aber AI-Act-spezifische Erweiterungen fehlen.',
    evidence: 'QMS deckt Standardprozesse ab, jedoch keine MLOps-Verfahren, keine Modell-Versionierungs-Policy.',
    rationale: 'Teilweise erfüllt: Art. 17 verlangt explizit AI-spezifische QMS-Elemente (z.B. Datenmanagement, Risikomanagement).',
    measure: 'QMS um AI-spezifische Verfahren ergänzen (Modell-Versionierung, Eval-Protokolle).',
    criteria: ['MLOps-Verfahren dokumentiert', 'Modell-Versionierungs-Policy', 'Audit-Trail vorhanden'],
    effort: '30-45h', priority: 'P1' },
  { id: 'A26-1', article: 'Art. 26', name: 'Pflichten der Betreiber', status: 'partial',
    gap: 'Betreiberpflichten teilweise umgesetzt — Aufsichtsperson benannt, aber Monitoring lückenhaft.',
    evidence: 'Aufsichtsperson dokumentiert, jedoch keine systematische Erfassung schwerwiegender Vorfälle.',
    rationale: 'Teilweise erfüllt: Art. 26 verlangt aktives Monitoring und Meldung schwerwiegender Vorfälle.',
    measure: 'Vorfalls-Monitoring etablieren, Eskalation an Anbieter und Behörden sicherstellen.',
    criteria: ['Vorfalls-Register aktiv', 'Eskalationsprozess dokumentiert', 'Quartalsweises Reporting'],
    effort: '20-30h', priority: 'P1' },
  { id: 'A50-1', article: 'Art. 50 Abs. 1', name: 'Transparenz bei KI-Interaktion', status: 'fail',
    gap: 'Chatbot kennzeichnet KI-Natur nicht.',
    evidence: 'UI-Audit: Begrüßung enthält keinen Hinweis auf KI-Natur, kein Disclaimer.',
    rationale: 'Nicht erfüllt: Art. 50 Abs. 1 verlangt explizite Kenntlichmachung der KI-Interaktion.',
    measure: 'Klare Kenntlichmachung in UI integrieren ("Sie chatten mit einer KI").',
    criteria: ['Kenntlichmachung an erster Interaktionsstelle', 'Mehrsprachig', 'Zugänglich'],
    effort: '4-8h', priority: 'P0' },
  { id: 'A50-2', article: 'Art. 50 Abs. 2', name: 'Kennzeichnung synthetischer Inhalte', status: 'fail',
    gap: 'Generierte Bilder/Audio/Video ohne Wasserzeichen oder Maschinen-Markierung.',
    evidence: 'Output-Pipeline ohne C2PA oder vergleichbares Wasserzeichen.',
    rationale: 'Nicht erfüllt: Art. 50 Abs. 2 verlangt maschinenlesbare Kennzeichnung.',
    measure: 'C2PA-Wasserzeichen integrieren, sichtbare Hinweise bei Deepfake-Risiko ergänzen.',
    criteria: ['C2PA-Konformität', 'Sichtbarer Hinweis bei Deepfakes', 'API-Dokumentation aktualisiert'],
    effort: '15-25h', priority: 'P0' },
  { id: 'A53-1', article: 'Art. 53', name: 'GPAI-Modell-Dokumentation', status: 'partial',
    gap: 'Modellbeschreibung vorhanden, aber Anhang-XI-Anforderungen nicht vollständig adressiert (z.B. Trainings-Footprint).',
    evidence: 'Model Card existiert, jedoch ohne Annex-XI-Abschnitte Trainingsenergie und Daten-Zusammenfassung.',
    rationale: 'Teilweise erfüllt: Art. 53 + Annex XI verlangen detaillierte GPAI-Dokumentation.',
    measure: 'Annex-XI-Mapping erstellen, Trainingsenergie und Daten-Zusammenfassung ergänzen.',
    criteria: ['Annex-XI-Vollständigkeit', 'Trainings-Footprint dokumentiert', 'Daten-Zusammenfassung publiziert'],
    effort: '20-35h', priority: 'P1' },
];

// EN/FR shorter translations
export const AI_ACT_REQS_EN: Record<string, Partial<AiActReq>> = {
  'A09-1': { name: 'Risk management system for high-risk AI', gap: 'No documented, continuous risk management system per Art. 9.', measure: 'Establish RMS per Art. 9, link to lifecycle, introduce semi-annual reviews.', rationale: 'Not fulfilled: Art. 9 requires iterative, documented RMS over the entire lifecycle.', evidence: 'Process review: ad-hoc 2024 risk analysis, no iterative lifecycle, no update after model changes.', criteria: ['RMS procedure documented', 'Iteration cycle defined', 'Risk register actively maintained'] },
  'A10-1': { name: 'Data governance — bias tests', gap: 'No bias tests per Art. 10(2)(f) performed or documented.', measure: 'Introduce bias test pipeline, version results.', rationale: 'Not fulfilled: Art. 10(2) explicitly requires bias identification and mitigation.', evidence: 'Datasheet: no representativeness analysis, no disparity metrics.', criteria: ['Disparate-impact metric < 0.8 documented', 'Mitigation strategy implemented', 'Test integrated in CI/CD'] },
  'A10-2': { name: 'Data quality — relevant, representative, complete', gap: 'Datasheet present, but representativeness evidence is partial.', measure: 'Add representativeness report with demographic distribution analysis.', rationale: 'Partially fulfilled.', evidence: 'Datasheet describes sources without distribution analysis.', criteria: ['Distribution analysis ≥ 5 dimensions', 'Gaps documented', 'Mitigation defined'] },
  'A11-1': { name: 'Technical documentation (Annex IV)', gap: 'Model description present, but Annex IV completeness not verified.', measure: 'Walk through Annex IV checklist, complete missing sections.', rationale: 'Partially fulfilled.', evidence: 'Model card exists, missing security and cybersecurity annexes.', criteria: ['Annex IV mapping present', 'All 9 sections covered', 'Versioning established'] },
  'A12-1': { name: 'Record-keeping and logging obligations', gap: 'Logging incomplete — model outputs not retained sufficiently.', measure: 'Implement full logging, retention ≥ 6 months.', rationale: 'Not fulfilled.', evidence: 'Logging audit: inputs yes, outputs only 7 days.', criteria: ['Output retention ≥ 6 months', 'Model ID in each log entry', 'Tamper-evident storage'] },
  'A13-1': { name: 'Transparency and user information', gap: 'Instructions for use lack accuracy and known limitations.', measure: 'Extend instructions with performance metrics and limitations.', rationale: 'Partially fulfilled.', evidence: 'User guide describes function but no per-segment metrics.', criteria: ['Per-segment accuracy metrics', 'Limitations explicit', 'Review cycle defined'] },
  'A14-1': { name: 'Effective human oversight', gap: 'No documented human oversight over critical decisions.', measure: 'Introduce human-in-the-loop for critical decision paths.', rationale: 'Not fulfilled.', evidence: '92% full automation, no escalation path.', criteria: ['Human review for high-stakes decisions', 'Intervention capability', 'Oversight personnel trained'] },
  'A15-1': { name: 'Accuracy across the lifecycle', gap: 'Initial eval present, but no continuous monitoring.', measure: 'Introduce production monitoring with drift detection.', rationale: 'Partially fulfilled.', evidence: '2024 eval report, no production monitoring.', criteria: ['Drift detection active', 'Re-validation SLA defined', 'Performance alerts'] },
  'A15-4': { name: 'Robustness against adversarial inputs', gap: 'No adversarial robustness tests.', measure: 'Establish adversarial robustness tests, implement input sanitisation.', rationale: 'Not fulfilled.', evidence: 'POC adversarial attack succeeds in 67% of test cases.', criteria: ['Robustness benchmark documented', 'Input validation in production', 'Quarterly tests'] },
  'A15-5': { name: 'Cybersecurity of AI systems', gap: 'No prompt-injection protection.', measure: 'Threat modelling, input sanitisation, output filtering.', rationale: 'Not fulfilled.', evidence: 'Pentest: 8/10 OWASP LLM tests succeed.', criteria: ['Threat model documented', 'OWASP LLM Top 10 covered', 'Pentest passed'] },
  'A17-1': { name: 'Quality management system (QMS)', gap: 'ISO 9001 QMS present, but AI-specific extensions missing.', measure: 'Extend QMS with AI-specific procedures.', rationale: 'Partially fulfilled.', evidence: 'QMS covers standard processes only.', criteria: ['MLOps procedures documented', 'Model versioning policy', 'Audit trail present'] },
  'A26-1': { name: 'Deployer obligations', gap: 'Oversight person designated, monitoring incomplete.', measure: 'Establish incident monitoring, escalation to provider and authority.', rationale: 'Partially fulfilled.', evidence: 'Oversight person documented, no systematic incident capture.', criteria: ['Incident register active', 'Escalation process documented', 'Quarterly reporting'] },
  'A50-1': { name: 'Transparency for AI interaction', gap: 'Chatbot does not disclose AI nature.', measure: 'Integrate clear disclosure in UI.', rationale: 'Not fulfilled.', evidence: 'UI audit: no disclaimer.', criteria: ['Disclosure at first interaction', 'Multilingual', 'Accessible'] },
  'A50-2': { name: 'Labelling of synthetic content', gap: 'Generated media without watermark or machine marking.', measure: 'Integrate C2PA watermark.', rationale: 'Not fulfilled.', evidence: 'Output pipeline without C2PA.', criteria: ['C2PA conformance', 'Visible deepfake notice', 'API documentation updated'] },
  'A53-1': { name: 'GPAI model documentation', gap: 'Annex XI requirements not fully addressed.', measure: 'Add Annex XI mapping including training footprint.', rationale: 'Partially fulfilled.', evidence: 'Model card lacks Annex XI sections.', criteria: ['Annex XI completeness', 'Training footprint documented', 'Data summary published'] },
};
export const AI_ACT_REQS_FR: Record<string, Partial<AiActReq>> = {
  'A09-1': { name: 'Système de gestion des risques pour IA à haut risque', gap: 'Aucun système de gestion des risques continu et documenté selon Art. 9.', measure: 'Établir un SGR conformément à l\'Art. 9.', rationale: 'Non rempli.', evidence: 'Analyse de risque ponctuelle 2024.', criteria: ['Procédure SGR documentée', 'Cycle d\'itération défini', 'Registre des risques actif'] },
  'A10-1': { name: 'Gouvernance des données — tests de biais', gap: 'Aucun test de biais selon Art. 10(2)(f).', measure: 'Introduire pipeline de tests de biais.', rationale: 'Non rempli.', evidence: 'Pas d\'analyse de représentativité.', criteria: ['Métrique disparate-impact < 0,8', 'Stratégie d\'atténuation', 'Test CI/CD'] },
  'A10-2': { name: 'Qualité des données — pertinent, représentatif, complet', gap: 'Datasheet présent mais preuve de représentativité partielle.', measure: 'Ajouter rapport de représentativité.', rationale: 'Partiellement rempli.', evidence: 'Datasheet sans analyse de distribution.', criteria: ['Analyse ≥ 5 dimensions', 'Lacunes documentées', 'Atténuation définie'] },
  'A11-1': { name: 'Documentation technique (Annexe IV)', gap: 'Description du modèle présente mais complétude Annexe IV non vérifiée.', measure: 'Compléter la checklist Annexe IV.', rationale: 'Partiellement rempli.', evidence: 'Model card incomplète.', criteria: ['Mapping Annexe IV', '9 sections couvertes', 'Versioning établi'] },
  'A12-1': { name: 'Enregistrements et journalisation', gap: 'Journalisation incomplète — sorties non retenues.', measure: 'Mettre en œuvre journalisation complète, rétention ≥ 6 mois.', rationale: 'Non rempli.', evidence: 'Sorties 7 jours seulement.', criteria: ['Rétention ≥ 6 mois', 'ID modèle dans chaque entrée', 'Stockage inviolable'] },
  'A13-1': { name: 'Transparence et information utilisateur', gap: 'Notice d\'utilisation incomplète sur précision et limitations.', measure: 'Étendre la notice avec métriques et limitations.', rationale: 'Partiellement rempli.', evidence: 'Guide utilisateur sans métriques par segment.', criteria: ['Métriques par segment', 'Limitations explicites', 'Cycle de revue'] },
  'A14-1': { name: 'Surveillance humaine effective', gap: 'Aucune surveillance humaine documentée.', measure: 'Introduire human-in-the-loop.', rationale: 'Non rempli.', evidence: '92% d\'automatisation.', criteria: ['Revue humaine pour décisions critiques', 'Intervention possible', 'Personnel formé'] },
  'A15-1': { name: 'Précision sur le cycle de vie', gap: 'Évaluation initiale mais pas de monitoring continu.', measure: 'Monitoring de production avec drift-detection.', rationale: 'Partiellement rempli.', evidence: 'Eval 2024, pas de production monitoring.', criteria: ['Drift detection actif', 'SLA de re-validation', 'Alertes performance'] },
  'A15-4': { name: 'Robustesse face aux entrées adversariales', gap: 'Aucun test de robustesse adversariale.', measure: 'Établir tests de robustesse.', rationale: 'Non rempli.', evidence: 'Attaque réussit dans 67% des cas.', criteria: ['Benchmark documenté', 'Validation entrées en production', 'Tests trimestriels'] },
  'A15-5': { name: 'Cybersécurité des systèmes IA', gap: 'Pas de protection contre prompt injection.', measure: 'Threat modelling et sanitisation.', rationale: 'Non rempli.', evidence: 'Pentest: 8/10 OWASP LLM réussis.', criteria: ['Threat model documenté', 'OWASP LLM Top 10 couvert', 'Pentest passé'] },
  'A17-1': { name: 'Système de gestion de la qualité (SMQ)', gap: 'SMQ ISO 9001 présent mais sans extensions IA.', measure: 'Étendre le SMQ.', rationale: 'Partiellement rempli.', evidence: 'SMQ standard.', criteria: ['Procédures MLOps', 'Politique de versioning', 'Piste d\'audit'] },
  'A26-1': { name: 'Obligations des déployeurs', gap: 'Personne responsable désignée mais monitoring lacunaire.', measure: 'Établir le monitoring d\'incidents.', rationale: 'Partiellement rempli.', evidence: 'Pas de capture systématique.', criteria: ['Registre actif', 'Processus d\'escalade', 'Reporting trimestriel'] },
  'A50-1': { name: 'Transparence d\'interaction IA', gap: 'Chatbot ne révèle pas sa nature IA.', measure: 'Intégrer une mention claire.', rationale: 'Non rempli.', evidence: 'Aucune mention dans l\'UI.', criteria: ['Mention dès la 1re interaction', 'Multilingue', 'Accessible'] },
  'A50-2': { name: 'Étiquetage du contenu synthétique', gap: 'Médias sans tatouage.', measure: 'Intégrer un tatouage C2PA.', rationale: 'Non rempli.', evidence: 'Pipeline sans C2PA.', criteria: ['Conformité C2PA', 'Mention deepfake visible', 'API documentée'] },
  'A53-1': { name: 'Documentation de modèle GPAI', gap: 'Exigences Annexe XI non couvertes.', measure: 'Ajouter mapping Annexe XI.', rationale: 'Partiellement rempli.', evidence: 'Model card sans sections Annexe XI.', criteria: ['Complétude Annexe XI', 'Empreinte d\'entraînement', 'Résumé de données publié'] },
};

// ── Demo Scenarios ──────────────────────────────────────────────
export interface AiActDemoScenario {
  entity: { name: string; role: string[] };
  systemName: string;
  systemPurpose: string;
  domain: string;
  annexIII: string[];
  prohibitedFlags: string[];
  isGpai: boolean;
  flopsThreshold: boolean;
  realtimeBiometricsPublic: boolean;
  affectsFundamentalRights: boolean;
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const AI_ACT_DEMO_SCENARIOS: AiActDemoScenario[] = [
  {
    entity: { name: 'KreditScore Plus GmbH', role: ['provider'] },
    systemName: 'CreditDecide AI v3.2',
    systemPurpose: 'Automatisierte Bonitätsbewertung für Konsumentenkredite — Empfehlung Annahme/Ablehnung mit Risikoscore.',
    domain: 'Finanzdienstleistungen / Retail Banking',
    annexIII: ['essential_services'],
    prohibitedFlags: [],
    isGpai: false, flopsThreshold: false, realtimeBiometricsPublic: false, affectsFundamentalRights: true,
    measures: {
      risk_mgmt: { active: true, documented: true, audited: false, certified: false },
      data_governance: { active: true, documented: true, audited: false, certified: false },
      tech_doc: { active: true, documented: true, audited: false, certified: false },
      logging: { active: true, documented: false, audited: false, certified: false },
      transparency: { active: true, documented: true, audited: false, certified: false },
      human_oversight: { active: false, documented: false, audited: false, certified: false },
      qms: { active: true, documented: true, audited: true, certified: true },
    },
    knownIssues: 'Keine systematischen Bias-Tests. Modell-Inversion-Risiko nicht bewertet. Vollautomatisierung ohne Human-in-the-loop.',
    files: [
      { name: 'CreditDecide_TechDoc_v3.2.pdf', size: 2_300_000, type: 'tech_doc' },
      { name: 'CreditDecide_DataCard.pdf', size: 720_000, type: 'data_card' },
      { name: 'CreditDecide_ModelCard.md', size: 95_000, type: 'model_card' },
    ],
  },
  {
    entity: { name: 'MediVision Imaging AG', role: ['provider', 'deployer'] },
    systemName: 'RadiologyAssist Pro',
    systemPurpose: 'Diagnostische Unterstützung in der Radiologie — Detektion von Auffälligkeiten in CT-/MRT-Bildern als Sicherheitskomponente eines Medizinprodukts.',
    domain: 'Medizintechnik / Bildgebende Diagnostik',
    annexIII: ['product_safety'],
    prohibitedFlags: [],
    isGpai: false, flopsThreshold: false, realtimeBiometricsPublic: false, affectsFundamentalRights: true,
    measures: {
      risk_mgmt: { active: true, documented: true, audited: true, certified: false },
      data_governance: { active: true, documented: true, audited: true, certified: false },
      tech_doc: { active: true, documented: true, audited: true, certified: true },
      logging: { active: true, documented: true, audited: false, certified: false },
      transparency: { active: true, documented: true, audited: false, certified: false },
      human_oversight: { active: true, documented: true, audited: false, certified: false },
      accuracy: { active: true, documented: true, audited: true, certified: false },
      qms: { active: true, documented: true, audited: true, certified: true },
      conformity: { active: true, documented: true, audited: false, certified: false },
      post_market: { active: true, documented: true, audited: false, certified: false },
    },
    knownIssues: 'Drift-Detection in Produktion noch nicht etabliert. Adversarial-Robustness-Tests stehen aus.',
    files: [
      { name: 'RadiologyAssist_TechDoc_AnnexIV.pdf', size: 4_100_000, type: 'tech_doc' },
      { name: 'RadiologyAssist_RMS_v2.pdf', size: 1_200_000, type: 'risk_mgmt_plan' },
      { name: 'RadiologyAssist_DPIA_2025.pdf', size: 850_000, type: 'dpia' },
    ],
  },
  {
    entity: { name: 'OmniLLM Foundation Labs', role: ['provider'] },
    systemName: 'OmniBase-7T',
    systemPurpose: 'Allgemein einsetzbares Sprachmodell (GPAI) für Downstream-Anwendungen, trainiert mit ca. 5×10²⁵ FLOPs.',
    domain: 'Foundation Models / Generative AI',
    annexIII: [],
    prohibitedFlags: [],
    isGpai: true, flopsThreshold: true, realtimeBiometricsPublic: false, affectsFundamentalRights: false,
    measures: {
      risk_mgmt: { active: true, documented: true, audited: false, certified: false },
      data_governance: { active: true, documented: false, audited: false, certified: false },
      tech_doc: { active: true, documented: true, audited: false, certified: false },
      gpai_doc: { active: true, documented: true, audited: false, certified: false },
      transparency: { active: true, documented: false, audited: false, certified: false },
      accuracy: { active: true, documented: true, audited: false, certified: false },
    },
    knownIssues: 'Daten-Zusammenfassung gemäß Annex XI nicht publiziert. Trainings-Footprint nicht offengelegt. C2PA-Wasserzeichen für synthetische Outputs fehlt.',
    files: [
      { name: 'OmniBase_ModelCard.md', size: 180_000, type: 'model_card' },
      { name: 'OmniBase_EvalReport.pdf', size: 1_900_000, type: 'model_card' },
    ],
  },
  {
    entity: { name: 'CityWatch Public Safety', role: ['deployer'] },
    systemName: 'StreetScan-RT',
    systemPurpose: 'Echtzeit-Erkennung gesuchter Personen mittels biometrischer Identifikation auf öffentlichen Plätzen.',
    domain: 'Öffentliche Sicherheit / Strafverfolgung',
    annexIII: ['biometrics', 'law_enforcement'],
    prohibitedFlags: ['realtime_rbi'],
    isGpai: false, flopsThreshold: false, realtimeBiometricsPublic: true, affectsFundamentalRights: true,
    measures: {
      risk_mgmt: { active: false, documented: false, audited: false, certified: false },
      data_governance: { active: true, documented: false, audited: false, certified: false },
      human_oversight: { active: true, documented: false, audited: false, certified: false },
    },
    knownIssues: 'Echtzeit-Fernidentifizierung im öffentlichen Raum ist grundsätzlich verboten (Art. 5). Ausnahmen nur unter strengen Voraussetzungen.',
    files: [
      { name: 'StreetScan_Concept.pdf', size: 540_000, type: 'tech_doc' },
    ],
  },
];
