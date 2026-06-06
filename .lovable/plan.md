ive## Universal Assessment Platform — Refactoring Plan

### What already exists (analysis)

The platform is mature and consistent. Each standard currently ships its own parallel set of files:

```text
src/data/<std>Data.ts(+I18n)      data model + controls
src/utils/<std>ReportPdf.ts       ~1300-line consulting PDF generator
src/utils/<std>QualityCheck.ts    QA validation
src/utils/<std>AuditFixes.ts      deterministic fixes
src/utils/pdfCore.ts              SHARED PDF primitives (fonts, layout, humanize…)
supabase/functions/<std>-reasoning  per-standard AI function
src/pages/<Std>ComplianceTool.tsx  per-standard page
```

Standards with full tools: NIS2, DORA, AI Act, IEC 62443, IEC UR E26, CRA, TISAX, PCI-DSS.

A first **Meta-Tool** already exists and is config-driven, but thin:
- `src/data/metaAssessment/{types,nis2Profile,index}.ts` — `StandardProfile` plug-in model (intake + requirements).
- `src/pages/MetaAssessmentTool.tsx` — state machine Standard → Intake → Analyzing → Report (JSON export only).
- `supabase/functions/meta-assessment-reasoning/index.ts` — generic, profile-driven AI with a strict data-integrity policy.

The Meta-Tool is the correct foundation. It lacks: scoring engine, maturity, evidence model, risk engine, recommendation engine, quality engine, dashboard, and consulting-grade PDF. The mature single-tool code is the "best-of" source to generalize.

### Goal & guardrails

Transform the Meta-Tool into the Universal Assessment Platform so a **new standard = one profile file (+ prompt entry, optional demo)**, with all engines standard-agnostic.

- Build **in parallel**. Do not modify or break the 8 existing single tools or their routes. They keep working unchanged.
- Reuse `pdfCore.ts` as-is; do not fork it.
- Keep the AI strictly explanatory; all scoring/compliance/risk math stays deterministic in TypeScript.
- Client-side PDF, no uploads, no persistence, existing rate limiting on the edge function.

### Architecture (plug-in model)

```text
src/data/metaAssessment/
  types.ts            ← extend schema (below)
  engine/
    scoring.ts        Universal scoring (pass/partial/fail + weighting, readiness)
    maturity.ts       Optional 0–5 maturity model, configurable per profile
    risk.ts           Risk = Likelihood × Impact (1–5), rating, heatmap buckets
    recommendations.ts Priority/effort/impact/duration/owner, roadmap grouping
    quality.ts        Universal QA rules (blocking vs warning)
    evidence.ts       Evidence types + strength (display only, never scored)
  profiles/<std>.ts   per-standard config (categories, controls, mappings, prompt id, maturity on/off)
  index.ts            registry

src/components/metaAssessment/   Dashboard, QualityPanel, rendering (presentation only)
src/utils/universalReportPdf.ts  ONE consulting PDF generator (uses pdfCore), reads the result model
supabase/functions/universal-reasoning/index.ts  consolidated, PROMPT_LIBRARY by standard
```

### Data model (extend `types.ts`)

Add the common entities the prompt requires, keeping existing ones backward-compatible: `Category`, `Control` (with `categoryId`, `weight`, optional `mandatory`, `maturityEnabled`), `Finding`, `Risk`, `Recommendation` (priority, effort, businessImpact, duration, owner, relatedFindings, relatedRisks), `Evidence` (type + strength), and `AssessmentProfile` (categories + controls + maturity flag + scoring model id + prompt id). The current `ProfileRequirement`/`AssessedRequirement` map onto `Control`/`Finding`.

### Engines (deterministic, standard-agnostic)

- **Scoring**: `pass=100 / partial=50 / fail=0`, category + weighted + overall, readiness level; pluggable scoring-model id for future models.
- **Maturity**: optional per profile, levels 0–5, current vs target gap.
- **Risk**: score, rating (Low/Med/High/Critical), heatmap matrix data.
- **Recommendations**: enrich + group Critical/High/Medium/Low; roadmap 0–3 / 3–6 / 6–12 months by risk reduction + effort.
- **Quality**: pass-without-evidence, risk-without-recommendation, recommendation-without-owner, missing mandatory controls, missing traceability, contradictions, incomplete intake. Critical → block PDF; warnings → Quality Panel.
- **Evidence**: inventory + strength shown in report; never affects score.

### Universal workflow (single page, no route change)

Extend `MetaAssessmentTool.tsx` state machine to:
`INTAKE → ASSESSMENT → AI REASONING → QUALITY CHECK → DASHBOARD → PDF REPORT`
The AI step fills explanatory text only; engines compute everything else; Quality gate guards the PDF button.

### Executive dashboard

New `components/metaAssessment/ExecutiveDashboard.tsx`: overall score, maturity, risk exposure, critical findings, top recommendations, category breakdown, readiness, risk heatmap — non-technical framing.

### Consulting-grade PDF (`universalReportPdf.ts`)

One generator on top of `pdfCore`, producing the full report: Cover, Executive Summary, Scope, Methodology (with the mandated AI-limitation statement), Overall Results (charts/radar/heatmap), Category Findings, Risk Analysis + register/matrix, Recommendation Plan, Maturity (if enabled), Evidence Overview, Traceability Matrix, Management Roadmap, Appendix. Trilingual (DE/EN/FR).

### AI consolidation

Create `supabase/functions/universal-reasoning/index.ts` with `PROMPT_LIBRARY` keyed by standard, reusing the existing data-integrity policy and rate limiting from `meta-assessment-reasoning`. Input `{ standard, language, controls, intake }`; output explanatory findings/risks only. Meta-Tool switches to it. Existing per-standard functions stay deployed for the legacy single tools.

### Pilot & rollout

1. Build engines + extended types + universal PDF + dashboard + quality panel.
2. Migrate the **NIS2 profile** to the full model as the pilot end-to-end.
3. Add a second profile (DORA) to prove "profile-only" extension.
4. Remaining standards become profile files incrementally (separate follow-ups).

### Breaking-change risks & mitigation

- Touching `pdfCore.ts` could affect all reports → only consume it, never modify signatures.
- `types.ts` is imported by the live Meta-Tool → make all additions optional/additive.
- New edge function is additive; legacy functions untouched.
- No DB/schema changes; no persistence added.

### Deliverable for this first implementation pass

Extended types + all six engines + `universal-reasoning` function + universal PDF + dashboard + quality panel, wired into `MetaAssessmentTool.tsx`, with **NIS2 fully migrated** as the working pilot. Existing tools remain untouched.
