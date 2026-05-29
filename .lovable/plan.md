## Goal

Replace the current compliance report (online results + PDF) for both IACS tools (UR E27 and UR E26) with the "Applicability Review" structure from the uploaded reference document. Verdicts switch to **Not applicable / Partially applicable / Applicable**, and the AI generates the narrative per finding.

## Approach (robust, low-risk)

Keep the internal scoring engine intact (status `pass|partial|fail` stays under the hood, so QA, charts, risk math keep working) and add a thin **verdict mapping layer** plus AI-generated narrative. Mapping:

```text
pass    -> Not applicable        (green)
partial -> Partially applicable  (amber)
fail    -> Applicable            (red)
```

This makes the visible model fully applicability-based while avoiding a destabilising rewrite of the validated QA/fix engine.

## Report structure (online + PDF), mirrored from the reference

1. Cover / title block (client, product, subject, date, CONFIDENTIAL)
2. Executive Summary — core finding paragraph + verdict overview counts (Critical / Not applicable / Partially applicable)
3. Key residual scope items + Recommendation
4. Introduction & Scope
5. Device characteristics table (from intake)
6. Key Assessment Principles
7. Individual Findings — per finding: Category, E27/E26 reference, Original Risk Rating, Verdict, Generalised Finding, Client Response, Residual Scope Note
8. Complete Control Assessment Matrix (all controls: ID, SR ref, topic, verdict, rationale)
9. Conclusion

## Work items

1. **Data model** (`src/data/iec62443Data.ts`)
   - Add optional fields to `IecThreat`: `verdict?`, `generalisedFinding?`, `clientResponse?`, `residualScopeNote?`.
   - Add `ReviewSummary` type (`coreFinding`, `recommendation`, `residualScopeItems[]`).
   - Add helpers: `verdictFromStatus(status)`, `VERDICT_LABELS` (de/en/fr), `originalRatingLabel(threat)`.

2. **AI edge function** (`supabase/functions/iec-document-assessment/index.ts`)
   - Accept `threats` in addition to `reqs`.
   - Extend tool schema to return: per-finding `{ verdict, generalisedFinding, clientResponse, residualScopeNote }`, per-control verdict+rationale, and a `summary` object.
   - Keep Data Integrity Policy (no invented evidence).

3. **Assessment lib** (`src/lib/iecDocumentAssessment.ts`)
   - Extend result types; merge review fields onto threats and summary into state.

4. **Online results** (`Iec62443ComplianceTool.tsx` + `Iec62443Ur26ComplianceTool.tsx`)
   - Rebuild `ReportView` to the 9-section structure; `StatusBadge` and the mapping panel relabelled to applicability terms.

5. **PDF** (`iec62443ReportPdf.ts` + `iec62443Ur26ReportPdf.ts`)
   - Reorder/relabel sections to match; render per-finding narrative and the control matrix.

6. **Charts / QA** (`Iec62443AuditCharts.tsx`, `Iec62443Ur26AuditCharts.tsx`, both `*QualityCheck.ts`)
   - Relabel donut to applicability terms; relax score-forcing QA rules (A3-1/A3-1b/B1/B2/E1) so a high-original-rating finding can legitimately be "Not applicable"; add completeness checks for the new narrative fields.

## Notes / decisions to confirm during build
- "Original Risk Rating" per finding is derived from the linked threat's likelihood × impact (e.g. "Critical (Score 20)").
- Key Assessment Principles section uses standard boilerplate text (trilingual), not AI-generated, to keep it stable.

After implementation: build check + render a test PDF and visually QA every page before delivering.