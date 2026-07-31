## MarSec Studio — improvement plan

Reviewed the wizard (`src/pages/MarSec.tsx`) and the generator (`supabase/functions/marsec-generate/index.ts`). The pipeline is solid: causal-chain prompt, ground truth, deadline anchoring, 5 DOCX files in a ZIP. The gaps are in **quality assurance, inject-level review, and facilitator usability** — the output is trusted blindly and can only be regenerated as a whole.

### 1. Automatic quality check on the generated exercise (highest value)
A client-side validator that runs right after generation and shows a pass/fail panel before export, in the style of the existing compliance tools:
- Every inject except the first has a `dependsOn` pointing at a real inject ID or timeline event.
- Inject count matches the chosen duration; times are monotonic and inside the exercise window.
- Timeline has at least injects + 2 events.
- No channel repeated three times in a row; no duplicated discussion prompts or clarification questions.
- Every selected topic actually appears as a `topicTag`; Lead thread has 3-4 injects, Core 1-2, Side 1.
- Reporting obligations cover every selected obligation, each with a deadline that resolves to a clock time.
- Roles complete for the chosen scope; every role tension contains an explicit "A vs. B" conflict.

Findings are listed as blockers vs. warnings, with a "Repair with AI" button that sends only the failed checks back for a targeted fix instead of a full regeneration.

### 2. Inject-level review and editing
- Expandable inject rows showing content, expected response, facilitator note, prompts, clarifications and observation focus (today only ID/time/title/topic are visible).
- Inline editing of title, time, content and expected response, so a facilitator can correct wording before export.
- "Regenerate this inject" — one inject only, with the rest of the exercise as context, preserving the causal chain.
- Drag-free reordering via time edit plus a re-sort action.

### 3. Save, reload and reuse exercises
- Export/import the exercise as JSON, so a finished exercise can be reopened later, edited and re-exported without a new AI call.
- Keep the last 5 generated exercises in localStorage with a small "Recent exercises" list on the landing screen.

### 4. Facilitator-usability additions to the exports
- Inject cards: add a check-box header block (time sent / channel used / who received / response given) for live use.
- Facilitator guide: add a dependency map (inject → predecessor) and a "master timeline" combining ground truth and injects.
- Add an evaluation/hotwash sheet with observation criteria per objective and a simple rating scale.
- Optional: a one-page participant briefing (scenario, rules, roles, no spoilers).

### 5. Generator robustness
- Two-stage generation for 4 h / 14-inject exercises: first ground truth + schedule + roles, then injects in one follow-up call. This removes the token-limit truncation risk that currently needs the JSON repair fallback.
- Feed the quality-check rules into the system prompt as an explicit self-check list before it answers.
- Slightly raise the daily rate cap only if needed; keep the current limits otherwise.

### 6. Smaller UX polish
- Live "estimated exercise length vs. inject count" hint in Parameters.
- Warning when more than 4 topics are weighted (prompt quality drops).
- Deadline overview as a small timeline strip (T+0 → T+72 h) instead of a plain list.
- Copy-to-clipboard for single injects (for chat-based delivery during the exercise).

### Technical notes
- New: `src/utils/marsecQualityCheck.ts` (pure validation), `src/components/marsec/InjectDetail.tsx`, `src/components/marsec/QualityPanel.tsx`.
- `MarSec.tsx` gets an editable `exercise` state (already local) plus JSON import/export; DOCX builders stay where they are but are extended for the new blocks.
- Edge function gains a `mode` parameter: `full` (as today), `stage1`/`stage2` (split generation) and `repair` (targeted fix from quality findings). Same model, rate limiting and AI usage logging.
- No schema or database changes.

### Suggested order
Start with 1 + 2 (quality check and inject review) — they change perceived output quality the most. Then 4, then 3, 5, 6.
