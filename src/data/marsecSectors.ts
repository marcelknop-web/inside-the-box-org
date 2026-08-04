// MarSec Studio — sector catalogs for the maritime TTX generator.

export type SectorId = "container" | "port" | "cruise";

export interface ProfileField {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
}

export interface SectorDef {
  id: SectorId;
  name: string;
  tagline: string;
  description: string;
  /** Context block handed to the AI. */
  aiContext: string;
  fields: ProfileField[];
  defaults: Record<string, string>;
  topics: string[];
  roles: { compact: string[]; full: string[] };
  defaultObligations: string[];
}

export type Weight = "Side thread" | "Core thread" | "Lead thread";

export const OBLIGATIONS: { id: string; label: string; detail: string; prompt: string }[] = [
  {
    id: "nis2",
    label: "NIS2 (EU)",
    detail: "24 h early warning, 72 h incident notification to the national competent authority.",
    prompt: "NIS2 (EU) Art. 23: early warning to the CSIRT / national competent authority within 24h of becoming aware, incident notification within 72h, final report within 1 month. These 24h/72h clocks are the regulatory deadlines (kind: \"Regulatory deadline\") — never shorten them. Any faster internal ambition (e.g. brief the board within 1h) must be a separate entry labelled kind: \"Internal escalation target\".",
  },
  {
    id: "imo",
    label: "IMO / ISPS, class & flag state",
    detail: "Company, contract and class-specific notification targets (IMO cyber-risk guidance, ISPS Code).",
    prompt: "IMO / ISPS, class and flag state: notify the Company Security Officer, Ship Security Officer, flag state administration and class society and document the protective measures applied under the Ship Security Plan. IMPORTANT: IMO MSC-FAL.1/Circ.3 is guidance on maritime cyber risk management and does NOT set fixed reporting deadlines — label every timing here as a company / contract / class-specific notification target (kind: \"Company / contract / class target\"), never as a regulatory deadline. Note: ISPS security levels are set by the responsible SOLAS contracting state — the company and the Master may only recommend escalation, never set the level themselves.",
  },
  {
    id: "gdpr",
    label: "GDPR Art. 33",
    detail: "72 h notification to the supervisory authority for passenger/crew personal data.",
    prompt: "GDPR Art. 33: notify the supervisory authority within 72h if passenger, guest or crew personal data is affected; assess Art. 34 notification of data subjects.",
  },
  {
    id: "customers",
    label: "Customers / charterers / cargo owners",
    detail: "Contract- and SLA-driven notification of charterers, cargo owners and terminals.",
    prompt: "Customers and charterers: contract- and SLA-driven notification of charterers, cargo owners, freight forwarders and terminal partners; state the SLA clock explicitly.",
  },
  {
    id: "portauthority",
    label: "Port authority",
    detail: "Impact on port operations, vessel calls or terminal operations.",
    prompt: "Port authority / harbour master: notify when port operations, a vessel call or terminal operations are affected; coordinate berth and traffic decisions.",
  },
  {
    id: "insurers",
    label: "Insurers (Cyber / P&I / H&M)",
    detail: "Contractually required, very early incident notification.",
    prompt: "Insurers: very early notification to the cyber insurer, P&I club and Hull & Machinery underwriter as contractually required; preserve evidence for the claim.",
  },
  {
    id: "cert",
    label: "CERT / CSIRT",
    detail: "National CERT or sector-specific maritime CERT.",
    prompt: "National CERT/CSIRT or maritime sector CERT: request support and share indicators of compromise.",
  },
  {
    id: "police",
    label: "Law enforcement",
    detail: "Police, BKA, FBI, Europol — extortion, sabotage or ransomware.",
    prompt: "Law enforcement (police, BKA, FBI, Europol): file a report in cases of extortion, sabotage or ransomware; align on evidence handling before any remediation.",
  },
  {
    id: "otvendors",
    label: "Suppliers / OT vendors",
    detail: "ABB, Kongsberg, Wärtsilä, Siemens, Schneider Electric — compromised OT.",
    prompt: "Suppliers and OT vendors (e.g. ABB, Kongsberg, Wärtsilä, Siemens, Schneider Electric): mandatory involvement for compromised OT or navigation systems, including remote-access lockdown.",
  },
];

const COMMON_ROLES_COMPACT = [
  "Crisis Team Lead",
  "Executive Sponsor (COO / Managing Director)",
  "IT Lead",
  "OT / Engineering Lead",
  "Communications & Media",
  "Scribe / Log Keeper",
];

export const SECTORS: SectorDef[] = [
  {
    id: "container",
    name: "Container Shipping Line",
    tagline: "Fleet, shore-side booking and cargo data under pressure",
    description: "Vessel operations, TOS/booking platforms, charter parties and cargo release exposed across ship and shore.",
    aiContext:
      "The exercising organisation is a container shipping line. Distinguish clearly between shore-side systems (booking, TOS/ERP, EDI with terminals and customs) and shipboard systems (bridge/ECDIS, engine and ballast OT, satcom). Model schedule and charter-party pressure, cargo release integrity, port call windows and the Master's authority at sea.",
    fields: [
      { key: "name", label: "Company name", placeholder: "Northlane Container Lines Ltd. (fictional)" },
      { key: "fleet", label: "Fleet size (vessels)", placeholder: "34" },
      { key: "capacity", label: "Total TEU capacity", placeholder: "180,000 TEU" },
      { key: "lanes", label: "Main trade lanes", placeholder: "Asia–North Europe, Transatlantic" },
      { key: "coreSystems", label: "TOS / booking / ERP provider", placeholder: "fictional vendor, e.g. CargoCore (SaaS)" },
      { key: "otVendors", label: "Onboard OT vendors", placeholder: "bridge, engine and ballast system vendors" },
      { key: "flagStates", label: "Flag states", placeholder: "Liberia, Malta, Portugal (MAR)" },
      { key: "specifics", label: "Specifics", placeholder: "reefer-heavy trade, ongoing TOS migration, joint venture terminal …", wide: true },
    ],
    defaults: {
      name: "Northlane Container Lines Ltd. (fictional)",
      fleet: "34",
      capacity: "180,000 TEU",
      lanes: "Asia–North Europe, Transatlantic",
      coreSystems: "CargoCore TOS/booking (SaaS, fictional)",
      otVendors: "bridge & engine automation (fictional vendor)",
      flagStates: "Liberia, Malta",
      specifics: "",
    },
    topics: [
      "Ransomware on shore-side booking and TOS platform",
      "ECDIS / bridge system manipulation on a vessel underway",
      "GPS and AIS spoofing in a congested traffic separation scheme",
      "Cargo data manipulation and bill-of-lading fraud",
      "OT compromise of engine, ballast water or power management",
      "Satcom / VSAT outage cutting ship–shore connectivity",
      "Container release fraud at a discharge terminal",
      "Third-party breach at a 3PL, port agent or EDI provider",
      "Insider at fleet operations centre",
      "Extortion with leaked customer and manifest data",
    ],
    roles: {
      compact: COMMON_ROLES_COMPACT,
      full: [
        "Crisis Team Lead",
        "Executive Sponsor (COO)",
        "Fleet Operations Manager",
        "Master / Bridge (via satcom)",
        "IT Lead (shore-side)",
        "OT / Marine Engineering Lead",
        "DPO / Legal & Charter Party",
        "Communications & Customer Notification",
      ],
    },
    defaultObligations: ["nis2", "imo", "customers", "insurers"],
  },
  {
    id: "port",
    name: "Port & Terminal Operator",
    tagline: "Gate, yard and quay crane operations at a standstill",
    description: "Terminal operating system, crane and gate OT, customs interfaces and hinterland connections under attack.",
    aiContext:
      "The exercising organisation is a port and terminal operator. Model the operational chain gate → yard → quay crane → vessel, the dependency on the terminal operating system and PCS/customs interfaces, PLC-driven crane and gate OT, ISPS security levels and the pressure of berthing windows, truck queues and hinterland rail slots.",
    fields: [
      { key: "name", label: "Operator name", placeholder: "Nordkai Terminal Holding (fictional)" },
      { key: "throughput", label: "Annual throughput", placeholder: "3.4 m TEU / 18 m tonnes" },
      { key: "berths", label: "Berths / quay cranes", placeholder: "6 berths, 18 STS cranes" },
      { key: "coreSystems", label: "TOS vendor", placeholder: "fictional TOS vendor" },
      { key: "interfaces", label: "PCS / customs interfaces", placeholder: "port community system, customs, rail operator" },
      { key: "ispsLevel", label: "Current ISPS security level", placeholder: "Level 1" },
      { key: "otVendors", label: "Crane / gate OT vendors", placeholder: "crane PLC and gate OCR vendors" },
      { key: "specifics", label: "Specifics", placeholder: "automated yard blocks, 24/7 operation, single-rail connection …", wide: true },
    ],
    defaults: {
      name: "Nordkai Terminal Holding (fictional)",
      throughput: "3.4 m TEU",
      berths: "6 berths, 18 STS cranes",
      coreSystems: "TerminalOne TOS (fictional)",
      interfaces: "port community system, customs, rail operator",
      ispsLevel: "Level 1",
      otVendors: "crane PLC and gate OCR vendors (fictional)",
      specifics: "",
    },
    topics: [
      "TOS ransomware halting gate and yard operations",
      "Quay crane / PLC (OT) compromise on the quay",
      "Gate access control and ISPS security breach",
      "Customs and port community system interface outage",
      "VTS / AIS disruption affecting vessel traffic",
      "Insider at the terminal manipulating yard moves",
      "Hinterland rail and trucking system outage",
      "Combined physical and cyber event (power, fire, intrusion)",
      "Reefer monitoring and cold-chain data loss",
      "Extortion with terminal and customer operational data",
    ],
    roles: {
      compact: COMMON_ROLES_COMPACT,
      full: [
        "Crisis Team Lead",
        "Executive Sponsor (Managing Director)",
        "Terminal Operations Manager",
        "IT Lead",
        "OT / Crane & Automation Lead",
        "Port Facility Security Officer (PFSO)",
        "DPO / Legal & Authority Liaison",
        "Communications & Customer Notification",
      ],
    },
    defaultObligations: ["nis2", "portauthority", "customers", "otvendors"],
  },
  {
    id: "cruise",
    name: "Cruise Line",
    tagline: "Guests aboard, systems down, cameras rolling",
    description: "Guest data, shipboard networks, itinerary and turnaround operations with thousands of people on board.",
    aiContext:
      "The exercising organisation is a cruise line. Model the presence of thousands of guests and crew on board, guest-facing systems (PMS, booking, app, Wi-Fi, onboard payment), shipboard safety and hotel OT (power, HVAC, watertight doors), medical records, itinerary and port turnaround constraints, and intense media and social-media exposure.",
    fields: [
      { key: "name", label: "Line name", placeholder: "Aurora Ocean Cruises (fictional)" },
      { key: "fleet", label: "Fleet size (vessels)", placeholder: "7" },
      { key: "capacity", label: "Passenger capacity (per vessel)", placeholder: "3,200 guests, 1,100 crew" },
      { key: "itineraries", label: "Itineraries / regions", placeholder: "Mediterranean, Northern Europe, Caribbean" },
      { key: "coreSystems", label: "PMS / booking provider", placeholder: "fictional guest management platform" },
      { key: "otVendors", label: "Bridge / ECDIS and hotel OT vendors", placeholder: "navigation and building automation vendors" },
      { key: "flagStates", label: "Flag states", placeholder: "Malta, Bahamas" },
      { key: "specifics", label: "Specifics", placeholder: "new-build entering service, high share of US guests, medical centre …", wide: true },
    ],
    defaults: {
      name: "Aurora Ocean Cruises (fictional)",
      fleet: "7",
      capacity: "3,200 guests, 1,100 crew",
      itineraries: "Mediterranean, Northern Europe",
      coreSystems: "GuestOne PMS & booking (fictional)",
      otVendors: "navigation and hotel automation (fictional vendors)",
      flagStates: "Malta, Bahamas",
      specifics: "",
    },
    topics: [
      "PMS / guest data breach (passport and payment data)",
      "Ransomware on the shipboard network mid-voyage",
      "Navigation and ECDIS integrity loss approaching a port",
      "Power, HVAC or watertight-door OT event",
      "Guest app and onboard Wi-Fi compromise",
      "Medical record breach at the onboard medical centre",
      "Port turnaround and embarkation system failure",
      "Media and social-media escalation from guests on board",
      "Crew credential theft and account takeover",
      "Extortion with guest data and cabin footage claims",
    ],
    roles: {
      compact: COMMON_ROLES_COMPACT,
      full: [
        "Crisis Team Lead",
        "Executive Sponsor (President / COO)",
        "Fleet / Marine Operations",
        "Master & Staff Captain (via satcom)",
        "IT Lead (shore & ship)",
        "Hotel & Guest Services Lead",
        "DPO / Legal & Guest Claims",
        "Communications, Media & Guest Relations",
      ],
    },
    defaultObligations: ["gdpr", "portauthority", "imo", "police"],
  },
];

export const getSector = (id: SectorId) => SECTORS.find((s) => s.id === id)!;
