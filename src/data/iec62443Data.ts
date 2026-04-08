// ── IEC 62443 Compliance Tool Constants & Demo Data (i18n-aware) ─────────
// Based on IEC 62443 — Industrial Automation and Control Systems Security

type T = (key: string) => string;

// ── System Types ───────────────────────────────────────────────
const ST_KEYS = ['dcs', 'scada', 'plc', 'rtu', 'his', 'safety', 'edge', 'cloud'] as const;
const ST_ICONS = ['🏭', '📡', '🔧', '📟', '🖥️', '⚠️', '🔌', '☁️'];
const ST_T_KEYS = ['stDcs', 'stScada', 'stPlc', 'stRtu', 'stHis', 'stSafety', 'stEdge', 'stCloud'];
const ST_DESC_KEYS = ['stDcsDesc', 'stScadaDesc', 'stPlcDesc', 'stRtuDesc', 'stHisDesc', 'stSafetyDesc', 'stEdgeDesc', 'stCloudDesc'];

export function getSystemTypes(t: T) {
  return ST_KEYS.map((id, i) => ({
    id,
    label: t(`iec.${ST_T_KEYS[i]}`),
    icon: ST_ICONS[i],
    desc: t(`iec.${ST_DESC_KEYS[i]}`),
  }));
}

// ── Security Levels (SL 1-4) ────────────────────────────────────
const SL_IDS = ['sl1', 'sl2', 'sl3', 'sl4'] as const;
const SL_COLORS = [
  'border-green-500 bg-green-500/10 text-green-400',
  'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  'border-orange-500 bg-orange-500/10 text-orange-400',
  'border-destructive bg-destructive/10 text-destructive',
];
const SL_KEYS = ['slSl1', 'slSl2', 'slSl3', 'slSl4'];

export function getSecurityLevels(t: T) {
  return SL_IDS.map((id, i) => ({
    id,
    label: t(`iec.${SL_KEYS[i]}`),
    color: SL_COLORS[i],
    desc: t(`iec.${SL_KEYS[i]}Desc`),
  }));
}

// ── Zone/Conduit Options ────────────────────────────────────────
const ZC_IDS = ['enterprise', 'dmz', 'control', 'field', 'safety', 'remote'] as const;
const ZC_ICONS = ['🏢', '🛡️', '⚙️', '🔌', '⚠️', '🌐'];
const ZC_KEYS = ['zcEnterprise', 'zcDmz', 'zcControl', 'zcField', 'zcSafety', 'zcRemote'];

export function getZoneConduits(t: T) {
  return ZC_IDS.map((id, i) => ({
    id,
    label: t(`iec.${ZC_KEYS[i]}`),
    icon: ZC_ICONS[i],
  }));
}

// ── Protocol/Interface Options ──────────────────────────────────
export const PROTOCOL_OPTS = [
  { label: 'OPC-UA', icon: '🏭' }, { label: 'Modbus TCP', icon: '🏭' },
  { label: 'PROFINET', icon: '🔌' }, { label: 'EtherNet/IP', icon: '🔌' },
  { label: 'DNP3', icon: '📟' }, { label: 'IEC 61850 (MMS/GOOSE)', icon: '⚡' },
  { label: 'BACnet', icon: '🏢' }, { label: 'MQTT', icon: '📡' },
  { label: 'HTTPS/REST', icon: '🔒' }, { label: 'SSH', icon: '🔑' },
  { label: 'RDP', icon: '🖥️' }, { label: 'VPN (IPsec/WireGuard)', icon: '🛡️' },
  { label: 'Serial (RS-232/485)', icon: '🔗' }, { label: 'Wireless (WiFi/Bluetooth)', icon: '📶' },
  { label: 'USB', icon: '🖇️' }, { label: 'Proprietäres Protokoll', icon: '❓' },
] as const;

// ── Security Measures (mapped to FRs) ──────────────────────────
const SM_IDS = ['iac', 'uc', 'si', 'dc', 'rdf', 'tre', 'ra', 'patch', 'backup', 'segmentation', 'monitoring', 'physical', 'training', 'vendor', 'incident'] as const;
const SM_LABEL_KEYS = ['smIac', 'smUc', 'smSi', 'smDc', 'smRdf', 'smTre', 'smRa', 'smPatch', 'smBackup', 'smSegmentation', 'smMonitoring', 'smPhysical', 'smTraining', 'smVendor', 'smIncident'];
const SM_CAT_KEYS = ['catAccess', 'catAccess', 'catIntegrity', 'catConfidentiality', 'catResilience', 'catResponse', 'catGovernance', 'catOps', 'catResilience', 'catNetwork', 'catDetection', 'catPhysical', 'catGovernance', 'catSupplyChain', 'catResponse'];

export function getSecurityMeasures(t: T) {
  return SM_IDS.map((id, i) => ({
    id,
    label: t(`iec.${SM_LABEL_KEYS[i]}`),
    cat: t(`iec.${SM_CAT_KEYS[i]}`),
  }));
}

export function getSecurityCategories(t: T) {
  return [...new Set(getSecurityMeasures(t).map(m => m.cat))];
}

// ── Attach Types ────────────────────────────────────────────────
const ATT_IDS = ['arch', 'riskAssess', 'policy', 'zoneMap', 'pentest', 'other'] as const;
const ATT_ICONS = ['🗺️', '📊', '📋', '🗂️', '🔍', '📎'];
const ATT_ACCEPTS = ['.pdf,.png,.jpg,.svg,.pptx,.vsdx,.drawio', '.pdf,.xlsx,.docx', '.pdf,.docx', '.pdf,.png,.jpg,.svg,.vsdx', '.pdf,.docx', '*'];
const ATT_KEYS = ['attArch', 'attRiskAssess', 'attPolicy', 'attZoneMap', 'attPentest', 'attOther'];

export function getAttachTypes(t: T) {
  return ATT_IDS.map((id, i) => ({
    id,
    label: t(`iec.${ATT_KEYS[i]}`),
    icon: ATT_ICONS[i],
    accept: ATT_ACCEPTS[i],
  }));
}

// ── Foundational Requirements Meta ─────────────────────────────
// FR 1-7 from IEC 62443-3-3
export const FR_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  FR1: { label: { de: 'Identifikation & Authentifizierung', en: 'Identification & Authentication', fr: 'Identification & authentification' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  FR2: { label: { de: 'Zugriffskontrolle', en: 'Use Control', fr: 'Contrôle d\'utilisation' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  FR3: { label: { de: 'Systemintegrität', en: 'System Integrity', fr: 'Intégrité système' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  FR4: { label: { de: 'Datenvertraulichkeit', en: 'Data Confidentiality', fr: 'Confidentialité des données' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  FR5: { label: { de: 'Eingeschränkter Datenfluss', en: 'Restricted Data Flow', fr: 'Flux de données restreint' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  FR6: { label: { de: 'Zeitnahe Reaktion', en: 'Timely Response to Events', fr: 'Réaction rapide aux événements' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  FR7: { label: { de: 'Ressourcenverfügbarkeit', en: 'Resource Availability', fr: 'Disponibilité des ressources' }, dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

// ── Types ───────────────────────────────────────────────────────

export interface IecThreat {
  id: number;
  fr: string; // FR1-FR7
  name: string;
  component: string;
  attacker: string;
  path: string;
  iecRef: string; // IEC 62443 reference (e.g. "SR 1.1")
  likelihood: number;
  impact: number;
  evidence: string;
  rationale: string;
  sources: string[];
  evidenceQuality: number;
  reproducibility: string;
}

export function threatId(th: IecThreat): string {
  return `${th.fr}-${String(th.id).padStart(3, '0')}`;
}

export interface IecReq {
  id: string;
  article: string; // e.g. "SR 1.1"
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

export interface IecIntakeData {
  facilityName: string;
  systemTypes: string[];
  securityLevel: string;
  description: string;
  zones: string[];
  protocols: string[];
  roles: string[];
  customRole: string;
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: IecIntakeData = {
  facilityName: '', systemTypes: [], securityLevel: '',
  description: '', zones: [], protocols: [],
  roles: [], customRole: '',
  measures: {}, knownIssues: '', files: [],
};

// ── Demo Threats (14 threats across FR1-FR7) ────────────────────

export const IEC_THREATS: IecThreat[] = [
  // FR1 — Identification & Authentication (3)
  { id: 1, fr: 'FR1', name: 'Shared Accounts auf SCADA-HMI-Stationen', component: 'SCADA HMI — Benutzerverwaltung', attacker: 'Interner Nutzer', path: 'Gemeinsamer Admin-Account (admin/admin) → keine individuelle Zuordnung → Missbrauch nicht nachvollziehbar', iecRef: 'SR 1.1',
    likelihood: 4, impact: 4,
    evidence: 'Konfigurationsaudit: 3 von 5 SCADA-HMI-Stationen nutzen gemeinsamen Admin-Account (admin/admin). Keine individuelle Authentifizierung. Kein Audit-Log auf Benutzerebene. Active Directory nicht an OT angebunden.',
    rationale: 'Likelihood 4: Shared Accounts in OT-Umgebungen verbreitet, Missbrauch schwer nachweisbar. Impact 4: Unbefugte Steuerungsänderungen können Produktionsprozesse stören.',
    sources: ['IEC 62443-3-3 SR 1.1: Human user identification and authentication', 'NIST SP 800-82r3 Section 5.3'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, fr: 'FR1', name: 'Fehlende Authentifizierung auf Modbus-TCP-Interface', component: 'Modbus TCP — SPS-Kommunikation', attacker: 'Netzwerk-Angreifer', path: 'Modbus TCP hat keine native Authentifizierung → Angreifer im OT-Netz kann direkt auf SPS zugreifen', iecRef: 'SR 1.1',
    likelihood: 5, impact: 5,
    evidence: 'Netzwerkscan: Modbus TCP Port 502 offen auf 12 SPS-Steuerungen. Write-Holding-Register ohne Authentifizierung möglich. Praktischer PoC: Setpoint über mbtcp-cli von 25°C auf 85°C geändert.',
    rationale: 'Likelihood 5: Standard-Tools (mbtcp-cli, pymodbus) frei verfügbar, kein Auth, Aufwand < 30 min. Impact 5: Direkte Manipulation von Steuerungsparametern mit Safety-Auswirkungen.',
    sources: ['IEC 62443-3-3 SR 1.1', 'ICS-CERT Advisory ICSA-18-107-03', 'CWE-306'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 9, fr: 'FR1', name: 'Standard-Passwörter auf Engineering-Workstations', component: 'Engineering-Workstation — Windows-Login', attacker: 'Insider / Wartungspersonal', path: 'Default-Credentials der Projektierungs-Software nicht geändert → Vollzugriff auf SPS-Programme', iecRef: 'SR 1.5',
    likelihood: 4, impact: 5,
    evidence: 'Stichprobe: 4 von 6 Engineering-Workstations mit Hersteller-Default-Passwort. Projektierungs-Software (Step 7, TIA Portal) ohne zusätzlichen Login-Schutz.',
    rationale: 'Likelihood 4: Default-Credentials in OT häufig, Herstellerdokumentation öffentlich. Impact 5: Vollzugriff auf SPS-Programme ermöglicht beliebige Steuerungsmanipulation.',
    sources: ['IEC 62443-3-3 SR 1.5: Authenticator management', 'NIST SP 800-82r3'], evidenceQuality: 4, reproducibility: 'easy' },

  // FR2 — Use Control (2)
  { id: 3, fr: 'FR2', name: 'Fehlende rollenbasierte Zugriffssteuerung (RBAC)', component: 'SCADA-Server — Autorisierung', attacker: 'Authentifizierter Nutzer', path: 'Alle Benutzer haben identische Rechte → Operator kann Konfiguration ändern → unbeabsichtigte Steuerungsänderung', iecRef: 'SR 2.1',
    likelihood: 4, impact: 3,
    evidence: 'Konfigurationsanalyse: SCADA-System hat nur eine Berechtigungsstufe. Operator-, Ingenieur- und Admin-Rollen sind nicht differenziert. Jeder angemeldete Benutzer kann Parameter ändern.',
    rationale: 'Likelihood 4: Fehlende RBAC in OT-Systemen verbreitet, jeder Benutzer kann Änderungen vornehmen. Impact 3: Fehlkonfiguration durch Operator möglich, aber keine direkte Kompromittierung.',
    sources: ['IEC 62443-3-3 SR 2.1: Authorization enforcement', 'ISA-99.02.01'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 10, fr: 'FR2', name: 'USB-Ports an Feldbussteuerungen nicht deaktiviert', component: 'SPS — USB-Schnittstelle', attacker: 'Physischer Angreifer / Insider', path: 'Offene USB-Ports → USB-Stick mit Malware → SPS-Kompromittierung', iecRef: 'SR 2.4',
    likelihood: 3, impact: 5,
    evidence: 'Vor-Ort-Prüfung: USB-Ports an 8 SPS-Steuerungen physisch zugänglich. Keine USB-Port-Sperre (Software oder Hardware). USB-Autorun nicht deaktiviert auf Engineering-Workstations.',
    rationale: 'Likelihood 3: Erfordert physischen Zugang, in Industrieumgebung durch Wartungspersonal plausibel. Impact 5: SPS-Kompromittierung mit direkter Safety-Relevanz.',
    sources: ['IEC 62443-3-3 SR 2.4: Mobile code', 'NIST SP 800-82r3 Section 5.6'], evidenceQuality: 4, reproducibility: 'medium' },

  // FR3 — System Integrity (2)
  { id: 4, fr: 'FR3', name: 'Fehlende Firmware-Signaturprüfung bei SPS-Updates', component: 'SPS — Firmware-Update-Prozess', attacker: 'Supply-Chain-Angreifer', path: 'Firmware-Updates ohne kryptographische Signatur → manipulierte Firmware kann installiert werden', iecRef: 'SR 3.4',
    likelihood: 2, impact: 5,
    evidence: 'Firmware-Update-Analyse: SPS-Firmware wird über Engineering-Workstation aufgespielt. Keine Signaturprüfung im Upload-Prozess. Modifiziertes Firmware-Image wurde ohne Fehlermeldung akzeptiert.',
    rationale: 'Likelihood 2: Supply-Chain-Angriff oder Kompromittierung der Engineering-Workstation erforderlich. Impact 5: Persistente SPS-Kompromittierung mit direkter Prozesssteuerungsgefährdung.',
    sources: ['IEC 62443-3-3 SR 3.4: Software and information integrity', 'NIST SP 800-193'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 11, fr: 'FR3', name: 'Keine Integritätsprüfung der SPS-Konfiguration', component: 'SPS — Konfigurationsmanagement', attacker: 'Privilegierter Insider', path: 'SPS-Konfigurationsänderungen nicht versioniert oder geprüft → unbemerkte Manipulation der Steuerungslogik', iecRef: 'SR 3.4',
    likelihood: 3, impact: 5,
    evidence: 'Prozessanalyse: Kein Versionskontrollsystem für SPS-Programme. Änderungen werden ohne Vergleichsprüfung (Baseline Comparison) übernommen. Keine automatische Benachrichtigung bei Konfigurationsänderungen.',
    rationale: 'Likelihood 3: Jeder Ingenieur mit Zugang zur Engineering-Workstation kann SPS-Programme ändern. Impact 5: Steuerungslogik-Manipulation mit Safety-Auswirkungen.',
    sources: ['IEC 62443-3-3 SR 3.4', 'IEC 62443-2-4 SP.03.02'], evidenceQuality: 4, reproducibility: 'easy' },

  // FR4 — Data Confidentiality (1)
  { id: 5, fr: 'FR4', name: 'OPC-UA Security Mode None — Prozessdaten im Klartext', component: 'OPC-UA Server — Transportschicht', attacker: 'Netzwerk-Mitleser', path: 'OPC-UA ohne Verschlüsselung → Prozessdaten, Rezepturen und Steuerungsbefehle im Klartext', iecRef: 'SR 4.1',
    likelihood: 4, impact: 5,
    evidence: 'Konfigurationsanalyse: OPC-UA Server SecurityMode=None, SecurityPolicy=None. Wireshark-Mitschnitt: OPC-UA ReadResponse enthält Prozessdaten im Klartext. Alle Nodes ohne Auth sichtbar.',
    rationale: 'Likelihood 4: Netzwerkzugang im OT-Segment, Layer-2-Zugang Standard. Impact 5: Prozessdaten, Produktionsparameter und Steuerungsbefehle offengelegt.',
    sources: ['IEC 62443-3-3 SR 4.1: Information confidentiality', 'OPC Foundation Security Best Practices'], evidenceQuality: 5, reproducibility: 'easy' },

  // FR5 — Restricted Data Flow (2)
  { id: 6, fr: 'FR5', name: 'Fehlende Netzwerksegmentierung zwischen IT und OT', component: 'Netzwerk — Zonenübergang IT/OT', attacker: 'Externer Angreifer / Ransomware', path: 'Flaches Netzwerk ohne Segmentierung → Ransomware aus IT propagiert in OT → Produktionsausfall', iecRef: 'SR 5.1',
    likelihood: 4, impact: 5,
    evidence: 'Netzwerkanalyse: IT- und OT-Netzwerk im gleichen VLAN (10.0.0.0/16). Keine Firewall zwischen Enterprise- und Control-Zone. Ping von Office-PC (10.0.1.50) zu SPS (10.0.5.20) erfolgreich.',
    rationale: 'Likelihood 4: Ransomware-Ausbreitung über flache Netzwerke häufig dokumentiert (Norsk Hydro, Colonial Pipeline). Impact 5: Produktionsausfall durch OT-Kompromittierung.',
    sources: ['IEC 62443-3-3 SR 5.1: Network segmentation', 'NIST SP 800-82r3 Section 5.4', 'IEC 62443-3-2: Security risk assessment'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 12, fr: 'FR5', name: 'Keine DMZ zwischen Enterprise- und Control-Zone', component: 'Netzwerk — DMZ-Architektur', attacker: 'Externer Angreifer', path: 'Direkter Zugriff von Enterprise-Zone auf SCADA-Server → keine Pufferzone → Angriff propagiert ungehindert', iecRef: 'SR 5.2',
    likelihood: 3, impact: 4,
    evidence: 'Architektur-Review: Keine dedizierte DMZ implementiert. SCADA-Historian direkt aus Enterprise-Netz erreichbar. Kein Proxy oder Data Diode für Datenübertragung.',
    rationale: 'Likelihood 3: DMZ-Fehlen verbreitet in Legacy-OT. Impact 4: Direkte Angriffspfade von IT nach OT ohne Pufferzone.',
    sources: ['IEC 62443-3-3 SR 5.2: Zone boundary protection', 'Purdue Enterprise Reference Architecture'], evidenceQuality: 4, reproducibility: 'medium' },

  // FR6 — Timely Response to Events (2)
  { id: 7, fr: 'FR6', name: 'Kein OT-spezifisches Security-Monitoring', component: 'OT-Netzwerk — Monitoring', attacker: 'APT / Interner Angreifer', path: 'Keine Anomalie-Erkennung im OT → Angriffe bleiben unerkannt → Lateral Movement ungehindert', iecRef: 'SR 6.1',
    likelihood: 4, impact: 4,
    evidence: 'Infrastruktur-Review: Kein IDS/IPS im OT-Netzwerk. Kein OT-spezifisches SIEM. Netzwerk-Switches ohne Port-Mirroring konfiguriert. Einzige Überwachung: IT-SIEM erfasst nur Enterprise-Zone.',
    rationale: 'Likelihood 4: Ohne Monitoring werden Angriffe im OT-Netzwerk nicht erkannt. Durchschnittliche Verweildauer: 280 Tage. Impact 4: Unerkannte Kompromittierung ermöglicht Eskalation und Datenexfiltration.',
    sources: ['IEC 62443-3-3 SR 6.1: Audit log accessibility', 'SANS ICS Security Survey 2025'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 13, fr: 'FR6', name: 'Fehlender Incident-Response-Plan für OT', component: 'Organisation — OT Incident Response', attacker: 'Beliebiger Angreifer', path: 'Kein OT-spezifischer IR-Plan → im Ernstfall Chaos → verlängerte Ausfallzeiten', iecRef: 'SR 6.2',
    likelihood: 5, impact: 3,
    evidence: 'Dokumentenprüfung: IT-Incident-Response-Plan vorhanden, aber ohne OT-Szenarien. Keine definierten Eskalationswege für OT-Vorfälle. Kein OT-spezifisches Playbook. Letzte Übung (TTX): nie für OT durchgeführt.',
    rationale: 'Likelihood 5: Bei Prüfung sofort als Mangel erkannt. OT-IR-Pläne fehlen in > 60% der Unternehmen. Impact 3: Governance-Verstoß, verlängerte Recovery-Zeit, aber kein direkter technischer Schaden.',
    sources: ['IEC 62443-2-1 Requirement 4.3.4.5: Incident response planning', 'NIST SP 800-82r3 Section 6.8'], evidenceQuality: 5, reproducibility: 'easy' },

  // FR7 — Resource Availability (2)
  { id: 8, fr: 'FR7', name: 'Kein redundantes Leitsystem (Single Point of Failure)', component: 'SCADA-Server — Hochverfügbarkeit', attacker: 'Hardware-Ausfall / Ransomware', path: 'Kein Failover → Serverausfall → kompletter Produktionsausfall', iecRef: 'SR 7.1',
    likelihood: 3, impact: 5,
    evidence: 'Architektur-Review: SCADA-Server auf einzelner Hardware ohne Failover-Cluster. Letzter Backup-Test: 14 Monate alt. Geschätztes RTO: 4h dokumentiert, tatsächlich getestet: nie.',
    rationale: 'Likelihood 3: Hardwareausfall statistisch wahrscheinlich, Ransomware realistisch. Impact 5: Kompletter Produktionsausfall ohne Failover.',
    sources: ['IEC 62443-3-3 SR 7.1: Denial of service protection', 'IEC 62443-2-1 Section 4.3.4.3'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 14, fr: 'FR7', name: 'Kein Disaster-Recovery-Plan für OT', component: 'OT-Infrastruktur — DR-Planung', attacker: 'Naturkatastrophe / Cyberangriff', path: 'Kein DR-Plan für OT → im Ernstfall keine geordnete Wiederherstellung → wochenlanger Ausfall', iecRef: 'SR 7.2',
    likelihood: 3, impact: 4,
    evidence: 'Dokumentenprüfung: IT-DR-Plan existiert, OT ist nicht abgedeckt. Keine dokumentierten Recovery-Prozeduren für SPS-Programme, SCADA-Konfigurationen oder Historiker-Datenbanken. Backup-Strategie für OT: nicht formalisiert.',
    rationale: 'Likelihood 3: DR-Szenarien realistisch. Impact 4: Ohne OT-DR-Plan kann Wiederherstellung Wochen dauern (SPS-Neuprojektierung).',
    sources: ['IEC 62443-2-1 Section 4.3.4.3: Business continuity plan', 'ISO 22301:2019'], evidenceQuality: 3, reproducibility: 'hard' },
];

// ── Demo IEC 62443 Requirements (22 requirements mapped to SRs) ──

export const IEC_REQS: IecReq[] = [
  // FR1 — Identification & Authentication
  { id: 'FR1-1', article: 'SR 1.1', name: 'Identifikation und Authentifizierung (Human Users)', status: 'fail',
    gap: 'Shared Accounts auf HMI, Modbus ohne Auth, Default-Passwörter',
    evidence: 'Shared Admin-Accounts auf 3/5 HMI-Stationen. Modbus TCP ohne Auth (12 SPS). Default-Passwörter auf 4/6 Engineering-Workstations.',
    rationale: 'Nicht erfüllt: Drei unabhängige Schwachstellen verletzen SR 1.1. Individuelle Identifikation ist Grundvoraussetzung für Accountability.',
    measure: '1. Individuelle Benutzerkonten auf allen HMI-Stationen (AD/LDAP-Anbindung). 2. Modbus TCP durch authentifiziertes Protokoll ersetzen (OPC-UA mit Security). 3. Passwort-Änderungszwang bei Erstinbetriebnahme.',
    criteria: ['Alle Benutzer authentifizieren sich individuell (keine Shared Accounts)', 'Modbus-Kommunikation durch authentifiziertes Protokoll ersetzt oder durch Netzwerksegmentierung geschützt', 'Default-Credentials bei Erstinbetriebnahme zwingend geändert'],
    effort: '40-60h', priority: 'P0' },
  { id: 'FR1-2', article: 'SR 1.2', name: 'Software-Prozess-Identifikation', status: 'partial',
    gap: 'Keine Authentifizierung zwischen SPS und SCADA',
    evidence: 'Kommunikation SPS ↔ SCADA ohne gegenseitige Authentifizierung. Kein Zertifikatsmanagement für OT-Komponenten.',
    rationale: 'Teilweise erfüllt: OPC-UA-Server hat Zertifikat, aber Security Mode = None. Modbus nativ ohne Auth.',
    measure: 'OPC-UA Security Mode auf SignAndEncrypt umstellen. Zertifikatsmanagement für alle OT-Komponenten einführen.',
    criteria: ['OPC-UA SecurityMode=SignAndEncrypt', 'Zertifikatsbasierte Authentifizierung zwischen SCADA und SPS'],
    effort: '24-32h', priority: 'P1' },
  { id: 'FR1-3', article: 'SR 1.5', name: 'Authenticator-Management', status: 'fail',
    gap: 'Default-Passwörter, keine Passwort-Policy für OT',
    evidence: '4/6 Engineering-Workstations mit Default-Passwort. Keine Passwort-Policy für OT-Systeme definiert. Keine Passwort-Rotation.',
    rationale: 'Nicht erfüllt: Default-Credentials in Kombination mit fehlender Policy verletzen SR 1.5 vollständig.',
    measure: '1. OT-Passwort-Policy definieren (min. 12 Zeichen, Rotation 90 Tage). 2. Default-Credentials bei Inbetriebnahme erzwingen. 3. Passwort-Safe für OT-Credentials einführen.',
    criteria: ['OT-Passwort-Policy dokumentiert und durchgesetzt', 'Default-Credentials eliminiert', 'Passwort-Safe für OT-Credentials'],
    effort: '16-24h', priority: 'P0' },

  // FR2 — Use Control
  { id: 'FR2-1', article: 'SR 2.1', name: 'Autorisierungs-Durchsetzung', status: 'fail',
    gap: 'Keine RBAC auf SCADA, einheitliche Berechtigungsstufe',
    evidence: 'SCADA-System ohne Rollendifferenzierung. Jeder angemeldete Benutzer hat volle Konfigurationsrechte.',
    rationale: 'Nicht erfüllt: Fehlende RBAC verletzt das Least-Privilege-Prinzip. Operator-Fehler und absichtlicher Missbrauch nicht verhinderbar.',
    measure: '1. RBAC im SCADA-System konfigurieren (Operator, Ingenieur, Admin). 2. Least-Privilege-Prinzip durchsetzen. 3. Berechtigungsmatrix dokumentieren.',
    criteria: ['Mindestens 3 Rollen mit differenzierten Berechtigungen konfiguriert', 'Berechtigungsmatrix dokumentiert und genehmigt', 'Regelmäßige Berechtigungsreviews (halbjährlich)'],
    effort: '24-32h', priority: 'P1' },
  { id: 'FR2-2', article: 'SR 2.4', name: 'Mobile Code / Wechselmedien', status: 'partial',
    gap: 'USB-Ports nicht deaktiviert, kein Wechselmedien-Konzept',
    evidence: 'USB-Ports physisch zugänglich. Keine USB-Port-Sperre. Kein dokumentiertes Wechselmedien-Konzept.',
    rationale: 'Teilweise erfüllt: Organisatorische Regelung vorhanden (Verbot privater USB), aber technisch nicht durchgesetzt.',
    measure: '1. USB-Ports per GPO/BIOS deaktivieren (Ausnahme: dedizierte Wartungsstationen). 2. Wechselmedien-Policy dokumentieren. 3. USB-Kiosk für Malware-Scan.',
    criteria: ['USB-Ports an SPS und HMI technisch deaktiviert', 'Dokumentierte Wechselmedien-Policy', 'USB-Kiosk-Station für Wartungsmedien'],
    effort: '12-20h', priority: 'P1' },

  // FR3 — System Integrity
  { id: 'FR3-1', article: 'SR 3.2', name: 'Malware-Schutz', status: 'partial',
    gap: 'Kein Antivirus auf Engineering-Workstations',
    evidence: 'Antivirus auf 2/6 Engineering-Workstations installiert. Signaturen 3 Monate alt. Kein Whitelisting-Konzept.',
    rationale: 'Teilweise erfüllt: Punktuell vorhanden, aber nicht flächendeckend und nicht aktuell.',
    measure: '1. Application Whitelisting auf allen Engineering-Workstations. 2. Signatur-Updates via WSUS/offline-Repository. 3. Regelmäßige Scans planen.',
    criteria: ['Application Whitelisting auf allen Engineering-Workstations aktiv', 'Signatur-Updates maximal 7 Tage alt', 'Quarantäne-Prozess dokumentiert'],
    effort: '16-24h', priority: 'P1' },
  { id: 'FR3-2', article: 'SR 3.4', name: 'Software- und Informationsintegrität', status: 'fail',
    gap: 'Keine Firmware-Signaturprüfung, keine SPS-Konfigurationskontrolle',
    evidence: 'SPS-Firmware ohne Signaturprüfung. Keine Versionskontrolle für SPS-Programme. Keine Baseline-Comparison.',
    rationale: 'Nicht erfüllt: Firmware-Manipulation und unbemerkte Konfigurationsänderungen möglich. Fundamentale Integritätsverletzung.',
    measure: '1. Firmware-Signaturprüfung implementieren (Hersteller-Support). 2. SPS-Versionskontrolle einführen (z.B. versiondog, MDT AutoSave). 3. Automatische Baseline-Comparison und Alerting.',
    criteria: ['Firmware-Updates werden vor Installation kryptographisch verifiziert', 'SPS-Programme in Versionskontrollsystem verwaltet', 'Automatische Benachrichtigung bei Konfigurationsabweichung'],
    effort: '32-48h', priority: 'P0' },

  // FR4 — Data Confidentiality
  { id: 'FR4-1', article: 'SR 4.1', name: 'Informationsvertraulichkeit', status: 'fail',
    gap: 'OPC-UA ohne Verschlüsselung, Prozessdaten im Klartext',
    evidence: 'OPC-UA SecurityMode=None. Prozessdaten im Klartext auf dem Netzwerk. Rezepturen und Steuerungsbefehle exponiert.',
    rationale: 'Nicht erfüllt: Vollständige Offenlegung aller Prozessdaten. In Industrieumgebung Betriebsgeheimnisse betroffen.',
    measure: '1. OPC-UA SecurityMode=SignAndEncrypt, SecurityPolicy=Basic256Sha256. 2. TLS 1.2+ für alle OT-Kommunikation. 3. Data-at-Rest-Verschlüsselung für Historian.',
    criteria: ['OPC-UA SecurityMode=SignAndEncrypt mit Basic256Sha256', 'Keine unverschlüsselte Industrieprotokoll-Kommunikation', 'Historian-Datenbank verschlüsselt'],
    effort: '24-40h', priority: 'P0' },
  { id: 'FR4-2', article: 'SR 4.3', name: 'Kryptographisches Management', status: 'partial',
    gap: 'Kein Zertifikatsmanagement, selbstsignierte Zertifikate',
    evidence: 'Selbstsignierte Zertifikate auf OPC-UA-Servern. Kein PKI für OT. Zertifikats-Ablauf nicht überwacht.',
    rationale: 'Teilweise erfüllt: Zertifikate vorhanden, aber nicht zentral verwaltet. Ablaufrisiko.',
    measure: 'OT-PKI aufbauen oder an Enterprise-PKI anbinden. Zertifikats-Lifecycle-Management einführen.',
    criteria: ['Zertifikats-Lifecycle-Management implementiert', 'PKI für OT-Komponenten etabliert'],
    effort: '24-32h', priority: 'P2' },

  // FR5 — Restricted Data Flow
  { id: 'FR5-1', article: 'SR 5.1', name: 'Netzwerksegmentierung', status: 'fail',
    gap: 'IT und OT im gleichen VLAN, keine Firewall',
    evidence: 'IT und OT im gleichen VLAN (10.0.0.0/16). Keine Firewall zwischen Zonen. Ping von Office zu SPS erfolgreich.',
    rationale: 'Nicht erfüllt: Fundamentaler Verstoß gegen das Zone-Conduit-Modell. Ransomware-Propagation ungehindert möglich.',
    measure: '1. Netzwerksegmentierung nach Purdue/IEC 62443 Zone-Conduit-Modell. 2. Next-Gen-Firewall zwischen IT und OT mit OT-Protokoll-Inspektion. 3. DMZ für Datenaustausch.',
    criteria: ['Dedizierte VLANs für Enterprise, DMZ, Control und Field Zone', 'Firewall mit OT-Protokoll-Inspektion an Zonenübergängen', 'DMZ für alle IT↔OT-Datenflüsse'],
    effort: '60-100h', priority: 'P0' },
  { id: 'FR5-2', article: 'SR 5.2', name: 'Zonengrenzschutz', status: 'fail',
    gap: 'Keine DMZ, direkter Zugriff auf SCADA aus Enterprise',
    evidence: 'Keine DMZ. SCADA-Historian direkt aus Enterprise-Netz erreichbar. Kein Proxy oder Data Diode.',
    rationale: 'Nicht erfüllt: Ohne DMZ ist die Purdue-Architektur durchbrochen. Angriffspfad IT→OT ohne Pufferzone.',
    measure: '1. DMZ-Zone einrichten (Level 3.5). 2. Data Diode oder Proxy für Historian-Daten. 3. Nur explizit erlaubte Datenflüsse definieren.',
    criteria: ['DMZ zwischen Enterprise und Control Zone implementiert', 'Historian-Daten über Proxy/Data Diode bereitgestellt', 'Whitelist-basierte Firewall-Regeln'],
    effort: '40-60h', priority: 'P0' },

  // FR6 — Timely Response
  { id: 'FR6-1', article: 'SR 6.1', name: 'Audit-Log-Zugriff', status: 'fail',
    gap: 'Kein OT-spezifisches Monitoring, kein IDS im OT-Netz',
    evidence: 'Kein IDS/IPS im OT-Netzwerk. Kein OT-SIEM. Keine Anomalie-Erkennung. IT-SIEM erfasst nur Enterprise-Zone.',
    rationale: 'Nicht erfüllt: Ohne OT-Monitoring werden Angriffe nicht erkannt. Durchschnittliche Verweildauer ohne Detection: 280 Tage.',
    measure: '1. OT-IDS/Anomalie-Erkennung installieren (z.B. Nozomi Networks, Claroty, Dragos). 2. Log-Forwarding von OT-Geräten an SIEM. 3. 24/7-Monitoring oder Managed-SOC.',
    criteria: ['OT-IDS in Control-Zone installiert und operativ', 'Log-Forwarding von SCADA, SPS-Gateways und Engineering-WS an SIEM', '24/7-Monitoring für OT-Alarme'],
    effort: '60-80h', priority: 'P0' },
  { id: 'FR6-2', article: 'SR 6.2', name: 'Kontinuierliches Monitoring', status: 'fail',
    gap: 'Kein OT-IR-Plan, keine Playbooks, keine Übungen',
    evidence: 'IT-IR-Plan ohne OT-Szenarien. Keine OT-Playbooks. Keine TTX für OT-Vorfälle durchgeführt.',
    rationale: 'Nicht erfüllt: Ohne OT-IR-Plan ist die Reaktionsfähigkeit bei OT-Vorfällen nicht sichergestellt.',
    measure: '1. OT-spezifischen IR-Plan erstellen (inkl. Playbooks für SCADA-Kompromittierung, Ransomware-in-OT, Safety-System-Ausfall). 2. Halbjährliche TTX-Übungen. 3. Eskalationswege definieren.',
    criteria: ['OT-IR-Plan dokumentiert mit mindestens 3 Playbooks', 'Halbjährliche TTX-Übungen mit OT-Personal', 'Eskalationswege IT↔OT definiert und getestet'],
    effort: '24-40h', priority: 'P1' },

  // FR7 — Resource Availability
  { id: 'FR7-1', article: 'SR 7.1', name: 'DoS-Schutz', status: 'fail',
    gap: 'Kein Failover für SCADA-Server, Single Point of Failure',
    evidence: 'SCADA-Server ohne Failover-Cluster. Letzter Backup-Test: 14 Monate alt. RTO nie getestet.',
    rationale: 'Nicht erfüllt: Single Point of Failure bei kritischem Leitsystem. Kein getestetes Recovery.',
    measure: '1. SCADA-Server-Cluster (Active-Passive oder Active-Active). 2. Tägliche automatisierte Backups mit wöchentlichem Restore-Test. 3. Dokumentiertes RTO/RPO.',
    criteria: ['SCADA-Server in Failover-Cluster konfiguriert', 'Automatisierte Backups mit regelmäßigem Restore-Test', 'RTO/RPO dokumentiert und getestet'],
    effort: '40-60h', priority: 'P0' },
  { id: 'FR7-2', article: 'SR 7.2', name: 'Ressourcenmanagement', status: 'partial',
    gap: 'Kein DR-Plan für OT, nur IT-DR-Plan vorhanden',
    evidence: 'IT-DR-Plan vorhanden. OT nicht abgedeckt. Keine Recovery-Prozeduren für SPS, SCADA, Historian.',
    rationale: 'Teilweise erfüllt: IT-DR vorhanden, OT-Erweiterung fehlt.',
    measure: '1. OT-DR-Plan erstellen (SPS-Backup, SCADA-Konfiguration, Historian-Recovery). 2. Jährlicher DR-Test inkl. OT-Komponenten. 3. Offline-Backup für kritische SPS-Programme.',
    criteria: ['OT-DR-Plan dokumentiert', 'Jährlicher DR-Test mit OT-Komponenten', 'Offline-Backup für kritische SPS-Programme'],
    effort: '24-40h', priority: 'P1' },

  // Cross-cutting
  { id: 'CC-1', article: 'IEC 62443-2-1 4.2.3', name: 'Sicherheitsrichtlinien und -verfahren', status: 'partial',
    gap: 'IT-Policies vorhanden, nicht auf OT angepasst',
    evidence: 'IT-Sicherheitsrichtlinien nach ISO 27001 vorhanden. Keine OT-spezifischen Ergänzungen. Keine Referenz auf IEC 62443.',
    rationale: 'Teilweise erfüllt: IT-Policies solide, OT-Spezifika fehlen.',
    measure: 'OT-spezifische Policies ergänzen (Patch-Management, Wechselmedien, Remote Access, Change Management für SPS).',
    criteria: ['OT-spezifische Sicherheitsrichtlinien dokumentiert', 'Referenz auf IEC 62443 und branchenspezifische Standards', 'Jährliche Policy-Reviews'],
    effort: '16-24h', priority: 'P2' },
  { id: 'CC-2', article: 'IEC 62443-2-1 4.3.2.6', name: 'Schulung und Bewusstsein', status: 'partial',
    gap: 'Kein OT-spezifisches Security-Training',
    evidence: 'IT-Security-Training für alle Mitarbeiter. Kein OT-spezifisches Training für Ingenieure und Operatoren. Keine ICS-Security-Awareness-Kampagne.',
    rationale: 'Teilweise erfüllt: IT-Awareness vorhanden, OT-Spezifika fehlen.',
    measure: '1. ICS-Security-Training für Ingenieure und Operatoren. 2. OT-Phishing-Simulation. 3. Jährliche ICS-Security-Awareness-Kampagne.',
    criteria: ['ICS-Security-Training für OT-Personal (jährlich)', 'OT-spezifische Phishing-Simulation', 'Awareness-Kampagne für Safety/Security-Konvergenz'],
    effort: '8-16h', priority: 'P2' },
  { id: 'CC-3', article: 'IEC 62443-2-4 SP.02.02', name: 'Patch-Management für OT', status: 'partial',
    gap: 'Kein formalisierter Patch-Prozess für OT-Systeme',
    evidence: 'IT-Patch-Management etabliert. OT-Patches ad-hoc, abhängig von Wartungsfenstern. Keine formale Patch-Bewertung für OT.',
    rationale: 'Teilweise erfüllt: Patches werden installiert, aber ohne formalisierten Prozess und Risikobewertung.',
    measure: '1. OT-Patch-Management-Prozess formalisieren (Bewertung, Test, Rollout, Rollback). 2. Patch-Kalender mit Wartungsfenstern abstimmen. 3. Virtuelle Patching-Strategie für Legacy-Systeme.',
    criteria: ['Formalisierter OT-Patch-Prozess dokumentiert', 'Patch-Bewertung vor Rollout (Kompatibilitätstest)', 'Virtual-Patching-Strategie für nicht-patchbare Legacy-Systeme'],
    effort: '16-24h', priority: 'P2' },
  { id: 'CC-4', article: 'IEC 62443-2-4 SP.03.08', name: 'Lieferanten- und Integratoren-Management', status: 'pass',
    gap: '',
    evidence: 'Lieferantenbewertung dokumentiert. Vertragsklauseln für Security-Anforderungen definiert. Regelmäßige Security-Reviews mit Hauptlieferanten.',
    rationale: 'Erfüllt: Strukturierter Lieferantenmanagement-Prozess mit Security-Anforderungen.',
    measure: '', criteria: [], effort: '', priority: '' },
];

// ── Demo Scenarios ──────────────────────────────────────────────

export interface DemoScenario {
  facility: { name: string; types: string[] };
  securityLevel: string;
  description: string;
  zones: string[];
  protocols: string[];
  roles: string[];
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    facility: { name: 'Chemiewerk Ludwigshafen — Leittechnik', types: ['dcs', 'plc', 'his'] },
    securityLevel: 'sl3',
    description: 'Verteiltes Leitsystem (DCS) mit 120 SPS-Steuerungen für chemische Prozessanlagen. OPC-UA-Kommunikation zwischen SCADA und SPS. Historian-Datenbank für Prozessdatenaufzeichnung. 5 Engineering-Workstations.',
    zones: ['enterprise', 'dmz', 'control', 'field'],
    protocols: ['OPC-UA', 'Modbus TCP', 'PROFINET', 'HTTPS/REST', 'SSH', 'RDP'],
    roles: ['OT-Security-Beauftragter', 'Leittechnik-Ingenieur', 'Operator', 'Wartungstechniker'],
    measures: { iac: { active: true, documented: false, audited: false }, segmentation: { active: true, documented: true, audited: false }, backup: { active: true, documented: true, audited: false }, patch: { active: true, documented: false, audited: false } },
    knownIssues: 'Flaches Netzwerk IT/OT, Shared Accounts auf HMI, Modbus ohne Auth, kein OT-Monitoring.',
    files: [
      { name: 'Chemiewerk_Netzwerkarchitektur_v3.2.pdf', size: 2_850_000, type: 'arch' },
      { name: 'Chemiewerk_Risikoanalyse_2024.pdf', size: 1_420_000, type: 'riskAssess' },
      { name: 'Zone_Conduit_Diagramm.vsdx', size: 890_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'Stadtwerke Rheinberg — Wasserversorgung', types: ['scada', 'rtu', 'plc'] },
    securityLevel: 'sl2',
    description: 'SCADA-System für Wasserversorgung mit 35 RTUs an Brunnenstandorten und Pumpwerken. Kommunikation über LTE/VPN. Zentrales Leitsystem mit Historian.',
    zones: ['enterprise', 'control', 'field', 'remote'],
    protocols: ['DNP3', 'Modbus TCP', 'HTTPS/REST', 'VPN (IPsec/WireGuard)', 'MQTT'],
    roles: ['Betriebsleiter', 'Leitstandoperator', 'Servicetechniker'],
    measures: { iac: { active: true, documented: true, audited: false }, backup: { active: true, documented: false, audited: false }, vendor: { active: true, documented: true, audited: true } },
    knownIssues: 'RTUs mit Default-Passwörtern, kein OT-IDS, DR-Plan nur für IT.',
    files: [
      { name: 'Stadtwerke_SCADA_Architektur.pdf', size: 1_650_000, type: 'arch' },
      { name: 'Stadtwerke_ISM_Policy_v2.pdf', size: 540_000, type: 'policy' },
    ],
  },
  {
    facility: { name: 'AutoParts AG — Fertigung', types: ['plc', 'edge', 'his'] },
    securityLevel: 'sl2',
    description: 'Automobilfertigung mit 80 SPS-Steuerungen, Edge-Computing für Qualitätskontrolle (KI-basiert). MES-Integration über OPC-UA. 3 Produktionslinien.',
    zones: ['enterprise', 'dmz', 'control', 'field'],
    protocols: ['OPC-UA', 'PROFINET', 'EtherNet/IP', 'MQTT', 'HTTPS/REST'],
    roles: ['Produktionsleiter', 'Automatisierungsingenieur', 'IT-Security-Manager', 'Instandhaltung'],
    measures: { segmentation: { active: true, documented: true, audited: true }, monitoring: { active: true, documented: false, audited: false }, patch: { active: true, documented: true, audited: false }, training: { active: true, documented: false, audited: false } },
    knownIssues: 'Legacy-SPS ohne Patch-Möglichkeit, OPC-UA Security Mode None auf Edge-Nodes.',
    files: [
      { name: 'AutoParts_OT_Architektur_v4.pdf', size: 3_200_000, type: 'arch' },
      { name: 'AutoParts_Pentest_OT_2025.pdf', size: 1_120_000, type: 'pentest' },
      { name: 'AutoParts_ZoneConduit_Map.pdf', size: 780_000, type: 'zoneMap' },
    ],
  },
];
