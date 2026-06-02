// ── IACS UR E26 Compliance Tool — Data Model ─────────────────
// Based on IACS Unified Requirement E26: Cyber Resilience of Ships
// E26 covers the ship as a whole (newbuild integration view, owner/yard perspective),
// E27 covers individual CBS (component/supplier view).
//
// E26 chapter structure (used in iecRef values):
//   Ch. 4  Equipment identification          → category SI
//   Ch. 5  Information sharing                → category DC
//   Ch. 6  Physical security of OT equipment  → category UC
//   Ch. 7  Network protection safeguards      → category UTN
//   Ch. 8  Anti-virus / anti-malware          → category SI
//   Ch. 9  Access control                     → category IAC
//   Ch. 10 Wireless communication             → category UTN
//   Ch. 11 Remote access                      → category UTN
//   Ch. 12 Use of mobile devices              → category UC
//   Ch. 13 Recovery plan                      → category RA
//   Ch. 14 Local, independent, manual ops     → category RA
//   Ch. 15 Network operation monitoring       → category AL
//   Ch. 16 Verification and testing           → category AL

// Re-export shared infrastructure from the UR E27 data file (types, helpers,
// system types, security levels, zones, protocols, measures, attach types).
export {
  getSecurityLevels, getZoneConduits,
  PROTOCOL_OPTS, getSecurityMeasures, getSecurityCategories,
  getAttachTypes, threatId, EMPTY_INTAKE,
} from './iec62443Data';
export type { IecThreat, IecReq, IecIntakeData, MeasureEntry } from './iec62443Data';

import type { IecThreat, IecReq, MeasureEntry } from './iec62443Data';

// ── Ship System Types (CBS in scope of E26 — ship-as-a-whole view) ───────────
// E26 covers the whole vessel, so the scope of computer-based systems is broader
// than the E27 component view. English-only labels (tool is English-only).
const E26_SYSTEM_TYPES = [
  { id: 'propulsion',   icon: '⚙️', label: 'Propulsion Control',                desc: 'Main engine, thrusters, propeller pitch & RPM control' },
  { id: 'steering',     icon: '🔄', label: 'Steering Gear',                     desc: 'Rudder control, autopilot, heading reference' },
  { id: 'navigation',   icon: '🧭', label: 'Navigation Systems',               desc: 'GPS/GNSS, RADAR, AIS, gyrocompass, speed log' },
  { id: 'ecdis',        icon: '🗺️', label: 'ECDIS',                            desc: 'Electronic chart display & information system' },
  { id: 'ibs',          icon: '🧭', label: 'Integrated Bridge System (IBS)',    desc: 'Integrated bridge / conning, workstation integration' },
  { id: 'power',        icon: '⚡', label: 'Power Management',                  desc: 'Generators, switchboards, PMS, emergency power' },
  { id: 'ias',          icon: '🏭', label: 'Machinery Automation / IAS',        desc: 'Integrated automation system, machinery control & alarms' },
  { id: 'cargo',        icon: '📦', label: 'Cargo Handling',                    desc: 'Ballast, cargo monitoring, IGS, loading computer' },
  { id: 'comms',        icon: '📡', label: 'Communications',                    desc: 'GMDSS, VSAT, VHF/UHF, satellite uplink' },
  { id: 'remote',       icon: '🛰️', label: 'Remote Access & Shore Connectivity', desc: 'Remote maintenance, shore links, OEM connectivity' },
  { id: 'safety',       icon: '🛟', label: 'Safety Systems',                    desc: 'Fire detection, watertight doors, alarm & monitoring' },
  { id: 'access',       icon: '🚪', label: 'Access Control & Physical Security', desc: 'Physical access, CCTV, intrusion detection' },
  { id: 'water',        icon: '💧', label: 'Water & Utility Systems',           desc: 'Fresh/ballast water, bilge, sewage, fuel utilities' },
  { id: 'hvac',         icon: '❄️', label: 'HVAC & Environmental Control',      desc: 'Heating, ventilation, air-conditioning, environmental' },
  { id: 'performance',  icon: '📊', label: 'Performance Monitoring & Analytics', desc: 'Voyage/performance monitoring, data analytics' },
  { id: 'deck',         icon: '🏗️', label: 'Deck Machinery / Cranes',          desc: 'Winches, windlasses, cranes, mooring equipment' },
  { id: 'dp',           icon: '🚢', label: 'Dynamic Positioning (DP)',          desc: 'DP control, position reference, thruster allocation' },
] as const;

export function getSystemTypes(_t?: (key: string) => string) {
  return E26_SYSTEM_TYPES.map(s => ({ ...s }));
}

// ── E26 Requirement Categories (grouping of E26 chapters 4-16) ───────────────
export const FR_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  IAC: { label: { de: 'Zugriffskontrolle (Kap. 9)', en: 'Access Control (Ch. 9)', fr: 'Contrôle d\'accès (Ch. 9)' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  UC: { label: { de: 'Physische Sicherheit & Mobile (Kap. 6, 12)', en: 'Physical & Mobile (Ch. 6, 12)', fr: 'Physique & mobile (Ch. 6, 12)' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  SI: { label: { de: 'Asset-ID & Malware-Schutz (Kap. 4, 8)', en: 'Asset ID & Malware (Ch. 4, 8)', fr: 'ID actifs & anti-malware (Ch. 4, 8)' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  DC: { label: { de: 'Informationsaustausch (Kap. 5)', en: 'Information Sharing (Ch. 5)', fr: 'Partage d\'information (Ch. 5)' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  AL: { label: { de: 'Monitoring & Tests (Kap. 15, 16)', en: 'Monitoring & Testing (Ch. 15, 16)', fr: 'Surveillance & tests (Ch. 15, 16)' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  RA: { label: { de: 'Recovery & manueller Betrieb (Kap. 13, 14)', en: 'Recovery & Manual Ops (Ch. 13, 14)', fr: 'Récupération & ops manuelles (Ch. 13, 14)' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  UTN: { label: { de: 'Netzwerk, WLAN & Remote (Kap. 7, 10, 11)', en: 'Network, Wireless, Remote (Ch. 7, 10, 11)', fr: 'Réseau, sans-fil, distant (Ch. 7, 10, 11)' }, dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  // ── Extended UR E26 Matrix — organizational & lifecycle controls ──
  GOV: { label: { de: 'Governance & Verantwortlichkeiten', en: 'Security Governance', fr: 'Gouvernance de sécurité' }, dot: 'bg-indigo-500', badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  RM: { label: { de: 'Risikomanagement', en: 'Risk Management', fr: 'Gestion des risques' }, dot: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  CM: { label: { de: 'Konfigurations- & Änderungsmanagement', en: 'Configuration & Change Mgmt', fr: 'Gestion des configurations & changements' }, dot: 'bg-teal-500', badge: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' },
  VM: { label: { de: 'Schwachstellen- & Patch-Management', en: 'Vulnerability & Patch Mgmt', fr: 'Gestion des vulnérabilités & correctifs' }, dot: 'bg-lime-500', badge: 'bg-lime-500/10 text-lime-400 border border-lime-500/20' },
  TP: { label: { de: 'Lieferanten- & Drittparteisicherheit', en: 'Supplier & Third-Party Security', fr: 'Sécurité fournisseurs & tiers' }, dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  IR: { label: { de: 'Incident-Management', en: 'Incident Management', fr: 'Gestion des incidents' }, dot: 'bg-pink-500', badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20' },
  AT: { label: { de: 'Awareness & Schulung', en: 'Awareness & Training', fr: 'Sensibilisation & formation' }, dot: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
};

// ── UR E26 Demo Threats (ship-level integration view) ───────────────────────

export const IEC_THREATS: IecThreat[] = [
  // IAC — Access Control (Ch. 9)
  { id: 1, fr: 'IAC', name: 'No Ship-Wide Identity Management', component: 'Integrated Ship Network — User Management', attacker: 'Crew Member / Contractor',
    path: 'Each CBS uses local accounts → no central revocation on crew change → orphaned accounts persist across all systems',
    iecRef: 'E26-Ch.9 (Access Control)', likelihood: 4, impact: 4,
    evidence: 'Inventory review across 11 CBS revealed that user accounts are managed locally on each system. No central directory service (LDAP/AD) is in place. On the most recent crew change, only three out of nine departing accounts were deactivated within 30 days.',
    rationale: 'Likelihood is rated 4 as the absence of central identity management is the norm on retrofitted vessels and orphaned accounts are documented. Impact is rated 4 as orphaned privileged accounts enable unauthorised access to safety-critical CBS.',
    sources: ['IACS UR E26 Chapter 9 — Access Control', 'BIMCO Cyber Security Guidelines v4'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 2, fr: 'IAC', name: 'Bridge Workstations Without Individual Login', component: 'IBS / ECDIS Workstations — Console Access',
    attacker: 'Watch Officer / Rating', path: 'Shared bridge account → no per-user accountability → audit trail useless for incident investigation',
    iecRef: 'E26-Ch.9 (Access Control)', likelihood: 5, impact: 3,
    evidence: 'On-site inspection confirmed that all four bridge workstations are logged in continuously with a shared "bridge" account. Sessions remain active 24/7. No individual authentication takes place at watch handover.',
    rationale: 'Likelihood is rated 5 as the finding was immediately apparent. Impact is rated 3 as misconfiguration is possible but a second officer is generally present.',
    sources: ['IACS UR E26 Chapter 9', 'IMO MSC-FAL.1/Circ.3/Rev.2'], evidenceQuality: 5, reproducibility: 'easy' },

  // UC — Physical Security & Mobile (Ch. 6, 12)
  { id: 3, fr: 'UC', name: 'Server Room Without Access Control', component: 'Engine Control Room — Physical Perimeter',
    attacker: 'Port Personnel / Visitor', path: 'Unlocked server cabinet in engine control room → physical access to network switches and CBS → console-level compromise',
    iecRef: 'E26-Ch.6 (Physical Security)', likelihood: 3, impact: 5,
    evidence: 'Physical inspection revealed that the network rack in the engine control room is unlocked. The control room itself is accessible without key card during port stays. No visitor log is maintained for the ECR.',
    rationale: 'Likelihood is rated 3 as port-stay access by external personnel is regular. Impact is rated 5 as direct physical access to OT network infrastructure enables full compromise.',
    sources: ['IACS UR E26 Chapter 6 — Physical Security of OT Equipment', 'IEC 62443-2-1'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 4, fr: 'UC', name: 'Crew BYOD Connected to OT Network', component: 'Crew Mobile Devices — Network Boundary',
    attacker: 'Crew Member (unintentional) / Malware on Phone', path: 'Crew smartphones connect to ship WiFi that bridges to OT → mobile malware propagates to bridge systems',
    iecRef: 'E26-Ch.12 (Mobile Devices)', likelihood: 4, impact: 5,
    evidence: 'Network capture revealed 23 personal mobile devices on the ship WLAN over a 24h period. The WLAN has direct routing to the OT VLAN. No MDM or BYOD policy is in place.',
    rationale: 'Likelihood is rated 4 as crew internet usage and resulting malware infections are well documented. Impact is rated 5 as lateral movement to bridge systems can result.',
    sources: ['IACS UR E26 Chapter 12 — Use of Mobile Devices', 'BIMCO Guidelines'], evidenceQuality: 4, reproducibility: 'medium' },

  // SI — Asset ID & Malware (Ch. 4, 8)
  { id: 5, fr: 'SI', name: 'Incomplete CBS Inventory', component: 'Asset Management — CBS Register',
    attacker: 'Any', path: 'No complete CBS asset register → unmanaged systems remain unpatched → shadow IT exploitable',
    iecRef: 'E26-Ch.4 (Equipment Identification)', likelihood: 5, impact: 3,
    evidence: 'Cross-check between the documented CBS register (14 entries) and an on-board network scan revealed 23 active CBS, including three undocumented engineering laptops and one VSAT control unit.',
    rationale: 'Likelihood is rated 5 as the gap was immediately measurable. Impact is rated 3 as undocumented assets escape the patch and monitoring regime.',
    sources: ['IACS UR E26 Chapter 4 — Equipment Identification', 'NIST SP 800-82r3'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 6, fr: 'SI', name: 'No Anti-Malware on Engineering Laptops', component: 'Service Laptops — Endpoint Protection',
    attacker: 'Service Technician / Supply-Chain Malware',
    path: 'Engineering laptops carried between vessels without AV → cross-fleet malware propagation via maintenance USB',
    iecRef: 'E26-Ch.8 (Anti-Malware)', likelihood: 4, impact: 5,
    evidence: 'Inspection of three shore-supplied service laptops found no active anti-malware product. Last Windows update on two devices was older than 12 months. Same devices are used on other vessels in the fleet.',
    rationale: 'Likelihood is rated 4 as service laptops travelling between vessels are a documented infection vector (NotPetya, LockerGoga). Impact is rated 5 as such laptops are connected directly to CBS during maintenance.',
    sources: ['IACS UR E26 Chapter 8 — Anti-Virus and Anti-Malware', 'NotPetya / Maersk Case Study'], evidenceQuality: 4, reproducibility: 'medium' },

  // DC — Information Sharing (Ch. 5)
  { id: 7, fr: 'DC', name: 'Unsecured Ship-to-Shore Cargo Data Exchange', component: 'Cargo Management — Shore Interface',
    attacker: 'Network Eavesdropper / Competitor', path: 'Cargo manifests and stowage plans transmitted to charterer via plain FTP → commercial-sensitive data exposed',
    iecRef: 'E26-Ch.5 (Information Sharing)', likelihood: 3, impact: 4,
    evidence: 'Capture of VSAT traffic during cargo operations revealed FTP transfers of stowage plans (PDF) and bunker reports (XLS) without TLS. Credentials transmitted in cleartext.',
    rationale: 'Likelihood is rated 3 as VSAT interception is feasible at the satellite or shore gateway. Impact is rated 4 as commercial cargo data and credentials are exposed.',
    sources: ['IACS UR E26 Chapter 5 — Information Sharing', 'IMO MSC.428(98)'], evidenceQuality: 4, reproducibility: 'medium' },

  // AL — Monitoring & Testing (Ch. 15, 16)
  { id: 8, fr: 'AL', name: 'No Network Operation Monitoring On Board', component: 'Ship Network — Visibility',
    attacker: 'APT / Insider', path: 'No NDR / IDS in OT segments → lateral movement and exfiltration go undetected for full voyage',
    iecRef: 'E26-Ch.15 (Network Monitoring)', likelihood: 4, impact: 4,
    evidence: 'Infrastructure review confirmed that no network monitoring, IDS, or flow collection is in place. The only available telemetry is the VSAT bandwidth chart at shore office.',
    rationale: 'Likelihood is rated 4 as attacks without monitoring are realistically undetectable. Impact is rated 4 as lateral movement to safety systems remains possible throughout the voyage.',
    sources: ['IACS UR E26 Chapter 15 — Network Operation Monitoring', 'IEC 62443-3-3 SR 6.1'], evidenceQuality: 4, reproducibility: 'medium' },
  { id: 9, fr: 'AL', name: 'No Cyber Verification Test Before Sea Trials', component: 'Newbuild Acceptance — Cyber Test Plan',
    attacker: 'Latent Defect / Mis-Integration', path: 'No documented cyber test plan in newbuild acceptance → integration defects discovered post-delivery in operation',
    iecRef: 'E26-Ch.16 (Verification and Testing)', likelihood: 3, impact: 4,
    evidence: 'Document review of the sea-trial protocol revealed no cyber-specific test cases. Network segmentation, failover, and access control were not verified during HAT/SAT.',
    rationale: 'Likelihood is rated 3 as newbuild cyber test omissions are common but not universal. Impact is rated 4 as undiscovered defects propagate into operational service.',
    sources: ['IACS UR E26 Chapter 16 — Verification and Testing', 'IACS UR E22 (Onboard Software)'], evidenceQuality: 4, reproducibility: 'hard' },

  // RA — Recovery & Manual Operations (Ch. 13, 14)
  { id: 10, fr: 'RA', name: 'No Recovery Plan for Loss of Navigation CBS', component: 'Recovery Planning — IBS / ECDIS',
    attacker: 'Ransomware / Hardware Failure', path: 'No documented recovery procedure → loss of ECDIS at sea results in unstructured improvisation by bridge crew',
    iecRef: 'E26-Ch.13 (Recovery Plan)', likelihood: 3, impact: 5,
    evidence: 'Document review found no recovery plan covering loss of navigation CBS. Last backup of ECDIS configuration is undated. Paper charts on board do not cover the current trade route.',
    rationale: 'Likelihood is rated 3 as ransomware on maritime IBS is documented. Impact is rated 5 as SOLAS V/19 navigation requirements would be violated.',
    sources: ['IACS UR E26 Chapter 13 — Recovery Plan', 'SOLAS V/19'], evidenceQuality: 4, reproducibility: 'hard' },
  { id: 11, fr: 'RA', name: 'Cannot Operate Steering Locally if CBS Fails', component: 'Steering Gear — Manual Fallback',
    attacker: 'CBS Failure / Cyber Attack', path: 'Steering CBS failure → no tested local/manual mode available → vessel uncontrollable',
    iecRef: 'E26-Ch.14 (Manual Operations)', likelihood: 2, impact: 5,
    evidence: 'Walk-through with the chief engineer showed that the steering local control station is wired but has not been operationally tested in the past 18 months. Crew is unfamiliar with the fallback procedure.',
    rationale: 'Likelihood is rated 2 as the fallback is physically present. Impact is rated 5 as untested fallback is equivalent to no fallback in an emergency.',
    sources: ['IACS UR E26 Chapter 14 — Local, Independent and Manual Operations', 'SOLAS V/26'], evidenceQuality: 4, reproducibility: 'medium' },

  // UTN — Network, Wireless, Remote (Ch. 7, 10, 11)
  { id: 12, fr: 'UTN', name: 'Flat Network Between IT, OT and Crew', component: 'Ship Network — Segmentation',
    attacker: 'Ransomware / Crew Internet Usage', path: 'Single VLAN for crew WiFi, admin IT, and OT → crew laptop infection reaches engine control system within minutes',
    iecRef: 'E26-Ch.7 (Network Protection)', likelihood: 4, impact: 5,
    evidence: 'Network analysis confirmed a single /22 subnet shared by crew WiFi, admin laptops, ECDIS, engine control, and PMS. ICMP from a crew laptop to the ECDIS succeeded. No firewall between the zones.',
    rationale: 'Likelihood is rated 4 as ransomware infections via crew internet access are extensively documented. Impact is rated 5 as direct compromise of engine and navigation CBS is possible.',
    sources: ['IACS UR E26 Chapter 7 — Network Protection Safeguards', 'Maersk NotPetya 2017'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 13, fr: 'UTN', name: 'Open Wireless Access Point Bridging OT', component: 'Bridge WiFi — Access Point',
    attacker: 'External Attacker (port / pier)', path: 'WPA2-PSK with weak key, AP bridges to OT VLAN → drive-by attacker on pier reaches IBS',
    iecRef: 'E26-Ch.10 (Wireless Communication)', likelihood: 3, impact: 5,
    evidence: 'WiFi audit during port stay detected an AP with SSID "bridge-svc", WPA2-PSK with default vendor key, broadcasting at -42 dBm at 30 m from the ship. The AP is bridged to the IBS VLAN.',
    rationale: 'Likelihood is rated 3 as the attack is feasible from the pier but requires physical proximity. Impact is rated 5 as the IBS is directly reachable.',
    sources: ['IACS UR E26 Chapter 10 — Wireless Communication', 'IEC 62443-3-3 SR 5.4'], evidenceQuality: 5, reproducibility: 'easy' },
  { id: 14, fr: 'UTN', name: 'Always-On Remote Access for OEM Maintenance', component: 'OEM Remote Access — VSAT',
    attacker: 'OEM Account Compromise / Supply-Chain Attacker',
    path: 'Permanent IPsec tunnel from engine OEM to engine CBS → no on-board approval → uncontrolled vendor presence in OT',
    iecRef: 'E26-Ch.11 (Remote Access)', likelihood: 3, impact: 5,
    evidence: 'Configuration review of the perimeter firewall showed a permanent IPsec tunnel to the engine OEM (203.0.113.0/24). No on-board approval workflow exists. The tunnel has been active continuously for 8 months.',
    rationale: 'Likelihood is rated 3 as OEM credential breaches are documented across the industry. Impact is rated 5 as direct propulsion control is reachable.',
    sources: ['IACS UR E26 Chapter 11 — Remote Access', 'IACS Rec. 166'], evidenceQuality: 4, reproducibility: 'medium' },
];

// ── UR E26 Requirements (consolidated across Chapters 4-16) ──

export const IEC_REQS: IecReq[] = [
  // IAC — Access Control (Ch. 9)
  { id: 'IAC-1', article: 'E26-Ch.9 (Access Control)', name: 'Ship-Wide Identity & Account Management', status: 'fail',
    gap: 'No centralised identity service; orphaned accounts persist after crew changes; shared bridge logins',
    evidence: 'User accounts are managed locally on each CBS. No central directory in place. Six out of nine departing crew accounts remained active beyond 30 days.',
    rationale: 'Chapter 9 of IACS UR E26 requires a managed access control regime across all CBS on board. Local-only account management without central revocation fundamentally fails this objective.',
    measure: '1. Establish a central directory (Active Directory / LDAP) for crew accounts. 2. Integrate all CBS that support directory authentication. 3. Document a joiner/mover/leaver process tied to the crew-change log.',
    criteria: ['Central directory operational on board', 'At least 80 % of CBS authenticate against the directory', 'All accounts of departing crew are deactivated within 24h of sign-off'],
    effort: '60-100h', priority: 'P0' },
  { id: 'IAC-2', article: 'E26-Ch.9 (Access Control)', name: 'Individual Authentication at Workstations', status: 'fail',
    gap: 'Shared bridge account in continuous use; no per-user accountability',
    evidence: 'All bridge workstations operate under a single shared "bridge" account 24/7. No individual login at watch handover.',
    rationale: 'Chapter 9 requires individual identification of users. Shared persistent sessions defeat accountability and audit logging.',
    measure: 'Configure smart-card or PIN-based individual login at watch handover on all bridge workstations. Auto-lock after 15 min of inactivity.',
    criteria: ['Per-user authentication enforced at every watch handover', 'Auto-lock after 15 min active on all bridge CBS'],
    effort: '24-40h', priority: 'P1' },

  // UC — Physical Security & Mobile Devices (Ch. 6, 12)
  { id: 'UC-1', article: 'E26-Ch.6 (Physical Security)', name: 'Physical Protection of OT Equipment', status: 'fail',
    gap: 'Network rack in ECR unlocked; visitor access uncontrolled during port stays',
    evidence: 'Network cabinet in the engine control room was found unlocked. No key-card requirement for ECR access in port. No visitor log.',
    rationale: 'Chapter 6 requires physical protection of OT equipment. The current configuration permits direct console access by any port-stay visitor.',
    measure: '1. Lock all OT cabinets with restricted key access. 2. Introduce key-card control for ECR and bridge during port stays. 3. Mandatory visitor log.',
    criteria: ['All OT cabinets lockable and locked outside maintenance', 'Visitor log in place for restricted spaces'],
    effort: '16-24h', priority: 'P0' },
  { id: 'UC-2', article: 'E26-Ch.12 (Mobile Devices)', name: 'Mobile Device Policy and Network Isolation', status: 'fail',
    gap: 'Crew BYOD smartphones reach OT VLAN; no MDM; no policy',
    evidence: '23 personal mobile devices observed on the same WLAN that routes to OT. No mobile device management. No documented BYOD policy.',
    rationale: 'Chapter 12 requires that mobile devices not introduce risk to OT. Direct routing between crew BYOD and OT is a fundamental violation.',
    measure: '1. Separate crew WLAN into an isolated VLAN with internet-only egress. 2. Document and communicate a BYOD policy. 3. Block all OT routes from the crew WLAN at the firewall.',
    criteria: ['Crew WLAN isolated from OT (verified by routing test)', 'BYOD policy signed off by master and chief engineer'],
    effort: '24-40h', priority: 'P0' },

  // SI — Asset Identification & Malware (Ch. 4, 8)
  { id: 'SI-1', article: 'E26-Ch.4 (Equipment Identification)', name: 'Complete CBS Register', status: 'fail',
    gap: 'CBS register lists 14 systems; network scan finds 23',
    evidence: 'Active network scan revealed nine CBS that are not in the documented CBS register, including engineering laptops and a VSAT control unit.',
    rationale: 'Chapter 4 requires complete identification of all CBS on board. Undocumented assets are excluded from patch, monitoring and recovery regimes.',
    measure: '1. Reconcile the network scan against the CBS register and add missing entries. 2. Establish a quarterly reconciliation procedure.',
    criteria: ['CBS register complete and reconciled to a current network scan', 'Quarterly reconciliation procedure documented'],
    effort: '24-40h', priority: 'P1' },
  { id: 'SI-2', article: 'E26-Ch.8 (Anti-Malware)', name: 'Anti-Malware on All Eligible CBS and Service Laptops', status: 'fail',
    gap: 'No AV on service laptops; OS updates over 12 months old',
    evidence: 'Three shore-supplied service laptops carry no anti-malware. Same laptops are used across multiple fleet vessels.',
    rationale: 'Chapter 8 requires anti-malware on all eligible systems. Service laptops without protection are a documented cross-fleet infection vector.',
    measure: '1. Deploy managed anti-malware on every service laptop authorised to connect to CBS. 2. Maintain signature updates < 30 days old. 3. Pre-connection scan procedure documented.',
    criteria: ['Every authorised service laptop runs current anti-malware', 'Pre-connection scan procedure signed off'],
    effort: '16-24h', priority: 'P0' },

  // DC — Information Sharing (Ch. 5)
  { id: 'DC-1', article: 'E26-Ch.5 (Information Sharing)', name: 'Secure Ship-to-Shore Information Exchange', status: 'fail',
    gap: 'Plain FTP used for cargo and bunker data; credentials in cleartext',
    evidence: 'VSAT capture during cargo operations shows FTP transfer of stowage plans and bunker reports without TLS. Credentials cleartext.',
    rationale: 'Chapter 5 requires that information exchanged with shore parties is protected commensurate with sensitivity. Plain FTP is no longer acceptable.',
    measure: '1. Replace FTP with SFTP or HTTPS for all ship-to-shore data flows. 2. Issue per-vessel credentials managed in the central directory.',
    criteria: ['No plain FTP/HTTP transfers in VSAT capture', 'Per-vessel credentials managed centrally'],
    effort: '24-40h', priority: 'P1' },

  // AL — Monitoring & Testing (Ch. 15, 16)
  { id: 'AL-1', article: 'E26-Ch.15 (Network Monitoring)', name: 'On-Board Network Operation Monitoring', status: 'fail',
    gap: 'No IDS/NDR and no log aggregation in OT segments',
    evidence: 'No intrusion detection, no flow collection, no centralised log aggregation. Telemetry limited to VSAT bandwidth chart at shore office.',
    rationale: 'Chapter 15 requires that the ship operator be able to detect anomalous network activity on board. The current state provides no on-board visibility.',
    measure: '1. Deploy a passive IDS sensor on the OT span port. 2. Forward logs from key CBS to an on-board syslog collector. 3. Weekly review by the ETO.',
    criteria: ['IDS active on OT span port', 'Syslog collector active with 90-day retention', 'Weekly review log maintained'],
    effort: '60-100h', priority: 'P0' },
  { id: 'AL-2', article: 'E26-Ch.16 (Verification and Testing)', name: 'Cyber Verification in HAT/SAT and Periodic Tests', status: 'fail',
    gap: 'No cyber test cases in sea-trial protocol; no periodic cyber test programme',
    evidence: 'Sea-trial protocol contains no cyber-specific test cases. No periodic on-board cyber testing in the safety-management system.',
    rationale: 'Chapter 16 requires verification and testing of cyber resilience measures, both at delivery and periodically in service.',
    measure: '1. Add a documented cyber test section to HAT/SAT. 2. Schedule annual on-board cyber tests covering segmentation, recovery and access control.',
    criteria: ['HAT/SAT include documented cyber test cases', 'Annual cyber test programme scheduled and signed off'],
    effort: '40-60h', priority: 'P1' },

  // RA — Recovery & Manual Operations (Ch. 13, 14)
  { id: 'RA-1', article: 'E26-Ch.13 (Recovery Plan)', name: 'Recovery Plan for Critical CBS', status: 'fail',
    gap: 'No documented recovery plan; backups undated; paper charts incomplete',
    evidence: 'No recovery plan in place. Date of last ECDIS configuration backup is unknown. Paper charts do not cover the current trade route.',
    rationale: 'Chapter 13 requires a documented and tested recovery plan for CBS critical to safety and operation.',
    measure: '1. Document a recovery plan covering navigation, propulsion and power management CBS. 2. Maintain dated, tested backups. 3. Carry paper charts covering the trade area.',
    criteria: ['Recovery plan documented and approved', 'Backups dated and verified within last 90 days', 'Paper charts cover current trade area'],
    effort: '40-60h', priority: 'P0' },
  { id: 'RA-2', article: 'E26-Ch.14 (Manual Operations)', name: 'Tested Local & Manual Fallback', status: 'partial',
    gap: 'Steering local control wired but not exercised for 18 months',
    evidence: 'Steering local control station present and wired but not operationally tested in the last 18 months. Crew unfamiliar with the procedure.',
    rationale: 'Chapter 14 requires that local/manual operation modes for critical functions be available AND tested. Untested fallback does not meet the requirement.',
    measure: '1. Exercise steering local control at least every 3 months. 2. Include the drill in the SMS. 3. Brief all bridge officers on the procedure.',
    criteria: ['Local steering drill performed quarterly and logged', 'Procedure briefed to all bridge officers'],
    effort: '8-16h', priority: 'P1' },

  // UTN — Network, Wireless, Remote (Ch. 7, 10, 11)
  { id: 'UTN-1', article: 'E26-Ch.7 (Network Protection)', name: 'Network Segmentation Between IT, OT, Crew', status: 'fail',
    gap: 'Single subnet shared by crew, admin and OT; no firewall',
    evidence: 'Network analysis revealed a single /22 subnet with crew, admin and OT systems. ICMP from a crew laptop to the ECDIS succeeded.',
    rationale: 'Chapter 7 mandates segmentation between zones with differing trust levels. A flat network is a fundamental violation.',
    measure: '1. Introduce VLANs for Crew, Admin, OT, Safety. 2. Deploy a next-generation firewall between zones. 3. Document and approve a zone & conduit diagram.',
    criteria: ['Separate VLANs for Crew, Admin, OT', 'NGFW enforcing zone policy', 'Zone & conduit diagram approved'],
    effort: '80-120h', priority: 'P0' },
  { id: 'UTN-2', article: 'E26-Ch.10 (Wireless Communication)', name: 'Wireless Access Security and Segregation', status: 'fail',
    gap: 'WPA2-PSK with default vendor key on an AP bridged to IBS',
    evidence: 'WiFi audit detected an AP "bridge-svc" with default WPA2 key, bridged to the IBS VLAN, detectable from the pier.',
    rationale: 'Chapter 10 requires that wireless communication be protected and segregated from safety-critical OT. The current AP fails both.',
    measure: '1. Replace PSK with WPA2/WPA3-Enterprise tied to the directory. 2. Place the service AP in a dedicated VLAN with no OT routes. 3. Disable broadcast outside maintenance windows.',
    criteria: ['No wireless AP routes directly to OT VLANs', 'WPA2/WPA3-Enterprise in use on service APs'],
    effort: '24-40h', priority: 'P0' },
  { id: 'UTN-3', article: 'E26-Ch.11 (Remote Access)', name: 'Controlled & Approved Remote Access', status: 'fail',
    gap: 'Permanent OEM tunnel to engine CBS; no on-board approval',
    evidence: 'Permanent IPsec tunnel to engine OEM has been active for 8 months. No on-board approval workflow. No MFA.',
    rationale: 'Chapter 11 requires that remote access be explicitly approved on board, time-bounded, multi-factor authenticated and logged.',
    measure: '1. Terminate the permanent tunnel; allow only on-demand sessions. 2. On-board approval by duty officer required. 3. Enforce MFA. 4. Full session logging with 1-year retention.',
    criteria: ['No always-on remote access tunnels', 'Approval workflow operational, signed by duty officer', 'MFA enforced; session logs retained 1 year'],
    effort: '40-60h', priority: 'P0' },
  { id: 'UTN-4', article: 'E26-Ch.7 (Network Protection)', name: 'Perimeter Hardening of Shore Connection', status: 'pass',
    gap: '',
    evidence: 'The VSAT perimeter is terminated on a firewall with documented rule set, monthly review, and an explicit default-deny posture.',
    rationale: 'The requirement is met. Perimeter hardening is documented and reviewed.',
    measure: '', criteria: [], effort: '', priority: '' },
];

// ── Extended UR E26 Matrix — Governance & Lifecycle Controls (20) ────────────
// These complement the 15 technical controls above with the organizational and
// lifecycle controls a classification-society auditor expects for a full UR E26
// readiness review: governance, risk management, change management, vulnerability
// management, supplier security, incident response and awareness.
export const IEC_REQS_GOVERNANCE: IecReq[] = [
  // GOV — Security Governance
  { id: 'GOV-1', article: 'E26 §3 (Goal & Functional Requirements) / IEC 62443-2-1', name: 'Cybersecurity Roles & Responsibilities Defined', status: 'fail',
    gap: 'No documented assignment of cyber-resilience responsibilities across master, chief engineer, ETO and shore office',
    evidence: 'The safety-management system contains no defined cybersecurity roles. No single accountable owner for vessel cyber resilience is named on board or ashore. Responsibilities are assumed informally by the ETO.',
    rationale: 'UR E26 is goal-based and places explicit responsibility for the ship-wide cyber-resilience framework on the owner. Without a documented RACI, requirements cannot be reliably owned, executed or evidenced at survey.',
    measure: '1. Define and document cybersecurity roles for ship and shore (accountable owner, on-board lead, deputy). 2. Embed the RACI in the SMS. 3. Brief all named role-holders against their responsibilities.',
    criteria: ['Cyber roles documented in the SMS with named accountable owner', 'On-board cyber lead and deputy designated in writing', 'Role-holders briefed and acknowledgement recorded'],
    effort: '24-40h', priority: 'P0' },
  { id: 'GOV-2', article: 'E26 §3 (Owner/Yard responsibilities) / IACS Rec. 166', name: 'Owner / Yard / Supplier Security Responsibilities', status: 'fail',
    gap: 'Division of cyber responsibilities between owner, yard and CBS suppliers is undocumented for the newbuild/retrofit',
    evidence: 'No responsibility matrix exists defining who delivers, integrates, tests and maintains the cyber-resilience measures across owner, building yard and CBS suppliers. Handover documentation does not allocate residual security tasks.',
    rationale: 'UR E26 explicitly distributes duties across owner, yard and supplier. Undocumented boundaries lead to security gaps at integration and at delivery handover.',
    measure: '1. Produce an owner/yard/supplier responsibility matrix for all cyber-resilience measures. 2. Reference it in build/retrofit contracts. 3. Confirm residual tasks at handover acceptance.',
    criteria: ['Responsibility matrix agreed and signed by owner and yard', 'Supplier security duties referenced in contracts', 'Residual tasks confirmed at handover'],
    effort: '24-40h', priority: 'P1' },
  { id: 'GOV-3', article: 'E26 §3 (Management Framework) / IEC 62443-2-1', name: 'Cybersecurity Policy & Management Commitment', status: 'partial',
    gap: 'A high-level company cyber policy exists but is not vessel-specific and lacks evidence of management review',
    evidence: 'A generic company IT security policy is on file but does not address OT/CBS, ship-specific scope, or review cadence. No record of management review of cyber resilience in the past 12 months.',
    rationale: 'UR E26 expects a managed framework with demonstrable top-management commitment. A generic, unreviewed policy does not provide the governance baseline the requirement assumes.',
    measure: '1. Extend the policy to cover OT/CBS and vessel scope. 2. Establish an annual management review of cyber resilience. 3. Record management endorsement.',
    criteria: ['Policy covers OT/CBS and is vessel-applicable', 'Annual management review scheduled and minuted', 'Documented top-management endorsement'],
    effort: '16-24h', priority: 'P1' },

  // RM — Risk Management
  { id: 'RM-1', article: 'E26 §4 (Risk Assessment) / IEC 62443-3-2', name: 'Cyber Risk Assessment for CBS', status: 'fail',
    gap: 'No documented cyber risk assessment covering the vessel\'s CBS and zones/conduits',
    evidence: 'No structured cyber risk assessment is on file. Security measures appear to have been selected ad hoc rather than derived from an assessed risk to each CBS and zone.',
    rationale: 'UR E26 requires that security measures be commensurate with assessed risk. Without a documented CBS risk assessment, the adequacy of the chosen measures cannot be demonstrated to a surveyor.',
    measure: '1. Conduct an IEC 62443-3-2 style risk assessment across all CBS and zones. 2. Document threat scenarios, likelihood/impact and residual risk. 3. Have the owner formally accept residual risk.',
    criteria: ['Risk assessment documented for all CBS and zones', 'Residual risk formally accepted by the owner', 'Assessment dated within the last 12 months'],
    effort: '60-100h', priority: 'P0' },
  { id: 'RM-2', article: 'E26 §4 (Risk-based selection) / IEC 62443-3-2', name: 'Risk-Based Security Measures Selection', status: 'fail',
    gap: 'Security measures not traceable to assessed risk or target security level',
    evidence: 'There is no traceability matrix linking implemented measures to specific risks or to the target security level (SL-T). Measure selection cannot be justified against the risk picture.',
    rationale: 'UR E26 expects measures to be derived from risk and the target security level. Lack of traceability prevents demonstration that the protection is proportionate.',
    measure: '1. Build a traceability matrix mapping each measure to risk(s) and SL-T. 2. Identify and close coverage gaps. 3. Review the matrix when the risk assessment changes.',
    criteria: ['Traceability matrix measure→risk→SL-T maintained', 'No uncovered high/critical risks', 'Matrix reviewed on each risk-assessment update'],
    effort: '40-60h', priority: 'P1' },
  { id: 'RM-3', article: 'E26 §4 (Change-driven review) / IEC 62443-2-1', name: 'Risk Review During System Changes', status: 'fail',
    gap: 'No requirement to re-assess cyber risk when CBS are modified, added or integrated',
    evidence: 'Recent CBS modifications (VSAT upgrade, additional engineering laptop) proceeded without any cyber risk review. No trigger in the change process mandates re-assessment.',
    rationale: 'UR E26 treats cyber resilience as lifecycle-managed; changes can invalidate prior risk decisions. A missing re-assessment trigger allows risk to drift undetected.',
    measure: '1. Add a mandatory cyber-risk review gate to the change process. 2. Record the review outcome for each change. 3. Update the master risk assessment accordingly.',
    criteria: ['Change process includes a cyber-risk review gate', 'Each CBS change has a recorded risk review', 'Master risk assessment updated after changes'],
    effort: '16-24h', priority: 'P1' },

  // CM — Configuration & Change Management
  { id: 'CM-1', article: 'E26 §5 (Configuration control) / IEC 62443-2-1', name: 'Controlled Configuration Baseline', status: 'fail',
    gap: 'No maintained secure configuration baseline for CBS; current state not documented',
    evidence: 'No approved configuration baseline (firmware versions, services, accounts, network settings) exists for the CBS. Drift cannot be detected because there is no reference state.',
    rationale: 'UR E26 expects CBS configurations to be controlled so that the secure state is known and maintainable. Without a baseline, hardening and integrity cannot be assured.',
    measure: '1. Capture an approved secure baseline per CBS class. 2. Store baselines under version control. 3. Periodically compare live configuration against the baseline.',
    criteria: ['Approved baseline exists per CBS class', 'Baselines version-controlled', 'Quarterly baseline comparison performed and logged'],
    effort: '40-60h', priority: 'P0' },
  { id: 'CM-2', article: 'E26 §5 (Change approval) / IEC 62443-2-1', name: 'Change Approval Process', status: 'fail',
    gap: 'CBS changes performed without documented approval or record',
    evidence: 'Engine OEM and integrator changes are applied on board without a formal approval step or change log. There is no record of who approved, applied or verified recent modifications.',
    rationale: 'UR E26 requires changes to be controlled. Unapproved, unrecorded changes undermine baseline integrity and prevent post-incident reconstruction.',
    measure: '1. Introduce a documented change-approval workflow for all CBS. 2. Require duty-officer authorisation before changes. 3. Maintain a change log with approver, date and verification.',
    criteria: ['Documented change-approval workflow in use', 'All CBS changes authorised before execution', 'Change log maintained with verification step'],
    effort: '24-40h', priority: 'P1' },
  { id: 'CM-3', article: 'E26 §5 (Security review of changes) / IEC 62443-2-1', name: 'Security Review of System Changes', status: 'partial',
    gap: 'Functional changes are tested but not reviewed for security impact',
    evidence: 'Changes are validated for functional correctness during commissioning but no security review (new ports, services, accounts, trust paths) is performed or recorded.',
    rationale: 'UR E26 expects that changes do not erode the established security posture. A functional-only review can silently reopen attack paths.',
    measure: '1. Add a security-impact checklist to the change process. 2. Verify hardening, segmentation and accounts after each change. 3. Record the security review outcome.',
    criteria: ['Security-impact checklist applied to each change', 'Post-change hardening/segmentation verified', 'Security review outcome recorded'],
    effort: '16-24h', priority: 'P2' },

  // VM — Vulnerability & Patch Management
  { id: 'VM-1', article: 'E26 §6 (Vulnerability monitoring) / IEC 62443-2-3', name: 'Vulnerability Monitoring Process', status: 'fail',
    gap: 'No process to identify vulnerabilities affecting the vessel\'s CBS',
    evidence: 'There is no routine review of vulnerability sources (CISA ICS advisories, vendor bulletins) against the CBS inventory. The crew is unaware of known exposures affecting on-board systems.',
    rationale: 'UR E26 expects exposures to be known and managed over the lifecycle. Without monitoring, exploitable vulnerabilities persist indefinitely.',
    measure: '1. Establish a recurring vulnerability-monitoring routine mapped to the CBS inventory. 2. Subscribe to ICS-CERT and vendor advisories. 3. Triage and log relevant findings.',
    criteria: ['Recurring vulnerability review against CBS inventory', 'ICS-CERT/vendor advisory subscriptions active', 'Triage decisions logged'],
    effort: '24-40h', priority: 'P0' },
  { id: 'VM-2', article: 'E26 §6 (Patch management) / IEC 62443-2-3', name: 'Security Patch Management', status: 'fail',
    gap: 'No managed patching regime for CBS and supporting endpoints',
    evidence: 'Operating systems on several CBS and service laptops are over 12 months behind. There is no patch schedule, test step, or approval path for OT-relevant updates.',
    rationale: 'UR E26 expects patches to be managed in a controlled, risk-aware manner (including vendor-approved windows). Unmanaged patching leaves known exploits open.',
    measure: '1. Define a patch policy with risk-based timelines and vendor-approval requirements. 2. Test patches before OT deployment. 3. Record applied patches per CBS.',
    criteria: ['Patch policy with risk-based timelines documented', 'Patches tested before OT deployment', 'Patch records maintained per CBS'],
    effort: '40-60h', priority: 'P1' },
  { id: 'VM-3', article: 'E26 §6 (Advisory tracking) / IEC 62443-2-3', name: 'Vendor Security Advisory Tracking', status: 'partial',
    gap: 'Vendor advisories received informally and not tracked to resolution',
    evidence: 'Some OEM security advisories reach the ETO by email but are not logged or tracked to a remediation decision. No closure evidence exists for past advisories.',
    rationale: 'UR E26 expects supplier security information to be acted upon. Untracked advisories result in inconsistent and unverifiable remediation.',
    measure: '1. Maintain an advisory register per supplier/CBS. 2. Assign owner and due date to each advisory. 3. Record remediation or accepted-risk decision.',
    criteria: ['Advisory register maintained per supplier/CBS', 'Each advisory has owner and due date', 'Resolution/accepted-risk recorded'],
    effort: '16-24h', priority: 'P2' },

  // TP — Supplier & Third-Party Security
  { id: 'TP-1', article: 'E26 §3 (Supplier requirements) / IACS Rec. 166', name: 'Security Requirements for Vendors', status: 'fail',
    gap: 'No cybersecurity requirements imposed on CBS suppliers in procurement',
    evidence: 'Purchase specifications and contracts for CBS do not include cybersecurity requirements (e.g. UR E27 type approval, hardening, secure defaults, support for patching).',
    rationale: 'UR E26 relies on suppliers delivering secure CBS. Absent contractual security requirements, the owner inherits unmanaged risk at delivery.',
    measure: '1. Add cybersecurity clauses (UR E27 alignment, secure defaults, patch support) to CBS procurement. 2. Require security documentation as a deliverable. 3. Verify at acceptance.',
    criteria: ['Security clauses in CBS procurement documents', 'Security documentation required as deliverable', 'Compliance verified at acceptance'],
    effort: '24-40h', priority: 'P1' },
  { id: 'TP-2', article: 'E26 §10 (Secure vendor access) / IEC 62443-3-3', name: 'Secure Remote Vendor Access', status: 'fail',
    gap: 'Vendor remote access not governed by an agreement or technical controls beyond the existing always-on tunnel',
    evidence: 'OEM remote access operates without a vendor access agreement, defined approval path, MFA, or session recording. Access scope is not least-privilege.',
    rationale: 'UR E26 requires remote access — including vendor access — to be controlled, approved and auditable. Ungoverned vendor access is a primary supply-chain attack path.',
    measure: '1. Establish a vendor remote-access agreement and least-privilege scope. 2. Enforce on-board approval, MFA and session logging. 3. Review vendor access quarterly.',
    criteria: ['Vendor remote-access agreement signed', 'On-board approval, MFA and session logging enforced', 'Quarterly vendor access review performed'],
    effort: '40-60h', priority: 'P0' },
  { id: 'TP-3', article: 'E26 §11 (Verification of CBS) / IACS UR E27', name: 'Security Verification of Delivered CBS', status: 'fail',
    gap: 'Delivered CBS accepted without security verification against requirements',
    evidence: 'Acceptance of integrated CBS does not include verification of hardening, default-credential removal, or supplier security claims. No security acceptance test record exists.',
    rationale: 'UR E26 expects the owner to verify that delivered CBS meet the agreed security requirements. Unverified delivery propagates supplier weaknesses into operation.',
    measure: '1. Define a security acceptance test (SAT) for delivered CBS. 2. Verify hardening, credentials and supplier claims. 3. Record SAT results before acceptance.',
    criteria: ['Security acceptance test defined for delivered CBS', 'Default credentials and hardening verified', 'SAT results recorded before acceptance'],
    effort: '24-40h', priority: 'P1' },

  // IR — Incident Management
  { id: 'IR-1', article: 'E26 §9 (Incident response) / IEC 62443-2-1', name: 'Cyber Incident Response Process', status: 'fail',
    gap: 'No cyber incident response plan covering on-board CBS',
    evidence: 'The contingency documentation addresses safety emergencies but contains no cyber incident response procedure. Crew has no defined first actions for a suspected cyber event.',
    rationale: 'UR E26 expects the ship to respond to cyber incidents in a structured way. Without a plan, response is improvised and recovery is delayed.',
    measure: '1. Develop a cyber incident response plan with roles, first actions and isolation steps. 2. Integrate it into the SMS. 3. Exercise it at least annually.',
    criteria: ['Cyber incident response plan documented in SMS', 'Defined first actions and isolation steps', 'Annual incident exercise performed and logged'],
    effort: '40-60h', priority: 'P0' },
  { id: 'IR-2', article: 'E26 §9 (Reporting & escalation) / IMO MSC-FAL.1/Circ.3', name: 'Incident Reporting & Escalation', status: 'fail',
    gap: 'No defined ship-to-shore cyber incident reporting and escalation path',
    evidence: 'There is no procedure or contact chain for reporting a cyber incident to the company DPA/CISO, flag, or class. Reporting thresholds and timelines are undefined.',
    rationale: 'UR E26 and the company SMS expect timely escalation. An undefined path delays containment, notification and regulatory reporting.',
    measure: '1. Define reporting thresholds and a ship-to-shore escalation contact chain. 2. Document timelines and external notification duties. 3. Brief the crew.',
    criteria: ['Escalation contact chain documented', 'Reporting thresholds and timelines defined', 'Crew briefed on reporting duties'],
    effort: '16-24h', priority: 'P1' },
  { id: 'IR-3', article: 'E26 §9 (Lessons learned) / IEC 62443-2-1', name: 'Lessons Learned Process', status: 'partial',
    gap: 'No structured post-incident review feeding back into measures',
    evidence: 'Past minor IT disruptions were resolved reactively with no documented post-incident review or resulting corrective actions.',
    rationale: 'UR E26 treats resilience as continuously improving. Without lessons-learned, the same weaknesses recur and measures are never tuned.',
    measure: '1. Add a post-incident review step to the response plan. 2. Capture root cause and corrective actions. 3. Track actions to closure and update measures.',
    criteria: ['Post-incident review step defined', 'Root cause and corrective actions captured', 'Corrective actions tracked to closure'],
    effort: '8-16h', priority: 'P2' },

  // AT — Awareness & Training
  { id: 'AT-1', article: 'E26 §3 (Personnel awareness) / IMO Res. MSC.428(98)', name: 'Crew Cybersecurity Awareness', status: 'fail',
    gap: 'No recurring cybersecurity awareness for crew',
    evidence: 'No cyber awareness training is delivered to crew on joining or periodically. Phishing, USB hygiene and BYOD risks are not covered in onboarding.',
    rationale: 'UR E26 recognises that the crew is a primary line of defence. Untrained crew materially increase the likelihood of malware introduction and social-engineering success.',
    measure: '1. Deliver cyber awareness at onboarding and at defined intervals. 2. Cover phishing, USB/BYOD hygiene and reporting. 3. Record completion.',
    criteria: ['Awareness training delivered at onboarding', 'Periodic refresher scheduled', 'Completion records maintained'],
    effort: '16-24h', priority: 'P1' },
  { id: 'AT-2', article: 'E26 §3 (Role-specific training) / IEC 62443-2-1', name: 'Role-Specific Security Training', status: 'fail',
    gap: 'No targeted training for roles with elevated CBS responsibilities (ETO, engineers, DPO)',
    evidence: 'Personnel with privileged CBS access receive no role-specific security training (secure configuration, remote-access approval, incident first response).',
    rationale: 'UR E26 expects competence commensurate with responsibility. Role-holders without targeted training cannot execute the assigned measures reliably.',
    measure: '1. Define role-specific training for ETO, engineers and DPO. 2. Deliver it before privileged duties commence. 3. Track competence and refreshers.',
    criteria: ['Role-specific training defined for key roles', 'Training completed before privileged duties', 'Competence and refreshers tracked'],
    effort: '16-24h', priority: 'P2' },
];

// Full extended matrix = 15 technical baseline controls + 20 governance/lifecycle controls.
export const IEC_REQS_EXTENDED: IecReq[] = [...IEC_REQS, ...IEC_REQS_GOVERNANCE];

// ── Assessment depth / product tiers ─────────────────────────────────────────
//   rapid    → 15 core technical controls (management overview, 0.5–1 PT)
//   extended → 35 controls, governance + technical (full readiness, 2–3 PT)
//   deepdive → 35 controls + per-CBS score matrix (system-by-system, high tier)
export type AssessmentType = 'rapid' | 'extended' | 'deepdive';

export function normalizeAssessmentType(v: AssessmentType | boolean | undefined): AssessmentType {
  if (v === true) return 'extended';
  if (v === false || v === undefined) return 'rapid';
  return v;
}

// Returns the active requirement set for the assessment depth chosen in intake.
export function getReqs(type: AssessmentType | boolean | undefined): IecReq[] {
  return normalizeAssessmentType(type) === 'rapid' ? IEC_REQS : IEC_REQS_EXTENDED;
}

// ── Control × CBS relevance matrix (CBS Deep Dive) ───────────────────────────
// Maps each control to the CBS system-type ids it materially applies to.
// '*' = ship-wide control that applies to every CBS. Per-CBS scores are derived
// purely from the real assessed status of the control set relevant to that CBS —
// no values are invented (Data Integrity Policy).
export const CONTROL_CBS_RELEVANCE: Record<string, string[]> = {
  // Technical baseline (Ch. 4-16)
  'IAC-1': ['*'],
  'IAC-2': ['ibs', 'ecdis', 'navigation', 'dp'],
  'UC-1': ['*'],
  'UC-2': ['*'],
  'SI-1': ['*'],
  'SI-2': ['ias', 'power', 'propulsion', 'steering', 'dp', 'safety'],
  'DC-1': ['cargo', 'comms', 'performance', 'remote'],
  'AL-1': ['*'],
  'AL-2': ['*'],
  'RA-1': ['navigation', 'ecdis', 'ibs', 'propulsion', 'power', 'steering', 'dp'],
  'RA-2': ['steering', 'propulsion', 'power', 'dp'],
  'UTN-1': ['*'],
  'UTN-2': ['ibs', 'comms', 'navigation', 'access'],
  'UTN-3': ['remote', 'ias', 'propulsion', 'power'],
  'UTN-4': ['comms', 'remote'],
  // Governance & lifecycle (extended)
  'GOV-1': ['*'], 'GOV-2': ['*'], 'GOV-3': ['*'],
  'RM-1': ['*'], 'RM-2': ['*'], 'RM-3': ['*'],
  'CM-1': ['*'], 'CM-2': ['*'],
  'CM-3': ['ias', 'power', 'propulsion', 'navigation', 'ecdis', 'ibs', 'dp'],
  'VM-1': ['*'],
  'VM-2': ['ias', 'power', 'propulsion', 'navigation', 'ecdis', 'ibs', 'dp', 'comms'],
  'VM-3': ['ias', 'power', 'propulsion', 'remote'],
  'TP-1': ['ias', 'propulsion', 'power', 'cargo', 'safety'],
  'TP-2': ['remote', 'ias', 'propulsion', 'power'],
  'TP-3': ['ias', 'propulsion', 'power', 'navigation', 'ecdis', 'ibs', 'dp'],
  'IR-1': ['*'], 'IR-2': ['*'], 'IR-3': ['*'],
  'AT-1': ['*'], 'AT-2': ['*'],
};

export function controlAppliesToCbs(reqId: string, cbsId: string): boolean {
  const rel = CONTROL_CBS_RELEVANCE[reqId];
  if (!rel || rel.includes('*')) return true;
  return rel.includes(cbsId);
}

const STATUS_SCORE: Record<IecReq['status'], number> = { pass: 100, partial: 50, fail: 0 };

export interface CbsScore {
  id: string;
  label: string;
  icon: string;
  score: number;            // 0-100, rounded
  applicable: number;       // controls relevant to this CBS
  pass: number;
  partial: number;
  fail: number;
}

// Computes a per-CBS readiness score from the real control statuses, filtered by
// the control×CBS relevance matrix. Pass=100, Partial=50, Fail=0.
export function computeCbsScores(reqs: IecReq[], systemTypeIds: string[]): CbsScore[] {
  const typeMeta = getSystemTypes();
  return systemTypeIds.map(id => {
    const meta = typeMeta.find(s => s.id === id);
    const relevant = reqs.filter(r => controlAppliesToCbs(r.id, id));
    const pass = relevant.filter(r => r.status === 'pass').length;
    const partial = relevant.filter(r => r.status === 'partial').length;
    const fail = relevant.filter(r => r.status === 'fail').length;
    const score = relevant.length > 0
      ? Math.round(relevant.reduce((sum, r) => sum + STATUS_SCORE[r.status], 0) / relevant.length)
      : 0;
    return { id, label: meta?.label || id, icon: meta?.icon || '⚙️', score, applicable: relevant.length, pass, partial, fail };
  }).sort((a, b) => b.score - a.score);
}

// ── Threats derived from a real assessment (no invented findings) ────────────
// In a real, post-intake document assessment the static demo threat catalogue
// (IEC_THREATS) must not be presented as this vessel's threats. Instead the
// Threat Landscape / Risk Matrix is derived purely from the assessed controls:
// each non-compliant control becomes one threat. Evidence/rationale come from
// the real assessment; likelihood/impact use the same transparent status
// methodology as the rest of the tool (fail = high, partial = medium). No
// attacker/path/source specifics are fabricated (Data Integrity Policy).
const STATUS_LI: Record<IecReq['status'], { likelihood: number; impact: number }> = {
  fail: { likelihood: 4, impact: 4 },
  partial: { likelihood: 3, impact: 2 },
  pass: { likelihood: 1, impact: 1 },
};

export function deriveThreatsFromReqs(reqs: IecReq[]): IecThreat[] {
  return reqs
    .filter(r => r.status !== 'pass')
    .map((r, i) => {
      const li = STATUS_LI[r.status];
      return {
        id: i + 1,
        fr: r.id.split('-')[0],
        name: r.name,
        component: r.article,
        attacker: '—',
        path: '—',
        iecRef: r.article,
        likelihood: li.likelihood,
        impact: li.impact,
        evidence: r.evidence || '',
        rationale: r.rationale || '',
        sources: [],
        evidenceQuality: 3,
        reproducibility: 'medium',
      } as IecThreat;
    });
}






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
    facility: { name: 'MV Aurora Borealis — LNG Carrier (Newbuild)', types: ['propulsion', 'navigation', 'power', 'cargo', 'ecdis'] },
    securityLevel: 'sl2',
    description: 'Newbuild LNG carrier in final outfitting. Integrated bridge system, dual-fuel engine control, cargo management, power management, VSAT, crew WLAN. Cyber-resilience assessment for IACS UR E26 compliance prior to sea trials.',
    zones: ['bridge', 'engineroom', 'crew', 'cargo_ot', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'IEC 61162-450', 'Modbus TCP', 'OPC-UA', 'VSAT/Fleet Broadband', 'VPN (IPsec)', 'Wireless (WiFi)', 'USB'],
    roles: ['Owner/Fleet Manager', 'Captain', 'Chief Engineer', 'IT/ETO Officer', 'Class Surveyor'],
    measures: { backup: { active: true, documented: true, audited: false, certified: false }, patch: { active: true, documented: false, audited: false, certified: false }, physical: { active: true, documented: false, audited: false, certified: false } },
    knownIssues: 'Flat ship network, crew BYOD on OT VLAN, no IDS, no central identity, OEM tunnels always-on.',
    files: [
      { name: 'AuroraBorealis_ShipNetwork_v0.9.pdf', size: 2_800_000, type: 'arch' },
      { name: 'CBS_Register_Newbuild.xlsx', size: 920_000, type: 'riskAssess' },
      { name: 'Zone_Conduit_Diagram_draft.vsdx', size: 740_000, type: 'zoneMap' },
    ],
  },
  {
    facility: { name: 'MV Hanseatic Wave — Container Vessel (In Service)', types: ['propulsion', 'navigation', 'power', 'comms'] },
    securityLevel: 'sl2',
    description: 'In-service 8500 TEU container vessel, retrofit assessment for IACS UR E26 readiness. Mixed-vintage CBS, recent VSAT upgrade, crew WLAN bridged to OT.',
    zones: ['bridge', 'engineroom', 'crew', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'Modbus TCP', 'HTTPS/REST', 'VSAT/Fleet Broadband', 'Serial (RS-422/485)', 'Wireless (WiFi)', 'USB'],
    roles: ['Captain', 'Chief Engineer', 'IT/ETO Officer', 'Watch Officer', 'DPO'],
    measures: { iac: { active: true, documented: false, audited: false, certified: false }, segmentation: { active: false, documented: false, audited: false, certified: false } },
    knownIssues: 'Orphaned crew accounts, no IDS, FTP for cargo data, untested manual steering fallback.',
    files: [
      { name: 'HanseaticWave_NetworkAsBuilt.pdf', size: 1_900_000, type: 'arch' },
      { name: 'CBS_Inventory_2025.xlsx', size: 540_000, type: 'riskAssess' },
    ],
  },
  {
    facility: { name: 'MV Polar Endeavour — Offshore Supply Vessel', types: ['propulsion', 'steering', 'navigation', 'power', 'safety'] },
    securityLevel: 'sl3',
    description: 'DP2 offshore supply vessel operating in North Sea. Higher security level due to safety-critical DP and gas operations. Recent finding: unsecured wireless AP on bridge.',
    zones: ['bridge', 'engineroom', 'crew', 'safety_zone', 'shore'],
    protocols: ['NMEA 0183', 'NMEA 2000', 'IEC 61162-450', 'Modbus TCP', 'CANbus (J1939)', 'OPC-UA', 'VSAT/Fleet Broadband', 'VPN (IPsec)', 'SSH', 'Wireless (WiFi)'],
    roles: ['Captain', 'Chief Engineer', 'DPO', 'IT/ETO Officer', 'Safety Officer', 'Owner/Fleet Manager'],
    measures: { iac: { active: true, documented: true, audited: false, certified: false }, backup: { active: true, documented: true, audited: false, certified: false }, segmentation: { active: true, documented: false, audited: false, certified: false } },
    knownIssues: 'Bridge WiFi bridged to IBS, OEM permanent tunnel to engine, no quarterly steering drill.',
    files: [
      { name: 'PolarEndeavour_ZoneConduit.pdf', size: 2_400_000, type: 'zoneMap' },
      { name: 'DP_CyberRiskAssessment.pdf', size: 1_200_000, type: 'riskAssess' },
      { name: 'WiFi_Audit_PortStavanger.pdf', size: 480_000, type: 'pentest' },
    ],
  },
];
