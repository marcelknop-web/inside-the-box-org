// ── IACS UR E27 Compliance Tool — Data Model ─────────────────
// Based on IACS Unified Requirement E27: Cyber Resilience of On-Board Systems and Equipment
// References IEC 62443-3-3 System Requirements

type T = (key: string) => string;

// ── Ship System Types (CBS in scope of E26) ─────────────────
// English-only labels (no i18n) — tool is English-only.
const SYSTEM_TYPES = [
  { id: 'propulsion', icon: '⚙️', label: 'Propulsion Control', desc: 'Main engine, thrusters, propeller pitch & RPM control' },
  { id: 'steering',   icon: '🔄', label: 'Steering Gear',       desc: 'Rudder control, autopilot, heading reference' },
  { id: 'navigation', icon: '🧭', label: 'Navigation Systems',  desc: 'GPS/GNSS, RADAR, AIS, gyrocompass, speed log' },
  { id: 'power',      icon: '⚡', label: 'Power Management',     desc: 'Generators, switchboards, PMS, emergency power' },
  { id: 'cargo',      icon: '📦', label: 'Cargo Handling',      desc: 'Ballast, cargo monitoring, IGS, loading computer' },
  { id: 'comms',      icon: '📡', label: 'Communications',      desc: 'GMDSS, VSAT, VHF/UHF, satellite uplink' },
  { id: 'safety',     icon: '🛟', label: 'Safety Systems',      desc: 'Fire detection, watertight doors, alarm & monitoring' },
  { id: 'ecdis',      icon: '🗺️', label: 'ECDIS / IBS',         desc: 'Electronic chart display, integrated bridge system' },
] as const;

export function getSystemTypes(_t?: T) {
  return SYSTEM_TYPES.map(s => ({ ...s }));
}

// ── Security Levels (SL 1-4 from IEC 62443, referenced by E27) ──
const SECURITY_LEVELS = [
  { id: 'sl1', label: 'SL 1 — Casual',     color: 'border-green-500 bg-green-500/10 text-green-400',          desc: 'Protection against casual or coincidental violation' },
  { id: 'sl2', label: 'SL 2 — Intentional', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',       desc: 'Protection against intentional violation using simple means with low resources' },
  { id: 'sl3', label: 'SL 3 — Sophisticated', color: 'border-orange-500 bg-orange-500/10 text-orange-400',     desc: 'Protection against intentional violation using sophisticated means with moderate resources' },
  { id: 'sl4', label: 'SL 4 — Nation-State', color: 'border-destructive bg-destructive/10 text-destructive',   desc: 'Protection against intentional violation using sophisticated means with extended resources' },
] as const;

export function getSecurityLevels(_t?: T) {
  return SECURITY_LEVELS.map(s => ({ ...s }));
}

// ── Ship Network Zones ──────────────────────────────────────
const ZONE_CONDUITS = [
  { id: 'bridge',       icon: '🚢', label: 'Bridge / Navigation Zone' },
  { id: 'engineroom',   icon: '⚙️', label: 'Engine Room / Machinery Zone' },
  { id: 'crew',         icon: '👥', label: 'Crew / Accommodation Network' },
  { id: 'cargo_ot',     icon: '📦', label: 'Cargo OT Zone' },
  { id: 'safety_zone',  icon: '🛟', label: 'Safety Zone (SIS)' },
  { id: 'shore',        icon: '🌐', label: 'Shore Connection / Satellite Link' },
] as const;

export function getZoneConduits(_t?: T) {
  return ZONE_CONDUITS.map(z => ({ ...z }));
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
const SECURITY_MEASURES = [
  { id: 'iac',          label: 'Identification & Authentication Control',  cat: 'Access Control' },
  { id: 'uc',           label: 'Use Control / Authorization',              cat: 'Access Control' },
  { id: 'si',           label: 'System Integrity',                         cat: 'Integrity' },
  { id: 'dc',           label: 'Data Confidentiality (Encryption)',        cat: 'Confidentiality' },
  { id: 'rdf',          label: 'Restricted Data Flow (Zones & Conduits)',  cat: 'Resilience' },
  { id: 'tre',          label: 'Timely Response to Events',                cat: 'Response' },
  { id: 'ra',           label: 'Resource Availability',                    cat: 'Governance' },
  { id: 'patch',        label: 'Patch & Vulnerability Management',         cat: 'Operations' },
  { id: 'backup',       label: 'Backup & Recovery',                        cat: 'Resilience' },
  { id: 'segmentation', label: 'Network Segmentation',                     cat: 'Network' },
  { id: 'monitoring',   label: 'Security Monitoring & Logging',            cat: 'Detection' },
  { id: 'physical',     label: 'Physical Security',                        cat: 'Physical' },
  { id: 'training',     label: 'Crew Training & Awareness',                cat: 'Governance' },
  { id: 'vendor',       label: 'Supplier / Vendor Management',             cat: 'Supply Chain' },
  { id: 'incident',     label: 'Incident Response Plan',                   cat: 'Response' },
] as const;

export function getSecurityMeasures(_t?: T) {
  return SECURITY_MEASURES.map(m => ({ ...m }));
}

export function getSecurityCategories(_t?: T) {
  return [...new Set(SECURITY_MEASURES.map(m => m.cat))];
}

// ── Attach Types ────────────────────────────────────────────
const ATTACH_TYPES = [
  { id: 'arch',       icon: '🗺️', label: 'Architecture / Network Diagram', accept: '.pdf,.png,.jpg,.svg,.pptx,.vsdx,.drawio' },
  { id: 'riskAssess', icon: '📊', label: 'Risk Assessment',                accept: '.pdf,.xlsx,.docx' },
  { id: 'policy',     icon: '📋', label: 'Security Policy / Procedure',    accept: '.pdf,.docx' },
  { id: 'zoneMap',    icon: '🗂️', label: 'Zones & Conduits Map',           accept: '.pdf,.png,.jpg,.svg,.vsdx' },
  { id: 'pentest',    icon: '🔍', label: 'Pentest / Audit Report',         accept: '.pdf,.docx' },
  { id: 'other',      icon: '📎', label: 'Other Evidence',                 accept: '*' },
] as const;

export function getAttachTypes(_t?: T) {
  return ATTACH_TYPES.map(a => ({ ...a }));
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
  certified: boolean;
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
  { id: 1, fr: 'IAC', name: 'Shared Accounts on Bridge Workstations', component: 'ECDIS/RADAR Workstation — User Management', attacker: 'Crew Member', path: 'Shared admin account (admin/admin) → no individual attribution → abuse untraceable', iecRef: 'E27-01 (SR 1.1)',
    likelihood: 4, impact: 4,
    evidence: 'During the configuration audit, it was found that three out of four bridge workstations use a shared admin account. Individual authentication is not in place. User-level audit logs do not exist.',
    rationale: 'Likelihood is rated 4 as shared accounts are widespread on vessels and abuse is virtually untraceable. Impact is rated 4 as unauthorized navigation changes can directly jeopardize vessel safety.',
    sources: ['IACS UR E27 Table 1 SI-01: Human user identification and authentication', 'IEC 62443-3-3 SR 1.1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, fr: 'IAC', name: 'Missing Authentication on NMEA Network', component: 'NMEA 0183/2000 — Sensor Bus', attacker: 'Network Attacker (local)', path: 'NMEA lacks native authentication → attacker on ship network can manipulate navigation data', iecRef: 'E27-01 (SR 1.1)',
    likelihood: 4, impact: 5,
    evidence: 'Network analysis revealed that the NMEA data stream is transmitted unencrypted. A GPS spoofing attack via forged NMEA sentences was successfully demonstrated in a proof of concept. No integrity check on sensor data is performed.',
    rationale: 'Likelihood is rated 4 as NMEA has no native authentication and physical access to the on-board network is given. Impact is rated 5 as manipulated navigation data can lead to grounding or collision.',
    sources: ['IACS UR E27 Table 1 SI-01', 'NIST SP 800-82r3', 'GPS-Spoofing Research (Humphreys, UT Austin)'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 9, fr: 'IAC', name: 'Default Passwords on Engine Control System', component: 'Engine Control System — Login', attacker: 'Maintenance Personnel / Insider', path: 'Manufacturer default credentials not changed → full access to engine control', iecRef: 'E27-04 (SR 1.5)',
    likelihood: 4, impact: 5,
    evidence: 'A spot check revealed that three out of four control systems still use the manufacturer default passwords. The associated service manual with credentials is publicly available.',
    rationale: 'Likelihood is rated 4 as default credentials are commonly found in maritime systems and manufacturer documentation is publicly accessible. Impact is rated 5 as full access to propulsion control is safety-critical.',
    sources: ['IACS UR E27 Table 1 SI-04: Authenticator management', 'IEC 62443-3-3 SR 1.5'], evidenceQuality: 4, reproducibility: 'easy' },

  // UC — Use Control (2)
  { id: 3, fr: 'UC', name: 'Missing Role-Based Access Control (RBAC)', component: 'Integrated Bridge System — Authorization', attacker: 'Authenticated User', path: 'All users have identical privileges → a rating can change navigation settings', iecRef: 'E27-08 (SR 2.1)',
    likelihood: 4, impact: 3,
    evidence: 'Configuration analysis of the bridge system revealed that only a single permission level exists. Officers, ratings, and service technicians all have identical access rights.',
    rationale: 'Likelihood is rated 4 as missing RBAC on ship systems is widespread. Impact is rated 3 as misconfigurations by unqualified personnel are possible but not immediately safety-critical.',
    sources: ['IACS UR E27 Table 1 SI-08: Authorization enforcement', 'IEC 62443-3-3 SR 2.1'], evidenceQuality: 4, reproducibility: 'easy' },
  { id: 10, fr: 'UC', name: 'USB Ports on Ship Systems Not Disabled', component: 'Bridge/Engine Room — USB Interfaces', attacker: 'Crew / Port Personnel', path: 'Open USB ports → USB stick with malware → CBS compromise', iecRef: 'E27-10 (SR 2.3)',
    likelihood: 4, impact: 5,
    evidence: 'On-site inspection confirmed that USB ports on ECDIS, radar, and engine workstations are physically accessible and not locked. Crew regularly loads chart updates via USB media.',
    rationale: 'Likelihood is rated 4 as USB usage in maritime operations is common (chart updates, log exports). Impact is rated 5 as malware injection into safety-critical systems is directly possible.',
    sources: ['IACS UR E27 Table 1 SI-10: Portable and mobile devices', 'IEC 62443-3-3 SR 2.3', 'BIMCO Cyber Security Guidelines'], evidenceQuality: 4, reproducibility: 'medium' },

  // SI — System Integrity (2)
  { id: 4, fr: 'SI', name: 'Missing Firmware Signature Verification for CBS Updates', component: 'CBS — Firmware Update Process', attacker: 'Supply Chain Attacker', path: 'Firmware updates without cryptographic signature → tampered firmware can be installed', iecRef: 'E27-19 (SR 3.3)',
    likelihood: 2, impact: 5,
    evidence: 'Analysis of the firmware update process revealed that updates are applied exclusively via USB. No cryptographic signature verification is performed. A modified firmware image was accepted without error during testing.',
    rationale: 'Likelihood is rated 2 as access to the update supply chain is required. Impact is rated 5 as a persistent compromise of a safety-critical CBS could result.',
    sources: ['IACS UR E27 Table 1 SI-19: Security functionality verification', 'IEC 62443-3-3 SR 3.3'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 11, fr: 'SI', name: 'No Malware Protection on ECDIS Workstation', component: 'ECDIS — Software Integrity', attacker: 'External Attacker / Malware', path: 'No antivirus/whitelisting → malware via USB/network → ECDIS failure → loss of electronic chart', iecRef: 'E27-18 (SR 3.2)',
    likelihood: 4, impact: 5,
    evidence: 'Configuration check revealed that the ECDIS workstation runs on Windows and has neither an antivirus solution nor application whitelisting. The last OS update was 18 months ago. USB ports are open.',
    rationale: 'Likelihood is rated 4 as USB-based infection vectors are realistic and internet access via VSAT exists. Impact is rated 5 as an ECDIS failure without current paper charts is SOLAS-relevant.',
    sources: ['IACS UR E27 Table 1 SI-18: Malicious code protection', 'IEC 62443-3-3 SR 3.2', 'IMO MSC.1/Circ.1526'], evidenceQuality: 5, reproducibility: 'easy' },

  // DC — Data Confidentiality (1)
  { id: 5, fr: 'DC', name: 'Unencrypted Communication to Shore Network', component: 'VSAT Link — Ship-to-Shore Communication', attacker: 'Network Eavesdropper', path: 'Ship↔Shore traffic without TLS → operational data, crew data, cargo data in cleartext', iecRef: 'E27-22 (SR 4.1)',
    likelihood: 3, impact: 4,
    evidence: 'Network capture revealed HTTP connections to the fleet management system without TLS encryption. Crew login credentials are transmitted in cleartext. Cargo manifest data is exposed.',
    rationale: 'Likelihood is rated 3 as VSAT interception is technically demanding but trivial for state-level actors. Impact is rated 4 as operational data and crew personal data are exposed.',
    sources: ['IACS UR E27 Table 1 SI-22: Information confidentiality', 'IEC 62443-3-3 SR 4.1'], evidenceQuality: 4, reproducibility: 'medium' },

  // AL — Audit & Logging (2)
  { id: 7, fr: 'AL', name: 'No Centralized Security Monitoring On Board', component: 'Ship Network — Monitoring', attacker: 'APT / Insider', path: 'No anomaly detection → attacks go undetected → free lateral movement in network', iecRef: 'E27-24 (SR 6.1)',
    likelihood: 4, impact: 4,
    evidence: 'Infrastructure review revealed that no intrusion detection system is installed in the ship network. No centralized log aggregation is in place. Individual systems log locally, but logs are not systematically evaluated.',
    rationale: 'Likelihood is rated 4 as attacks without monitoring infrastructure go undetected. Impact is rated 4 as undetected compromise enables escalation to safety systems.',
    sources: ['IACS UR E27 Table 1 SI-24: Audit log accessibility', 'IEC 62443-3-3 SR 6.1'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 13, fr: 'AL', name: 'Audit Logs Without Timestamp Synchronization', component: 'CBS — NTP/Time Synchronization', attacker: 'Any Attacker', path: 'No NTP synchronization → log correlation impossible → forensics impeded', iecRef: 'E27-16 (SR 2.11)',
    likelihood: 5, impact: 2,
    evidence: 'A spot check revealed that CBS system clocks deviate by up to 47 minutes. No NTP server is installed on board. Logs are not correlatable.',
    rationale: 'Likelihood is rated 5 as the finding was immediately apparent during the audit. Impact is rated 2 as there is no direct safety impact, but forensic investigation is severely hampered.',
    sources: ['IACS UR E27 Table 1 SI-16: Timestamps', 'IEC 62443-3-3 SR 2.11'], evidenceQuality: 5, reproducibility: 'easy' },

  // RA — Resource Availability (2)
  { id: 8, fr: 'RA', name: 'No Redundancy Concept for Navigation CBS', component: 'ECDIS/Radar — High Availability', attacker: 'Hardware Failure / Ransomware', path: 'No failover → CBS failure → loss of navigation → SOLAS violation', iecRef: 'E27-25 (SR 7.1)',
    likelihood: 3, impact: 5,
    evidence: 'Architecture review revealed that ECDIS runs on a single hardware unit without backup. Automatic failover to radar standalone is not configured. A backup ECDIS is physically present but not configured.',
    rationale: 'Likelihood is rated 3 as hardware failures are realistic and ransomware scenarios are documented. Impact is rated 5 as loss of navigation is SOLAS-relevant.',
    sources: ['IACS UR E27 Table 1 SI-25: DoS protection', 'IEC 62443-3-3 SR 7.1', 'SOLAS V/19.2'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 14, fr: 'RA', name: 'No Disaster Recovery Plan for CBS', component: 'Ship Network — DR Planning', attacker: 'Cyber Attack / Failure', path: 'No DR plan → no orderly recovery in an emergency → prolonged system outage at sea', iecRef: 'E27-28 (SR 7.4)',
    likelihood: 3, impact: 4,
    evidence: 'Document review revealed that no recovery plan for CBS exists. Backup procedures are not documented. The date of the last system backup is unknown.',
    rationale: 'Likelihood is rated 3 as disaster recovery scenarios at sea are realistic. Impact is rated 4 as recovery without a plan can take several days (next port).',
    sources: ['IACS UR E27 Table 1 SI-28: System recovery and reconstitution', 'IEC 62443-3-3 SR 7.4'], evidenceQuality: 3, reproducibility: 'hard' },

  // UTN — Untrusted Network (2)
  { id: 6, fr: 'UTN', name: 'Missing Network Segmentation Between IT and OT', component: 'Ship Network — IT/OT Zone Boundary', attacker: 'External Attacker / Ransomware', path: 'Flat network → ransomware from crew IT propagates to OT → navigation/engine failure', iecRef: 'E27-36 (SR 1.13)',
    likelihood: 4, impact: 5,
    evidence: 'Network analysis revealed that crew WiFi, administrative IT systems, and OT systems operate in the same network segment. No firewall between zones exists. A ping test from a crew laptop to the ECDIS was successful.',
    rationale: 'Likelihood is rated 4 as ransomware infections via crew internet access are frequently documented (cf. NotPetya, Maersk 2017). Impact is rated 5 as navigation and engine system failure can result.',
    sources: ['IACS UR E27 Table 2 SI-36: Access via untrusted networks', 'IEC 62443-3-3 SR 1.13', 'Maersk NotPetya Case Study'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 12, fr: 'UTN', name: 'No Remote Access Management for Maintenance', component: 'VSAT — Remote Access', attacker: 'External Attacker', path: 'Remote maintenance without MFA or approval → uncontrolled vendor access → CBS compromise', iecRef: 'E27-37 (SR 1.13 RE1)',
    likelihood: 3, impact: 5,
    evidence: 'Configuration check revealed that a remote desktop connection via VSAT operates without multi-factor authentication. The vendor VPN connection is permanently active. No approval by on-board personnel is required.',
    rationale: 'Likelihood is rated 3 as a permanently active remote access connection is a documented attack vector. Impact is rated 5 as uncontrolled full access to safety-critical CBS is possible.',
    sources: ['IACS UR E27 Table 2 SI-37: Explicit access request approval', 'IEC 62443-3-3 SR 1.13 RE1'], evidenceQuality: 4, reproducibility: 'medium' },
];

// ── IACS UR E27 Requirements (Table 1: 31 + Table 2: 10 = 41, consolidated to 22 key items) ──

export const IEC_REQS: IecReq[] = [
  // IAC — Identification & Authentication
  { id: 'IAC-1', article: 'E27-01 (SR 1.1)', name: 'Human User Identification & Authentication', status: 'fail',
    gap: 'Shared accounts on bridge, NMEA without authentication, default passwords on control systems',
    evidence: 'Three out of four bridge workstations use shared admin accounts. The NMEA network has no authentication. Default passwords are active on engine control systems.',
    rationale: 'The requirement is not met. Three independent vulnerabilities violate E27-01. Individual identification is a fundamental prerequisite for accountability.',
    measure: '1. Introduce individual user accounts on all bridge CBS. 2. Protect the NMEA network via a firewall/gateway system. 3. Enforce password change on initial commissioning.',
    criteria: ['All users authenticate individually', 'NMEA data stream protected by gateway with integrity check', 'Default credentials mandatorily changed at commissioning'],
    effort: '40-60h', priority: 'P0' },
  { id: 'IAC-2', article: 'E27-02 (SR 1.3)', name: 'Account Management', status: 'partial',
    gap: 'No centralized user management; accounts not deactivated on crew change',
    evidence: 'No centralized account management is in place. Crew changes do not trigger account deactivation. Service accounts have no expiration date.',
    rationale: 'The requirement is partially met. User accounts exist, but the lifecycle (creation, deactivation, review) is not systematically managed.',
    measure: 'Introduce centralized account management. Automatic deactivation on crew change. Assign expiration dates to service accounts.',
    criteria: ['Account lifecycle process documented', 'Crew change triggers automatic account review'],
    effort: '16-24h', priority: 'P1' },
  { id: 'IAC-3', article: 'E27-04 (SR 1.5)', name: 'Authenticator Management', status: 'fail',
    gap: 'Default passwords on control systems, no password policy defined',
    evidence: 'Three out of four control systems use manufacturer default passwords. No CBS-specific password policy is defined.',
    rationale: 'The requirement is not met. Default credentials combined with the absence of a password policy represent a significant security risk.',
    measure: '1. Define a CBS password policy. 2. Eliminate all default credentials at commissioning. 3. Introduce a password safe for CBS access credentials.',
    criteria: ['CBS password policy documented and enforced', 'All default credentials eliminated'],
    effort: '16-24h', priority: 'P0' },

  // UC — Use Control
  { id: 'UC-1', article: 'E27-08 (SR 2.1)', name: 'Authorization Enforcement', status: 'fail',
    gap: 'No role-based access control on bridge system; single permission level for all users',
    evidence: 'The bridge system has no role differentiation. Every logged-in user has full configuration rights.',
    rationale: 'The requirement is not met. The absence of role-based access control violates the least-privilege principle and enables unintended or malicious configuration changes.',
    measure: '1. Configure role-based access control (Captain, Officer, Service). 2. Document a permissions matrix.',
    criteria: ['At least three roles with differentiated permissions configured', 'Permissions matrix documented and approved'],
    effort: '24-32h', priority: 'P1' },
  { id: 'UC-2', article: 'E27-10 (SR 2.3)', name: 'Portable & Mobile Devices', status: 'partial',
    gap: 'USB ports not disabled; no removable media policy in place',
    evidence: 'USB ports on ECDIS and engine workstations are physically accessible and not locked. No formal removable media policy exists.',
    rationale: 'The requirement is partially met. An organizational directive on USB usage exists but is not technically enforced.',
    measure: '1. Technically disable USB ports via BIOS/software. 2. Set up a dedicated kiosk station for chart updates. 3. Establish a removable media policy.',
    criteria: ['USB ports on all CBS technically disabled (exception: dedicated update stations)', 'Removable media policy documented and communicated'],
    effort: '12-20h', priority: 'P1' },
  { id: 'UC-3', article: 'E27-12 (SR 2.5)', name: 'Session Lock', status: 'partial',
    gap: 'No automatic session lock configured on bridge CBS',
    evidence: 'ECDIS and radar workstations have no automatic screen lock. Sessions remain permanently active.',
    rationale: 'The requirement is partially met. Manual lock is possible, but automatic timeout is not configured.',
    measure: 'Configure automatic session lock after 15 minutes of inactivity on all CBS.',
    criteria: ['Automatic session lock after max 15 minutes active on all CBS'],
    effort: '4-8h', priority: 'P2' },

  // SI — System Integrity
  { id: 'SI-1', article: 'E27-18 (SR 3.2)', name: 'Malicious Code Protection', status: 'fail',
    gap: 'No malware protection on ECDIS and engine workstations',
    evidence: 'The ECDIS workstation runs on Windows but has neither antivirus nor application whitelisting. The last OS update was 18 months ago.',
    rationale: 'The requirement is not met. The absence of any malware protection on safety-critical CBS represents a significant risk.',
    measure: '1. Implement application whitelisting on all CBS. 2. Set up offline signature updates. 3. Establish regular scans.',
    criteria: ['Application whitelisting active on all CBS', 'Signature updates no older than 30 days'],
    effort: '16-24h', priority: 'P0' },
  { id: 'SI-2', article: 'E27-17 (SR 3.1)', name: 'Communication Integrity', status: 'fail',
    gap: 'NMEA communication without integrity protection',
    evidence: 'The NMEA data stream is transmitted unencrypted and without integrity checking. A GPS spoofing PoC was successful.',
    rationale: 'The requirement is not met. Manipulated navigation data is accepted by the system without any verification.',
    measure: '1. Install an NMEA gateway with integrity checking. 2. Implement multi-source comparison (GPS/GLONASS/Galileo). 3. Set up AIS cross-validation.',
    criteria: ['NMEA gateway with plausibility checking installed', 'Multi-GNSS validation active'],
    effort: '24-40h', priority: 'P0' },
  { id: 'SI-3', article: 'E27-20 (SR 3.5)', name: 'Input Validation', status: 'partial',
    gap: 'No validation of external inputs from untrusted networks',
    evidence: 'Data from the fleet management system is processed without validation. No input sanitization is performed.',
    rationale: 'The requirement is partially met. Internal data processing is validated, but external inputs are not checked.',
    measure: 'Implement input validation for all data received from untrusted networks.',
    criteria: ['Input validation for all external data sources implemented and documented'],
    effort: '16-24h', priority: 'P2' },
  { id: 'SI-4', article: 'E27-21 (SR 3.6)', name: 'Deterministic Output', status: 'pass',
    gap: '',
    evidence: 'The engine control system enters a defined safe state on CBS failure (dead ship condition procedure). ECDIS has a paper-based fallback.',
    rationale: 'The requirement is met. Fail-safe behavior is documented and has been tested.',
    measure: '', criteria: [], effort: '', priority: '' },

  // DC — Data Confidentiality
  { id: 'DC-1', article: 'E27-22 (SR 4.1)', name: 'Information Confidentiality', status: 'fail',
    gap: 'Unencrypted communication to shore network',
    evidence: 'HTTP connections to the fleet management system without TLS encryption were identified. Crew login credentials are transmitted in cleartext.',
    rationale: 'The requirement is not met. Operational data and personal crew data are transmitted unencrypted over the VSAT connection.',
    measure: '1. Introduce TLS 1.2+ for all shore connections. 2. VPN tunnel for fleet management. 3. Encryption at rest on CBS.',
    criteria: ['All shore connections over TLS 1.2+', 'Fleet management via VPN tunnel'],
    effort: '24-40h', priority: 'P0' },
  { id: 'DC-2', article: 'E27-23 (SR 4.3)', name: 'Use of Cryptography', status: 'partial',
    gap: 'Outdated cryptographic algorithms; no certificate management in place',
    evidence: 'TLS 1.0 is still active on some systems. Certificates in use are self-signed. No certificate lifecycle management exists.',
    rationale: 'The requirement is partially met. Cryptography is used but is outdated and not centrally managed.',
    measure: 'Enforce TLS 1.2+ on all systems. Establish centralized certificate management.',
    criteria: ['TLS 1.0/1.1 disabled', 'Certificate lifecycle management established'],
    effort: '16-24h', priority: 'P2' },

  // AL — Audit & Logging
  { id: 'AL-1', article: 'E27-13 (SR 2.8)', name: 'Auditable Events', status: 'fail',
    gap: 'Insufficient event logging on CBS',
    evidence: 'Neither an intrusion detection system nor centralized log aggregation is in place. Individual system logs are not systematically evaluated.',
    rationale: 'The requirement is not met. Security-relevant events are not systematically recorded and therefore cannot be traced.',
    measure: '1. Build centralized log aggregation (syslog server). 2. Install IDS in the ship network. 3. Create an event monitoring policy.',
    criteria: ['Centralized log aggregation for all CBS in place', 'IDS installed in critical network segments'],
    effort: '40-60h', priority: 'P0' },
  { id: 'AL-2', article: 'E27-16 (SR 2.11)', name: 'Timestamps', status: 'fail',
    gap: 'No NTP synchronization; CBS clocks deviate significantly',
    evidence: 'CBS system clocks deviate by up to 47 minutes. No NTP server is installed on board.',
    rationale: 'The requirement is not met. Without time synchronization, log correlation and effective forensics are not possible.',
    measure: 'Install an NTP server on board and synchronize all CBS.',
    criteria: ['NTP server active on board', 'All CBS clocks synchronized (max ±1 s deviation)'],
    effort: '8-16h', priority: 'P1' },

  // RA — Resource Availability
  { id: 'RA-1', article: 'E27-25 (SR 7.1)', name: 'Denial of Service Protection', status: 'fail',
    gap: 'No failover for navigation CBS; single point of failure',
    evidence: 'ECDIS runs on a single hardware unit without backup. A backup ECDIS is physically present but not configured.',
    rationale: 'The requirement is not met. A single point of failure exists for a SOLAS-relevant system.',
    measure: '1. Configure ECDIS hot standby. 2. Set up automatic failover. 3. Conduct regular failover tests.',
    criteria: ['ECDIS failover configured and tested', 'Semi-annual failover test documented'],
    effort: '24-40h', priority: 'P0' },
  { id: 'RA-2', article: 'E27-27 (SR 7.3)', name: 'System Backup', status: 'fail',
    gap: 'No documented backup strategy for CBS',
    evidence: 'No recovery plan exists. Backup procedures are not documented. The date of the last backup is unknown.',
    rationale: 'The requirement is not met. No backup strategy exists for safety-relevant CBS.',
    measure: '1. Create a backup policy for all CBS. 2. Set up regular automated backups. 3. Semi-annual restore tests.',
    criteria: ['CBS backup policy documented', 'Automated backups active', 'Semi-annual restore tests conducted'],
    effort: '16-24h', priority: 'P1' },
  { id: 'RA-3', article: 'E27-28 (SR 7.4)', name: 'System Recovery & Reconstitution', status: 'partial',
    gap: 'No CBS-specific recovery plan for at-sea scenarios',
    evidence: 'A generic IT recovery plan exists. CBS-specific recovery procedures for at-sea scenarios are missing.',
    rationale: 'The requirement is partially met. A generic plan exists, but extension to maritime-specific scenarios is still pending.',
    measure: 'Create a CBS-specific recovery plan with maritime scenarios (failure at sea, limited communications).',
    criteria: ['CBS recovery plan with at-sea scenarios documented', 'Annual recovery test conducted'],
    effort: '16-24h', priority: 'P1' },
  { id: 'RA-4', article: 'E27-29 (SR 7.5)', name: 'Emergency Power', status: 'pass',
    gap: '',
    evidence: 'Emergency power supply is available for all essential CBS and has been tested. UPS systems are installed on the bridge and in the engine room.',
    rationale: 'The requirement is met. The emergency power concept is documented and regularly tested.',
    measure: '', criteria: [], effort: '', priority: '' },

  // UTN — Untrusted Network Protection (Table 2)
  { id: 'UTN-1', article: 'E27-32 (SR 1.1 RE2)', name: 'Multifactor Authentication (Untrusted)', status: 'fail',
    gap: 'No multi-factor authentication for remote access via VSAT',
    evidence: 'Remote desktop access via VSAT operates without MFA. Only password authentication is used.',
    rationale: 'The requirement is not met. IACS UR E27 Table 2 requires multi-factor authentication for access over untrusted networks.',
    measure: '1. Introduce MFA for all remote access. 2. Deploy hardware tokens or app-based authentication.',
    criteria: ['MFA active for all access over untrusted networks'],
    effort: '16-24h', priority: 'P0' },
  { id: 'UTN-2', article: 'E27-36 (SR 1.13)', name: 'Access via Untrusted Networks', status: 'fail',
    gap: 'No monitoring and control of shore access; missing network segmentation',
    evidence: 'Crew WiFi, administrative IT, and OT systems reside in the same network segment. No firewall between zones exists. Shore access is uncontrolled.',
    rationale: 'The requirement is not met. A fundamental violation of the network segmentation principle exists.',
    measure: '1. Introduce network segmentation (Crew/Admin/OT). 2. Install a next-generation firewall. 3. Set up a DMZ for shore communication.',
    criteria: ['Dedicated network segments for Crew, Admin, and OT established', 'Firewall active at all zone boundaries', 'Shore access exclusively via DMZ'],
    effort: '60-100h', priority: 'P0' },
  { id: 'UTN-3', article: 'E27-37 (SR 1.13 RE1)', name: 'Explicit Access Request Approval', status: 'fail',
    gap: 'Remote access without on-board approval by ship personnel',
    evidence: 'The vendor VPN connection is permanently active. No approval by on-board personnel is required.',
    rationale: 'The requirement is not met. IACS UR E27 requires explicit on-board approval for every remote access session.',
    measure: '1. VPN access only after explicit approval by the duty officer. 2. Full session logging. 3. Time-limited access windows.',
    criteria: ['Remote access only after documented on-board approval', 'Session logging active', 'Time-limited access configured'],
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
    facility: { name: 'MV Northern Spirit — Container Vessel', types: ['propulsion', 'navigation', 'power', 'ecdis'] },
    securityLevel: 'sl2',
    description: 'Container vessel with integrated bridge system (IBS), ECDIS, Radar/ARPA, AIS, Engine Control System, Power Management System. VSAT connection to shore office. 4 bridge workstations, 2 engine room terminals.',
    zones: ['bridge', 'engineroom', 'crew', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'Modbus TCP', 'HTTPS/REST', 'VSAT/Fleet Broadband', 'Serial (RS-422/485)', 'USB'],
    roles: ['Captain', 'Chief Engineer', 'IT/ETO Officer', 'Watch Officer', 'Electrical Engineer'],
    measures: { iac: { active: true, documented: false, audited: false, certified: false }, backup: { active: true, documented: false, audited: false, certified: false }, patch: { active: true, documented: false, audited: false, certified: false } },
    knownIssues: 'Flat network IT/OT, shared accounts on bridge, USB ports open, no monitoring, NMEA unprotected.',
    files: [
      { name: 'NorthernSpirit_NetworkArchitecture_v2.1.pdf', size: 2_200_000, type: 'arch' },
      { name: 'CBS_Inventory_2024.xlsx', size: 890_000, type: 'riskAssess' },
      { name: 'Network_Topology_Diagram.vsdx', size: 650_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Baltic Trader — RoRo Ferry', types: ['propulsion', 'steering', 'navigation', 'safety', 'comms'] },
    securityLevel: 'sl3',
    description: 'RoRo ferry with passenger operations. DP system, integrated bridge system, fire detection system, GMDSS, public address system. High-frequency port calls with regular shore connections.',
    zones: ['bridge', 'engineroom', 'crew', 'cargo_ot', 'safety_zone', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'IEC 61162-450', 'Modbus TCP', 'PROFINET', 'HTTPS/REST', 'VPN (IPsec)', 'Wireless (WiFi)'],
    roles: ['Captain', 'Safety Officer', 'Chief Engineer', 'IT/ETO Officer', 'DPO (Dynamic Positioning Operator)'],
    measures: { iac: { active: true, documented: true, audited: false, certified: false }, segmentation: { active: true, documented: false, audited: false, certified: false }, monitoring: { active: true, documented: false, audited: false, certified: false }, incident: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'Passenger WiFi not segmented, remote maintenance without MFA, fire detection system legacy.',
    files: [
      { name: 'BalticTrader_CyberRiskAssessment_2024.pdf', size: 3_100_000, type: 'riskAssess' },
      { name: 'Network_Segmentation_Plan.pdf', size: 1_800_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Deep Explorer — Offshore Supply Vessel', types: ['propulsion', 'steering', 'navigation', 'cargo', 'comms'] },
    securityLevel: 'sl2',
    description: 'Offshore supply vessel (OSV) with DP-2 system for offshore platform supply. Engine management system, ballast control, crane control. Frequent remote maintenance by vendors.',
    zones: ['bridge', 'engineroom', 'cargo_ot', 'shore'],
    protocols: ['NMEA 2000', 'CANbus (J1939)', 'Modbus TCP', 'OPC-UA', 'VSAT/Fleet Broadband', 'VPN (IPsec)'],
    roles: ['Captain', 'DPO (Dynamic Positioning Operator)', 'Chief Engineer', 'ETO (Electro-Technical Officer)'],
    measures: { iac: { active: true, documented: false, audited: false, certified: false }, vendor: { active: true, documented: true, audited: true, certified: false }, backup: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'DP system remote maintenance permanently active, no MFA, default passwords on crane control.',
    files: [
      { name: 'DeepExplorer_DP_SystemDoc.pdf', size: 4_500_000, type: 'arch' },
      { name: 'Vendor_Access_Policy.pdf', size: 520_000, type: 'policy' },
    ],
  },
  {
    facility: { name: 'MV Arctic Pioneer — LNG Carrier', types: ['propulsion', 'navigation', 'cargo', 'power', 'comms'] },
    securityLevel: 'sl3',
    description: 'LNG carrier with cargo management system (CMS), gas detection system, inert gas system, integrated navigation suite. Shore-based remote condition monitoring via VSAT. Class notation for cyber resilience.',
    zones: ['bridge', 'engineroom', 'cargo_ot', 'safety_zone', 'crew', 'shore'],
    protocols: ['NMEA 2000', 'IEC 61162-450', 'Modbus TCP', 'PROFINET', 'HTTPS/REST', 'VSAT/Fleet Broadband', 'OPC-UA'],
    roles: ['Captain', 'Chief Engineer', 'Gas Engineer', 'IT/ETO Officer', 'Cargo Officer'],
    measures: { iac: { active: true, documented: true, audited: true, certified: false }, segmentation: { active: true, documented: true, audited: false, certified: false }, monitoring: { active: true, documented: true, audited: false, certified: false }, incident: { active: true, documented: true, audited: false, certified: false }, backup: { active: true, documented: true, audited: true, certified: false }, vendor: { active: true, documented: false, audited: false, certified: false } },
    knownIssues: 'Cargo management system uses legacy Windows CE. Gas detection sensors lack authentication. Shore monitoring VPN uses shared credentials.',
    files: [
      { name: 'ArcticPioneer_CyberRiskAssessment_2025.pdf', size: 3_800_000, type: 'riskAssess' },
      { name: 'ArcticPioneer_NetworkArchitecture.pdf', size: 2_100_000, type: 'arch' },
      { name: 'CMS_SecurityAudit_2024.pdf', size: 1_400_000, type: 'policy' },
      { name: 'Zone_Conduit_Diagram_v2.vsdx', size: 780_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Horizon Star — Cruise Vessel', types: ['propulsion', 'navigation', 'steering', 'safety', 'comms'] },
    securityLevel: 'sl3',
    description: 'Cruise vessel with 3,200 passenger capacity. Integrated bridge, HVAC control, fire detection, access control (cabin cards), entertainment systems, passenger WiFi. Multiple shore connections per port call.',
    zones: ['bridge', 'engineroom', 'crew', 'cargo_ot', 'safety_zone', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'BACnet', 'Modbus TCP', 'HTTPS/REST', 'Wireless (WiFi)', 'Bluetooth', 'VPN (IPsec)'],
    roles: ['Captain', 'Safety Officer', 'Chief Engineer', 'IT Manager', 'Hotel Director', 'ETO (Electro-Technical Officer)'],
    measures: { iac: { active: true, documented: true, audited: false, certified: false }, segmentation: { active: true, documented: true, audited: true, certified: false }, monitoring: { active: true, documented: false, audited: false, certified: false }, incident: { active: true, documented: true, audited: false, certified: false }, patch: { active: true, documented: true, audited: false, certified: false } },
    knownIssues: 'Passenger WiFi shares physical infrastructure with crew network. Cabin access card system uses legacy protocol. Entertainment system patch cycle >12 months.',
    files: [
      { name: 'HorizonStar_CyberSecurityPlan.pdf', size: 4_200_000, type: 'riskAssess' },
      { name: 'HorizonStar_NetworkSegmentation.pdf', size: 2_500_000, type: 'zoneMap' },
      { name: 'AccessControl_AuditReport_2024.pdf', size: 1_100_000, type: 'policy' },
    ],
  },
];
