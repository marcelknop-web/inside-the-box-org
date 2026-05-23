export type RoleId = "it-ops" | "ot-ops" | "ic" | "mgmt";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
}

export const ROLES: Role[] = [
  {
    id: "it-ops",
    name: "IT-Ops",
    description:
      "Own corporate IT response: containment, identity, EDR/SIEM telemetry, evidence preservation. You stop lateral movement on the IT side.",
  },
  {
    id: "ot-ops",
    name: "OT-Ops",
    description:
      "Own the plant floor: PLC and SIS status, production continuity, safety primacy. You decide what stays running and what is isolated.",
  },
  {
    id: "ic",
    name: "Incident Commander",
    description:
      "Run the response. Coordinate across teams, make the call under uncertainty, own the NIS-2 clock and battle rhythm.",
  },
  {
    id: "mgmt",
    name: "Management & Comms",
    description:
      "Handle clients, regulator (NSM), board, media. Draft holding statements, manage reputation, decide what gets disclosed and when.",
  },
];

export interface Phase {
  index: 1 | 2 | 3 | 4;
  name: string;
  timestamp: string;
  colorKey: "amber" | "orange" | "red" | "blue";
  situation: string;
  decisionQuestion: string;
  iec62443Ref: string;
  nis2Flag?: string;
}

export const PHASES: Phase[] = [
  {
    index: 1,
    name: "Phase 1 — Initial Anomaly",
    timestamp: "T+0",
    colorKey: "amber",
    situation:
      "Splunk fires a HIGH-severity alert: anomalous vendor VPN session active outside business hours. Telemetry shows a lateral movement attempt from the Jump Host (10.10.20.50 in the IT/OT DMZ) toward the OT Historian. No production impact has been confirmed. The vendor VPN account is one used by a third-party PLC integrator.",
    decisionQuestion:
      "Terminate the vendor VPN session immediately and revoke the third-party integrator's access?",
    iec62443Ref: "IEC 62443-3-3 SR 1.2 / SR 5.1 — account management & network segmentation",
  },
  {
    index: 2,
    name: "Phase 2 — Confirmed Compromise",
    timestamp: "T+45 min",
    colorKey: "orange",
    situation:
      "A malicious Siemens S7 configuration block has been pushed to the client simulation PLC in the OT Sim Network. Ransomware payload identified on an Engineering Workstation. OT Historian (10.10.30.x) is unreachable. The NIS-2 incident clock starts now.",
    decisionQuestion:
      "Isolate the OT Sim Network from the DMZ and trigger early client notification?",
    iec62443Ref: "IEC 62443-2-1 / 3-3 SR 5.2 — zone & conduit isolation",
    nis2Flag: "NIS-2 24h early warning window starts now.",
  },
  {
    index: 3,
    name: "Phase 3 — Safety Threshold",
    timestamp: "T+90 min",
    colorKey: "red",
    situation:
      "Claroty detects a SIS pre-alarm. Automatic emergency shutdown has triggered on the affected line. Ransom note appears on SCADA consoles. The attacker sends an encrypted message threatening to publish client data within 24 hours unless contact is made.",
    decisionQuestion:
      "Notify NSM now, issue holding statement to clients, and formally reject attacker contact?",
    iec62443Ref: "IEC 62443-2-1 incident response policy; safety primacy over availability",
    nis2Flag: "NIS-2 24h early warning is due. 72h incident notification clock advancing.",
  },
  {
    index: 4,
    name: "Phase 4 — Recovery Decision",
    timestamp: "T+4 h",
    colorKey: "blue",
    situation:
      "Forensics is engaged. Partial recovery on OT Sim Network is technically possible from validated backups. NIS-2 72h window: ~68h remaining. A media inquiry has landed and the board is asking for a public restart timeline.",
    decisionQuestion:
      "Authorise conditional restart of OT Sim Network under forensic monitoring?",
    iec62443Ref: "IEC 62443-2-1 recovery & change-management; integrity verification before restart",
    nis2Flag: "Final 72h incident notification must include scope, impact, root cause hypothesis.",
  },
];

export const NETWORK_ZONES: Array<{ zone: string; name: string; cidr: string }> = [
  { zone: "Zone 1", name: "Corporate IT", cidr: "10.10.10.0/24" },
  { zone: "Zone 2", name: "IT/OT DMZ", cidr: "10.10.20.0/24" },
  { zone: "Zone 3", name: "OT Sim Network", cidr: "10.10.30.0/24" },
  { zone: "SIS", name: "Safety PLC (air-gapped)", cidr: "10.10.30.99" },
];

export const INITIAL_ALERT = {
  source: "Splunk SIEM",
  severity: "HIGH",
  timestamp: "T+0 · 23:47 local",
  detail:
    "Vendor VPN session active outside business hours; lateral movement attempt from Jump Host (10.10.20.50) toward OT Historian.",
};

export const phaseColor = (k: Phase["colorKey"]) => {
  switch (k) {
    case "amber":
      return "text-amber-400 border-amber-400/40 bg-amber-400/10";
    case "orange":
      return "text-orange-400 border-orange-400/40 bg-orange-400/10";
    case "red":
      return "text-red-400 border-red-400/40 bg-red-400/10";
    case "blue":
      return "text-sky-400 border-sky-400/40 bg-sky-400/10";
  }
};
