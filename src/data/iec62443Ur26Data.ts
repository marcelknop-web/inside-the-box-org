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
  getSystemTypes, getSecurityLevels, getZoneConduits,
  PROTOCOL_OPTS, getSecurityMeasures, getSecurityCategories,
  getAttachTypes, threatId, EMPTY_INTAKE,
} from './iec62443Data';
export type { IecThreat, IecReq, IecIntakeData, MeasureEntry } from './iec62443Data';

import type { IecThreat, IecReq, MeasureEntry } from './iec62443Data';

// ── E26 Requirement Categories (grouping of E26 chapters 4-16) ───────────────
export const FR_CATEGORIES: Record<string, { label: Record<string, string>; dot: string; badge: string }> = {
  IAC: { label: { de: 'Zugriffskontrolle (Kap. 9)', en: 'Access Control (Ch. 9)', fr: 'Contrôle d\'accès (Ch. 9)' }, dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  UC: { label: { de: 'Physische Sicherheit & Mobile (Kap. 6, 12)', en: 'Physical & Mobile (Ch. 6, 12)', fr: 'Physique & mobile (Ch. 6, 12)' }, dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  SI: { label: { de: 'Asset-ID & Malware-Schutz (Kap. 4, 8)', en: 'Asset ID & Malware (Ch. 4, 8)', fr: 'ID actifs & anti-malware (Ch. 4, 8)' }, dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  DC: { label: { de: 'Informationsaustausch (Kap. 5)', en: 'Information Sharing (Ch. 5)', fr: 'Partage d\'information (Ch. 5)' }, dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  AL: { label: { de: 'Monitoring & Tests (Kap. 15, 16)', en: 'Monitoring & Testing (Ch. 15, 16)', fr: 'Surveillance & tests (Ch. 15, 16)' }, dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  RA: { label: { de: 'Recovery & manueller Betrieb (Kap. 13, 14)', en: 'Recovery & Manual Ops (Ch. 13, 14)', fr: 'Récupération & ops manuelles (Ch. 13, 14)' }, dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  UTN: { label: { de: 'Netzwerk, WLAN & Remote (Kap. 7, 10, 11)', en: 'Network, Wireless, Remote (Ch. 7, 10, 11)', fr: 'Réseau, sans-fil, distant (Ch. 7, 10, 11)' }, dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
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

// ── Demo Scenarios (Maritime, owner / newbuild perspective) ────────────────

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
