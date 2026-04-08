// ── IACS UR E27 Compliance Tool — Data Model ─────────────────
// Based on IACS Unified Requirement E27: Cyber Resilience of On-Board Systems and Equipment
// References IEC 62443-3-3 System Requirements

type T = (key: string) => string;

// ── Ship System Types (CBS in scope of E26) ─────────────────
const ST_KEYS = ['propulsion', 'steering', 'navigation', 'power', 'cargo', 'comms', 'safety', 'ecdis'] as const;
const ST_ICONS = ['⚙️', '🔄', '🧭', '⚡', '📦', '📡', '🛟', '🗺️'];
const ST_T_KEYS = ['stPropulsion', 'stSteering', 'stNavigation', 'stPower', 'stCargo', 'stComms', 'stSafety', 'stEcdis'];
const ST_DESC_KEYS = ['stPropulsionDesc', 'stSteeringDesc', 'stNavigationDesc', 'stPowerDesc', 'stCargoDesc', 'stCommsDesc', 'stSafetyDesc', 'stEcdisDesc'];

export function getSystemTypes(t: T) {
  return ST_KEYS.map((id, i) => ({
    id,
    label: t(`iec.${ST_T_KEYS[i]}`),
    icon: ST_ICONS[i],
    desc: t(`iec.${ST_DESC_KEYS[i]}`),
  }));
}

// ── Security Levels (SL 1-4 from IEC 62443, referenced by E27) ──
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

// ── Ship Network Zones ──────────────────────────────────────
const ZC_IDS = ['bridge', 'engineroom', 'crew', 'cargo_ot', 'safety_zone', 'shore'] as const;
const ZC_ICONS = ['🚢', '⚙️', '👥', '📦', '🛟', '🌐'];
const ZC_KEYS = ['zcBridge', 'zcEngineRoom', 'zcCrew', 'zcCargoOt', 'zcSafetyZone', 'zcShore'];

export function getZoneConduits(t: T) {
  return ZC_IDS.map((id, i) => ({
    id,
    label: t(`iec.${ZC_KEYS[i]}`),
    icon: ZC_ICONS[i],
  }));
}

// ── Maritime Protocol/Interface Options ─────────────────────
export const PROTOCOL_OPTS = [
  { label: 'NMEA 0183', icon: '🧭' }, { label: 'NMEA 2000', icon: '🧭' },
  { label: 'IEC 61162-450', icon: '📡' }, { label: 'Modbus TCP', icon: '⚙️' },
  { label: 'CANbus (J1939)', icon: '⚙️' }, { label: 'PROFINET', icon: '🔌' },
  { label: 'EtherNet/IP', icon: '🔌' }, { label: 'OPC-UA', icon: '🏭' },
  { label: 'HTTPS/REST', icon: '🔒' }, { label: 'SSH', icon: '🔑' },
  { label: 'VSAT/Fleet Broadband', icon: '📡' }, { label: 'VPN (IPsec)', icon: '🛡️' },
  { label: 'Serial (RS-422/485)', icon: '🔗' }, { label: 'Wireless (WiFi)', icon: '📶' },
  { label: 'Bluetooth', icon: '📶' }, { label: 'USB', icon: '🖇️' },
] as const;

// ── Security Measures (mapped to E27 Table 1 categories) ────
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

// ── Attach Types ────────────────────────────────────────────
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

// ── E27 Requirement Categories (based on E27 Table 1 + Table 2 grouping) ──
export const FR_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  IAC: { label: { de: 'Identifikation & Authentifizierung', en: 'Identification & Authentication', fr: 'Identification & authentification' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  UC: { label: { de: 'Zugriffskontrolle', en: 'Use Control', fr: 'Contrôle d\'utilisation' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  SI: { label: { de: 'Systemintegrität', en: 'System Integrity', fr: 'Intégrité système' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  DC: { label: { de: 'Datenvertraulichkeit', en: 'Data Confidentiality', fr: 'Confidentialité des données' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  AL: { label: { de: 'Audit & Logging', en: 'Audit & Logging', fr: 'Audit & journalisation' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  RA: { label: { de: 'Ressourcenverfügbarkeit', en: 'Resource Availability', fr: 'Disponibilité des ressources' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  UTN: { label: { de: 'Untrusted-Network-Schutz', en: 'Untrusted Network Protection', fr: 'Protection réseau non fiable' }, dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

// ── Types ───────────────────────────────────────────────────

export interface IecThreat {
  id: number;
  fr: string; // IAC, UC, SI, DC, AL, RA, UTN
  name: string;
  component: string;
  attacker: string;
  path: string;
  iecRef: string; // E27 Table ref (e.g. "E27-SI01" mapped to SR)
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
  article: string; // E27 SI-No reference e.g. "E27-01 (SR 1.1)"
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

// ── Demo Threats (14 threats — maritime context) ────────────

export const IEC_THREATS: IecThreat[] = [
  // IAC — Identification & Authentication (3)
  { id: 1, fr: 'IAC', name: 'Shared Accounts auf Brücken-Workstations', component: 'ECDIS/RADAR Workstation — Benutzerverwaltung', attacker: 'Crew-Mitglied', path: 'Gemeinsamer Admin-Account (admin/admin) → keine individuelle Zuordnung → Missbrauch nicht nachvollziehbar', iecRef: 'E27-01 (SR 1.1)',
    likelihood: 4, impact: 4,
    evidence: 'Im Rahmen des Konfigurationsaudits wurde festgestellt, dass drei von vier Brücken-Workstations einen gemeinsamen Admin-Account verwenden. Eine individuelle Authentifizierung findet nicht statt. Audit-Logs auf Benutzerebene sind nicht vorhanden.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da Shared Accounts auf Schiffen weit verbreitet sind und ein Missbrauch kaum nachweisbar ist. Die Auswirkung wird mit 4 bewertet, da unbefugte Navigationsänderungen die Schiffssicherheit unmittelbar gefährden können.',
    sources: ['IACS UR E27 Table 1 SI-01: Human user identification and authentication', 'IEC 62443-3-3 SR 1.1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, fr: 'IAC', name: 'Fehlende Authentifizierung auf NMEA-Netzwerk', component: 'NMEA 0183/2000 — Sensorbus', attacker: 'Netzwerk-Angreifer (lokal)', path: 'NMEA hat keine native Authentifizierung → Angreifer im Bordnetz kann Navigationsdaten manipulieren', iecRef: 'E27-01 (SR 1.1)',
    likelihood: 4, impact: 5,
    evidence: 'Die Netzwerkanalyse hat ergeben, dass der NMEA-Datenstrom unverschlüsselt übertragen wird. Ein GPS-Spoofing-Angriff über gefälschte NMEA-Sätze wurde im Rahmen eines Proof of Concept erfolgreich durchgeführt. Eine Integritätsprüfung der Sensordaten findet nicht statt.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da NMEA über keine native Authentifizierung verfügt und physischer Zugang zum Netzwerk an Bord gegeben ist. Die Auswirkung wird mit 5 bewertet, da manipulierte Navigationsdaten zu Grundberührung oder Kollision führen können.',
    sources: ['IACS UR E27 Table 1 SI-01', 'NIST SP 800-82r3', 'GPS-Spoofing Research (Humphreys, UT Austin)'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 9, fr: 'IAC', name: 'Standard-Passwörter auf Maschinensteuerung', component: 'Engine Control System — Login', attacker: 'Wartungspersonal / Insider', path: 'Default-Credentials des Herstellers nicht geändert → Vollzugriff auf Maschinensteuerung', iecRef: 'E27-04 (SR 1.5)',
    likelihood: 4, impact: 5,
    evidence: 'Bei einer Stichprobe wurden bei drei von vier Steuerungssystemen die Hersteller-Default-Passwörter vorgefunden. Das zugehörige Service-Manual mit den Zugangsdaten ist öffentlich verfügbar.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da Default-Credentials in maritimen Systemen häufig anzutreffen sind und die Hersteller-Dokumentation öffentlich zugänglich ist. Die Auswirkung wird mit 5 bewertet, da ein Vollzugriff auf die Antriebssteuerung Safety-Relevanz besitzt.',
    sources: ['IACS UR E27 Table 1 SI-04: Authenticator management', 'IEC 62443-3-3 SR 1.5'], evidenceQuality: 4, reproducibility: 'easy' },

  // UC — Use Control (2)
  { id: 3, fr: 'UC', name: 'Fehlende rollenbasierte Zugriffssteuerung (RBAC)', component: 'Integrated Bridge System — Autorisierung', attacker: 'Authentifizierter Benutzer', path: 'Alle Benutzer haben identische Rechte → Matrose kann Navigationseinstellungen ändern', iecRef: 'E27-08 (SR 2.1)',
    likelihood: 4, impact: 3,
    evidence: 'Die Konfigurationsanalyse des Bridge-Systems hat ergeben, dass lediglich eine einzige Berechtigungsstufe existiert. Offiziere, Matrosen und Service-Techniker verfügen über identische Zugriffsrechte.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da fehlende RBAC auf Bordsystemen weit verbreitet ist. Die Auswirkung wird mit 3 bewertet, da Fehlkonfigurationen durch unqualifiziertes Personal möglich, aber nicht unmittelbar sicherheitskritisch sind.',
    sources: ['IACS UR E27 Table 1 SI-08: Authorization enforcement', 'IEC 62443-3-3 SR 2.1'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 10, fr: 'UC', name: 'USB-Ports an Bordsystemen nicht deaktiviert', component: 'Bridge/Engine Room — USB-Schnittstellen', attacker: 'Crew / Hafenpersonal', path: 'Offene USB-Ports → USB-Stick mit Malware → CBS-Kompromittierung', iecRef: 'E27-10 (SR 2.3)',
    likelihood: 4, impact: 5,
    evidence: 'Bei der Vor-Ort-Prüfung wurde festgestellt, dass die USB-Ports an ECDIS-, Radar- und Engine-Workstations physisch zugänglich und nicht gesperrt sind. Die Crew lädt regelmäßig Kartenupdates über USB-Datenträger.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da die USB-Nutzung im maritimen Betrieb üblich ist (Kartenupdates, Log-Exporte). Die Auswirkung wird mit 5 bewertet, da eine Malware-Einschleusung in Safety-kritische Systeme unmittelbar möglich ist.',
    sources: ['IACS UR E27 Table 1 SI-10: Portable and mobile devices', 'IEC 62443-3-3 SR 2.3', 'BIMCO Cyber Security Guidelines'], evidenceQuality: 4, reproducibility: 'medium' },

  // SI — System Integrity (2)
  { id: 4, fr: 'SI', name: 'Fehlende Firmware-Signaturprüfung bei CBS-Updates', component: 'CBS — Firmware-Update-Prozess', attacker: 'Supply-Chain-Angreifer', path: 'Firmware-Updates ohne kryptographische Signatur → manipulierte Firmware kann installiert werden', iecRef: 'E27-19 (SR 3.3)',
    likelihood: 2, impact: 5,
    evidence: 'Die Analyse des Firmware-Update-Prozesses hat ergeben, dass Updates ausschließlich über USB aufgespielt werden. Eine kryptographische Signaturprüfung findet nicht statt. Ein modifiziertes Firmware-Image wurde im Test ohne Fehlermeldung akzeptiert.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 2 bewertet, da ein Zugang zur Update-Lieferkette erforderlich ist. Die Auswirkung wird mit 5 bewertet, da eine persistente Kompromittierung eines Safety-relevanten CBS die Folge sein kann.',
    sources: ['IACS UR E27 Table 1 SI-19: Security functionality verification', 'IEC 62443-3-3 SR 3.3'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 11, fr: 'SI', name: 'Kein Malware-Schutz auf ECDIS-Workstation', component: 'ECDIS — Software-Integrität', attacker: 'Externer Angreifer / Malware', path: 'Kein Antivirus/Whitelisting → Malware über USB/Netzwerk → ECDIS-Ausfall → Verlust der elektronischen Seekarte', iecRef: 'E27-18 (SR 3.2)',
    likelihood: 4, impact: 5,
    evidence: 'Der Konfigurationscheck hat ergeben, dass die ECDIS-Workstation auf Windows basiert und weder über eine Antivirus-Lösung noch über Application Whitelisting verfügt. Das letzte Betriebssystem-Update liegt 18 Monate zurück. USB-Ports sind offen.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da USB-basierte Infektionsvektoren realistisch sind und Internetzugang über VSAT besteht. Die Auswirkung wird mit 5 bewertet, da ein ECDIS-Ausfall bei Fehlen aktueller Papierseekarten SOLAS-relevant ist.',
    sources: ['IACS UR E27 Table 1 SI-18: Malicious code protection', 'IEC 62443-3-3 SR 3.2', 'IMO MSC.1/Circ.1526'], evidenceQuality: 5, reproducibility: 'easy' },

  // DC — Data Confidentiality (1)
  { id: 5, fr: 'DC', name: 'Unverschlüsselte Kommunikation zum Shore-Netzwerk', component: 'VSAT-Link — Schiff-Land-Kommunikation', attacker: 'Netzwerk-Mitleser', path: 'Datenverkehr Schiff↔Shore ohne TLS → Betriebsdaten, Crew-Daten, Frachtdaten im Klartext', iecRef: 'E27-22 (SR 4.1)',
    likelihood: 3, impact: 4,
    evidence: 'Der Netzwerkmitschnitt hat HTTP-Verbindungen zum Fleet-Management-System ohne TLS-Verschlüsselung aufgezeigt. Crew-Login-Daten werden im Klartext übertragen. Frachtmanifest-Daten sind exponiert.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 3 bewertet, da eine VSAT-Interception technisch anspruchsvoll, für staatliche Akteure jedoch trivial ist. Die Auswirkung wird mit 4 bewertet, da Betriebsdaten und personenbezogene Daten der Crew exponiert werden.',
    sources: ['IACS UR E27 Table 1 SI-22: Information confidentiality', 'IEC 62443-3-3 SR 4.1'], evidenceQuality: 4, reproducibility: 'medium' },

  // AL — Audit & Logging (2)
  { id: 7, fr: 'AL', name: 'Kein zentrales Security-Monitoring an Bord', component: 'Bordnetzwerk — Monitoring', attacker: 'APT / Insider', path: 'Keine Anomalie-Erkennung → Angriffe bleiben unerkannt → freie Bewegung im Netzwerk', iecRef: 'E27-24 (SR 6.1)',
    likelihood: 4, impact: 4,
    evidence: 'Das Infrastruktur-Review hat ergeben, dass kein Intrusion-Detection-System im Bordnetzwerk installiert ist. Eine zentrale Log-Aggregation findet nicht statt. Einzelne Systeme protokollieren lokal, die Logs werden jedoch nicht systematisch ausgewertet.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da Angriffe ohne Monitoring-Infrastruktur nicht erkannt werden. Die Auswirkung wird mit 4 bewertet, da eine unerkannte Kompromittierung die Eskalation auf Safety-Systeme ermöglicht.',
    sources: ['IACS UR E27 Table 1 SI-24: Audit log accessibility', 'IEC 62443-3-3 SR 6.1'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 13, fr: 'AL', name: 'Audit-Logs ohne Zeitstempel-Synchronisation', component: 'CBS — NTP/Zeitsynchronisation', attacker: 'Beliebiger Angreifer', path: 'Keine NTP-Synchronisation → Log-Korrelation unmöglich → Forensik erschwert', iecRef: 'E27-16 (SR 2.11)',
    likelihood: 5, impact: 2,
    evidence: 'Eine Stichprobe hat ergeben, dass die Uhrzeiten der CBS-Systeme um bis zu 47 Minuten voneinander abweichen. Ein NTP-Server ist an Bord nicht vorhanden. Die Logs sind nicht korrelierbar.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 5 bewertet, da der Befund sofort bei der Prüfung erkennbar war. Die Auswirkung wird mit 2 bewertet, da keine direkte Safety-Auswirkung besteht, die forensische Aufklärung jedoch massiv behindert wird.',
    sources: ['IACS UR E27 Table 1 SI-16: Timestamps', 'IEC 62443-3-3 SR 2.11'], evidenceQuality: 5, reproducibility: 'easy' },

  // RA — Resource Availability (2)
  { id: 8, fr: 'RA', name: 'Kein Redundanzkonzept für Navigations-CBS', component: 'ECDIS/Radar — Hochverfügbarkeit', attacker: 'Hardware-Ausfall / Ransomware', path: 'Kein Failover → CBS-Ausfall → Verlust der Navigation → SOLAS-Verstoß', iecRef: 'E27-25 (SR 7.1)',
    likelihood: 3, impact: 5,
    evidence: 'Das Architektur-Review hat ergeben, dass das ECDIS auf einzelner Hardware ohne Backup betrieben wird. Ein automatischer Failover auf Radar-Standalone ist nicht vorgesehen. Ein Backup-ECDIS ist zwar physisch vorhanden, jedoch nicht konfiguriert.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 3 bewertet, da Hardwareausfälle realistisch und Ransomware-Szenarien dokumentiert sind. Die Auswirkung wird mit 5 bewertet, da ein Navigationsverlust SOLAS-relevant ist.',
    sources: ['IACS UR E27 Table 1 SI-25: DoS protection', 'IEC 62443-3-3 SR 7.1', 'SOLAS V/19.2'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 14, fr: 'RA', name: 'Kein Disaster-Recovery-Plan für CBS', component: 'Bordnetzwerk — DR-Planung', attacker: 'Cyberangriff / Ausfall', path: 'Kein DR-Plan → im Ernstfall keine geordnete Wiederherstellung → verlängerter Systemausfall auf See', iecRef: 'E27-28 (SR 7.4)',
    likelihood: 3, impact: 4,
    evidence: 'Die Dokumentenprüfung hat ergeben, dass kein Recovery-Plan für CBS vorliegt. Backup-Prozeduren sind nicht dokumentiert. Der Zeitpunkt des letzten Systembackups ist nicht bekannt.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 3 bewertet, da Disaster-Recovery-Szenarien auf See realistisch sind. Die Auswirkung wird mit 4 bewertet, da eine Wiederherstellung ohne Recovery-Plan mehrere Tage in Anspruch nehmen kann (nächster Hafen).',
    sources: ['IACS UR E27 Table 1 SI-28: System recovery and reconstitution', 'IEC 62443-3-3 SR 7.4'], evidenceQuality: 3, reproducibility: 'hard' },

  // UTN — Untrusted Network (2)
  { id: 6, fr: 'UTN', name: 'Fehlende Netzwerksegmentierung zwischen IT und OT', component: 'Bordnetzwerk — Zonenübergang IT/OT', attacker: 'Externer Angreifer / Ransomware', path: 'Flaches Netzwerk → Ransomware aus Crew-IT propagiert in OT → Navigations-/Maschinenausfall', iecRef: 'E27-36 (SR 1.13)',
    likelihood: 4, impact: 5,
    evidence: 'Die Netzwerkanalyse hat ergeben, dass Crew-WiFi, administrative IT-Systeme und OT-Systeme im gleichen Netzwerksegment betrieben werden. Eine Firewall zwischen den Zonen existiert nicht. Ein Ping-Test von einem Crew-Laptop zum ECDIS war erfolgreich.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 4 bewertet, da Ransomware-Infektionen über den Crew-Internetzugang häufig dokumentiert sind (vgl. NotPetya, Maersk 2017). Die Auswirkung wird mit 5 bewertet, da ein Navigationssystem- und Maschinenausfall die Folge sein kann.',
    sources: ['IACS UR E27 Table 2 SI-36: Access via untrusted networks', 'IEC 62443-3-3 SR 1.13', 'Maersk NotPetya Case Study'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 12, fr: 'UTN', name: 'Kein Remote-Access-Management für Fernwartung', component: 'VSAT — Remote Access', attacker: 'Externer Angreifer', path: 'Fernwartung ohne MFA oder Genehmigung → Hersteller-Zugriff unkontrolliert → CBS-Kompromittierung', iecRef: 'E27-37 (SR 1.13 RE1)',
    likelihood: 3, impact: 5,
    evidence: 'Der Konfigurationscheck hat ergeben, dass ein Remote-Desktop-Zugang über VSAT ohne Multi-Faktor-Authentifizierung besteht. Die Hersteller-VPN-Verbindung ist permanent aktiv. Eine Freigabe durch das Bordpersonal ist nicht erforderlich.',
    rationale: 'Die Eintrittswahrscheinlichkeit wird mit 3 bewertet, da ein permanent aktiver Remote-Zugang ein dokumentierter Angriffsvektor ist. Die Auswirkung wird mit 5 bewertet, da ein unkontrollierter Vollzugriff auf Safety-kritische CBS möglich ist.',
    sources: ['IACS UR E27 Table 2 SI-37: Explicit access request approval', 'IEC 62443-3-3 SR 1.13 RE1'], evidenceQuality: 4, reproducibility: 'medium' },
];

// ── IACS UR E27 Requirements (Table 1: 31 + Table 2: 10 = 41, consolidated to 22 key items) ──

export const IEC_REQS: IecReq[] = [
  // IAC — Identification & Authentication
  { id: 'IAC-1', article: 'E27-01 (SR 1.1)', name: 'Human User Identification & Authentication', status: 'fail',
    gap: 'Shared Accounts auf Brücke, NMEA ohne Authentifizierung, Default-Passwörter auf Steuerungssystemen',
    evidence: 'Auf drei von vier Brücken-Workstations werden gemeinsame Admin-Accounts verwendet. Das NMEA-Netzwerk verfügt über keine Authentifizierung. Auf der Maschinensteuerung sind Default-Passwörter aktiv.',
    rationale: 'Die Anforderung ist nicht erfüllt. Drei voneinander unabhängige Schwachstellen verletzen E27-01. Eine individuelle Identifikation ist Grundvoraussetzung für die Nachvollziehbarkeit von Handlungen (Accountability).',
    measure: '1. Einführung individueller Benutzerkonten auf allen Brücken-CBS. 2. Schutz des NMEA-Netzwerks durch ein Firewall-/Gateway-System. 3. Erzwingung eines Passwortwechsels bei Erstinbetriebnahme.',
    criteria: ['Alle Benutzer authentifizieren sich individuell', 'NMEA-Datenstrom durch Gateway mit Integritätsprüfung geschützt', 'Default-Credentials bei Inbetriebnahme zwingend geändert'],
    effort: '40-60h', priority: 'P0' },
  { id: 'IAC-2', article: 'E27-02 (SR 1.3)', name: 'Account Management', status: 'partial',
    gap: 'Keine zentrale Benutzerverwaltung; Accounts werden bei Crew-Wechsel nicht deaktiviert',
    evidence: 'Ein zentrales Account-Management ist nicht vorhanden. Crew-Wechsel führen nicht zur Deaktivierung von Benutzerkonten. Service-Accounts besitzen kein Ablaufdatum.',
    rationale: 'Die Anforderung ist teilweise erfüllt. Benutzerkonten existieren, der Lifecycle (Anlegen, Deaktivieren, Überprüfen) wird jedoch nicht systematisch verwaltet.',
    measure: 'Einführung eines zentralen Account-Managements. Automatische Deaktivierung bei Crew-Wechsel. Vergabe von Ablaufdaten für Service-Accounts.',
    criteria: ['Account-Lifecycle-Prozess dokumentiert', 'Crew-Wechsel löst automatischen Account-Review aus'],
    effort: '16-24h', priority: 'P1' },
  { id: 'IAC-3', article: 'E27-04 (SR 1.5)', name: 'Authenticator Management', status: 'fail',
    gap: 'Default-Passwörter auf Steuerungssystemen, keine Passwort-Policy definiert',
    evidence: 'Drei von vier Steuerungssystemen verwenden das Hersteller-Default-Passwort. Eine CBS-spezifische Passwort-Policy ist nicht definiert.',
    rationale: 'Die Anforderung ist nicht erfüllt. Default-Credentials in Kombination mit einer fehlenden Passwort-Policy stellen ein erhebliches Sicherheitsrisiko dar.',
    measure: '1. Definition einer CBS-Passwort-Policy. 2. Eliminierung aller Default-Credentials bei Inbetriebnahme. 3. Einführung eines Passwort-Safes für CBS-Zugangsdaten.',
    criteria: ['CBS-Passwort-Policy dokumentiert und durchgesetzt', 'Alle Default-Credentials eliminiert'],
    effort: '16-24h', priority: 'P0' },

  // UC — Use Control
  { id: 'UC-1', article: 'E27-08 (SR 2.1)', name: 'Authorization Enforcement', status: 'fail',
    gap: 'Keine RBAC auf Bridge-System, einheitliche Berechtigungsstufe',
    evidence: 'Bridge-System ohne Rollendifferenzierung. Jeder angemeldete Benutzer hat volle Konfigurationsrechte.',
    rationale: 'Nicht erfüllt: Fehlende RBAC verletzt das Least-Privilege-Prinzip.',
    measure: '1. RBAC konfigurieren (Kapitän, Offizier, Service). 2. Berechtigungsmatrix dokumentieren.',
    criteria: ['Mindestens 3 Rollen mit differenzierten Berechtigungen', 'Berechtigungsmatrix dokumentiert'],
    effort: '24-32h', priority: 'P1' },
  { id: 'UC-2', article: 'E27-10 (SR 2.3)', name: 'Portable & Mobile Devices', status: 'partial',
    gap: 'USB-Ports nicht deaktiviert, kein Wechselmedien-Konzept',
    evidence: 'USB-Ports an ECDIS und Engine-Workstations physisch zugänglich. Keine USB-Port-Sperre.',
    rationale: 'Teilweise erfüllt: Organisatorische Regelung vorhanden, technisch nicht durchgesetzt.',
    measure: '1. USB-Ports per BIOS/Software deaktivieren. 2. Dedizierte Kiosk-Station für Kartenupdates. 3. Wechselmedien-Policy.',
    criteria: ['USB-Ports technisch deaktiviert (Ausnahme: dedizierte Stationen)', 'Wechselmedien-Policy dokumentiert'],
    effort: '12-20h', priority: 'P1' },
  { id: 'UC-3', article: 'E27-12 (SR 2.5)', name: 'Session Lock', status: 'partial',
    gap: 'Keine automatische Session-Sperre auf Brücken-CBS',
    evidence: 'ECDIS und Radar-Workstations haben keine automatische Bildschirmsperre. Sessions bleiben permanent aktiv.',
    rationale: 'Teilweise erfüllt: Manuelle Sperre möglich, aber kein Timeout konfiguriert.',
    measure: 'Automatische Session-Sperre nach 15 Minuten Inaktivität auf allen CBS konfigurieren.',
    criteria: ['Session-Lock nach max. 15 Minuten auf allen CBS aktiv'],
    effort: '4-8h', priority: 'P2' },

  // SI — System Integrity
  { id: 'SI-1', article: 'E27-18 (SR 3.2)', name: 'Malicious Code Protection', status: 'fail',
    gap: 'Kein Malware-Schutz auf ECDIS und Engine-Workstations',
    evidence: 'ECDIS Windows-basiert, kein Antivirus, kein Whitelisting. OS-Update 18 Monate alt.',
    rationale: 'Nicht erfüllt: Kein Schutz gegen Malware auf Safety-kritischen CBS.',
    measure: '1. Application Whitelisting auf allen CBS. 2. Offline-Signatur-Updates. 3. Regelmäßige Scans.',
    criteria: ['Application Whitelisting auf allen CBS aktiv', 'Signatur-Updates max. 30 Tage alt'],
    effort: '16-24h', priority: 'P0' },
  { id: 'SI-2', article: 'E27-17 (SR 3.1)', name: 'Communication Integrity', status: 'fail',
    gap: 'NMEA-Kommunikation ohne Integritätsschutz',
    evidence: 'NMEA-Datenstrom unverschlüsselt und ohne Integritätsprüfung. GPS-Spoofing-PoC erfolgreich.',
    rationale: 'Nicht erfüllt: Manipulierte Navigationsdaten werden ohne Prüfung akzeptiert.',
    measure: '1. NMEA-Gateway mit Integritätsprüfung. 2. Multi-Source-Vergleich (GPS/GLONASS/Galileo). 3. AIS-Kreuzprüfung.',
    criteria: ['NMEA-Gateway mit Plausibilitätsprüfung installiert', 'Multi-GNSS-Validierung aktiv'],
    effort: '24-40h', priority: 'P0' },
  { id: 'SI-3', article: 'E27-20 (SR 3.5)', name: 'Input Validation', status: 'partial',
    gap: 'Keine Validierung externer Inputs über Untrusted Networks',
    evidence: 'Fleet-Management-Daten werden ohne Validierung verarbeitet. Keine Input-Sanitization.',
    rationale: 'Teilweise erfüllt: Interne Datenverarbeitung validiert, externe Inputs nicht.',
    measure: 'Input-Validierung für alle Daten aus Untrusted Networks implementieren.',
    criteria: ['Input-Validierung für alle externen Datenquellen implementiert'],
    effort: '16-24h', priority: 'P2' },
  { id: 'SI-4', article: 'E27-21 (SR 3.6)', name: 'Deterministic Output', status: 'pass',
    gap: '',
    evidence: 'Engine Control System geht bei CBS-Ausfall in definierten Safe-State (Dead Ship Condition Procedure). ECDIS hat papierbasierte Rückfallebene.',
    rationale: 'Erfüllt: Fail-Safe-Verhalten dokumentiert und getestet.',
    measure: '', criteria: [], effort: '', priority: '' },

  // DC — Data Confidentiality
  { id: 'DC-1', article: 'E27-22 (SR 4.1)', name: 'Information Confidentiality', status: 'fail',
    gap: 'Unverschlüsselte Kommunikation zum Shore-Netzwerk',
    evidence: 'HTTP-Verbindungen zum Fleet-Management ohne TLS. Crew-Login-Daten im Klartext.',
    rationale: 'Nicht erfüllt: Betriebsdaten und PII unverschlüsselt über VSAT übertragen.',
    measure: '1. TLS 1.2+ für alle Shore-Verbindungen. 2. VPN für Fleet-Management. 3. Verschlüsselung at Rest auf CBS.',
    criteria: ['Alle Shore-Verbindungen über TLS 1.2+', 'Fleet-Management über VPN-Tunnel'],
    effort: '24-40h', priority: 'P0' },
  { id: 'DC-2', article: 'E27-23 (SR 4.3)', name: 'Use of Cryptography', status: 'partial',
    gap: 'Veraltete Krypto-Algorithmen, kein Zertifikatsmanagement',
    evidence: 'TLS 1.0 auf einigen Systemen. Selbstsignierte Zertifikate. Kein Zertifikats-Lifecycle.',
    rationale: 'Teilweise erfüllt: Kryptographie eingesetzt, aber veraltet und nicht zentral verwaltet.',
    measure: 'TLS 1.2+ erzwingen. Zertifikatsmanagement aufbauen.',
    criteria: ['TLS 1.0/1.1 deaktiviert', 'Zertifikats-Lifecycle-Management'],
    effort: '16-24h', priority: 'P2' },

  // AL — Audit & Logging
  { id: 'AL-1', article: 'E27-13 (SR 2.8)', name: 'Auditable Events', status: 'fail',
    gap: 'Keine ausreichende Event-Protokollierung auf CBS',
    evidence: 'Kein IDS/IPS. Keine zentrale Log-Aggregation. Einzelsystem-Logs unausgewertet.',
    rationale: 'Nicht erfüllt: Security-Events werden nicht systematisch erfasst.',
    measure: '1. Zentrale Log-Aggregation (Syslog-Server). 2. IDS im Bordnetzwerk. 3. Event-Monitoring-Policy.',
    criteria: ['Zentrale Log-Aggregation für alle CBS', 'IDS in kritischen Netzwerksegmenten'],
    effort: '40-60h', priority: 'P0' },
  { id: 'AL-2', article: 'E27-16 (SR 2.11)', name: 'Timestamps', status: 'fail',
    gap: 'Keine NTP-Synchronisation, Uhrzeiten weichen ab',
    evidence: 'Uhrzeiten der CBS weichen bis zu 47 Minuten ab. Kein NTP-Server an Bord.',
    rationale: 'Nicht erfüllt: Log-Korrelation ohne Zeitsynchronisation unmöglich.',
    measure: 'NTP-Server an Bord installieren. Alle CBS synchronisieren.',
    criteria: ['NTP-Server an Bord aktiv', 'Alle CBS-Uhrzeiten synchronisiert (max. ±1s Abweichung)'],
    effort: '8-16h', priority: 'P1' },

  // RA — Resource Availability
  { id: 'RA-1', article: 'E27-25 (SR 7.1)', name: 'Denial of Service Protection', status: 'fail',
    gap: 'Kein Failover für Navigations-CBS, Single Point of Failure',
    evidence: 'ECDIS auf einzelner Hardware ohne Backup. Backup-ECDIS vorhanden aber nicht konfiguriert.',
    rationale: 'Nicht erfüllt: Single Point of Failure bei SOLAS-relevantem System.',
    measure: '1. ECDIS Hot-Standby konfigurieren. 2. Automatischer Failover. 3. Regelmäßige Failover-Tests.',
    criteria: ['ECDIS-Failover konfiguriert und getestet', 'Failover-Test halbjährlich'],
    effort: '24-40h', priority: 'P0' },
  { id: 'RA-2', article: 'E27-27 (SR 7.3)', name: 'System Backup', status: 'fail',
    gap: 'Keine dokumentierte Backup-Strategie für CBS',
    evidence: 'Kein Recovery-Plan. Keine dokumentierten Backup-Prozeduren. Letzter Backup: unbekannt.',
    rationale: 'Nicht erfüllt: Keine Backup-Strategie für Safety-relevante CBS.',
    measure: '1. Backup-Policy für alle CBS. 2. Regelmäßige automatisierte Backups. 3. Restore-Tests halbjährlich.',
    criteria: ['CBS-Backup-Policy dokumentiert', 'Automatisierte Backups aktiv', 'Halbjährliche Restore-Tests'],
    effort: '16-24h', priority: 'P1' },
  { id: 'RA-3', article: 'E27-28 (SR 7.4)', name: 'System Recovery & Reconstitution', status: 'partial',
    gap: 'Kein CBS-Recovery-Plan für Szenarien auf See',
    evidence: 'Generischer IT-Recovery-Plan vorhanden. Keine CBS-spezifischen Recovery-Prozeduren für Szenarien auf See.',
    rationale: 'Teilweise erfüllt: Generischer Plan existiert, maritim-spezifische Erweiterung fehlt.',
    measure: 'CBS-spezifischen Recovery-Plan mit maritimen Szenarien erstellen.',
    criteria: ['CBS-Recovery-Plan mit See-Szenarien dokumentiert', 'Jährlicher Recovery-Test'],
    effort: '16-24h', priority: 'P1' },
  { id: 'RA-4', article: 'E27-29 (SR 7.5)', name: 'Emergency Power', status: 'pass',
    gap: '',
    evidence: 'Notstromversorgung für alle Essential CBS vorhanden und getestet. USV-Systeme auf Brücke und Maschinenraum.',
    rationale: 'Erfüllt: Notstromkonzept dokumentiert und regelmäßig getestet.',
    measure: '', criteria: [], effort: '', priority: '' },

  // UTN — Untrusted Network Protection (Table 2)
  { id: 'UTN-1', article: 'E27-32 (SR 1.1 RE2)', name: 'Multifactor Authentication (Untrusted)', status: 'fail',
    gap: 'Kein MFA für Remote-Zugriff über VSAT',
    evidence: 'Remote-Desktop via VSAT ohne MFA. Passwort-only-Authentifizierung.',
    rationale: 'Nicht erfüllt: E27 Table 2 verlangt MFA bei Zugriff über Untrusted Networks.',
    measure: '1. MFA für alle Remote-Zugänge. 2. Hardware-Token oder App-basiert.',
    criteria: ['MFA für alle Zugriffe über Untrusted Networks aktiv'],
    effort: '16-24h', priority: 'P0' },
  { id: 'UTN-2', article: 'E27-36 (SR 1.13)', name: 'Access via Untrusted Networks', status: 'fail',
    gap: 'Keine Überwachung und Kontrolle des Shore-Zugangs',
    evidence: 'Crew-WiFi, Admin-IT und OT im gleichen Segment. Keine Firewall. Shore-Zugang unkontrolliert.',
    rationale: 'Nicht erfüllt: Fundamentaler Verstoß gegen Netzwerksegmentierung.',
    measure: '1. Netzwerksegmentierung (Crew/Admin/OT). 2. Next-Gen-Firewall. 3. DMZ für Shore-Kommunikation.',
    criteria: ['Dedizierte Netzwerksegmente für Crew, Admin und OT', 'Firewall an Zonenübergängen', 'Shore-Zugang nur über DMZ'],
    effort: '60-100h', priority: 'P0' },
  { id: 'UTN-3', article: 'E27-37 (SR 1.13 RE1)', name: 'Explicit Access Request Approval', status: 'fail',
    gap: 'Remote-Zugriff ohne On-Board-Freigabe',
    evidence: 'Hersteller-VPN permanent aktiv. Keine Freigabe durch Bordpersonal erforderlich.',
    rationale: 'Nicht erfüllt: E27 verlangt explizite On-Board-Genehmigung für Remote-Zugriffe.',
    measure: '1. VPN-Zugang nur nach expliziter Freigabe durch Bordoffizier. 2. Session-Logging. 3. Zeitbegrenzung.',
    criteria: ['Remote-Zugriff nur nach On-Board-Freigabe', 'Session-Logging aktiv', 'Zeitlich begrenzte Zugänge'],
    effort: '16-24h', priority: 'P0' },
];

// ── Demo Scenarios (Maritime) ───────────────────────────────

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
    facility: { name: 'MV Northern Spirit — Containerschiff', types: ['propulsion', 'navigation', 'power', 'ecdis'] },
    securityLevel: 'sl2',
    description: 'Containerschiff mit integriertem Brückensystem (IBS), ECDIS, Radar/ARPA, AIS, Engine Control System, Power Management System. VSAT-Verbindung zum Shore-Office. 4 Brücken-Workstations, 2 Engine-Room-Terminals.',
    zones: ['bridge', 'engineroom', 'crew', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'Modbus TCP', 'HTTPS/REST', 'VSAT/Fleet Broadband', 'Serial (RS-422/485)', 'USB'],
    roles: ['Kapitän', 'Chief Engineer', 'IT-Officer', 'Wachoffizier', 'Elektroingenieur'],
    measures: { iac: { active: true, documented: false, audited: false }, backup: { active: true, documented: false, audited: false }, patch: { active: true, documented: false, audited: false } },
    knownIssues: 'Flaches Netzwerk IT/OT, Shared Accounts auf Brücke, USB-Ports offen, kein Monitoring, NMEA ungeschützt.',
    files: [
      { name: 'NorthernSpirit_Netzwerkarchitektur_v2.1.pdf', size: 2_200_000, type: 'arch' },
      { name: 'CBS_Inventory_2024.xlsx', size: 890_000, type: 'riskAssess' },
      { name: 'Network_Topology_Diagram.vsdx', size: 650_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Baltic Trader — RoRo-Fähre', types: ['propulsion', 'steering', 'navigation', 'safety', 'comms'] },
    securityLevel: 'sl3',
    description: 'RoRo-Fähre mit Passagierbetrieb. DP-System, integriertes Brückensystem, Fire Detection System, GMDSS, Public Address System. Hochfrequenter Hafenbetrieb mit regelmäßigen Shore-Connections.',
    zones: ['bridge', 'engineroom', 'crew', 'cargo_ot', 'safety_zone', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'IEC 61162-450', 'Modbus TCP', 'PROFINET', 'HTTPS/REST', 'VPN (IPsec)', 'Wireless (WiFi)'],
    roles: ['Kapitän', 'Safety Officer', 'Chief Engineer', 'IT-Officer', 'DPO (Dynamic Positioning Operator)'],
    measures: { iac: { active: true, documented: true, audited: false }, segmentation: { active: true, documented: false, audited: false }, monitoring: { active: true, documented: false, audited: false }, incident: { active: true, documented: true, audited: false } },
    knownIssues: 'Passagier-WiFi nicht segmentiert, Remote-Wartung ohne MFA, Fire-Detection-System Legacy.',
    files: [
      { name: 'BalticTrader_CyberRiskAssessment_2024.pdf', size: 3_100_000, type: 'riskAssess' },
      { name: 'Network_Segmentation_Plan.pdf', size: 1_800_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Deep Explorer — Offshore-Versorgungsschiff', types: ['propulsion', 'steering', 'navigation', 'cargo', 'comms'] },
    securityLevel: 'sl2',
    description: 'Offshore-Supply-Vessel (OSV) mit DP-2-System für Offshore-Plattform-Versorgung. Engine Management System, Ballast Control, Crane Control. Häufige Fernwartung durch Hersteller.',
    zones: ['bridge', 'engineroom', 'cargo_ot', 'shore'],
    protocols: ['NMEA 2000', 'CANbus (J1939)', 'Modbus TCP', 'OPC-UA', 'VSAT/Fleet Broadband', 'VPN (IPsec)'],
    roles: ['Kapitän', 'DPO (Dynamic Positioning Operator)', 'Chief Engineer', 'ETO (Electro-Technical Officer)'],
    measures: { iac: { active: true, documented: false, audited: false }, vendor: { active: true, documented: true, audited: true }, backup: { active: true, documented: true, audited: false } },
    knownIssues: 'DP-System Fernwartung permanent aktiv, kein MFA, Default-Passwords auf Crane Control.',
    files: [
      { name: 'DeepExplorer_DP_SystemDoc.pdf', size: 4_500_000, type: 'arch' },
      { name: 'Vendor_Access_Policy.pdf', size: 520_000, type: 'policy' },
    ],
  },
];
