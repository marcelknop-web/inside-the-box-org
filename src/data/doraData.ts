// ── DORA Compliance Tool Constants & Demo Data (i18n-aware) ─────────────
// Based on Regulation (EU) 2022/2554 — Digital Operational Resilience Act

type T = (key: string) => string;

// ── Entity Types ───────────────────────────────────────────────
const ET_KEYS = ['bank', 'insurance', 'payment', 'crypto', 'fund', 'ict_provider'] as const;
const ET_ICONS = ['🏦', '🛡️', '💳', '₿', '📈', '🖥️'];
const ET_T_KEYS = ['etBank', 'etInsurance', 'etPayment', 'etCrypto', 'etFund', 'etIctProvider'];
const ET_DESC_KEYS = ['etBankDesc', 'etInsuranceDesc', 'etPaymentDesc', 'etCryptoDesc', 'etFundDesc', 'etIctProviderDesc'];

export function getEntityTypes(t: T) {
  return ET_KEYS.map((id, i) => ({
    id,
    label: t(`dora.${ET_T_KEYS[i]}`),
    icon: ET_ICONS[i],
    desc: t(`dora.${ET_DESC_KEYS[i]}`),
  }));
}

// ── DORA Criticality Levels ─────────────────────────────────────
const CRIT_IDS = ['standard', 'significant', 'critical'] as const;
const CRIT_COLORS = [
  'border-green-500 bg-green-500/10 text-green-400',
  'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  'border-destructive bg-destructive/10 text-destructive',
];
const CRIT_KEYS = ['critStandard', 'critSignificant', 'critCritical'];

export function getCriticalityLevels(t: T) {
  return CRIT_IDS.map((id, i) => ({
    id,
    label: t(`dora.${CRIT_KEYS[i]}`),
    color: CRIT_COLORS[i],
    desc: t(`dora.${CRIT_KEYS[i]}Desc`),
  }));
}

// ── ICT Infrastructure Options ──────────────────────────────────
const INFRA_IDS = ['core_banking', 'trading', 'payment_proc', 'cloud', 'data_center', 'network', 'endpoints', 'mobile'] as const;
const INFRA_ICONS = ['🏦', '📊', '💳', '☁️', '🏢', '🌐', '🖥️', '📱'];
const INFRA_KEYS = ['infraCoreBanking', 'infraTrading', 'infraPayment', 'infraCloud', 'infraDataCenter', 'infraNetwork', 'infraEndpoints', 'infraMobile'];

export function getInfraOpts(t: T) {
  return INFRA_IDS.map((id, i) => ({
    id,
    label: t(`dora.${INFRA_KEYS[i]}`),
    icon: INFRA_ICONS[i],
  }));
}

// ── Third-Party ICT Provider Categories ────────────────────────
export const THIRD_PARTY_OPTS = [
  { label: 'Cloud Service Provider (IaaS/PaaS/SaaS)', icon: '☁️' },
  { label: 'Core Banking Provider', icon: '🏦' },
  { label: 'Payment Processor', icon: '💳' },
  { label: 'Market Data Provider', icon: '📊' },
  { label: 'Network/Telecom Provider', icon: '🌐' },
  { label: 'Security Service Provider (SOC/SIEM)', icon: '🛡️' },
  { label: 'Software Vendor (ERP/CRM)', icon: '💻' },
  { label: 'Data Center Operator', icon: '🏢' },
  { label: 'IT Outsourcing Provider', icon: '🔧' },
] as const;

// ── ICT Risk Management Measures ────────────────────────────────
const RM_IDS = ['ict_risk_framework', 'ict_asset_mgmt', 'ict_config_mgmt', 'encryption', 'network_sec', 'access_control', 'patch_mgmt', 'logging', 'incident_mgmt', 'bcm', 'backup', 'drp', 'change_mgmt', 'testing', 'awareness'] as const;
const RM_LABEL_KEYS = ['rmIctRisk', 'rmAssetMgmt', 'rmConfigMgmt', 'rmEncryption', 'rmNetworkSec', 'rmAccessControl', 'rmPatchMgmt', 'rmLogging', 'rmIncidentMgmt', 'rmBcm', 'rmBackup', 'rmDrp', 'rmChangeMgmt', 'rmTesting', 'rmAwareness'];
const RM_CAT_KEYS = ['catGovernance', 'catGovernance', 'catGovernance', 'catProtection', 'catProtection', 'catProtection', 'catProtection', 'catDetection', 'catResponse', 'catRecovery', 'catRecovery', 'catRecovery', 'catOps', 'catOps', 'catOps'];

export function getRiskMeasures(t: T) {
  return RM_IDS.map((id, i) => ({
    id,
    label: t(`dora.${RM_LABEL_KEYS[i]}`),
    cat: t(`dora.${RM_CAT_KEYS[i]}`),
  }));
}

export function getRiskCategories(t: T) {
  return [...new Set(getRiskMeasures(t).map(m => m.cat))];
}

// ── Attach Types ────────────────────────────────────────────────
const ATT_IDS = ['ict_risk_policy', 'bcp', 'incident_plan', 'third_party_register', 'test_report', 'other'] as const;
const ATT_ICONS = ['📋', '🔄', '🚨', '📦', '🔍', '📎'];
const ATT_ACCEPTS = ['.pdf,.docx', '.pdf,.docx', '.pdf,.docx', '.xlsx,.csv,.pdf', '.pdf,.docx', '*'];
const ATT_KEYS = ['attIctRiskPolicy', 'attBcp', 'attIncidentPlan', 'attThirdPartyRegister', 'attTestReport', 'attOther'];

export function getAttachTypes(t: T) {
  return ATT_IDS.map((id, i) => ({
    id,
    label: t(`dora.${ATT_KEYS[i]}`),
    icon: ATT_ICONS[i],
    accept: ATT_ACCEPTS[i],
  }));
}

// ── Types ───────────────────────────────────────────────────────

export interface DoraRisk {
  id: number;
  category: string; // ICT risk category: 'C' confidentiality, 'I' integrity, 'A' availability, 'G' governance, 'T' third-party, 'R' resilience
  name: string;
  component: string;
  attacker: string;
  path: string;
  doraRef: string; // DORA article reference
  likelihood: number;
  impact: number;
  evidence: string;
  rationale: string;
  sources: string[];
  evidenceQuality: number;
  reproducibility: string;
}

export function riskId(r: DoraRisk): string {
  return `${r.category}-${String(r.id).padStart(3, '0')}`;
}

export interface DoraReq {
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

export interface MeasureEntry {
  active: boolean;
  documented: boolean;
  audited: boolean;
}

export interface DoraIntakeData {
  entityName: string;
  entityType: string[];
  criticality: string;
  description: string;
  infrastructure: string[];
  thirdPartyProviders: string[];
  roles: string[];
  customRole: string;
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: DoraIntakeData = {
  entityName: '', entityType: [], criticality: '',
  description: '', infrastructure: [],
  thirdPartyProviders: [], roles: [], customRole: '',
  measures: {}, knownIssues: '', files: [],
};

// ── Risk Categories (like STRIDE but for DORA) ─────────────────
export const RISK_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  C: { label: { de: 'Vertraulichkeit', en: 'Confidentiality', fr: 'Confidentialité' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  I: { label: { de: 'Integrität', en: 'Integrity', fr: 'Intégrité' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  A: { label: { de: 'Verfügbarkeit', en: 'Availability', fr: 'Disponibilité' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  G: { label: { de: 'Governance', en: 'Governance', fr: 'Gouvernance' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  T: { label: { de: 'Drittanbieter', en: 'Third-Party', fr: 'Tiers' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  R: { label: { de: 'Resilienz', en: 'Resilience', fr: 'Résilience' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
};

// ── Demo Risks (14 risks across all 6 categories) ──────────────

export const DORA_RISKS: DoraRisk[] = [
  // C — Confidentiality (2)
  { id: 1, category: 'C', name: 'Unverschlüsselte interne Kommunikation zwischen Kernbanksystemen', component: 'Core-Banking-Netzwerk', attacker: 'Interner Angreifer / Netzwerk-Mitleser', path: 'Laterale Kommunikation zwischen Applikationsservern ohne TLS → Transaktionsdaten im Klartext → Datenabfluss', doraRef: 'Art. 8', likelihood: 4, impact: 5,
    evidence: 'Netzwerkmitschnitt (Wireshark): TCP-Verbindungen zwischen App-Server 10.0.1.10 und DB-Server 10.0.1.20 auf Port 1521 ohne TLS-Verschlüsselung. Transaktionsdaten (IBAN, Betrag, Verwendungszweck) im Klartext sichtbar. Pcap-Datei dokumentiert.',
    rationale: 'Likelihood 4: Zugang zum internen Netzwerk für Mitarbeiter und Dienstleister Standard. TLS-Konfiguration auf internen Verbindungen häufig vernachlässigt. Impact 5: Kundentransaktionsdaten sind regulatorisch geschützt (DSGVO Art. 32, DORA Art. 9). Offenlegung führt zu Meldepflicht und Reputationsschaden.',
    sources: ['DORA Art. 9 Abs. 2: Schutz von Informationsaktiva', 'EBA-Leitlinie zu IKT-Sicherheitsrisiken (EBA/GL/2019/04)'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, category: 'C', name: 'Unzureichender Zugriffsschutz auf Kundendaten-API', component: 'Online-Banking API', attacker: 'Authentifizierter Nutzer', path: 'IDOR-Schwachstelle in REST-API → Zugriff auf fremde Kontodaten durch Manipulation der Account-ID', doraRef: 'Art. 9 Abs. 4', likelihood: 4, impact: 4,
    evidence: 'API-Test: GET /api/v1/accounts/{id}/transactions — Änderung der Account-ID von eigener (ACC-123) auf fremde (ACC-456) liefert Transaktionsdaten eines anderen Kunden. Kein serverseitiger Ownership-Check.',
    rationale: 'Likelihood 4: Standard-Tooling (Browser DevTools, Postman) genügt. Impact 4: Offenlegung fremder Kontodaten, DSGVO-Verstoß, Kundenvertrauen beschädigt.',
    sources: ['OWASP API Security Top 10 — API1: Broken Object Level Authorization', 'DORA Art. 9 Abs. 4: Zugangskontrollmechanismen'], evidenceQuality: 4, reproducibility: 'easy' },

  // I — Integrity (2)
  { id: 3, category: 'I', name: 'Fehlende Integritätsprüfung bei Batch-Zahlungsdateien', component: 'Zahlungsverkehr-System', attacker: 'Insider / Supply-Chain-Angreifer', path: 'Batch-Dateien (SEPA XML) ohne Signaturprüfung verarbeitet → Manipulation von Zahlungsaufträgen möglich', doraRef: 'Art. 9 Abs. 4', likelihood: 3, impact: 5,
    evidence: 'Prozessanalyse: SEPA-XML-Batch-Dateien werden über SFTP empfangen und ohne kryptografische Signaturprüfung direkt in das Zahlungsverkehr-System eingelesen. Modifizierte Testdatei (geänderter IBAN und Betrag) wurde erfolgreich verarbeitet.',
    rationale: 'Likelihood 3: Erfordert Zugang zum SFTP-Server oder Kompromittierung der Upload-Kette. Impact 5: Direkte finanzielle Verluste durch manipulierte Zahlungsaufträge. Regulatorische Konsequenzen (PSD2, DORA).',
    sources: ['DORA Art. 9 Abs. 4 lit. d: Datenintegrität', 'PSD2 Art. 95: Sicherheitsanforderungen'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 4, category: 'I', name: 'Keine Tamper-Protection für Audit-Logs', component: 'SIEM / Logging-Infrastruktur', attacker: 'Privilegierter Insider', path: 'Admin-Zugang zu Log-Servern → Manipulation oder Löschung von Audit-Trails → Forensik unmöglich', doraRef: 'Art. 12', likelihood: 3, impact: 4,
    evidence: 'Konfigurationsanalyse: Audit-Logs werden lokal auf dem Applikationsserver gespeichert (rsyslog, /var/log/audit/). Root-Zugang ermöglicht Modifikation. Kein Write-Once-Medium, kein WORM-Storage, keine kryptografische Verkettung.',
    rationale: 'Likelihood 3: Erfordert Root-/Admin-Zugang, aber in vielen Organisationen zu weit verbreitet. Impact 4: Verlust der forensischen Nachvollziehbarkeit. DORA Art. 12 verlangt Nachweispflicht.',
    sources: ['DORA Art. 12: Backup-Strategien und Wiederherstellungsmethoden', 'ISO 27001:2022 A.8.15: Logging'], evidenceQuality: 4, reproducibility: 'easy' },

  // A — Availability (3)
  { id: 5, category: 'A', name: 'Single Point of Failure im Core-Banking-System', component: 'Core-Banking-Datenbankserver', attacker: 'Systemausfall / Ransomware', path: 'Keine Datenbankreplikation → Serverausfall → Komplettausfall des Online-Banking für alle Kunden', doraRef: 'Art. 11 Abs. 1-3', likelihood: 3, impact: 5,
    evidence: 'Architektur-Review: Core-Banking-Datenbank läuft auf einem einzelnen Oracle-Server ohne Active-Passive-Failover. Letzter vollständiger Backup-Test: 14 Monate alt. Recovery Time Objective (RTO) dokumentiert mit 4h, tatsächlich getestet: 18h.',
    rationale: 'Likelihood 3: Serverausfälle (Hardware, Ransomware) sind realistische Szenarien. Ohne Replikation ist Totalausfall die Folge. Impact 5: Kompletter Ausfall aller Bankgeschäfte — Kundenvertrauen, regulatorische Meldepflicht, finanzielle Verluste.',
    sources: ['DORA Art. 11: Backup-Strategien und Wiederherstellung', 'EBA-Leitlinie IKT-Risiken'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 6, category: 'A', name: 'Kein DDoS-Schutz für Online-Banking-Portal', component: 'Online-Banking Web-Frontend', attacker: 'Externer Angreifer', path: 'Volumetrischer DDoS-Angriff → Portal nicht erreichbar → Kunden können keine Transaktionen durchführen', doraRef: 'Art. 9 Abs. 2', likelihood: 4, impact: 4,
    evidence: 'Infrastruktur-Review: Kein dedizierter DDoS-Mitigation-Service (kein Cloudflare, AWS Shield o.ä.). Web-Application-Firewall vorhanden, aber ohne Rate-Limiting. Lasttest: 5000 gleichzeitige Requests führen zu Response-Timeout.',
    rationale: 'Likelihood 4: DDoS-as-a-Service ist billig und weit verbreitet. Finanzsektor ist priorisiertes Ziel. Impact 4: Service-Ausfall für Endkunden, aber kein Datenverlust.',
    sources: ['DORA Art. 9 Abs. 2: Schutz der IKT-Systeme', 'NIST SP 800-189: DDoS Mitigation'], evidenceQuality: 3, reproducibility: 'medium' },
  { id: 7, category: 'A', name: 'Ungetesteter Disaster-Recovery-Plan', component: 'IT-Infrastruktur gesamt', attacker: 'Naturkatastrophe / Systemausfall', path: 'DR-Plan existiert nur auf Papier → Im Ernstfall Chaos → Verlängerter Ausfallzeitraum', doraRef: 'Art. 11 Abs. 6', likelihood: 3, impact: 4,
    evidence: 'Dokumentenprüfung: DR-Plan (Version 2.3, letzte Aktualisierung 2024-03) existiert. Letzter vollständiger DR-Test: nie durchgeführt. Letzte Teilübung (Backup-Restore einzelner Systeme): 18 Monate alt. Kein dokumentiertes Ergebnis.',
    rationale: 'Likelihood 3: DR-Szenarien (Datacenter-Ausfall, Ransomware) sind statistisch wahrscheinlich. Impact 4: Ohne getesteten DR-Plan kann sich die Wiederherstellungszeit von Stunden auf Tage verlängern.',
    sources: ['DORA Art. 11 Abs. 6: Regelmäßige Überprüfung von IKT-Kontinuitätsplänen', 'ISO 22301:2019'], evidenceQuality: 3, reproducibility: 'hard' },

  // G — Governance (2)
  { id: 8, category: 'G', name: 'Fehlende IKT-Risikomanagement-Verantwortung auf Leitungsebene', component: 'Organisationsstruktur / Management', attacker: 'Regulatorisches Risiko', path: 'Keine dedizierte Verantwortung für IKT-Risiken auf Vorstandsebene → Strategische Lücken → Compliance-Verstoß', doraRef: 'Art. 5 Abs. 2', likelihood: 5, impact: 3,
    evidence: 'Organisationsanalyse: IKT-Risikomanagement ist dem IT-Leiter zugeordnet, nicht dem Vorstand. Kein dokumentiertes Mandat für IKT-Risiko-Verantwortung auf Leitungsebene. Board-Reporting zu IKT-Risiken: unregelmäßig, kein festes Format.',
    rationale: 'Likelihood 5: DORA Art. 5 Abs. 2 verlangt explizit Verantwortung der Leitungsorgane. Bei Prüfung durch BaFin sofort beanstandet. Impact 3: Governance-Lücke, aber kein direkter technischer Schaden.',
    sources: ['DORA Art. 5 Abs. 2: Verantwortung der Leitungsorgane', 'BaFin-Merkblatt MaRisk AT 4.3.1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 9, category: 'G', name: 'Unzureichende IKT-Schulungen für Management und Mitarbeiter', component: 'Personal / Awareness', attacker: 'Social Engineering', path: 'Fehlende Sensibilisierung → Phishing-Erfolg → Initialer Zugang für Angreifer', doraRef: 'Art. 13 Abs. 6', likelihood: 4, impact: 3,
    evidence: 'Personalakte-Stichprobe: 35% der Mitarbeiter haben in den letzten 12 Monaten kein IKT-Sicherheitstraining absolviert. Phishing-Simulationsergebnis: 22% Klickrate (Branchendurchschnitt: 12%). Kein spezifisches DORA-Training für Vorstand.',
    rationale: 'Likelihood 4: Phishing ist der häufigste initiale Angriffsvektor im Finanzsektor. 22% Klickrate ist weit über Benchmark. Impact 3: Initialer Zugang, aber weitere Exploitation erforderlich für materiellen Schaden.',
    sources: ['DORA Art. 13 Abs. 6: Schulungsprogramme für IKT-Sicherheit', 'ENISA Threat Landscape 2025'], evidenceQuality: 4, reproducibility: 'easy' },

  // T — Third-Party (3)
  { id: 10, category: 'T', name: 'Keine Exit-Strategie für kritischen Cloud-Provider', component: 'Cloud-Infrastruktur (AWS)', attacker: 'Anbieter-Lock-in / Provider-Ausfall', path: 'Keine dokumentierte Exit-Strategie → Provider-Wechsel dauert Monate → Verfügbarkeitsrisiko', doraRef: 'Art. 28 Abs. 8', likelihood: 3, impact: 5,
    evidence: 'Vertragsanalyse: Kein Exit-Plan im Cloud-Vertrag. Keine Datenportabilitätsklausel. Kein Probelauf für Provider-Wechsel. Geschätzte Migrationszeit bei aktuellem Stand: 6-12 Monate.',
    rationale: 'Likelihood 3: Cloud-Provider-Wechsel sind selten, aber regulatorisch gefordert. BaFin prüft Exit-Strategien aktiv. Impact 5: Ohne Exit-Strategie droht operationale Abhängigkeit und regulatorisches Risiko.',
    sources: ['DORA Art. 28 Abs. 8: Exit-Strategien', 'EBA-Leitlinie Cloud-Outsourcing'], evidenceQuality: 3, reproducibility: 'hard' },
  { id: 11, category: 'T', name: 'Unvollständiges Informationsregister für IKT-Drittanbieter', component: 'Vendor-Management', attacker: 'Regulatorisches Risiko', path: 'Register nicht vollständig → Fehlende Übersicht über Abhängigkeiten → Risikoaggregation unmöglich', doraRef: 'Art. 28 Abs. 3', likelihood: 5, impact: 3,
    evidence: 'Registerprüfung: 47 von geschätzten 62 IKT-Drittanbietern erfasst. Fehlende Einträge betreffen u.a. Subunternehmer des Cloud-Providers, Marktdatenanbieter und den Print-Dienstleister für vertrauliche Dokumente. Keine Klassifikation nach Kritikalität.',
    rationale: 'Likelihood 5: DORA Art. 28 Abs. 3 verlangt explizit ein vollständiges Register. Bei Prüfung sofort als Mangel erkannt. Impact 3: Governance-Verstoß, aber kein direkter technischer Schaden.',
    sources: ['DORA Art. 28 Abs. 3: Informationsregister für IKT-Drittanbieter', 'RTS zu Informationsregister (ESA)'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 12, category: 'T', name: 'Fehlende Sicherheitsaudits bei kritischem Zahlungsdienstleister', component: 'Payment Processor (extern)', attacker: 'Supply-Chain-Risiko', path: 'Kein Recht auf Prüfung vereinbart → Sicherheitsniveau des Anbieters unbekannt → Blind Trust', doraRef: 'Art. 30 Abs. 2 lit. f', likelihood: 4, impact: 4,
    evidence: 'Vertragsanalyse: Kein vertraglich vereinbartes Prüfungsrecht gegenüber Payment-Processor. Letztes SOC-2-Zertifikat des Anbieters: 18 Monate alt. Keine Informationen über Sub-Outsourcing.',
    rationale: 'Likelihood 4: DORA fordert Prüfungsrechte explizit. BaFin prüft Vertragsklauseln. Impact 4: Bei Sicherheitsvorfall beim Provider ist das Institut mitbetroffen ohne Einblick in Ursachen.',
    sources: ['DORA Art. 30 Abs. 2 lit. f: Prüfungsrechte', 'EBA-Leitlinie Outsourcing-Vereinbarungen'], evidenceQuality: 3, reproducibility: 'hard' },

  // R — Resilience (2)
  { id: 13, category: 'R', name: 'Kein formalisiertes TLPT-Programm (Threat-Led Penetration Testing)', component: 'Sicherheitstestabteilung', attacker: 'Regulatorisches Risiko', path: 'Keine TLPT nach Art. 26 → Regulatorische Non-Compliance → BaFin-Beanstandung', doraRef: 'Art. 26', likelihood: 4, impact: 3,
    evidence: 'Dokumentenprüfung: Jährliche Penetrationstests werden durchgeführt (Scope: externe Angriffsfläche). Kein TLPT nach TIBER-EU-Methodik. Kein Threat-Intelligence-basiertes Scoping. Kein Red-Team-Engagement in den letzten 3 Jahren.',
    rationale: 'Likelihood 4: DORA Art. 26 fordert TLPT alle 3 Jahre für signifikante Institute. BaFin hat TIBER-DE-Programm bereits aktiv. Impact 3: Regulatorische Beanstandung, aber kein direkter technischer Schaden.',
    sources: ['DORA Art. 26: Threat-Led Penetration Testing', 'TIBER-EU Framework', 'BaFin TIBER-DE-Rundschreiben'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 14, category: 'R', name: 'Incident-Response-Plan nicht auf DORA-Meldefristen ausgerichtet', component: 'Incident-Response-Team', attacker: 'Regulatorisches Risiko', path: 'IR-Plan sieht keine 4h-Early-Warning vor → Meldefrist verpasst → Bußgeld', doraRef: 'Art. 19', likelihood: 4, impact: 4,
    evidence: 'Prozessanalyse: IR-Plan (Version 3.1) definiert Eskalation an CISO innerhalb 24h. Keine spezifische Prozedur für DORA-Meldepflichten (4h Early Warning, 72h Intermediate, 1 Monat Final). Keine vorbereiteten Meldeformulare.',
    rationale: 'Likelihood 4: DORA-Meldepflichten gelten ab 2025. Jeder qualifizierte IKT-Vorfall erfordert Meldung. Impact 4: Fristversäumnis führt zu Bußgeld und regulatorischen Konsequenzen.',
    sources: ['DORA Art. 19: Meldung schwerwiegender IKT-Vorfälle', 'RTS zur Klassifizierung und Meldung von IKT-Vorfällen'], evidenceQuality: 4, reproducibility: 'easy' },
];

// ── Demo DORA Requirements (24 requirements) ────────────────────

export const DORA_REQS: DoraReq[] = [
  // ═══ CHAPTER II — ICT Risk Management (Art. 5-16) ═══

  { id: 'D5-1', article: 'Art. 5', name: 'IKT-Risikomanagement-Rahmenwerk', status: 'partial',
    gap: 'Rahmenwerk existiert, aber nicht auf DORA-Anforderungen aktualisiert. Keine explizite Vorstandsverantwortung dokumentiert.',
    evidence: 'Dokumentenprüfung: IKT-Risiko-Framework (Version 2.1, Stand 2024-06) basiert auf MaRisk AT 7.2. DORA-spezifische Anforderungen (Art. 6 Abs. 1-8) nicht vollständig abgebildet. Vorstandsmandat fehlt.',
    rationale: 'Teilweise erfüllt: Grundlegendes Framework vorhanden, aber DORA verlangt erweiterte Anforderungen inkl. expliziter Leitungsverantwortung (Art. 5 Abs. 2).',
    measure: 'IKT-Risiko-Framework auf DORA Art. 5-6 aktualisieren. Vorstandsmandat für IKT-Risikomanagement dokumentieren. Jährliche Überprüfung formalisieren.',
    criteria: ['IKT-Risiko-Framework referenziert DORA Art. 5-6 explizit', 'Vorstandsmandat für IKT-Risikoverantwortung dokumentiert und vom Vorstand unterzeichnet', 'Jährliche Überprüfung des Frameworks ist im Governance-Kalender verankert'],
    effort: '40-60h', priority: 'P0' },

  { id: 'D6-1', article: 'Art. 6', name: 'IKT-Systeme, -Protokolle und -Tools', status: 'partial',
    gap: 'Asset-Inventar nicht vollständig. Keine automatisierte Erkennung neuer Assets.',
    evidence: 'Asset-Management-Prüfung: 78% der IKT-Assets im CMDB erfasst. Schatten-IT (nicht-genehmigte Cloud-Dienste) durch DNS-Analyse identifiziert: 12 nicht-erfasste SaaS-Dienste.',
    rationale: 'Teilweise erfüllt: CMDB vorhanden, aber unvollständig. DORA verlangt vollständige Identifikation und Klassifikation aller IKT-Assets.',
    measure: 'CMDB vervollständigen. Shadow-IT-Discovery-Tool implementieren. Automatisierte Asset-Erkennung einrichten.',
    criteria: ['CMDB-Abdeckung >= 95% aller IKT-Assets', 'Shadow-IT-Discovery läuft automatisiert (mindestens wöchentlich)', 'Alle Assets nach Kritikalität klassifiziert'],
    effort: '30-50h', priority: 'P1' },

  { id: 'D7-1', article: 'Art. 7', name: 'Identifizierung kritischer IKT-Systeme', status: 'pass',
    gap: '',
    evidence: 'Business-Impact-Analyse (BIA): Alle Geschäftsprozesse mit IKT-Abhängigkeiten dokumentiert. Kritische Systeme (Core Banking, Payment, Online-Banking) identifiziert und klassifiziert. RTO/RPO für jedes System definiert.',
    rationale: 'Erfüllt: Systematische BIA durchgeführt. Kritische IKT-Funktionen und -Assets identifiziert und dokumentiert.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'D8-1', article: 'Art. 8', name: 'Schutzmaßnahmen und Prävention', status: 'fail',
    gap: 'Mehrere kritische Schutzmaßnahmen fehlen: interne Verschlüsselung, Netzwerksegmentierung unvollständig, DDoS-Schutz fehlt.',
    evidence: 'Technische Prüfung: Interne Kommunikation zwischen Kernbanksystemen ohne TLS (vgl. C-001). Netzwerksegmentierung: Produktions- und Testnetzwerke nicht vollständig getrennt. Kein DDoS-Mitigation-Service (vgl. A-006).',
    rationale: 'Nicht erfüllt: DORA Art. 8 fordert umfassende Schutzmaßnahmen. Drei unabhängige kritische Lücken identifiziert.',
    measure: '1. TLS für alle internen Verbindungen implementieren. 2. Netzwerksegmentierung vervollständigen (Produktions-/Test-/Entwicklungsumgebung). 3. DDoS-Mitigation-Service implementieren.',
    criteria: ['Alle internen Verbindungen über TLS 1.2+ verschlüsselt', 'Netzwerksegmentierung nach Umgebungen (Prod/Test/Dev) vollständig implementiert', 'DDoS-Mitigation-Service aktiv und getestet'],
    effort: '60-100h', priority: 'P0' },

  { id: 'D9-1', article: 'Art. 9 Abs. 1-2', name: 'Erkennung anomaler Aktivitäten', status: 'partial',
    gap: 'SIEM vorhanden, aber Use-Cases unvollständig. Keine automatisierte Anomalie-Erkennung.',
    evidence: 'SIEM-Review: Splunk-basiertes SIEM mit 42 aktiven Alerts. Aber: Keine Korrelationsregeln für Lateral Movement. Keine ML-basierte Anomalie-Erkennung. Log-Quellen: 68% der kritischen Systeme angebunden.',
    rationale: 'Teilweise erfüllt: SIEM vorhanden und operativ. Aber DORA verlangt umfassende Erkennungsfähigkeit inkl. mehrerer Verteidigungslinien.',
    measure: 'SIEM-Use-Cases erweitern (insb. Lateral Movement, Privilege Escalation). Log-Anbindung auf 95% der kritischen Systeme erhöhen. Anomalie-Erkennung evaluieren.',
    criteria: ['SIEM-Abdeckung >= 95% der kritischen Systeme', 'Korrelationsregeln für Top-10-Angriffsszenarien implementiert', 'Anomalie-Erkennung für Netzwerk- und Benutzerverhalten aktiv'],
    effort: '40-60h', priority: 'P1' },

  { id: 'D9-2', article: 'Art. 9 Abs. 4', name: 'Zugangskontrolle und Authentifizierung', status: 'fail',
    gap: 'IDOR-Schwachstelle in API. Kein MFA für administrative Zugänge. Privileged Access Management unvollständig.',
    evidence: 'API-Test: IDOR-Schwachstelle (vgl. C-002). Admin-Zugänge ohne MFA (vgl. Konfigurationsanalyse). PAM-Lösung nur für 60% der privilegierten Accounts implementiert.',
    rationale: 'Nicht erfüllt: Mehrere kritische Zugangskontroll-Schwächen. DORA fordert starke Authentifizierung und Autorisierung.',
    measure: '1. IDOR in API beheben (serverseitiger Ownership-Check). 2. MFA für alle Admin-Zugänge. 3. PAM-Abdeckung auf 100% erweitern.',
    criteria: ['Serverseitiger Ownership-Check für alle API-Endpoints', 'MFA für alle administrativen und privilegierten Zugänge aktiv', 'PAM-Lösung für 100% der privilegierten Accounts'],
    effort: '50-70h', priority: 'P0' },

  { id: 'D10-1', article: 'Art. 10', name: 'Incident-Response und Kommunikation', status: 'partial',
    gap: 'IR-Plan nicht auf DORA-Meldefristen ausgerichtet. Keine vorbereiteten Meldeformulare.',
    evidence: 'IR-Plan-Review: Plan vorhanden und grundsätzlich funktional. Aber: Keine DORA-spezifischen Meldefristen (4h/72h/1M). Keine Vorlagen für Behördenmeldungen. Letzte Übung: 8 Monate alt.',
    rationale: 'Teilweise erfüllt: IR-Prozess existiert, aber DORA verlangt spezifische Meldefristen und -formate.',
    measure: 'IR-Plan um DORA-Meldeprozeduren ergänzen (4h Early Warning, 72h Intermediate, 1M Final). Meldevorlagen erstellen. Quartalsweise Übungen.',
    criteria: ['IR-Plan enthält DORA-Meldeprozeduren mit Fristen', 'Vorbereitete Meldeformulare für BaFin/DORA-Meldung', 'Quartalsweise Tabletop-Übungen dokumentiert'],
    effort: '20-30h', priority: 'P1' },

  { id: 'D11-1', article: 'Art. 11 Abs. 1-3', name: 'Backup-Strategien', status: 'partial',
    gap: 'Backups vorhanden, aber Recovery nicht regelmäßig getestet. RTO-Abweichung bei Core Banking.',
    evidence: 'Backup-Prüfung: Tägliche Backups für alle kritischen Systeme. Aber: Letzter vollständiger Restore-Test für Core Banking: 14 Monate alt. Gemessene Recovery-Zeit: 18h vs. dokumentierte RTO: 4h.',
    rationale: 'Teilweise erfüllt: Backups werden erstellt, aber Recovery ist nicht validiert. Die Diskrepanz zwischen dokumentierter RTO (4h) und tatsächlicher Recovery (18h) ist kritisch.',
    measure: 'Quartalsweise Restore-Tests für kritische Systeme. RTO-Validierung in Testumgebung. Ergebnisse dokumentieren.',
    criteria: ['Quartalsweise Restore-Tests für alle kritischen Systeme', 'Gemessene Recovery-Zeiten liegen innerhalb der dokumentierten RTO', 'Test-Ergebnisse werden dokumentiert und an Vorstand berichtet'],
    effort: '20-30h', priority: 'P1' },

  { id: 'D11-2', article: 'Art. 11 Abs. 4-6', name: 'IKT-Kontinuitätsplanung', status: 'fail',
    gap: 'DR-Plan nicht getestet. Kein Switching-Test zwischen Primär- und Backup-Standort durchgeführt.',
    evidence: 'DR-Plan (Version 2.3) existiert. Letzter vollständiger DR-Test: nie. Backup-Standort vorhanden, aber Switching-Prozedur nicht dokumentiert und nicht getestet (vgl. R-007).',
    rationale: 'Nicht erfüllt: DORA Art. 11 Abs. 6 verlangt regelmäßige Tests der IKT-Kontinuitätspläne. Ein ungetesteter Plan ist regulatorisch wertlos.',
    measure: 'Jährlichen DR-Test durchführen (vollständiger Switching-Test). Prozeduren dokumentieren. Ergebnisse an Vorstand berichten.',
    criteria: ['Jährlicher vollständiger DR-Test inkl. Switching durchgeführt', 'Switching-Prozedur dokumentiert und getestet', 'DR-Test-Ergebnisse werden an Vorstand berichtet'],
    effort: '40-60h', priority: 'P0' },

  { id: 'D12-1', article: 'Art. 12', name: 'Lern- und Weiterentwicklungsprozesse', status: 'pass',
    gap: '',
    evidence: 'Prozessprüfung: Post-Incident-Reviews werden nach jedem Vorfall durchgeführt. Lessons-Learned werden dokumentiert und in Prozessverbesserungen umgesetzt. Threat-Intelligence-Feed (FIRST, FS-ISAC) wird ausgewertet.',
    rationale: 'Erfüllt: Systematischer Lernprozess etabliert. Vorfälle werden analysiert und Erkenntnisse in Verbesserungen umgesetzt.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'D13-1', article: 'Art. 13 Abs. 1-5', name: 'Kommunikation und Meldepflichten (intern)', status: 'pass',
    gap: '',
    evidence: 'Prozessanalyse: Interne Kommunikationsrichtlinie für IKT-Vorfälle vorhanden. Eskalationspfade definiert. Kommunikationsplan für verschiedene Vorfallschweregrade dokumentiert.',
    rationale: 'Erfüllt: Strukturierte interne Kommunikation für IKT-Vorfälle ist etabliert und getestet.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'D13-2', article: 'Art. 13 Abs. 6', name: 'IKT-Sicherheitsschulungen', status: 'partial',
    gap: 'Schulungsquote unter 100%. Kein DORA-spezifisches Training für Vorstand.',
    evidence: 'Schulungsstatistik: 65% der Mitarbeiter haben IKT-Sicherheitstraining absolviert (Ziel: 100%). Phishing-Klickrate: 22%. Kein DORA-spezifisches Training für Leitungsorgane.',
    rationale: 'Teilweise erfüllt: Schulungsprogramm existiert, aber Durchdringung und DORA-Spezifik unzureichend.',
    measure: 'Schulungsquote auf 100% erhöhen. DORA-spezifisches Training für Vorstand entwickeln. Phishing-Simulationen monatlich.',
    criteria: ['Schulungsquote >= 95% aller Mitarbeiter', 'DORA-spezifisches Training für Leitungsorgane jährlich', 'Phishing-Klickrate < 5%'],
    effort: '15-25h', priority: 'P2' },

  // ═══ CHAPTER III — Incident Reporting (Art. 17-23) ═══

  { id: 'D17-1', article: 'Art. 17', name: 'IKT-Vorfallsmanagement-Prozess', status: 'partial',
    gap: 'Grundprozess vorhanden, aber Klassifizierungskriterien nicht DORA-konform. Keine automatisierte Schweregrad-Bewertung.',
    evidence: 'Prozessprüfung: Incident-Management-Prozess basiert auf ITIL. Klassifizierungskriterien nutzen interne Skala (P1-P4), nicht DORA Art. 18 Abs. 1 Kriterien. Keine automatisierte Bewertung anhand der RTS-Kriterien.',
    rationale: 'Teilweise erfüllt: Prozess existiert und ist operativ, aber Klassifizierung muss auf DORA-Kriterien umgestellt werden.',
    measure: 'Klassifizierungskriterien auf DORA Art. 18 Abs. 1 umstellen. Automatisierte Bewertung implementieren. Mapping ITIL → DORA dokumentieren.',
    criteria: ['Klassifizierungskriterien basieren auf DORA Art. 18 Abs. 1', 'Automatisierte Bewertung der Kriterien implementiert', 'ITIL-zu-DORA-Mapping dokumentiert und validiert'],
    effort: '20-30h', priority: 'P1' },

  { id: 'D19-1', article: 'Art. 19', name: 'Meldung schwerwiegender IKT-Vorfälle', status: 'fail',
    gap: 'Meldeprozess nicht auf DORA-Fristen ausgerichtet. Keine Meldevorlagen. Kein Test durchgeführt.',
    evidence: 'Prozessanalyse: Aktuelle Meldeprozedur sieht Meldung an BaFin innerhalb 24h vor. DORA fordert 4h (Early Warning). Keine vorbereiteten Meldeformulare. Kein Probelauf (vgl. R-014).',
    rationale: 'Nicht erfüllt: Die 4h-Meldefrist ist eine harte regulatorische Anforderung. Aktuelle Prozesse sind nicht darauf ausgelegt.',
    measure: '1. Meldeprozedur auf 4h-Frist umstellen. 2. Meldevorlagen nach RTS-Vorgaben erstellen. 3. Halbjährliche Trockenübungen.',
    criteria: ['Meldeprozedur sieht 4h-Early-Warning vor', 'Meldevorlagen gemäß RTS erstellt und verfügbar', 'Halbjährliche Trockenübung durchgeführt und dokumentiert'],
    effort: '25-40h', priority: 'P0' },

  // ═══ CHAPTER IV — Digital Operational Resilience Testing (Art. 24-27) ═══

  { id: 'D24-1', article: 'Art. 24', name: 'Allgemeine Testanforderungen', status: 'partial',
    gap: 'Jährliche Penetrationstests werden durchgeführt, aber nicht alle kritischen Systeme abgedeckt. Keine Vulnerability-Scanning-Routine.',
    evidence: 'Testbericht-Review: Letzte Pentests decken externe Angriffsfläche ab (Web-Applikationen, APIs). Interne Tests: nur Ad-hoc. Kein regelmäßiges Vulnerability-Scanning. Source-Code-Audits: nie.',
    rationale: 'Teilweise erfüllt: Tests werden durchgeführt, aber Scope und Regelmäßigkeit entsprechen nicht DORA Art. 24.',
    measure: 'Jährliches Testprogramm erstellen (Pentests, Vulnerability-Scanning, Source-Code-Audits). Scope auf alle kritischen Systeme erweitern.',
    criteria: ['Jährliches Testprogramm dokumentiert und genehmigt', 'Vulnerability-Scanning monatlich für alle kritischen Systeme', 'Source-Code-Audits für eigenentwickelte kritische Applikationen'],
    effort: '30-50h', priority: 'P1' },

  { id: 'D25-1', article: 'Art. 25', name: 'Tests der IKT-Werkzeuge und -Systeme', status: 'pass',
    gap: '',
    evidence: 'Testprogramm: Regelmäßige Penetrationstests (jährlich, externer Dienstleister). Vulnerability-Assessment der externen Angriffsfläche (monatlich, Qualys). Netzwerk-Security-Reviews (halbjährlich).',
    rationale: 'Erfüllt: Grundlegende Tests werden regelmäßig und systematisch durchgeführt. Scope entspricht den Anforderungen für Standardtests.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'D26-1', article: 'Art. 26', name: 'Threat-Led Penetration Testing (TLPT)', status: 'fail',
    gap: 'Kein TLPT-Programm nach TIBER-EU-Methodik. Kein Threat-Intelligence-basiertes Red-Teaming.',
    evidence: 'Kein TLPT nach TIBER-EU durchgeführt. Letzte Red-Team-Übung: nie. Kein Threat-Intelligence-basiertes Scoping für Penetrationstests (vgl. R-013).',
    rationale: 'Nicht erfüllt: DORA Art. 26 fordert TLPT alle 3 Jahre für signifikante Finanzunternehmen. Dies ist eine explizite regulatorische Anforderung.',
    measure: '1. TLPT-Programm nach TIBER-EU aufsetzen. 2. Threat-Intelligence-Provider beauftragen. 3. Red-Team-Dienstleister auswählen und erstes TLPT durchführen.',
    criteria: ['TLPT-Programm nach TIBER-EU dokumentiert', 'Threat-Intelligence-basiertes Scoping durchgeführt', 'Erstes TLPT innerhalb von 12 Monaten abgeschlossen'],
    effort: '100-200h (extern)', priority: 'P1' },

  // ═══ CHAPTER V — ICT Third-Party Risk Management (Art. 28-44) ═══

  { id: 'D28-1', article: 'Art. 28 Abs. 1-2', name: 'Grundsätze des IKT-Drittanbieter-Risikomanagements', status: 'partial',
    gap: 'Drittanbieter-Policy vorhanden, aber nicht DORA-konform aktualisiert. Keine Risikoklassifizierung der Anbieter.',
    evidence: 'Policy-Review: Outsourcing-Policy (Version 1.4, Stand 2024-03) basiert auf MaRisk AT 9. DORA-spezifische Anforderungen (Konzentrationsrisiko, Sub-Outsourcing-Kette) nicht adressiert.',
    rationale: 'Teilweise erfüllt: Grundlegende Policy vorhanden, aber DORA erweitert die Anforderungen erheblich.',
    measure: 'Outsourcing-Policy auf DORA Art. 28-30 aktualisieren. Risikoklassifizierung aller Anbieter durchführen. Konzentrationsrisiko-Analyse implementieren.',
    criteria: ['Outsourcing-Policy referenziert DORA Art. 28-30', 'Alle Anbieter nach Kritikalität klassifiziert', 'Konzentrationsrisiko-Analyse durchgeführt und dokumentiert'],
    effort: '30-50h', priority: 'P1' },

  { id: 'D28-2', article: 'Art. 28 Abs. 3', name: 'Informationsregister für IKT-Drittanbieter', status: 'fail',
    gap: 'Register unvollständig (47 von 62). Keine Kritikalitätsklassifikation. Keine Subunternehmer erfasst.',
    evidence: 'Registerprüfung: 47 von geschätzten 62 Anbietern erfasst. Fehlende Einträge. Keine Klassifikation nach Kritikalität. Subunternehmer der Anbieter nicht erfasst (vgl. T-011).',
    rationale: 'Nicht erfüllt: DORA Art. 28 Abs. 3 verlangt ein vollständiges und aktuelles Register. Aktuelle Erfassung ist unzureichend.',
    measure: '1. Register vervollständigen (alle 62+ Anbieter). 2. Kritikalitätsklassifikation einführen. 3. Sub-Outsourcing-Ketten erfassen. 4. Register der BaFin auf Anfrage zur Verfügung stellen.',
    criteria: ['Register enthält 100% der IKT-Drittanbieter', 'Jeder Anbieter nach Kritikalität klassifiziert', 'Sub-Outsourcing-Ketten bis Tier 2 erfasst'],
    effort: '40-60h', priority: 'P0' },

  { id: 'D28-3', article: 'Art. 28 Abs. 8', name: 'Exit-Strategien', status: 'fail',
    gap: 'Keine Exit-Strategien für kritische IKT-Drittanbieter. Keine Datenportabilitätsklauseln.',
    evidence: 'Vertragsanalyse: Kein Exit-Plan für Cloud-Provider (vgl. T-010). Keine Datenportabilitätsklauseln. Geschätzte Migrationszeit: 6-12 Monate.',
    rationale: 'Nicht erfüllt: DORA Art. 28 Abs. 8 verlangt Exit-Strategien für kritische Anbieter. Aktuelle Verträge enthalten keine entsprechenden Klauseln.',
    measure: '1. Exit-Strategien für alle kritischen Anbieter dokumentieren. 2. Datenportabilitätsklauseln in Verträge aufnehmen. 3. Jährliche Exit-Feasibility-Bewertung.',
    criteria: ['Exit-Strategie für jeden kritischen Anbieter dokumentiert', 'Datenportabilitätsklauseln in Verträgen verankert', 'Jährliche Exit-Feasibility-Bewertung durchgeführt'],
    effort: '30-50h', priority: 'P0' },

  { id: 'D30-1', article: 'Art. 30', name: 'Vertragliche Schlüsselbestimmungen', status: 'partial',
    gap: 'Vertragsklauseln für kritische Anbieter unvollständig. Keine Prüfungsrechte vereinbart.',
    evidence: 'Vertragsanalyse: 3 von 8 kritischen Anbietern haben keine Prüfungsrechte (Audit-Right) vertraglich vereinbart. Service-Level-Agreements nicht DORA-konform (keine Verfügbarkeitsziele nach Art. 30 Abs. 2 lit. a). Kein Recht auf Subunternehmer-Genehmigung (vgl. T-012).',
    rationale: 'Teilweise erfüllt: Verträge existieren, aber DORA stellt detaillierte Anforderungen an Vertragsklauseln, die nicht vollständig umgesetzt sind.',
    measure: '1. Vertragliche Prüfungsrechte mit allen kritischen Anbietern vereinbaren. 2. SLAs DORA-konform anpassen. 3. Sub-Outsourcing-Genehmigungsrecht verankern.',
    criteria: ['Prüfungsrechte mit 100% der kritischen Anbieter vereinbart', 'SLAs enthalten DORA-konforme Verfügbarkeitsziele', 'Sub-Outsourcing-Genehmigungsrecht vertraglich verankert'],
    effort: '40-60h', priority: 'P1' },

  // ═══ Additional Process Requirements ═══

  { id: 'D14-1', article: 'Art. 14', name: 'Kommunikationsrichtlinien', status: 'pass',
    gap: '',
    evidence: 'Richtlinienprüfung: Kommunikationsrichtlinie für IKT-Vorfälle dokumentiert. Interne und externe Kommunikationspfade definiert. Krisenkommunikationsplan vorhanden.',
    rationale: 'Erfüllt: Strukturierte Kommunikationsrichtlinien sind implementiert und getestet.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'D15-1', article: 'Art. 15', name: 'Vereinfachter IKT-Risikomanagement-Rahmen', status: 'pass',
    gap: '',
    evidence: 'Nicht anwendbar für signifikante/kritische Institute. Vollständiger Art. 5-14 Rahmen implementiert.',
    rationale: 'Erfüllt: Vollständiger Rahmen nach Art. 5-14 implementiert. Art. 15 (vereinfacht) ist nicht anwendbar.',
    measure: '', criteria: [], effort: '', priority: '' },
];

// ── Demo Scenarios ──────────────────────────────────────────────

export interface DemoScenario {
  entity: { name: string; types: string[] };
  criticality: string;
  description: string;
  infrastructure: string[];
  thirdPartyProviders: string[];
  roles: string[];
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    // Mittelständische Bank — signifikant
    entity: { name: 'Rheinland Volksbank eG', types: ['bank'] },
    criticality: 'significant',
    description: 'Mittelständische Genossenschaftsbank mit 120.000 Kunden. Core-Banking über Rechenzentrum der Atruvia AG. Online-Banking und Mobile-App als Eigenentwicklung. 350 Mitarbeiter.',
    infrastructure: ['core_banking', 'payment_proc', 'cloud', 'network', 'endpoints', 'mobile'],
    thirdPartyProviders: ['Core Banking Provider', 'Cloud Service Provider (IaaS/PaaS/SaaS)', 'Payment Processor', 'Network/Telecom Provider', 'Security Service Provider (SOC/SIEM)'],
    roles: ['Vorstand IT', 'CISO', 'IT-Leiter', 'Datenschutzbeauftragter', 'Compliance-Beauftragter'],
    measures: { ict_risk_framework: { active: true, documented: true, audited: false }, access_control: { active: true, documented: true, audited: false }, patch_mgmt: { active: true, documented: true, audited: true }, logging: { active: true, documented: false, audited: false }, bcm: { active: true, documented: true, audited: false }, backup: { active: true, documented: true, audited: true } },
    knownIssues: 'DR-Test wurde in den letzten 24 Monaten nicht vollständig durchgeführt. Informationsregister für IKT-Drittanbieter ist unvollständig.',
    files: [
      { name: 'RVB_IKT-Risiko-Framework_v2.1.pdf', size: 1_890_000, type: 'ict_risk_policy' },
      { name: 'RVB_BCM-Plan_2025.pdf', size: 1_230_000, type: 'bcp' },
      { name: 'RVB_IR-Plan_v3.1.pdf', size: 780_000, type: 'incident_plan' },
      { name: 'RVB_Drittanbieter-Register_2025.xlsx', size: 245_000, type: 'third_party_register' },
      { name: 'RVB_Pentest-Bericht_Q4-2025.pdf', size: 2_100_000, type: 'test_report' },
    ],
  },
  {
    // Versicherung — signifikant
    entity: { name: 'SecureLife Versicherung AG', types: ['insurance'] },
    criticality: 'significant',
    description: 'Schadenversicherung mit Schwerpunkt Sachversicherung und Cyber-Versicherung. 800 Mitarbeiter, 2 Standorte. Cloud-First-Strategie mit AWS. Eigenentwickeltes Schadenmanagement-System.',
    infrastructure: ['cloud', 'data_center', 'network', 'endpoints', 'mobile'],
    thirdPartyProviders: ['Cloud Service Provider (IaaS/PaaS/SaaS)', 'Software Vendor (ERP/CRM)', 'Network/Telecom Provider', 'Data Center Operator', 'IT Outsourcing Provider'],
    roles: ['CTO', 'CISO', 'Head of IT Operations', 'DPO', 'Compliance Officer'],
    measures: { ict_risk_framework: { active: true, documented: true, audited: true }, ict_asset_mgmt: { active: true, documented: true, audited: false }, encryption: { active: true, documented: true, audited: false }, network_sec: { active: true, documented: true, audited: true }, incident_mgmt: { active: true, documented: true, audited: false }, awareness: { active: true, documented: false, audited: false } },
    knownIssues: 'Cloud-Exit-Strategie noch nicht vollständig ausgearbeitet.',
    files: [
      { name: 'SL_ISMS_Policy_v4.pdf', size: 2_340_000, type: 'ict_risk_policy' },
      { name: 'SL_DR-Plan_2025.pdf', size: 890_000, type: 'bcp' },
      { name: 'SL_Incident-Response_Playbook.pdf', size: 1_560_000, type: 'incident_plan' },
      { name: 'SL_Vendor-Register_2025-Q1.xlsx', size: 178_000, type: 'third_party_register' },
    ],
  },
  {
    // Zahlungsdienstleister — kritisch
    entity: { name: 'PayStream GmbH', types: ['payment'] },
    criticality: 'critical',
    description: 'Zahlungsdienstleister mit PSD2-Lizenz. Verarbeitet 2.5 Mio. Transaktionen/Tag. API-First-Architektur. Multi-Cloud (AWS + Azure). 180 Mitarbeiter, davon 120 in der Entwicklung.',
    infrastructure: ['payment_proc', 'cloud', 'network', 'endpoints'],
    thirdPartyProviders: ['Cloud Service Provider (IaaS/PaaS/SaaS)', 'Network/Telecom Provider', 'Security Service Provider (SOC/SIEM)', 'Market Data Provider'],
    roles: ['CEO', 'CTO', 'CISO', 'Head of Compliance', 'DPO', 'Head of Engineering'],
    measures: { ict_risk_framework: { active: true, documented: true, audited: true }, encryption: { active: true, documented: true, audited: true }, access_control: { active: true, documented: true, audited: true }, patch_mgmt: { active: true, documented: true, audited: true }, logging: { active: true, documented: true, audited: true }, incident_mgmt: { active: true, documented: true, audited: false }, testing: { active: true, documented: true, audited: false } },
    knownIssues: 'TLPT nach TIBER-EU noch nicht durchgeführt. Informationsregister wird aktuell aufgebaut.',
    files: [
      { name: 'PS_Security-Framework_v5.pdf', size: 3_450_000, type: 'ict_risk_policy' },
      { name: 'PS_BCM-DR-Plan_2025.pdf', size: 1_780_000, type: 'bcp' },
      { name: 'PS_IR-Playbook_v2.pdf', size: 1_120_000, type: 'incident_plan' },
      { name: 'PS_ICT-Register_Draft.xlsx', size: 98_000, type: 'third_party_register' },
      { name: 'PS_Pentest_Annual_2025.pdf', size: 2_890_000, type: 'test_report' },
    ],
  },
  {
    // Fondsgesellschaft — standard
    entity: { name: 'AlphaCapital Asset Management', types: ['fund'] },
    criticality: 'standard',
    description: 'Kapitalverwaltungsgesellschaft mit Fokus auf Aktienfonds. AuM: 4.2 Mrd. EUR. 45 Mitarbeiter. Bloomberg-Terminal für Marktdaten. Order-Routing über externe Broker.',
    infrastructure: ['trading', 'cloud', 'network', 'endpoints'],
    thirdPartyProviders: ['Market Data Provider', 'Cloud Service Provider (IaaS/PaaS/SaaS)', 'Software Vendor (ERP/CRM)', 'Network/Telecom Provider'],
    roles: ['Geschäftsführer', 'IT-Leiter', 'Compliance', 'Portfolio-Manager'],
    measures: { access_control: { active: true, documented: true, audited: false }, encryption: { active: true, documented: false, audited: false }, backup: { active: true, documented: true, audited: false }, awareness: { active: true, documented: true, audited: false } },
    knownIssues: 'Kein formalisiertes IKT-Risiko-Framework vorhanden. Abhängigkeit von Bloomberg als Single Source für Marktdaten.',
    files: [
      { name: 'AC_IT-Policy_2024.pdf', size: 560_000, type: 'ict_risk_policy' },
      { name: 'AC_BCM-Notfallplan.pdf', size: 340_000, type: 'bcp' },
    ],
  },
  {
    // IKT-Drittanbieter — kritisch
    entity: { name: 'CloudSecure Financial Services GmbH', types: ['ict_provider'] },
    criticality: 'critical',
    description: 'Cloud-basierter IKT-Dienstleister für den Finanzsektor. Hosting und Managed Services für 35 Finanzinstitute. ISO 27001 zertifiziert. 2 Rechenzentren in Frankfurt und München.',
    infrastructure: ['cloud', 'data_center', 'network', 'endpoints'],
    thirdPartyProviders: ['Data Center Operator', 'Network/Telecom Provider', 'Security Service Provider (SOC/SIEM)'],
    roles: ['CEO', 'CTO', 'CISO', 'Head of Operations', 'Compliance Manager', 'Service Delivery Manager'],
    measures: { ict_risk_framework: { active: true, documented: true, audited: true }, ict_config_mgmt: { active: true, documented: true, audited: true }, encryption: { active: true, documented: true, audited: true }, network_sec: { active: true, documented: true, audited: true }, logging: { active: true, documented: true, audited: true }, incident_mgmt: { active: true, documented: true, audited: true }, bcm: { active: true, documented: true, audited: true }, drp: { active: true, documented: true, audited: false }, change_mgmt: { active: true, documented: true, audited: true }, testing: { active: true, documented: true, audited: false } },
    knownIssues: 'DR-Switching-Test zwischen Frankfurt und München steht noch aus. Informationsregister muss um Sub-Outsourcing-Ketten ergänzt werden.',
    files: [
      { name: 'CS_ISMS_ISO27001_Certificate.pdf', size: 4_200_000, type: 'ict_risk_policy' },
      { name: 'CS_BCM-DR_Framework_v6.pdf', size: 2_780_000, type: 'bcp' },
      { name: 'CS_IR-Runbook_v4.pdf', size: 1_890_000, type: 'incident_plan' },
      { name: 'CS_Provider-Register_2025-Q1.xlsx', size: 312_000, type: 'third_party_register' },
      { name: 'CS_Pentest_BSI-Certified_2025.pdf', size: 3_120_000, type: 'test_report' },
      { name: 'CS_SOC2_Type2_Report_2024.pdf', size: 5_600_000, type: 'other' },
    ],
  },
];
