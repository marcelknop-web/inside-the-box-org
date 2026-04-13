// ── NIS-2 Compliance Tool Constants & Demo Data (i18n-aware) ─────────────
// Based on Directive (EU) 2022/2555 — Network and Information Security Directive 2

type T = (key: string) => string;

// ── Entity Types (NIS-2 sectors) ───────────────────────────────
const ET_KEYS = ['energy', 'transport', 'health', 'digital_infra', 'public_admin', 'manufacturing'] as const;
const ET_ICONS = ['⚡', '🚂', '🏥', '🌐', '🏛️', '🏭'];
const ET_T_KEYS = ['etEnergy', 'etTransport', 'etHealth', 'etDigitalInfra', 'etPublicAdmin', 'etManufacturing'];
const ET_DESC_KEYS = ['etEnergyDesc', 'etTransportDesc', 'etHealthDesc', 'etDigitalInfraDesc', 'etPublicAdminDesc', 'etManufacturingDesc'];

export function getEntityTypes(t: T) {
  return ET_KEYS.map((id, i) => ({
    id,
    label: t(`nis2c.${ET_T_KEYS[i]}`),
    icon: ET_ICONS[i],
    desc: t(`nis2c.${ET_DESC_KEYS[i]}`),
  }));
}

// ── NIS-2 Criticality Levels ─────────────────────────────────────
const CRIT_IDS = ['important', 'essential'] as const;
const CRIT_COLORS = [
  'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  'border-destructive bg-destructive/10 text-destructive',
];
const CRIT_KEYS = ['critImportant', 'critEssential'];

export function getCriticalityLevels(t: T) {
  return CRIT_IDS.map((id, i) => ({
    id,
    label: t(`nis2c.${CRIT_KEYS[i]}`),
    color: CRIT_COLORS[i],
    desc: t(`nis2c.${CRIT_KEYS[i]}Desc`),
  }));
}

// ── Infrastructure Options ──────────────────────────────────
const INFRA_IDS = ['scada_ot', 'erp_system', 'cloud_services', 'network_infra', 'email_collab', 'iot_devices', 'data_center', 'vpn_remote'] as const;
const INFRA_ICONS = ['🏭', '📊', '☁️', '🌐', '📧', '📡', '🏢', '🔒'];
const INFRA_KEYS = ['infraScada', 'infraErp', 'infraCloud', 'infraNetwork', 'infraEmail', 'infraIot', 'infraDataCenter', 'infraVpn'];

export function getInfraOpts(t: T) {
  return INFRA_IDS.map((id, i) => ({
    id,
    label: t(`nis2c.${INFRA_KEYS[i]}`),
    icon: INFRA_ICONS[i],
  }));
}

// ── Supply Chain Categories ────────────────────────
export const SUPPLY_CHAIN_OPTS = [
  { label: 'Cloud Service Provider (IaaS/PaaS/SaaS)', icon: '☁️' },
  { label: 'Managed Security Service Provider (MSSP)', icon: '🛡️' },
  { label: 'Software-Lieferant / Entwicklungspartner', icon: '💻' },
  { label: 'Hardware-Lieferant / OEM', icon: '🔧' },
  { label: 'Telekommunikationsanbieter', icon: '📡' },
  { label: 'IT-Outsourcing-Dienstleister', icon: '🏢' },
  { label: 'Beratungsunternehmen', icon: '📋' },
  { label: 'Rechenzentrumsbetreiber', icon: '🖥️' },
] as const;

// ── Risk Management Measures (Art. 21) ────────────────────────
const RM_IDS = ['risk_analysis', 'incident_handling', 'bcm', 'supply_chain', 'network_security', 'vuln_management', 'cyber_hygiene', 'crypto', 'access_control', 'mfa', 'secure_comms', 'hr_security'] as const;
const RM_LABEL_KEYS = ['rmRiskAnalysis', 'rmIncidentHandling', 'rmBcm', 'rmSupplyChain', 'rmNetworkSec', 'rmVulnMgmt', 'rmCyberHygiene', 'rmCrypto', 'rmAccessControl', 'rmMfa', 'rmSecureComms', 'rmHrSecurity'];
const RM_CAT_KEYS = ['catGovernance', 'catResponse', 'catRecovery', 'catSupplyChain', 'catProtection', 'catProtection', 'catProtection', 'catProtection', 'catProtection', 'catProtection', 'catProtection', 'catGovernance'];

export function getRiskMeasures(t: T) {
  return RM_IDS.map((id, i) => ({
    id,
    label: t(`nis2c.${RM_LABEL_KEYS[i]}`),
    cat: t(`nis2c.${RM_CAT_KEYS[i]}`),
  }));
}

export function getRiskCategories(t: T) {
  return [...new Set(getRiskMeasures(t).map(m => m.cat))];
}

// ── Attach Types ────────────────────────────────────────────────
const ATT_IDS = ['risk_policy', 'bcm_plan', 'incident_plan', 'supply_chain_register', 'pentest_report', 'other'] as const;
const ATT_ICONS = ['📋', '🔄', '🚨', '📦', '🔍', '📎'];
const ATT_ACCEPTS = ['.pdf,.docx', '.pdf,.docx', '.pdf,.docx', '.xlsx,.csv,.pdf', '.pdf,.docx', '*'];
const ATT_KEYS = ['attRiskPolicy', 'attBcmPlan', 'attIncidentPlan', 'attSupplyChainRegister', 'attPentestReport', 'attOther'];

export function getAttachTypes(t: T) {
  return ATT_IDS.map((id, i) => ({
    id,
    label: t(`nis2c.${ATT_KEYS[i]}`),
    icon: ATT_ICONS[i],
    accept: ATT_ACCEPTS[i],
  }));
}

// ── Types ───────────────────────────────────────────────────────

export interface Nis2Risk {
  id: number;
  category: string; // C, I, A, G, S (supply chain), R (resilience)
  name: string;
  component: string;
  attacker: string;
  path: string;
  nis2Ref: string;
  likelihood: number;
  impact: number;
  evidence: string;
  rationale: string;
  sources: string[];
  evidenceQuality: number;
  reproducibility: string;
}

export function riskId(r: Nis2Risk): string {
  return `${r.category}-${String(r.id).padStart(3, '0')}`;
}

export interface Nis2Req {
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
  certified: boolean;
}

export interface Nis2IntakeData {
  entityName: string;
  entityType: string[];
  criticality: string;
  description: string;
  infrastructure: string[];
  supplyChainProviders: string[];
  roles: string[];
  customRole: string;
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: Nis2IntakeData = {
  entityName: '', entityType: [], criticality: '',
  description: '', infrastructure: [],
  supplyChainProviders: [], roles: [], customRole: '',
  measures: {}, knownIssues: '', files: [],
};

// ── Risk Categories (CIAGSR for NIS-2) ─────────────────
export const RISK_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  C: { label: { de: 'Vertraulichkeit', en: 'Confidentiality', fr: 'Confidentialité' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  I: { label: { de: 'Integrität', en: 'Integrity', fr: 'Intégrité' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  A: { label: { de: 'Verfügbarkeit', en: 'Availability', fr: 'Disponibilité' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  G: { label: { de: 'Governance', en: 'Governance', fr: 'Gouvernance' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  S: { label: { de: 'Lieferkette', en: 'Supply Chain', fr: 'Chaîne d\'approvisionnement' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  R: { label: { de: 'Resilienz', en: 'Resilience', fr: 'Résilience' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
};

// ── Demo Risks (14 risks across all 6 categories) ──────────────
// Sector-specific variants for Risk #1 (Confidentiality).
// Remaining risks (2-14) are generic and apply across all sectors.

const RISK1_BY_SECTOR: Record<string, Nis2Risk> = {
  health: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Patientendaten zwischen Standorten', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → Gesundheitsdaten im Klartext → Datenabfluss', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Standort A und B nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt HL7-FHIR-Nachrichten mit Patientendaten im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Gesundheitsdaten unterliegen höchstem Schutzbedarf (DSGVO Art. 9, NIS-2 Art. 21). Offenlegung führt zu Meldepflicht und erheblichem Reputationsschaden.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
  transport: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Steuerungsdaten zwischen Betriebsstandorten', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → Verkehrssteuerungsdaten im Klartext → Manipulation möglich', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Leitstelle und Außenstellen nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt Steuerungsbefehle für Wechselverkehrszeichen und Tunnelbelüftung im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Manipulation von Verkehrssteuerungsdaten kann unmittelbar die öffentliche Sicherheit gefährden.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
  energy: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Netzsteuerungsdaten zwischen Standorten', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → SCADA-Steuerdaten im Klartext → Manipulation der Energieversorgung möglich', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Leitstelle und Umspannwerken nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt IEC 60870-5-104 Telegramme mit Schaltbefehlen im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Manipulation von Netzsteuerungsbefehlen kann zu Versorgungsausfällen führen, die tausende Haushalte betreffen.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
  digital_infra: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Kundendaten zwischen Rechenzentren', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → Kundendaten im Klartext → Datenabfluss', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Rechenzentren nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt Replikationsdaten mit Kundeninformationen im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Datenabfluss betrifft potenziell alle gehosteten Kunden und löst umfangreiche Meldepflichten aus.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
  public_admin: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Bürgerdaten zwischen Behördenstandorten', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → Verwaltungsdaten im Klartext → Datenabfluss', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Behördenstandorten nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt Meldedaten und Sozialdaten im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Bürgerdaten unterliegen besonderem Schutzbedarf. Offenlegung führt zu Meldepflicht und Vertrauensverlust.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
  manufacturing: {
    id: 1, category: 'C', name: 'Unverschlüsselte Übertragung von Produktionsdaten zwischen Werksstandorten', component: 'Standortverbindung / WAN', attacker: 'Man-in-the-Middle / Netzwerk-Mitleser', path: 'Site-to-Site-Verbindung ohne End-to-End-Verschlüsselung → Produktionsdaten und Betriebsgeheimnisse im Klartext → Industriespionage', nis2Ref: 'Art. 21 Abs. 2 lit. h',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: WAN-Verbindung zwischen Produktionsstandorten nutzt MPLS ohne zusätzliche Verschlüsselung. Pcap-Analyse zeigt OPC-UA-Telemetrie und Rezepturdaten im Klartext. Dokumentiert in Prüfbericht NW-2025-001.',
    rationale: 'Likelihood 4: MPLS-Netze sind nicht inhärent verschlüsselt, Provider-seitige Kompromittierung ist realistisch. Impact 5: Industriespionage und Manipulation von Produktionsprozessen können existenzbedrohend sein.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. h: Einsatz von Kryptografie', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 5, reproducibility: 'easy',
  },
};

const DEFAULT_RISK1 = RISK1_BY_SECTOR.energy;

const GENERIC_RISKS: Nis2Risk[] = [
  { id: 2, category: 'C', name: 'Unzureichende Zugriffskontrolle auf kritische OT-Systeme', component: 'SCADA / Prozessleitsystem', attacker: 'Insider / kompromittierter Account', path: 'Shared Admin-Accounts auf SCADA-HMI → keine individuelle Nachvollziehbarkeit → unbefugter Zugriff auf Steuerungsfunktionen', nis2Ref: 'Art. 21 Abs. 2 lit. i',
    likelihood: 4, impact: 4,
    evidence: 'Konfigurationsaudit: 3 von 5 SCADA-HMI-Stationen nutzen einen gemeinsamen Admin-Account (admin/admin). Keine individuelle Authentifizierung. Kein Audit-Log auf Benutzerebene. Active Directory nicht an OT angebunden.',
    rationale: 'Likelihood 4: Shared Accounts sind in OT-Umgebungen häufig, Missbrauch schwer nachweisbar. Impact 4: Unbefugte Steuerungsänderungen können Produktionsprozesse stören.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. i: Zugangs- und Zugriffskontrollen', 'IEC 62443-3-3 SR 1.1'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 3, category: 'I', name: 'Fehlende Integritätsprüfung bei Software-Updates für OT-Systeme', component: 'Firmware-Update-Prozess', attacker: 'Supply-Chain-Angreifer', path: 'OT-Firmware-Updates ohne Signaturprüfung → manipulierte Firmware → Kompromittierung der Steuerungslogik', nis2Ref: 'Art. 21 Abs. 2 lit. e',
    likelihood: 3, impact: 5,
    evidence: 'Prozessanalyse: Firmware-Updates für SPS-Steuerungen werden manuell per USB-Stick aufgespielt. Keine kryptografische Signaturprüfung. Keine SBOM-Validierung. Letzter Lieferanten-Audit: nie durchgeführt.',
    rationale: 'Likelihood 3: Erfordert Zugang zur Update-Kette, aber Supply-Chain-Angriffe nehmen zu (SolarWinds, Kaseya). Impact 5: Manipulierte Steuerungslogik kann physische Schäden verursachen.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. e: Sicherheit bei Erwerb, Entwicklung und Wartung', 'BSI-CS 005'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 4, category: 'I', name: 'Keine Integritätsüberwachung kritischer Konfigurationsdateien', component: 'Serversysteme / Active Directory', attacker: 'Privilegierter Insider / APT', path: 'Keine File-Integrity-Monitoring → unbemerkte Konfigurationsänderungen → Backdoor-Installation', nis2Ref: 'Art. 21 Abs. 2 lit. a',
    likelihood: 3, impact: 4,
    evidence: 'Konfigurationsanalyse: Kein File-Integrity-Monitoring (FIM) auf Domain-Controllern und kritischen Servern. GPO-Änderungen werden nicht automatisch alarmiert. Letzte manuelle Konfigurationsprüfung: 8 Monate.',
    rationale: 'Likelihood 3: APT-Gruppen nutzen Konfigurationsänderungen als Persistenz-Mechanismus. Impact 4: Unbemerkte Backdoors ermöglichen langfristigen Zugriff.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. a: Risikoanalyse und Sicherheitskonzepte', 'MITRE ATT&CK T1036'], evidenceQuality: 3, reproducibility: 'medium' },
  { id: 5, category: 'A', name: 'Kein getesteter Business-Continuity-Plan für kritische Dienste', component: 'Gesamtorganisation / BCM', attacker: 'Ransomware / Naturkatastrophe', path: 'BCP nur auf Papier → im Ernstfall keine koordinierte Reaktion → verlängerter Ausfall kritischer Dienste', nis2Ref: 'Art. 21 Abs. 2 lit. c',
    likelihood: 4, impact: 5,
    evidence: 'Dokumentenprüfung: BCP (Version 1.2, Stand 2023-09) existiert. Letzter vollständiger BCP-Test: nie durchgeführt. Backup-Restore-Tests nur für Einzelsysteme. Kein Krisenhandbuch für die Geschäftsleitung.',
    rationale: 'Likelihood 4: Ransomware-Angriffe auf kritische Infrastrukturen nehmen stark zu. Ohne getesteten Plan ist koordinierte Reaktion unmöglich. Impact 5: Ausfall kritischer Dienste mit Auswirkung auf öffentliche Versorgung.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. c: Aufrechterhaltung des Betriebs', 'ISO 22301:2019'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 6, category: 'A', name: 'Single Point of Failure in der Netzwerkarchitektur', component: 'Core-Switch / Netzwerk-Backbone', attacker: 'Hardwareausfall / gezielte Sabotage', path: 'Zentraler Core-Switch ohne Redundanz → Ausfall → kompletter Netzwerkzusammenbruch', nis2Ref: 'Art. 21 Abs. 2 lit. c',
    likelihood: 3, impact: 5,
    evidence: 'Architektur-Review: Zentraler Core-Switch (Cisco Catalyst 9500) ohne HA-Partner. Kein Spanning-Tree-Fallback. MTTR bei Hardwareausfall: geschätzt 48-72h (Ersatzteilbeschaffung). Alle VLANs laufen über diesen Switch.',
    rationale: 'Likelihood 3: Hardwareausfälle sind statistisch wahrscheinlich (MTBF beachten). Impact 5: Totalausfall aller Netzwerkdienste für alle Standortbereiche.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. c: Backup-Management und Wiederherstellung', 'BSI-Grundschutz NET.1.1'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 7, category: 'A', name: 'Keine DDoS-Mitigation für öffentlich erreichbare Dienste', component: 'Webportal / API-Gateway', attacker: 'Externer Angreifer', path: 'Volumetrischer DDoS → öffentliche Dienste nicht erreichbar → Bürger/Kunden betroffen', nis2Ref: 'Art. 21 Abs. 2 lit. b',
    likelihood: 4, impact: 4,
    evidence: 'Infrastruktur-Review: Kein DDoS-Mitigation-Dienst. WAF vorhanden, aber ohne Rate-Limiting. Lasttest: 3000 gleichzeitige Requests führen zu Service-Degradation.',
    rationale: 'Likelihood 4: DDoS-as-a-Service ist billig. Kritische Infrastrukturen sind priorisierte Ziele. Impact 4: Dienstausfall für Öffentlichkeit, aber kein Datenverlust.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. b: Bewältigung von Sicherheitsvorfällen', 'NIST SP 800-189'], evidenceQuality: 3, reproducibility: 'medium' },
  { id: 8, category: 'G', name: 'Fehlende Verantwortung der Geschäftsleitung für Cybersicherheit', component: 'Management / Governance', attacker: 'Regulatorisches Risiko', path: 'Keine dokumentierte GL-Verantwortung → strategische Lücken → Sanktionsrisiko nach Art. 20', nis2Ref: 'Art. 20',
    likelihood: 5, impact: 4,
    evidence: 'Organisationsanalyse: Cybersicherheit ist dem IT-Leiter zugeordnet, nicht der Geschäftsleitung. Kein dokumentiertes Mandat. Kein regelmäßiges Reporting an GL. GL hat keine NIS-2-Schulung absolviert.',
    rationale: 'Likelihood 5: Art. 20 NIS-2 verlangt explizit GL-Verantwortung mit persönlicher Haftung. Bei Prüfung sofort beanstandet. Impact 4: Bußgelder bis 10 Mio. EUR oder 2% des Umsatzes.',
    sources: ['NIS-2 Art. 20: Governance und Verantwortung der Leitungsorgane', 'NIS2UmsuCG § 38'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 9, category: 'G', name: 'Fehlende NIS-2-spezifische Schulungen für Geschäftsleitung', component: 'Personal / Schulungsprogramm', attacker: 'Social Engineering / Compliance-Risiko', path: 'GL ohne Cybersicherheits-Schulung → uninformierte Risikoentscheidungen → Haftungsrisiko', nis2Ref: 'Art. 20 Abs. 2',
    likelihood: 5, impact: 3,
    evidence: 'Schulungsnachweis-Prüfung: Kein GL-Mitglied hat in den letzten 24 Monaten eine Cybersicherheits-Schulung absolviert. Allgemeine Mitarbeiter-Awareness: 58% Teilnahmequote. Phishing-Simulation: 25% Klickrate.',
    rationale: 'Likelihood 5: Art. 20 Abs. 2 NIS-2 verpflichtet GL-Mitglieder explizit zur Teilnahme an Schulungen. Impact 3: Primär regulatorisches Risiko, aber auch operatives Risiko durch uninformierte Entscheidungen.',
    sources: ['NIS-2 Art. 20 Abs. 2: Schulungspflicht für Leitungsorgane', 'BSI-Grundschutz ORP.3'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 10, category: 'S', name: 'Keine Sicherheitsbewertung kritischer Lieferanten', component: 'Lieferantenmanagement', attacker: 'Supply-Chain-Angreifer', path: 'Lieferanten-Sicherheitsniveau unbekannt → Kompromittierung über Lieferkette → Zugang zu internen Systemen', nis2Ref: 'Art. 21 Abs. 2 lit. d',
    likelihood: 4, impact: 4,
    evidence: 'Vertragsanalyse: 12 von 18 kritischen Lieferanten ohne Sicherheitsbewertung. Kein standardisierter Fragebogen. Keine SLA-Klauseln zu Cybersicherheit. Kein Recht auf Sicherheitsaudits vertraglich vereinbart.',
    rationale: 'Likelihood 4: Supply-Chain-Angriffe nehmen stark zu. Ohne Bewertung ist das Sicherheitsniveau unbekannt. Impact 4: Kompromittierung über vertrauenswürdigen Lieferanten umgeht Perimeter-Schutz.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. d: Sicherheit der Lieferkette', 'ENISA Supply Chain Guidelines'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 11, category: 'S', name: 'Unvollständiges Lieferantenregister für IKT-Produkte und -Dienste', component: 'Vendor-Management', attacker: 'Regulatorisches Risiko', path: 'Unvollständige Übersicht → unerkannte Abhängigkeiten → Risikoaggregation unmöglich', nis2Ref: 'Art. 21 Abs. 2 lit. d',
    likelihood: 5, impact: 3,
    evidence: 'Registerprüfung: 38 von geschätzten 55 IKT-Lieferanten erfasst. Fehlende Einträge betreffen u.a. Open-Source-Abhängigkeiten, Cloud-Sub-Prozessoren und Wartungsvertragspartner. Keine Klassifikation nach Kritikalität.',
    rationale: 'Likelihood 5: NIS-2 verlangt Übersicht über Lieferkette. Bei Prüfung sofort als Mangel erkannt. Impact 3: Governance-Verstoß, aber kein direkter technischer Schaden.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. d: Sicherheit der Lieferkette', 'BSI-Grundschutz OPS.2.1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 12, category: 'S', name: 'Keine Notfallplanung bei Ausfall kritischer Dienstleister', component: 'Cloud-Provider / Hosting', attacker: 'Provider-Ausfall / Insolvenz', path: 'Kein Exit-Plan → Provider-Wechsel dauert Monate → Service-Unterbrechung', nis2Ref: 'Art. 21 Abs. 2 lit. d',
    likelihood: 3, impact: 5,
    evidence: 'Vertragsanalyse: Kein Exit-Plan für primären Cloud-Provider. Keine Datenportabilitäts-Tests. Geschätzte Migrationszeit: 4-8 Monate. Keine Multi-Cloud-Strategie.',
    rationale: 'Likelihood 3: Provider-Ausfälle selten, aber realistisch (OVH-Brand 2021). Impact 5: Kompletter Dienst-Ausfall über Wochen bis Monate.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. d: Lieferkettensicherheit', 'ENISA Cloud Security Guide'], evidenceQuality: 3, reproducibility: 'hard' },
  { id: 13, category: 'R', name: 'Kein strukturiertes Schwachstellenmanagement', component: 'IT-Infrastruktur gesamt', attacker: 'Externer Angreifer / Exploit-Kit', path: 'Ungepatchte Schwachstellen → automatisierte Exploitation → Systemkompromittierung', nis2Ref: 'Art. 21 Abs. 2 lit. e',
    likelihood: 4, impact: 4,
    evidence: 'Vulnerability-Scan: 127 CVEs mit CVSS >= 7.0 auf exponierten Systemen. Davon 23 mit CVSS >= 9.0. Älteste ungepatchte CVE: 14 Monate alt. Kein regelmäßiger Scan-Zyklus. Kein Patch-Priorisierungsprozess.',
    rationale: 'Likelihood 4: Automatisierte Exploit-Kits nutzen bekannte CVEs. 23 kritische CVEs bieten breite Angriffsfläche. Impact 4: Systemkompromittierung mit Zugang zu internen Netzwerken.',
    sources: ['NIS-2 Art. 21 Abs. 2 lit. e: Schwachstellenmanagement', 'FIRST CVSS v4.0'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 14, category: 'R', name: 'Meldeprozess nicht auf NIS-2-Fristen ausgerichtet', component: 'Incident-Response-Team', attacker: 'Regulatorisches Risiko', path: 'Kein 24h-Frühwarnungs-Prozess → Meldefrist verpasst → Bußgeld', nis2Ref: 'Art. 23',
    likelihood: 4, impact: 4,
    evidence: 'Prozessanalyse: IR-Plan (Version 2.0) definiert Eskalation an CISO innerhalb 48h. NIS-2 fordert 24h-Frühwarnung, 72h-Erstmeldung. Keine vorbereiteten Meldeformulare. Kein Probelauf mit BSI.',
    rationale: 'Likelihood 4: NIS-2-Meldepflichten gelten ab Umsetzung. Jeder erhebliche Sicherheitsvorfall erfordert Meldung. Impact 4: Fristversäumnis führt zu Bußgeld und aufsichtlichen Konsequenzen.',
    sources: ['NIS-2 Art. 23: Meldepflichten bei erheblichen Sicherheitsvorfällen', 'NIS2UmsuCG § 32'], evidenceQuality: 4, reproducibility: 'easy' },
];

/** Returns sector-appropriate NIS-2 risks based on entity type(s). */
export function getNis2Risks(entityTypes?: string[]): Nis2Risk[] {
  const sector = entityTypes?.[0] ?? 'energy';
  const risk1 = RISK1_BY_SECTOR[sector] ?? DEFAULT_RISK1;
  return [risk1, ...GENERIC_RISKS];
}

/** @deprecated Use getNis2Risks(entityTypes) for sector-correct data. */
export const NIS2_RISKS: Nis2Risk[] = getNis2Risks(['energy']);

// ── Demo NIS-2 Requirements (22 requirements) ────────────────────

export const NIS2_REQS: Nis2Req[] = [
  // ═══ Art. 20 — Governance ═══
  { id: 'N20-1', article: 'Art. 20 Abs. 1', name: 'Verantwortung der Geschäftsleitung', status: 'fail',
    gap: 'Keine dokumentierte GL-Verantwortung für Cybersicherheit. Kein Reporting-Prozess.',
    evidence: 'Organisationsanalyse: Cybersicherheit organisatorisch beim IT-Leiter angesiedelt. Kein GL-Mandat. Kein regelmäßiges Board-Reporting zu Cyberrisiken.',
    rationale: 'Nicht erfüllt: Art. 20 Abs. 1 NIS-2 verlangt explizit, dass Leitungsorgane die Risikomanagementmaßnahmen billigen und deren Umsetzung überwachen.',
    measure: 'GL-Mandat für Cybersicherheit dokumentieren. Quartalsweises Reporting einführen. Verantwortlichkeiten formal zuordnen.',
    criteria: ['GL-Mandat dokumentiert und unterzeichnet', 'Quartalsweises Cyber-Reporting an Geschäftsleitung', 'Verantwortlichkeiten-Matrix erstellt'],
    effort: '20-40h', priority: 'P0' },

  { id: 'N20-2', article: 'Art. 20 Abs. 2', name: 'Schulungspflicht der Geschäftsleitung', status: 'fail',
    gap: 'Kein GL-Mitglied hat Cybersicherheits-Schulung absolviert.',
    evidence: 'Schulungsnachweis-Prüfung: 0% GL-Schulungsquote für Cybersicherheit. Allgemeine Awareness-Quote: 58%.',
    rationale: 'Nicht erfüllt: Art. 20 Abs. 2 verpflichtet GL-Mitglieder zur Teilnahme an Cybersicherheits-Schulungen.',
    measure: 'NIS-2-spezifische Schulung für alle GL-Mitglieder durchführen. Jährliche Wiederholung etablieren.',
    criteria: ['100% GL-Mitglieder geschult', 'Jährlicher Schulungsnachweis dokumentiert', 'Schulungsinhalte umfassen NIS-2-Anforderungen'],
    effort: '10-20h', priority: 'P0' },

  // ═══ Art. 21 — Risikomanagementmaßnahmen ═══
  { id: 'N21-1', article: 'Art. 21 Abs. 2 lit. a', name: 'Risikoanalyse und Sicherheitskonzepte', status: 'partial',
    gap: 'Risikoanalyse vorhanden, aber nicht auf NIS-2-Anforderungen aktualisiert. Kein All-Gefahren-Ansatz.',
    evidence: 'Dokumentenprüfung: Risikoanalyse (Version 2.1, Stand 2024-03) basiert auf ISO 27001. NIS-2-spezifischer All-Gefahren-Ansatz (physische Risiken, Naturkatastrophen) nicht vollständig abgebildet.',
    rationale: 'Teilweise erfüllt: Grundlegende Risikoanalyse vorhanden, aber NIS-2 verlangt erweiterten All-Gefahren-Ansatz.',
    measure: 'Risikoanalyse auf NIS-2 Art. 21 aktualisieren. All-Gefahren-Ansatz implementieren. Jährliche Überprüfung formalisieren.',
    criteria: ['Risikoanalyse referenziert NIS-2 Art. 21 explizit', 'All-Gefahren-Ansatz dokumentiert', 'Jährliche Überprüfung im Governance-Kalender'],
    effort: '30-50h', priority: 'P1' },

  { id: 'N21-2', article: 'Art. 21 Abs. 2 lit. b', name: 'Bewältigung von Sicherheitsvorfällen', status: 'partial',
    gap: 'Incident-Response-Prozess vorhanden, aber nicht NIS-2-konform. Keine automatisierte Klassifizierung.',
    evidence: 'Prozessprüfung: IR-Prozess basiert auf ITIL. Klassifizierung nutzt interne Skala, nicht NIS-2-Kriterien. Keine automatisierte Bewertung.',
    rationale: 'Teilweise erfüllt: Prozess operativ, aber Klassifizierung muss auf NIS-2-Kriterien umgestellt werden.',
    measure: 'Klassifizierungskriterien auf NIS-2 Art. 23 umstellen. Automatisierung implementieren.',
    criteria: ['Klassifizierung nach NIS-2-Kriterien implementiert', 'Automatisierte Schweregrad-Bewertung', 'Dokumentiertes Mapping ITIL → NIS-2'],
    effort: '20-30h', priority: 'P1' },

  { id: 'N21-3', article: 'Art. 21 Abs. 2 lit. c', name: 'Aufrechterhaltung des Betriebs und Krisenmanagement', status: 'fail',
    gap: 'BCP nicht getestet. Kein dokumentiertes Krisenmanagement. Backup-Recovery nicht validiert.',
    evidence: 'BCP (Version 1.2) existiert. Letzter BCP-Test: nie. Backup vorhanden, aber Recovery-Test für kritische Systeme: 18 Monate alt. RTO-Abweichung: dokumentiert 4h, tatsächlich gemessen 22h.',
    rationale: 'Nicht erfüllt: NIS-2 Art. 21 Abs. 2 lit. c verlangt getestete Pläne. Ein ungetesteter Plan hat im Ernstfall keinen Wert.',
    measure: 'Jährlichen BCP-Test durchführen. Krisenhandbuch erstellen. Backup-Recovery quartalsweise testen.',
    criteria: ['Jährlicher BCP-Test durchgeführt und dokumentiert', 'Krisenhandbuch für GL erstellt', 'Quartalsweise Recovery-Tests mit RTO-Validierung'],
    effort: '40-60h', priority: 'P0' },

  { id: 'N21-4', article: 'Art. 21 Abs. 2 lit. d', name: 'Sicherheit der Lieferkette', status: 'fail',
    gap: 'Keine systematische Lieferantenbewertung. Kein Lieferantenregister. Keine Exit-Strategien.',
    evidence: 'Lieferantenanalyse: 12 von 18 kritischen Lieferanten ohne Sicherheitsbewertung. Register unvollständig (38/55). Keine Exit-Pläne für kritische Provider.',
    rationale: 'Nicht erfüllt: Art. 21 Abs. 2 lit. d ist eines der Kernelemente von NIS-2. Lieferkettensicherheit wird explizit und detailliert gefordert.',
    measure: '1. Lieferantenregister vervollständigen. 2. Sicherheitsbewertung für alle kritischen Lieferanten. 3. Exit-Strategien dokumentieren.',
    criteria: ['Register enthält 100% der IKT-Lieferanten', 'Sicherheitsbewertung für alle kritischen Lieferanten', 'Exit-Strategie für jeden kritischen Provider'],
    effort: '50-80h', priority: 'P0' },

  { id: 'N21-5', article: 'Art. 21 Abs. 2 lit. e', name: 'Sicherheit bei Erwerb, Entwicklung und Wartung', status: 'partial',
    gap: 'Grundlegende Prozesse vorhanden, aber kein Schwachstellenmanagement. Keine SBOM-Pflicht.',
    evidence: 'Prozessanalyse: Change-Management-Prozess vorhanden. Kein strukturiertes Vulnerability-Management. 127 offene CVEs >= 7.0. Keine SBOM für eigene Produkte.',
    rationale: 'Teilweise erfüllt: Change-Prozess existiert, aber Schwachstellenmanagement fehlt.',
    measure: 'Vulnerability-Management-Prozess einführen. Monatliche Scans. SBOM-Erstellung für kritische Systeme.',
    criteria: ['Monatliche Vulnerability-Scans', 'Patch-SLA: kritisch < 72h, hoch < 14d', 'SBOM für kritische Systeme erstellt'],
    effort: '30-50h', priority: 'P1' },

  { id: 'N21-6', article: 'Art. 21 Abs. 2 lit. f', name: 'Bewertung der Wirksamkeit von Maßnahmen', status: 'partial',
    gap: 'Jährliche Pentests, aber nicht alle kritischen Systeme abgedeckt. Keine KPI-basierte Wirksamkeitsmessung.',
    evidence: 'Testbericht-Review: Pentests decken externe Angriffsfläche ab. Interne Tests: nur Ad-hoc. Keine kontinuierliche Wirksamkeitsmessung. Keine definierten Security-KPIs.',
    rationale: 'Teilweise erfüllt: Tests werden durchgeführt, aber Scope und systematische Bewertung sind unzureichend.',
    measure: 'Jährliches Testprogramm erweitern. Security-KPIs definieren. Quartalsweise Wirksamkeitsbewertung.',
    criteria: ['Pentests für alle kritischen Systeme', 'Security-KPIs definiert und gemessen', 'Quartalsweise Wirksamkeitsberichte'],
    effort: '25-40h', priority: 'P2' },

  { id: 'N21-7', article: 'Art. 21 Abs. 2 lit. g', name: 'Grundlegende Cyberhygiene und Schulungen', status: 'partial',
    gap: 'Awareness-Programm vorhanden, aber Teilnahmequote zu niedrig. Phishing-Klickrate über Benchmark.',
    evidence: 'Schulungsstatistik: 58% Awareness-Teilnahmequote (Ziel: 95%). Phishing-Klickrate: 25% (Benchmark: < 5%). Kein rollenbasiertes Schulungskonzept.',
    rationale: 'Teilweise erfüllt: Programm existiert, aber Durchdringung und Wirksamkeit unzureichend.',
    measure: 'Schulungsquote auf 95% erhöhen. Rollenbasiertes Konzept einführen. Monatliche Phishing-Simulationen.',
    criteria: ['Schulungsquote >= 95%', 'Phishing-Klickrate < 5%', 'Rollenbasiertes Schulungskonzept implementiert'],
    effort: '15-25h', priority: 'P2' },

  { id: 'N21-8', article: 'Art. 21 Abs. 2 lit. h', name: 'Einsatz von Kryptografie und Verschlüsselung', status: 'fail',
    gap: 'Interne Kommunikation teilweise unverschlüsselt. Keine Kryptografie-Richtlinie.',
    evidence: 'Netzwerkanalyse: WAN-Verbindung ohne E2E-Verschlüsselung. 30% der internen Webdienste nur HTTP. Keine dokumentierte Kryptografie-Richtlinie. Keine Schlüsselmanagement-Prozedur.',
    rationale: 'Nicht erfüllt: Art. 21 Abs. 2 lit. h fordert explizit Konzepte für den Einsatz von Kryptografie.',
    measure: 'Kryptografie-Richtlinie erstellen. TLS auf allen Diensten erzwingen. Schlüsselmanagement einführen.',
    criteria: ['Kryptografie-Richtlinie dokumentiert und genehmigt', '100% TLS auf internen und externen Diensten', 'Schlüsselmanagement-Prozedur implementiert'],
    effort: '30-50h', priority: 'P0' },

  { id: 'N21-9', article: 'Art. 21 Abs. 2 lit. i', name: 'Zugangs- und Zugriffskontrollen', status: 'partial',
    gap: 'AD-basierte Zugriffskontrolle für IT, aber OT-Systeme mit Shared Accounts. Kein PAM.',
    evidence: 'Audit: Active Directory für IT-Systeme mit RBAC. OT-Systeme: 3/5 SCADA-HMIs mit Shared Accounts. Kein Privileged Access Management. Keine regelmäßige Rezertifizierung.',
    rationale: 'Teilweise erfüllt: IT-Zugriffskontrolle funktioniert, aber OT-Bereich hat kritische Lücken.',
    measure: 'OT-Systeme an zentrale Authentifizierung anbinden. PAM einführen. Halbjährliche Rezertifizierung.',
    criteria: ['Individuelle Accounts auf allen SCADA/HMI-Systemen', 'PAM für privilegierte Zugriffe', 'Halbjährliche Rezertifizierung aller Berechtigungen'],
    effort: '40-60h', priority: 'P1' },

  { id: 'N21-10', article: 'Art. 21 Abs. 2 lit. j', name: 'Multi-Faktor-Authentifizierung', status: 'partial',
    gap: 'MFA für VPN und Cloud-Dienste, aber nicht für alle kritischen Systeme.',
    evidence: 'MFA-Analyse: VPN-Zugang mit MFA (MS Authenticator). Cloud-Dienste (M365, Azure) mit MFA. Kritische interne Systeme (AD Admin, SIEM, Backup-Konsole): kein MFA. OT-Systeme: kein MFA.',
    rationale: 'Teilweise erfüllt: MFA für externe Zugänge vorhanden, aber für interne kritische Systeme fehlt es.',
    measure: 'MFA auf alle kritischen Systeme ausweiten. Conditional-Access-Policies implementieren.',
    criteria: ['MFA für alle Admin-Zugänge', 'MFA für alle kritischen internen Systeme', 'Conditional-Access-Policies konfiguriert'],
    effort: '20-30h', priority: 'P1' },

  { id: 'N21-11', article: 'Art. 21 Abs. 2 lit. k', name: 'Gesicherte Sprach-, Video- und Textkommunikation', status: 'pass',
    gap: '',
    evidence: 'Kommunikationsanalyse: Microsoft Teams mit E2E-Verschlüsselung für vertrauliche Gespräche. E-Mail über Exchange Online mit TLS. Signal für Krisenkommunikation. VoIP über SIP-TLS.',
    rationale: 'Erfüllt: Verschlüsselte Kommunikationskanäle sind flächendeckend implementiert.',
    measure: '', criteria: [], effort: '', priority: '' },

  // ═══ Art. 23 — Meldepflichten ═══
  { id: 'N23-1', article: 'Art. 23 Abs. 1-4', name: 'Meldung erheblicher Sicherheitsvorfälle', status: 'fail',
    gap: 'Meldeprozess nicht auf NIS-2-Fristen ausgerichtet. Keine Meldevorlagen. Kein Probelauf.',
    evidence: 'IR-Plan sieht Meldung innerhalb 48h vor. NIS-2 fordert 24h Frühwarnung, 72h Erstmeldung. Keine Meldevorlagen. Kein Probelauf mit BSI.',
    rationale: 'Nicht erfüllt: Die 24h-Frist für die Frühwarnung ist eine harte regulatorische Anforderung.',
    measure: '1. Meldeprozess auf 24h-Frist umstellen. 2. Meldevorlagen erstellen. 3. Halbjährliche Trockenübung.',
    criteria: ['24h-Frühwarnung im Prozess verankert', 'Meldevorlagen nach NIS-2-Vorgaben', 'Halbjährliche Meldeübung durchgeführt'],
    effort: '25-40h', priority: 'P0' },

  // ═══ Art. 25 — Registrierung ═══
  { id: 'N25-1', article: 'Art. 25', name: 'Registrierung bei zuständiger Behörde', status: 'fail',
    gap: 'Noch keine Registrierung beim BSI erfolgt.',
    evidence: 'Prüfung: Keine Registrierung als wesentliche/wichtige Einrichtung beim BSI. Keine Kontaktstelle benannt.',
    rationale: 'Nicht erfüllt: Art. 25 NIS-2 verlangt Registrierung bei der zuständigen nationalen Behörde.',
    measure: 'Registrierung beim BSI durchführen. Kontaktstelle benennen. Angaben aktuell halten.',
    criteria: ['Registrierung beim BSI abgeschlossen', 'Kontaktstelle benannt und kommuniziert', 'Daten quartalsweise auf Aktualität geprüft'],
    effort: '8-16h', priority: 'P0' },

  // ═══ Ergänzende Anforderungen ═══
  { id: 'N21-12', article: 'Art. 21 Abs. 1', name: 'Geeignete und verhältnismäßige Maßnahmen', status: 'pass',
    gap: '',
    evidence: 'Maßnahmenanalyse: Implementierte Sicherheitsmaßnahmen berücksichtigen Unternehmensgröße, Risikoprofil und gesellschaftliche Auswirkungen.',
    rationale: 'Erfüllt: Verhältnismäßigkeitsgrundsatz wird im Sicherheitskonzept berücksichtigt.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'N21-13', article: 'Art. 21 Abs. 3', name: 'Berücksichtigung europäischer und internationaler Normen', status: 'pass',
    gap: '',
    evidence: 'Normenmapping: Sicherheitskonzept referenziert ISO 27001, IEC 62443, BSI-Grundschutz. Mapping auf NIS-2 dokumentiert.',
    rationale: 'Erfüllt: Relevante Normen werden systematisch berücksichtigt.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'N21-14', article: 'Art. 21 Abs. 2 lit. b', name: 'Sicherheitsvorfallsmanagement-Prozess', status: 'partial',
    gap: 'Grundprozess vorhanden, aber Klassifizierung nicht NIS-2-konform.',
    evidence: 'IR-Prozess basiert auf ITIL. Funktioniert operativ, aber Schweregrad-Klassifizierung nutzt interne Skala statt NIS-2-Kriterien.',
    rationale: 'Teilweise erfüllt: Prozess funktional, aber regulatorische Ausrichtung fehlt.',
    measure: 'Klassifizierung auf NIS-2-Kriterien umstellen.',
    criteria: ['NIS-2-konforme Klassifizierungskriterien', 'Automatisierte Bewertung implementiert'],
    effort: '15-25h', priority: 'P1' },

  { id: 'N21-15', article: 'Art. 21 Abs. 4', name: 'Meldung an zuständige Behörde bei Nichteinhaltung', status: 'pass',
    gap: '',
    evidence: 'Compliance-Prüfung: Verfahren zur Meldung von Nichteinhaltung ist dokumentiert und im Compliance-Management integriert.',
    rationale: 'Erfüllt: Meldeverfahren ist implementiert und getestet.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'N23-2', article: 'Art. 23 Abs. 5-7', name: 'Information betroffener Empfänger', status: 'partial',
    gap: 'Kommunikationsplan vorhanden, aber keine Vorlage für Betroffeneninformation.',
    evidence: 'Krisenkommunikationsplan existiert. Keine Vorlagen für Information betroffener Empfänger nach Art. 23 Abs. 7.',
    rationale: 'Teilweise erfüllt: Grundprozess vorhanden, aber spezifische NIS-2-Anforderungen nicht umgesetzt.',
    measure: 'Vorlagen für Betroffeneninformation erstellen. Kommunikationskanäle festlegen.',
    criteria: ['Vorlagen für Betroffeneninformation erstellt', 'Kommunikationskanäle definiert', 'Testlauf durchgeführt'],
    effort: '10-20h', priority: 'P2' },

  { id: 'N24-1', article: 'Art. 24', name: 'Nutzung europäischer Zertifizierungsschemata', status: 'pass',
    gap: '',
    evidence: 'Prüfung: ISO 27001-Zertifizierung vorhanden. BSI C5-Nachweis für Cloud-Nutzung. Mapping auf EUCS in Vorbereitung.',
    rationale: 'Erfüllt: Relevante Zertifizierungen vorhanden und aktuell.',
    measure: '', criteria: [], effort: '', priority: '' },

  { id: 'N32-1', article: 'Art. 32/33', name: 'Aufsichtsmaßnahmen und Sanktionsbereitschaft', status: 'partial',
    gap: 'Keine interne Vorbereitung auf aufsichtliche Prüfungen. Kein Audit-Readiness-Programm.',
    evidence: 'Compliance-Analyse: Keine dokumentierte Vorbereitung auf BSI-Prüfungen. Keine interne Audit-Readiness-Bewertung. Nachweisführung nicht standardisiert.',
    rationale: 'Teilweise erfüllt: Grundlegende Dokumentation vorhanden, aber nicht auf aufsichtliche Prüfungen ausgerichtet.',
    measure: 'Audit-Readiness-Programm aufsetzen. Nachweisführung standardisieren. Probe-Audit durchführen.',
    criteria: ['Audit-Readiness-Assessment durchgeführt', 'Nachweisführung standardisiert', 'Probe-Audit innerhalb 6 Monaten'],
    effort: '20-30h', priority: 'P2' },
];

// ── Demo Scenarios ──────────────────────────────────────────────

export interface DemoScenario {
  entity: { name: string; types: string[] };
  criticality: string;
  description: string;
  infrastructure: string[];
  supplyChainProviders: string[];
  roles: string[];
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    entity: { name: 'Stadtwerke Rheinberg GmbH', types: ['energy'] },
    criticality: 'essential',
    description: 'Kommunaler Energieversorger mit 85.000 Kunden. Strom- und Gasversorgung, Fernwärme. SCADA-basierte Netzsteuerung. 280 Mitarbeiter, 2 Standorte.',
    infrastructure: ['scada_ot', 'erp_system', 'network_infra', 'email_collab', 'vpn_remote'],
    supplyChainProviders: ['Cloud Service Provider (IaaS/PaaS/SaaS)', 'Managed Security Service Provider (MSSP)', 'Software-Lieferant / Entwicklungspartner', 'Telekommunikationsanbieter'],
    roles: ['Geschäftsführer', 'IT-Leiter', 'OT-Sicherheitsbeauftragter', 'Datenschutzbeauftragter', 'Compliance-Manager'],
    measures: { risk_analysis: { active: true, documented: true, audited: false, certified: false }, incident_handling: { active: true, documented: true, audited: false, certified: false }, bcm: { active: true, documented: true, audited: false, certified: false }, network_security: { active: true, documented: true, audited: true, certified: false }, access_control: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'BCP nie vollständig getestet. OT-Systeme mit Shared Accounts. Lieferantenregister unvollständig.',
    files: [
      { name: 'SW_Risikoanalyse_v2.1.pdf', size: 1_450_000, type: 'risk_policy' },
      { name: 'SW_BCP_2024.pdf', size: 980_000, type: 'bcm_plan' },
      { name: 'SW_IR-Plan_v2.0.pdf', size: 650_000, type: 'incident_plan' },
      { name: 'SW_Lieferanten_Register.xlsx', size: 180_000, type: 'supply_chain_register' },
    ],
  },
  {
    entity: { name: 'MedTech Klinikverbund AG', types: ['health'] },
    criticality: 'essential',
    description: 'Klinikverbund mit 3 Krankenhäusern und 12 MVZ. 4.200 Mitarbeiter. Digitale Patientenakte, medizinische IoT-Geräte. KIS/RIS/PACS-Systeme.',
    infrastructure: ['erp_system', 'cloud_services', 'network_infra', 'email_collab', 'iot_devices', 'data_center'],
    supplyChainProviders: ['Cloud Service Provider (IaaS/PaaS/SaaS)', 'Software-Lieferant / Entwicklungspartner', 'Hardware-Lieferant / OEM', 'Telekommunikationsanbieter', 'Rechenzentrumsbetreiber'],
    roles: ['Vorstand', 'CIO', 'CISO', 'Datenschutzbeauftragter', 'Medizintechnik-Leiter', 'Compliance-Beauftragter'],
    measures: { risk_analysis: { active: true, documented: true, audited: true, certified: false }, incident_handling: { active: true, documented: true, audited: false, certified: false }, network_security: { active: true, documented: true, audited: true, certified: false }, crypto: { active: true, documented: false, audited: false, certified: false }, access_control: { active: true, documented: true, audited: true, certified: false }, mfa: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'Patientendaten-Übertragung zwischen Standorten teilweise unverschlüsselt. Medizinische IoT-Geräte schwer patchbar.',
    files: [
      { name: 'MT_ISMS_Policy_v4.pdf', size: 2_100_000, type: 'risk_policy' },
      { name: 'MT_BCP_Klinikverbund.pdf', size: 1_340_000, type: 'bcm_plan' },
      { name: 'MT_Incident_Playbook.pdf', size: 890_000, type: 'incident_plan' },
      { name: 'MT_Pentest_Q4-2024.pdf', size: 1_780_000, type: 'pentest_report' },
    ],
  },
  {
    entity: { name: 'TransLog Infrastruktur GmbH', types: ['transport'] },
    criticality: 'essential',
    description: 'Betreiber von Verkehrsleitsystemen für Autobahnen in 3 Bundesländern. 150 Mitarbeiter. OT-lastige Infrastruktur mit Verkehrskameras, Wechselverkehrszeichen und Tunnelsteuerung.',
    infrastructure: ['scada_ot', 'network_infra', 'vpn_remote', 'iot_devices', 'data_center'],
    supplyChainProviders: ['Managed Security Service Provider (MSSP)', 'Hardware-Lieferant / OEM', 'Telekommunikationsanbieter', 'IT-Outsourcing-Dienstleister'],
    roles: ['Geschäftsführer', 'Technischer Leiter', 'IT-Sicherheitsbeauftragter', 'Betriebsleiter OT'],
    measures: { risk_analysis: { active: true, documented: true, audited: false, certified: false }, network_security: { active: true, documented: true, audited: true, certified: false }, access_control: { active: true, documented: false, audited: false, certified: false }, bcm: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'OT-Firmware-Updates ohne Signaturprüfung. Kein DDoS-Schutz für Verkehrsportal.',
    files: [
      { name: 'TL_Sicherheitskonzept_v3.pdf', size: 1_670_000, type: 'risk_policy' },
      { name: 'TL_BCM_Verkehrssteuerung.pdf', size: 920_000, type: 'bcm_plan' },
      { name: 'TL_Lieferanten_Übersicht.xlsx', size: 145_000, type: 'supply_chain_register' },
    ],
  },
  {
    entity: { name: 'CyberSecure Hosting AG', types: ['digital_infra'] },
    criticality: 'essential',
    description: 'Rechenzentrumsdienstleister mit 2 Standorten (Frankfurt, Berlin). Hosting für 120 Kunden, darunter KRITIS-Betreiber. ISO 27001 und BSI C5 zertifiziert. 95 Mitarbeiter.',
    infrastructure: ['data_center', 'cloud_services', 'network_infra', 'email_collab', 'vpn_remote'],
    supplyChainProviders: ['Hardware-Lieferant / OEM', 'Telekommunikationsanbieter', 'Managed Security Service Provider (MSSP)', 'Software-Lieferant / Entwicklungspartner'],
    roles: ['Geschäftsführer', 'CTO', 'CISO', 'Datenschutzbeauftragter', 'NOC-Leiter'],
    measures: { risk_analysis: { active: true, documented: true, audited: true, certified: true }, incident_handling: { active: true, documented: true, audited: true, certified: false }, bcm: { active: true, documented: true, audited: true, certified: false }, network_security: { active: true, documented: true, audited: true, certified: true }, access_control: { active: true, documented: true, audited: true, certified: false }, crypto: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'Georedundanz zwischen Standorten nicht vollständig getestet. Sub-Dienstleister-Übersicht lückenhaft.',
    files: [
      { name: 'CSH_ISMS_ISO27001_v5.pdf', size: 3_200_000, type: 'risk_policy' },
      { name: 'CSH_BCM_DR_Plan_2025.pdf', size: 1_450_000, type: 'bcm_plan' },
      { name: 'CSH_IR-Runbook_v3.pdf', size: 1_120_000, type: 'incident_plan' },
      { name: 'CSH_C5_Audit_Report_2024.pdf', size: 4_500_000, type: 'pentest_report' },
      { name: 'CSH_Lieferanten_Register.xlsx', size: 210_000, type: 'supply_chain_register' },
    ],
  },
  {
    entity: { name: 'Aqua Westfalen GmbH', types: ['water'] },
    criticality: 'essential',
    description: 'Wasserversorger für 320.000 Einwohner. 3 Wasserwerke, 1.200 km Leitungsnetz. SCADA-gesteuerte Prozessleittechnik. 180 Mitarbeiter.',
    infrastructure: ['scada_ot', 'erp_system', 'network_infra', 'iot_devices', 'vpn_remote'],
    supplyChainProviders: ['Hardware-Lieferant / OEM', 'Telekommunikationsanbieter', 'IT-Outsourcing-Dienstleister', 'Software-Lieferant / Entwicklungspartner'],
    roles: ['Technischer Geschäftsführer', 'IT-Leiter', 'OT-Sicherheitsbeauftragter', 'Betriebsleiter Wasserwerk'],
    measures: { risk_analysis: { active: true, documented: true, audited: false, certified: false }, network_security: { active: true, documented: true, audited: false, certified: false }, access_control: { active: true, documented: false, audited: false, certified: false }, bcm: { active: true, documented: true, audited: false, certified: false }, incident_handling: { active: true, documented: false, audited: false, certified: false } },
    knownIssues: 'SCADA-Systeme mit Windows XP Embedded. Remote-Wartungszugänge ohne MFA. Kein Netzwerk-Monitoring für OT-Segment.',
    files: [
      { name: 'AW_Sicherheitskonzept_OT_2024.pdf', size: 1_890_000, type: 'risk_policy' },
      { name: 'AW_Notfallplan_Wasserversorgung.pdf', size: 780_000, type: 'bcm_plan' },
      { name: 'AW_Netzplan_IT_OT.vsdx', size: 340_000, type: 'supply_chain_register' },
    ],
  },
];
