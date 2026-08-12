# IACS UR E27 Tool — Upgrade from Quick Check to Readiness Assessment

Goal: work the review comments into `/iacs-ur27` so the intake follows the E27 logic (scope → system → architecture → access → capabilities → evidence), feeds a requirement-level matrix, and keeps E27 (system/equipment) cleanly separated from E26 (ship level).

## 1. New Phase 0: Applicability & Scope (new first screen)

Placed before everything else:

- Vessel type (passenger ship, cargo ≥500 GT, high speed craft ≥500 GT, MODU ≥500 GT, self-propelled offshore unit, other)
- Gross tonnage, international voyage yes/no
- Newbuild vs. existing vessel, contract-for-construction date
- Flag state, classification society
- Is E26 also applicable? yes/no

Result: the tool computes and displays an applicability verdict — **Mandatory / Non-mandatory / Voluntary** — instead of only a compliance percentage. The verdict is carried into the summary and the report header.

## 2. Reframe the Security Level screen

- Rename to "Security Context / Threat Capability", SL-T becomes **optional**.
- Add the note: the selected SL-T is assessment context only; E27 requirements are assessed independently against the mandatory E27 security capabilities.
- Add an E27 requirement profile selector: Standard E27 · E27 + untrusted network requirements · E27 + compensating measures.

## 3. CBS Asset & Software Inventory (new block)

Two-tier so a quick check stays quick:

- **Quick tier**: component counts per class (PLC, HMI, server, workstation, network device, firewall, engineering station, sensor/controller, other).
- **Detailed tier** (optional, expandable rows): asset, manufacturer, model/type, function, OS/firmware, version, patch level, physical interfaces, protocols. Plus a software inventory line per asset.

## 4. Architecture, Data Flows & Untrusted Networks

Extends the existing zones and protocols screens:

- Connectivity model: standalone · single network · multiple security zones · connected to other CBS · shore connection · internet · remote maintenance · wireless · satellite · removable media
- Security boundaries and redundancy present yes/no, topology diagram availability (physical / logical / none)
- Key data flows (free-text rows: source zone → target zone, protocol, direction)
- **Untrusted network question**: does the CBS communicate through or provide access via an untrusted network? If yes, the extra E27 untrusted-network requirements (UTN set, E27 #31–41) are automatically switched on in the requirement matrix and shown as in-scope.

## 5. Remote Access (new block)

Type (none, vendor, shore-based, remote maintenance, VPN, jump server, remote desktop, cloud, other) plus controls: MFA, explicit approval, session logging, session timeout, remote session termination, who authorises.

## 6. Granular E27 controls, Maintenance, Recovery, Supplier

The existing 15 measure rows stay as the dashboard layer; underneath, sub-controls are added and mapped to E27 requirement IDs:

- Identity & access: individual accounts, privileged accounts, RBAC, least privilege, segregation of duties, password policy, default credentials changed, account lifecycle
- Device/physical: removable media control, portable devices, physical interfaces, engineering laptops, service ports
- Malware: antimalware capability, application allowlisting, unauthorised software detection, update mechanism
- Logging: security/access/OS/config-change/backup/comms-loss events, retention, time synchronisation, read-only log access
- Network: firewall, segmentation, allowed communication, ports/protocols, security configuration, least functionality, DoS protection
- Recovery: backup exists, scope (config/system state), offline copy, frequency, restore tested, known secure state, recovery procedure, recovery time
- Maintenance: vendor maintenance, remote/onsite, patch process, security and firmware update mechanism, vulnerability notification, obsolete components, patch level known, emergency patching
- Supply chain: manufacturer, supplier, integrator, shipyard, subcontractors, third-party components, type approval, E27 certificate, IEC 62443 certification, security documentation

## 7. Evidence & Assurance layer

Every relevant control gets an evidence state — no evidence · claimed · available · independently verified — plus an evidence type (system documentation, network diagram, configuration, vendor documentation, certificate, test report, procedure, manual, audit report, screenshot, other). Existing "documented/audited/certified" flags are folded into this scale.

## 8. Requirement matrix instead of direct report

After the intake, the engine builds one row per E27 requirement:

```text
E27 Requirement → Applicability → Implementation → Evidence → Gap → Risk → Recommendation
```

The AI document assessment keeps its current role (it complements the self-declarations); the new intake fields are passed to it as context so verdicts are grounded in the declared architecture, remote access and evidence states. Findings without any declared basis or evidence are reported as gaps, never invented.

## 9. E27 vs. E26 separation

Ship-level items (on-board zone architecture, integration) are labelled as E26 context inside the E27 tool and excluded from the E27 conformance score; E27 scoring uses only system/equipment-level requirements. The report states this split explicitly.

## Technical notes

- `src/data/iec62443Data.ts`: extend `IecIntakeData` (applicability, requirementProfile, assetInventory, architecture, untrustedNetwork, remoteAccess, maintenance, supplyChain, evidence map), keep fields optional so existing local/cloud drafts still load; add applicability rules and the E26-vs-E27 flag on requirements.
- `src/pages/Iec62443ComplianceTool.tsx`: intake wizard grows from 6 to 9 phases (Scope · CBS · Inventory · Architecture · Access · Roles/Supplier · Capabilities · Evidence/Docs · Summary), with the untrusted-network rule gating the UTN requirement set.
- `supabase/functions/iec-document-assessment/index.ts`: context block extended with the new intake sections (bounded lengths, same trust model).
- `src/utils/iec62443ReportPdf.ts` and `iec62443QualityCheck.ts`: applicability verdict in the header, requirement matrix columns, QA checks for scope completeness and evidence-free "pass" verdicts.
- Language stays English for this tool; design tokens and existing layout patterns unchanged.
