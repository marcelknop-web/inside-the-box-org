## MarSec Studio — Maritime TTX Generator

An English-language copy of ERNSTLFALL, adapted to the maritime sector (container shipping, port operators, cruise), with a DRYNET-inspired visual layout.

### Route & access
- New route `/marsec` (title "MarSec Studio"), behind the same password gate pattern, not listed in the AI Lab grid — direct link only.
- ERNSTLFALL stays untouched.

### Wizard flow (5 steps, English UI)
1. **Sector** — pick one: Container Shipping Line / Port & Terminal Operator / Cruise Line. The selection drives the topic catalog, the profile fields, the role set and the reporting obligations.
2. **Organisation profile** — sector-specific fields:
   - Container line: fleet size, TEU capacity, trade lanes, TOS/ERP provider, onboard OT vendors, flag states.
   - Port/terminal: annual throughput (TEU/tonnes), berths/cranes, TOS vendor, PCS/customs interfaces, ISPS security level.
   - Cruise: fleet size, passenger capacity, itineraries/regions, PMS/booking provider, bridge/ECDIS vendors.
   - Optional Excel upload retained (parsed locally in browser).
3. **Scenario topics** — sector-specific catalogs, each weighted as Side thread / Core thread / Lead thread (max 4 recommended). Examples:
   - Container line: ransomware on shore-side booking/TOS, ECDIS/bridge system manipulation, GPS/AIS spoofing, cargo-data manipulation (BL fraud), OT compromise on engine/ballast systems, satcom outage, container-release fraud, third-party 3PL/agent breach.
   - Port/terminal: TOS ransomware halting gate & yard, crane/PLC (OT) compromise, gate/access-control and ISPS breach, customs/PCS interface outage, VTS/AIS disruption, insider at terminal, hinterland rail/truck system outage, physical + cyber combined event.
   - Cruise: PMS/guest-data breach (passport, payment), ransomware on shipboard network mid-voyage, navigation/ECDIS integrity loss, HVAC/power OT event, guest-facing app & Wi-Fi compromise, medical-record breach, port-turnaround system failure, media/social-media escalation.
4. **Exercise parameters** — duration (2 h / 8 injects, 3 h / 11, 4 h / 14), role scope (compact 6 / full 8, maritime roles: Master/Bridge, Fleet Ops/Terminal Ops, CISO, IT/OT lead, DPO/Legal, Comms/PR, HSSE/Security Officer (CSO/PFSO), Scribe), difficulty (Beginner / Intermediate / Expert), and a reporting-obligations block (see below).
5. **Generation & export** — same terminal-style progress log; ZIP with five DOCX files (Trainer Guide, Inject Cards, Role Cards, Participant Worksheet, Trainer Script), all English.

### Reporting obligations (replaces the DORA toggle)
Multi-select checkboxes, each fed into the AI prompt with concrete deadlines computed from the classification timestamp:
- NIS2 (EU): 24 h early warning / 72 h notification to the national authority
- IMO MSC-FAL.1/Circ.3, ISPS Code, class society and flag state
- GDPR Art. 33 (72 h) for passenger/crew personal data
- Customers / charterers / cargo owners / terminals (contract & SLA-driven notification)
- Port authority (impact on port operations, call or terminal)
- Insurers (Cyber / P&I / Hull & Machinery) — very early notification
- National or maritime CERT/CSIRT
- Law enforcement (police, BKA, FBI, Europol) for extortion, sabotage or ransomware
- Suppliers / OT vendors (ABB, Kongsberg, Wärtsilä, Siemens, Schneider Electric) for compromised OT
Defaults preselected per sector (e.g. cruise → GDPR + port authority; port → port authority + NIS2).

### Backend
New edge function `marsec-generate`, modelled on `ernstfall-generate`:
- English system prompt with the same strict rules (causal chain, ground truth, no invented facts, channel diversity, anti-repetition) rewritten for maritime context: shipboard vs shore-side split, IT/OT separation, class/flag/port-state actors, charter parties, voyage schedule pressure.
- Sector-specific context block injected per selection.
- Reporting-obligation deadlines computed from `classificationTime`.
- Same rate limiting, AI usage logging, JSON-parse retry, Gemini Flash model.

### Layout (DRYNET-inspired)
- Full-bleed maritime hero: dark sea/sky photograph with a subtle network-node overlay, oversized geometric sans headline ("MarSec Studio" / tagline), light text on the image.
- Palette: deep navy/slate neutrals with a single crimson accent (`#D6003C`-family) for primary buttons, active stepper state and highlights; generous whitespace; wide rounded cards; thin borders.
- Sticky slim top bar with wordmark, back link and a crimson primary action button.
- Stepper as a horizontal pill row in the accent colour; step cards on white over a light neutral background; sector cards with maritime iconography.
- Word exports use a matching navy/crimson accent scheme.
- Fully responsive, mobile-checked.

### Technical notes
- New files: `src/pages/MarSec.tsx`, sector data module (`src/data/marsecSectors.ts`) for topic catalogs, profile field definitions, roles and default reporting obligations, `supabase/functions/marsec-generate/index.ts`.
- Route added in `src/App.tsx` with password gate; not added to the AI Lab grid or sitemap.
- DOCX/ZIP builder logic reused from `Ernstfall.tsx`, translated and re-styled; drafts autosaved under a separate localStorage key.
- Hero image generated as a project asset (no external hotlinking).
