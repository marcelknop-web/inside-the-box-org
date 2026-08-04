# MarSec: exercise-script feedback (six sharpenings)

Goal: make generated exercises decision-oriented instead of knowledge-quiz style, give facilitators an internal truth sheet, and close the loop with a recovery decision.

## 1. Explicit, testable exercise objectives
- Generator must produce 3–5 objectives, each phrased as a testable capability ("activate the crisis team within X", "steer the first data-protection assessment", "keep the embarkation process workable"), each tied to a selected topic and to at least one inject.
- Objectives move to the top of the facilitator handbook, the participant briefing and the one-pager PDF (already partly there — order and labelling get aligned).
- Quality check: warning if fewer than 3 objectives, if an objective names no observable behaviour/decision, or if a Lead-thread topic has no objective.

## 2. Internal ground-truth fact sheet
- New ground-truth block "facts": resolved answers to the questions participants will ask — which data is actually affected, whether specific artefacts (e.g. cabin footage) exist, which trust relationships exist between guest network, external provider and the core application, what the adversary actually did.
- Clarification answers may only say "Not known — carry as an assumption" when the fact sheet also marks it unknown; anything material must be resolved in the fact sheet so the debrief can judge decision quality.
- Quality check: blocker if the fact sheet is missing or thinner than the number of injects; warning if more than a third of all clarification answers are "not known".
- Fact sheet is rendered in the facilitator handbook only (never in the participant briefing).

## 3. Plausible technical causal chain
- New ground-truth field "architectureAssumption": one explicit paragraph stating the technical bridge that makes the escalation possible (e.g. the managed service provider's authentication API path between guest Wi-Fi and the core booking/PMS system), plus the shore-IT vs on-board IT/OT boundary.
- Prompt rule: no inject may assert a compromise that skips the stated bridge; each technical inject references the assumption or a timeline event.
- Quality check: blocker if the field is empty; warning if an inject names a compromised system that appears in neither the architecture assumption nor the timeline.

## 4. ISPS wording corrected
- Prompt rule: never ask whether the ISPS security level should be changed — security levels are set by the responsible SOLAS contracting state, not by master or company.
- Required framing instead: which immediate protective measures under the Ship Security Plan are appropriate, whom the master informs (CSO, SSO, flag state, port facility), and under what conditions escalation to authorities is recommended. Cyber risk management stays separated from a formal ISPS level change.
- The "IMO / ISPS, class & flag state" obligation text is reworded from "document any change of ISPS security level" to notification and SSP-measure wording.
- Quality check: warning on any prompt or inject text asking to set/raise/change an ISPS security level.

## 5. Regulation as a decision path, not a knowledge question
- Prompt rule: reporting injects must not ask "which reporting duties are triggered?". They ask who is controller, which jurisdictions are in scope, which facts are still missing for a deadline assessment, and who tasks legal/privacy.
- Reporting obligations keep concrete deadlines (existing rule), but each obligation additionally names the decision owner and the facts required before the clock can be assessed.
- Quality check: warning if a discussion prompt is a bare enumeration question about legal norms.

## 6. Recovery phase added
- The exercise gains a closing recovery segment: the last inject (and the schedule) covers the decision on safe restoration, manual fallback processes, revoking/re-granting provider access, evidence preservation and the departure/resumption decision.
- Phase vocabulary becomes explicit: Detection → Containment → Operational impact → Communication → Recovery, matching the identify/protect/detect/respond/recover cycle.
- Quality check: blocker if no inject carries a recovery phase or a restoration/resumption decision.

All new checks feed the existing silent auto-repair loop, so the user sees no extra UI.

## Technical notes
- `src/data/marsecTypes.ts`: extend `Exercise.groundTruth` with `architectureAssumption: string` and `facts: { question: string; answer: string }[]`; both optional for backward compatibility with saved sessions.
- `supabase/functions/marsec-generate/index.ts`: extend `SYSTEM_BASE` rules and the self-check list (objectives, fact sheet, architecture bridge, ISPS wording, regulatory decision framing, recovery inject), and add the two new fields plus the recovery phase to the JSON schema block in the user prompt. Repair mode inherits the same system prompt automatically.
- `src/utils/marsecQualityCheck.ts`: add the checks listed above with `fix` strings written as imperative repair instructions.
- `src/data/marsecSectors.ts`: reword the IMO/ISPS obligation prompt.
- `src/pages/MarSec.tsx`: render architecture assumption and fact sheet in the facilitator Word handbook (new sections after "Adversary / root cause"), keep them out of the participant briefing; keep objectives first in both.
- `src/utils/marsecOnePagerPdf.ts`: keep objectives block, add a one-line architecture assumption to the scenario column if space allows.
