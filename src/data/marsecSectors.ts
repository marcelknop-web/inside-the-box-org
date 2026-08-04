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
    detail: "24 h early warning, 72 h notification, final report after 1 month.",
    prompt: "NIS2 (EU) Art. 23: early warning to the CSIRT / national competent authority within 24h of becoming aware, incident notification within 72h, final report within 1 month. These 24h/72h/1-month clocks are the regulatory deadlines (kind: \"Regulatory deadline\") — never shorten them. Any faster internal ambition (e.g. brief the board within 1h) must be a separate entry labelled kind: \"Internal escalation target\".",
  },
  {
    id: "imo",
    label: "IMO cyber-risk guidance (SMS)",
    detail: "Company/SMS-driven handling under MSC-FAL.1/Circ.3 and Res. MSC.428(98) — guidance, no fixed clock.",
    prompt: "IMO cyber risk management: handle the incident through the Safety Management System (SMS) as required by Res. MSC.428(98), applying MSC-FAL.1/Circ.3 guidance. IMPORTANT: this guidance sets NO fixed reporting deadline — every timing here is a company / SMS notification target (kind: \"Company / contract / class target\"), never a regulatory deadline. Note: ISPS security levels are set by the responsible SOLAS contracting state — the company and the Master may only recommend escalation, never set the level themselves.",
  },
  {
    id: "flagstate",
    label: "Flag state & class society",
    detail: "Security incident report to the flag administration; class notification when class-relevant systems are affected.",
    prompt: "Flag state administration and recognised organisation / class society: report the security incident to the flag state via the Company Security Officer (SOLAS XI-2 / ISPS Code obligation, wording \"without delay\" — statutory duty but no numeric hour clock, kind: \"Regulatory deadline\"), and notify class when navigation, propulsion, steering, power management or other class-relevant systems are affected or operated in degraded mode (kind: \"Company / contract / class target\").",
  },
  {
    id: "portstate",
    label: "Port state / coast guard (e.g. USCG MTSA)",
    detail: "Breach of security / transportation security incident report — USCG NRC under 33 CFR 101.305, MARSEC level changes.",
    prompt: "Port state authority and coast guard: for calls in US waters, report suspicious activity, breaches of security and transportation security incidents to the US Coast Guard via the National Response Center without delay (33 CFR 101.305, MTSA) and act on MARSEC level changes; for EU calls, notify the coastal state authority / VTS and the port state control body when navigation, safety or security of the vessel is affected. Statutory duty phrased as \"without delay\" — no numeric hour clock (kind: \"Regulatory deadline\").",
  },
  {
    id: "designatedauthority",
    label: "ISPS designated authority (port facility)",
    detail: "PFSO reporting of a breach of security at the port facility (ISPS Code, EU Reg. 725/2004).",
    prompt: "Designated authority for maritime security: the Port Facility Security Officer reports a breach of security or security incident at the port facility to the national designated authority and updates the Port Facility Security Plan measures (ISPS Code Part A, EU Reg. 725/2004). Statutory duty without a numeric hour clock (kind: \"Regulatory deadline\").",
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
    label: "Port authority / harbour master",
    detail: "Impact on port operations, vessel calls or terminal operations.",
    prompt: "Port authority / harbour master and VTS: notify when port operations, a vessel call or terminal operations are affected; coordinate berth, traffic and tug decisions.",
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
    prompt: "National CERT/CSIRT or maritime sector CERT: request support and share indicators of compromise. Voluntary support request unless it is the same body as the NIS2 competent authority.",
  },
  {
    id: "police",
    label: "Law enforcement",
    detail: "Police and national/international agencies — extortion, sabotage or ransomware.",
    prompt: "Law enforcement (national police, federal criminal police, Europol / Interpol contact points): file a report in cases of extortion, sabotage or ransomware; align on evidence handling before any remediation. Not a statutory reporting clock (kind: \"Legal / operational escalation target\").",
  },
  {
    id: "otvendors",
    label: "Suppliers / OT vendors",
    detail: "Bridge, engine, crane and automation vendors — compromised OT.",
    prompt: "Suppliers and OT vendors (bridge/navigation, engine automation, power management, crane and gate PLC vendors): mandatory involvement for compromised OT or navigation systems, including remote-access lockdown and vendor forensics support.",
  },
  {
    id: "markets",
    label: "Capital markets / investors",
    detail: "Ad-hoc disclosure (EU MAR Art. 17) or SEC Form 8-K Item 1.05 for listed groups.",
    prompt: "Capital markets: if the exercising group is listed, assess inside-information disclosure under EU MAR Art. 17 (without delay) or SEC Form 8-K Item 1.05 (within four business days of the materiality determination). Only include this if the organisation profile makes a listing plausible (kind: \"Regulatory deadline\").",
  },
  {
    id: "crew",
    label: "Crew, unions & seafarer welfare",
    detail: "Crew notification, works council / ITF involvement when crew data or safety is affected.",
    prompt: "Crew and employee representation: inform affected crew and shore staff, involve the works council or seafarer union representation (e.g. ITF) when crew personal data, payroll or on-board safety is affected. Internal obligation, no statutory clock (kind: \"Internal escalation target\").",
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
    defaultObligations: ["nis2", "flagstate", "imo", "customers", "insurers"],
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
    defaultObligations: ["nis2", "designatedauthority", "portauthority", "customers", "otvendors"],
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
    defaultObligations: ["nis2", "gdpr", "flagstate", "portauthority", "police"],
  },
];

export const getSector = (id: SectorId) => SECTORS.find((s) => s.id === id)!;
