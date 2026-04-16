// SOC-Life: rooms, NPCs, incidents, playbooks
// Style: realistic SOC playbooks aligned with NIST SP 800-61 phases
// (Detection & Analysis -> Containment -> Eradication -> Recovery -> Post-Incident)

export type RoomId =
  | "soc_floor"
  | "siem"
  | "forensics"
  | "noc"
  | "server_room"
  | "war_room"
  | "ciso_office"
  | "kitchen";

export interface Room {
  id: RoomId;
  // Grid position on a 4x2 floor plan
  col: 0 | 1 | 2 | 3;
  row: 0 | 1;
  /** i18n key path under socLife.rooms.<id>.name / .desc */
  i18n: string;
}

export const ROOMS: Room[] = [
  { id: "soc_floor",   col: 0, row: 0, i18n: "soc_floor" },
  { id: "siem",        col: 1, row: 0, i18n: "siem" },
  { id: "forensics",   col: 2, row: 0, i18n: "forensics" },
  { id: "noc",         col: 3, row: 0, i18n: "noc" },
  { id: "war_room",    col: 0, row: 1, i18n: "war_room" },
  { id: "ciso_office", col: 1, row: 1, i18n: "ciso_office" },
  { id: "server_room", col: 2, row: 1, i18n: "server_room" },
  { id: "kitchen",     col: 3, row: 1, i18n: "kitchen" },
];

export type NpcId = "junior" | "ir_lead" | "ciso" | "sysadmin";
export interface Npc {
  id: NpcId;
  homeRoom: RoomId;
  /** i18n key path under socLife.npcs.<id>.name */
  i18n: string;
}
export const NPCS: Npc[] = [
  { id: "junior",   homeRoom: "soc_floor",   i18n: "junior" },
  { id: "ir_lead",  homeRoom: "war_room",    i18n: "ir_lead" },
  { id: "ciso",     homeRoom: "ciso_office", i18n: "ciso" },
  { id: "sysadmin", homeRoom: "server_room", i18n: "sysadmin" },
];

export type IncidentType = "phishing" | "ransomware" | "ddos" | "insider";

/**
 * A single playbook step. The player must:
 *   1. Be in `requiredRoom` (or any if null)
 *   2. Pick the option whose `correct` is true
 * `timeLimitMs` controls escalation pressure for the step.
 */
export interface PlaybookStep {
  id: string;
  /** i18n key relative to socLife.incidents.<type>.steps.<stepId> */
  i18nBase: string;
  requiredRoom: RoomId | null;
  options: PlaybookOption[];
  timeLimitMs: number;
}
export interface PlaybookOption {
  id: string;
  /** i18n key under <stepBase>.options.<optionId> */
  i18nKey: string;
  correct: boolean;
  /** Reputation delta if chosen */
  delta: number;
}

export interface Incident {
  type: IncidentType;
  /** i18n key under socLife.incidents.<type>.title etc. */
  i18nBase: string;
  /** Seconds before the player MUST pick a step (overall) before auto-escalation */
  initialDelayMs: number;
  steps: PlaybookStep[];
}

const PHISHING: Incident = {
  type: "phishing",
  i18nBase: "phishing",
  initialDelayMs: 12_000,
  steps: [
    {
      id: "detect",
      i18nBase: "detect",
      requiredRoom: "siem",
      timeLimitMs: 25_000,
      options: [
        { id: "verify",  i18nKey: "verify",  correct: true,  delta: +6 },
        { id: "ignore",  i18nKey: "ignore",  correct: false, delta: -8 },
        { id: "broadcast", i18nKey: "broadcast", correct: false, delta: -4 },
      ],
    },
    {
      id: "contain",
      i18nBase: "contain",
      requiredRoom: "soc_floor",
      timeLimitMs: 25_000,
      options: [
        { id: "block_sender", i18nKey: "block_sender", correct: true,  delta: +6 },
        { id: "delete_only",  i18nKey: "delete_only",  correct: false, delta: -3 },
        { id: "wait",         i18nKey: "wait",         correct: false, delta: -6 },
      ],
    },
    {
      id: "eradicate",
      i18nBase: "eradicate",
      requiredRoom: "forensics",
      timeLimitMs: 25_000,
      options: [
        { id: "hunt_iocs",  i18nKey: "hunt_iocs",  correct: true,  delta: +7 },
        { id: "reset_one",  i18nKey: "reset_one",  correct: false, delta: -2 },
        { id: "reimage_all", i18nKey: "reimage_all", correct: false, delta: -3 },
      ],
    },
    {
      id: "report",
      i18nBase: "report",
      requiredRoom: "ciso_office",
      timeLimitMs: 25_000,
      options: [
        { id: "brief_ciso",   i18nKey: "brief_ciso",   correct: true,  delta: +5 },
        { id: "skip",         i18nKey: "skip",         correct: false, delta: -7 },
        { id: "blame_user",   i18nKey: "blame_user",   correct: false, delta: -5 },
      ],
    },
  ],
};

const RANSOMWARE: Incident = {
  type: "ransomware",
  i18nBase: "ransomware",
  initialDelayMs: 9_000,
  steps: [
    {
      id: "detect",
      i18nBase: "detect",
      requiredRoom: "siem",
      timeLimitMs: 22_000,
      options: [
        { id: "confirm_edr", i18nKey: "confirm_edr", correct: true,  delta: +6 },
        { id: "shutdown_all", i18nKey: "shutdown_all", correct: false, delta: -5 },
        { id: "wait",        i18nKey: "wait",        correct: false, delta: -8 },
      ],
    },
    {
      id: "isolate",
      i18nBase: "isolate",
      requiredRoom: "noc",
      timeLimitMs: 20_000,
      options: [
        { id: "segment_vlan", i18nKey: "segment_vlan", correct: true,  delta: +8 },
        { id: "pull_cables",  i18nKey: "pull_cables",  correct: false, delta: -3 },
        { id: "kill_internet", i18nKey: "kill_internet", correct: false, delta: -4 },
      ],
    },
    {
      id: "recover",
      i18nBase: "recover",
      requiredRoom: "server_room",
      timeLimitMs: 25_000,
      options: [
        { id: "restore_backup", i18nKey: "restore_backup", correct: true,  delta: +8 },
        { id: "pay_ransom",     i18nKey: "pay_ransom",     correct: false, delta: -10 },
        { id: "rebuild_blind",  i18nKey: "rebuild_blind",  correct: false, delta: -4 },
      ],
    },
    {
      id: "escalate",
      i18nBase: "escalate",
      requiredRoom: "war_room",
      timeLimitMs: 22_000,
      options: [
        { id: "convene_ir", i18nKey: "convene_ir", correct: true,  delta: +6 },
        { id: "stay_quiet", i18nKey: "stay_quiet", correct: false, delta: -8 },
        { id: "press_release", i18nKey: "press_release", correct: false, delta: -5 },
      ],
    },
  ],
};

const DDOS: Incident = {
  type: "ddos",
  i18nBase: "ddos",
  initialDelayMs: 8_000,
  steps: [
    {
      id: "detect",
      i18nBase: "detect",
      requiredRoom: "noc",
      timeLimitMs: 18_000,
      options: [
        { id: "verify_traffic", i18nKey: "verify_traffic", correct: true, delta: +5 },
        { id: "reboot_routers", i18nKey: "reboot_routers", correct: false, delta: -5 },
        { id: "ignore",         i18nKey: "ignore",         correct: false, delta: -6 },
      ],
    },
    {
      id: "mitigate",
      i18nBase: "mitigate",
      requiredRoom: "noc",
      timeLimitMs: 20_000,
      options: [
        { id: "scrubbing", i18nKey: "scrubbing", correct: true,  delta: +8 },
        { id: "geoblock",  i18nKey: "geoblock",  correct: false, delta: -2 },
        { id: "shut_site", i18nKey: "shut_site", correct: false, delta: -5 },
      ],
    },
    {
      id: "comms",
      i18nBase: "comms",
      requiredRoom: "war_room",
      timeLimitMs: 22_000,
      options: [
        { id: "status_page", i18nKey: "status_page", correct: true,  delta: +5 },
        { id: "deny",        i18nKey: "deny",        correct: false, delta: -6 },
        { id: "panic_tweet", i18nKey: "panic_tweet", correct: false, delta: -7 },
      ],
    },
  ],
};

const INSIDER: Incident = {
  type: "insider",
  i18nBase: "insider",
  initialDelayMs: 14_000,
  steps: [
    {
      id: "detect",
      i18nBase: "detect",
      requiredRoom: "siem",
      timeLimitMs: 25_000,
      options: [
        { id: "review_dlp",  i18nKey: "review_dlp",  correct: true,  delta: +6 },
        { id: "confront",    i18nKey: "confront",    correct: false, delta: -8 },
        { id: "ignore",      i18nKey: "ignore",      correct: false, delta: -6 },
      ],
    },
    {
      id: "preserve",
      i18nBase: "preserve",
      requiredRoom: "forensics",
      timeLimitMs: 25_000,
      options: [
        { id: "image_endpoint", i18nKey: "image_endpoint", correct: true,  delta: +8 },
        { id: "wipe_evidence",  i18nKey: "wipe_evidence",  correct: false, delta: -10 },
        { id: "factory_reset",  i18nKey: "factory_reset",  correct: false, delta: -8 },
      ],
    },
    {
      id: "hr_legal",
      i18nBase: "hr_legal",
      requiredRoom: "ciso_office",
      timeLimitMs: 25_000,
      options: [
        { id: "loop_hr_legal", i18nKey: "loop_hr_legal", correct: true,  delta: +7 },
        { id: "fire_now",      i18nKey: "fire_now",      correct: false, delta: -6 },
        { id: "shadow",        i18nKey: "shadow",        correct: false, delta: -3 },
      ],
    },
  ],
};

export const INCIDENTS: Record<IncidentType, Incident> = {
  phishing: PHISHING,
  ransomware: RANSOMWARE,
  ddos: DDOS,
  insider: INSIDER,
};

export const INCIDENT_TYPES: IncidentType[] = ["phishing", "ransomware", "ddos", "insider"];
