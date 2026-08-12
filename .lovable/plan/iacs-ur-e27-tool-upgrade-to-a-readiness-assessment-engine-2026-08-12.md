# IACS UR E27 Tool — Upgrade to a Readiness Assessment Engine

Goal: rebuild `/iacs-ur27` around the real E27 Rev.1 (Sep 2023) logic — 30 core capabilities plus 11 conditional untrusted-network capabilities, CBS-level applicability, E22 system category, evidence grading and the E27 documentation package — while keeping a fast path for a quick check.

## Data depth: three levels, not nine mandatory pages

- **Level 1 — Quick Intake (5–10 min)**: vessel, CBS, E22 category, connectivity, untrusted network, remote access, security posture. Sufficient for a readiness snapshot.
- **Level 2 — Detailed Assessment**: the 30 (or 41) capabilities requirement by requirement.
- **Level 3 — Evidence & Documentation**: only when the user wants a full readiness report for Class.

Levels 2 and 3 are opt-in continuations, not gates on Level 1.

## Phase structure

```text
0  Applicability & Scope       vessel -> contract date -> E27 applicability
1  CBS Identification          system -> function -> E22 category -> supplier
2  Asset & Software Inventory  components -> firmware -> software -> versions
3  Architecture & Interfaces   zones -> topology -> conduits -> protocols -> data flows
4  Access & Connectivity       users -> privileges -> remote access -> untrusted networks
5  Roles & Supply Chain        supplier -> integrator -> shipyard -> owner -> class
6  E27 Security Capabilities   30 core + conditional 11
7  Evidence & Documentation    evidence grading + E27 documentation package
8  Assessment & Report         requirement matrix -> gaps -> risk -> recommendations -> readiness
```

## 1. Applicability on two levels

- **Vessel level**: vessel type (passenger, cargo ≥500 GT, high speed craft ≥500 GT, MODU ≥500 GT, self-propelled offshore unit, other), gross tonnage, international voyage, newbuild vs. existing, contract-for-construction date (Rev.1 applies from 1 July 2024), flag, classification society, E26 applicable yes/no. Verdict: Mandatory / Non-mandatory / Voluntary.
- **CBS level**: for the assessed CBS — in scope / out of scope / pending determination, driven by E26 CBS scope and the compliance-demonstration path. The report states both, e.g. "Vessel-level: Mandatory · CBS Propulsion Control: In scope · Untrusted network: Yes · Applicable capabilities: 41".

## 2. E22 System Category (new, mandatory field on the CBS screen)

- CBS Category I / II / III / Not determined
- Basis for categorisation: E22 · Class-approved documentation · Supplier declaration · Assessment pending

"Not determined" never passes as compliant — it is reported as an open scope item.

## 3. Requirement model: 30 core + 11 conditional

The catalogue is modelled as 30 core E27 security capabilities plus 11 conditional untrusted-network capabilities (items 31–41: MFA, access via untrusted networks, explicit access approval, remote session termination, integrity and session controls). The 11 become applicable automatically when the CBS communicates through or grants access via an untrusted network — not as a generic optional profile.

Assessment profile selector: **E27 Core** · **E27 Core + Untrusted Network**. There is no "E27 + compensating measures" profile.

## 4. Compensating measures as gap treatment

Handled per requirement after the verdict, never as a compliance baseline:

```text
Requirement -> Not met -> Compensating measure -> Residual risk -> Class acceptance status
```

Compensating measure states: None · Proposed · Implemented · Accepted by Class · Not accepted / pending.

## 5. Status model (replaces pass/partial/fail)

Not assessed · Not applicable · Implemented · Partially implemented · Not implemented · Claimed / unverified · Verified · Compensating measure · Pending Class approval.

Evidence is graded separately: no evidence · claimed · available · independently verified — and "available" never implies compliant. The engine combines implementation × evidence, e.g. implemented + no evidence = "Claimed / unverified"; not implemented + evidence = "Gap"; implemented + independently verified = "Verified".

## 6. Security Level reframed

SL-T becomes optional context, renamed "Security Context / Threat Capability", with the note that E27 requirements are assessed independently against the mandatory E27 capabilities.

## 7. Asset & Software Inventory

- **Quick tier**: component counts per class (PLC, HMI, server, workstation, network device, firewall, engineering station, sensor/controller, other).
- **Detailed tier** (optional rows): unique asset identifier, asset, manufacturer, model/type, function, OS/firmware, version, patch level, physical interfaces, protocols, plus CBS category, criticality / safety relevance, network zone, security boundary, supplier, system integrator, type approval status and E27 type approval certificate. Software inventory per asset.

Type approval status matters because the required documents and the compliance-demonstration path differ for type-approved and non-type-approved CBS.

## 8. Architecture, data flows, untrusted networks, remote access

- Connectivity model: standalone · single network · multiple security zones · connected to other CBS · shore connection · internet · remote maintenance · wireless · satellite · removable media
- Security boundaries and redundancy, topology diagram availability (physical / logical / none), key data flows (source zone → target zone, protocol, direction)
- Untrusted network question drives the conditional 11 capabilities
- Remote access: type (none, vendor, shore-based, remote maintenance, VPN, jump server, remote desktop, cloud, other) plus MFA, explicit approval, session logging, session timeout, remote session termination, authorising role

## 9. Granular controls, maintenance, recovery, supply chain

The existing 15 measure rows stay as the dashboard layer; sub-controls are added underneath and mapped to E27 capability IDs: identity & access (individual/privileged accounts, RBAC, least privilege, segregation of duties, password policy, default credentials, account lifecycle), device/physical (removable media, portable devices, physical interfaces, engineering laptops, service ports), malware (antimalware, allowlisting, unauthorised software, update mechanism), logging (auditable events, retention, time synchronisation, read-only access), network (firewall, segmentation, allowed communication, ports/protocols, security configuration, least functionality, DoS protection), recovery (backup scope, offline copy, frequency, restore tested, known secure state, procedure, recovery time), maintenance (vendor maintenance, patch and firmware update mechanisms, vulnerability notification, obsolete components, emergency patching), supply chain (manufacturer, supplier, integrator, shipyard, subcontractors, third-party components, type approval, E27 certificate, IEC 62443 certification, security documentation).

## 10. E27 Documentation & Certification package (new section)

Tracked with Available / Missing / N/A / Pending each:

CBS asset inventory · topology diagram · security capability description · security capability test procedure · security configuration guidelines · secure development lifecycle documentation · maintenance plan · verification plan · incident response / recovery information · management of change plan · test reports · type approval certificate · previous Class approval · system certificate.

Required set adapts to type-approved vs. non-type-approved CBS. Output includes a plain statement such as "4 documents required for E27 approval are missing".

## 11. Readiness instead of Compliance %

Primary KPI becomes **E27 Readiness**, e.g. "76 % — 24/30 core capabilities implemented · 5 require evidence validation · 1 gap", and "32/41 applicable capabilities" when untrusted-network requirements apply. The report states explicitly that readiness is not Class certification: E27 compliance demonstration is a Class approval process including plan approval and, depending on type approval status, survey/FAT. Self-assessed, evidence-verified and Class-approved states are visually distinct.

## 12. E27 vs. E26 labelling

Every intake block is tagged in the UI as **E27 System / Equipment Level** or **E26 Ship / Integration Context** (e.g. bridge/navigation zone and zone & conduit architecture = E26 context; the navigation CBS and its interfaces = E27 scope). E26-context data informs the analysis but is excluded from the E27 readiness score, and the report says so.

## Technical notes

- `src/data/iec62443Data.ts`: extend `IecIntakeData` (vesselApplicability, cbsApplicability, cbsCategory + basis, assessmentProfile, assetInventory, architecture, dataFlows, untrustedNetwork, remoteAccess, maintenance, supplyChain, evidence map, documentationPackage); new status and evidence enums; mark each requirement as core (1–30) or conditional untrusted-network (31–41) and as E27 vs. E26 level. All new fields optional so existing local/cloud drafts keep loading.
- `src/pages/Iec62443ComplianceTool.tsx`: wizard restructured into the nine phases with Level 1 / 2 / 3 progression, untrusted-network rule activating the conditional capabilities, and level labels on each block.
- `supabase/functions/iec-document-assessment/index.ts`: context block extended with the new intake sections (bounded lengths); status vocabulary widened; the model must not invent evidence — missing evidence maps to "claimed / unverified".
- `src/utils/iec62443ReportPdf.ts`, `iec62443Ur26*` untouched; `iec62443QualityCheck.ts` gains checks for undetermined CBS category, evidence-free "implemented" claims, missing documentation items and readiness-vs-certification wording.
- Tool stays English; existing design tokens and layout patterns unchanged.
