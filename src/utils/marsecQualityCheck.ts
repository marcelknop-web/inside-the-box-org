// MarSec Studio — client-side quality assurance for generated exercises.
// Pure functions, no side effects: every check returns a finding the facilitator can act on.

import type { Exercise, Inject } from "@/data/marsecTypes";

export type Severity = "blocker" | "warning";

export interface Finding {
  id: string;
  severity: Severity;
  rule: string;
  detail: string;
  /** Short, imperative instruction handed to the AI repair pass. */
  fix: string;
}

export interface CheckContext {
  injectCount: number;
  /** Topic name -> weight, as selected in the wizard. */
  topics: Record<string, string>;
  /** Labels of the reporting obligations selected in the wizard. */
  obligationLabels: string[];
  roleCount: number;
  /** Booked session length in real room minutes (e.g. 120 for "2h"). */
  durationMinutes?: number;
}


/** Parses "T+45 min", "T+1h", "T+1:15", "09:30" into minutes since exercise start. */
export function parseInjectMinutes(raw: string | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  const rel = /^t\s*\+\s*(?:(\d+)\s*h)?\s*(?:(\d{1,3})\s*(?:min|m)?)?/.exec(s);
  if (rel && (rel[1] || rel[2]) && s.startsWith("t")) {
    const h = rel[1] ? parseInt(rel[1], 10) : 0;
    const m = rel[2] ? parseInt(rel[2], 10) : 0;
    return h * 60 + m;
  }
  const clock = /^(\d{1,2}):(\d{2})/.exec(s);
  if (clock) return parseInt(clock[1], 10) * 60 + parseInt(clock[2], 10);
  return null;
}

const norm = (s: string) =>
  (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const looksLikeTension = (t: string) => {
  const s = (t || "").toLowerCase();
  return /\bvs\.?\b|\bversus\b|\bagainst\b|\bwhile\b|\bbut\b|\bat the (?:same|cost)\b/.test(s);
};

export function runQualityCheck(ex: Exercise, ctx: CheckContext): Finding[] {
  const f: Finding[] = [];
  const injects: Inject[] = ex.injects ?? [];
  const ids = new Set(injects.map((i) => i.id));
  const timelineText = (ex.groundTruth?.timeline ?? []).map((t) => `${t.time} ${t.event}`).join(" | ");

  // ── Structure ─────────────────────────────────────────────
  if (injects.length !== ctx.injectCount) {
    f.push({
      id: "inject-count",
      severity: injects.length < ctx.injectCount ? "blocker" : "warning",
      rule: "Inject count matches the selected duration",
      detail: `${injects.length} injects generated, ${ctx.injectCount} expected.`,
      fix: `Deliver exactly ${ctx.injectCount} injects, keeping the existing causal chain intact.`,
    });
  }

  // ── Causality ─────────────────────────────────────────────
  const missingDep = injects.slice(1).filter((i) => !i.dependsOn || !i.dependsOn.trim());
  if (missingDep.length) {
    f.push({
      id: "depends-missing",
      severity: "blocker",
      rule: "Every inject after the first names a predecessor",
      detail: `No dependsOn: ${missingDep.map((i) => i.id).join(", ")}.`,
      fix: `Add a concrete dependsOn (inject ID or timeline event) for ${missingDep.map((i) => i.id).join(", ")}.`,
    });
  }
  const timelineTimes = new Set(
    (ex.groundTruth?.timeline ?? []).map((t) => (t.time || "").trim()).filter(Boolean),
  );
  const danglingDep = injects.filter((i) => {
    if (!i.dependsOn) return false;
    // Tolerate wrappers like "timeline event: 09:20" or "see timeline 09:20 — ...".
    const d = i.dependsOn.replace(/^\s*(?:see\s+)?timeline(?:\s+event)?\s*[:\-–]?\s*/i, "").trim();
    const idHit = [...ids].some((id) => id !== i.id && d.includes(id));
    const timeHit = [...timelineTimes].some((t) => d.startsWith(t) || d === t);
    const tlHit = norm(timelineText).includes(norm(d).slice(0, 24)) && norm(d).length > 8;
    return !idHit && !timeHit && !tlHit;
  });

  if (danglingDep.length) {
    f.push({
      id: "depends-dangling",
      severity: "warning",
      rule: "Predecessors resolve to a real inject or timeline event",
      detail: `Unresolved reference: ${danglingDep.map((i) => `${i.id} → "${i.dependsOn}"`).join("; ")}.`,
      fix: "Rewrite each dependsOn so it cites an existing inject ID or a verbatim ground-truth timeline event.",
    });
  }

  // ── Timing ────────────────────────────────────────────────
  const mins = injects.map((i) => parseInjectMinutes(i.time));
  const unparsed = injects.filter((_, idx) => mins[idx] === null);
  if (unparsed.length) {
    f.push({
      id: "time-format",
      severity: "warning",
      rule: "Inject times are machine-readable",
      detail: `Unreadable time value: ${unparsed.map((i) => `${i.id} ("${i.time}")`).join(", ")}.`,
      fix: 'Use "T+<h>h<mm>" or a HH:MM clock time for every inject time.',
    });
  }
  for (let i = 1; i < mins.length; i++) {
    if (mins[i] !== null && mins[i - 1] !== null && (mins[i] as number) < (mins[i - 1] as number)) {
      f.push({
        id: "time-order",
        severity: "blocker",
        rule: "Inject times run forward",
        detail: `${injects[i].id} (${injects[i].time}) sits before ${injects[i - 1].id} (${injects[i - 1].time}).`,
        fix: "Re-time the injects so they are strictly ascending across the exercise window.",
      });
      break;
    }
  }

  // ── Ground truth depth ───────────────────────────────────
  const tl = ex.groundTruth?.timeline ?? [];
  if (tl.length < injects.length + 2) {
    f.push({
      id: "timeline-depth",
      severity: "warning",
      rule: "Ground truth timeline is deeper than the inject list",
      detail: `${tl.length} timeline events for ${injects.length} injects (minimum ${injects.length + 2}).`,
      fix: `Extend the ground-truth timeline to at least ${injects.length + 2} events, including pre-incident causes.`,
    });
  }
  if (!ex.groundTruth?.classificationTime) {
    f.push({
      id: "classification-time",
      severity: "blocker",
      rule: "Classification time anchors all deadlines",
      detail: "No classificationTime set — reporting clocks cannot be calculated.",
      fix: "Set classificationTime as HH:MM and anchor every reporting deadline to it.",
    });
  }

  // ── Channel diversity ────────────────────────────────────
  for (let i = 2; i < injects.length; i++) {
    const a = norm(injects[i].channel), b = norm(injects[i - 1].channel), c = norm(injects[i - 2].channel);
    if (a && a === b && b === c) {
      f.push({
        id: "channel-repeat",
        severity: "warning",
        rule: "No channel three times in a row",
        detail: `"${injects[i].channel}" used for ${injects[i - 2].id}, ${injects[i - 1].id} and ${injects[i].id}.`,
        fix: "Vary the injection channels (phone, e-mail, ticket, satcom crew report, VHF, media enquiry, authority letter, chat, ops radio).",
      });
      break;
    }
  }

  // ── Anti-repetition ──────────────────────────────────────
  const dupPrompts = new Map<string, string[]>();
  injects.forEach((i) => (i.discussionPrompts ?? []).forEach((p) => {
    const k = norm(p);
    if (!k) return;
    dupPrompts.set(k, [...(dupPrompts.get(k) ?? []), i.id]);
  }));
  const promptHits = [...dupPrompts.values()].filter((v) => v.length > 1);
  if (promptHits.length) {
    f.push({
      id: "dup-prompts",
      severity: "warning",
      rule: "Discussion prompts are unique across injects",
      detail: `${promptHits.length} prompt(s) duplicated (e.g. ${promptHits[0].join(", ")}).`,
      fix: "Replace duplicated discussion prompts with inject-specific ones.",
    });
  }
  const dupClar = new Map<string, string[]>();
  injects.forEach((i) => (i.clarifications ?? []).forEach((c) => {
    const k = norm(c.question);
    if (!k) return;
    dupClar.set(k, [...(dupClar.get(k) ?? []), i.id]);
  }));
  const clarHits = [...dupClar.values()].filter((v) => v.length > 1);
  if (clarHits.length) {
    f.push({
      id: "dup-clarifications",
      severity: "warning",
      rule: "Clarification questions are unique across injects",
      detail: `${clarHits.length} question(s) duplicated (e.g. ${clarHits[0].join(", ")}).`,
      fix: "Replace duplicated clarification questions with inject-specific ones.",
    });
  }

  // ── Topic coverage & weighting ───────────────────────────
  const tagText = injects.map((i) => norm(`${i.topicTag} ${i.title}`));
  // topicTag must name a selected topic, not just its weight ("Lead thread" etc.).
  const weightLabels = new Set(["lead thread", "core thread", "side thread"]);
  const weightTagged = injects.filter((i) => weightLabels.has(norm(i.topicTag)));
  if (weightTagged.length) {
    f.push({
      id: "topic-tag-weight",
      severity: "warning",
      rule: "topicTag names the scenario topic, not its weighting",
      detail: `Tagged with a weighting instead of a topic: ${weightTagged.map((i) => i.id).join(", ")}.`,
      fix: `Set topicTag to the verbatim selected topic, one of: ${Object.keys(ctx.topics).join(" | ")}.`,
    });
  }

  const narrativeText = norm(
    [
      ex.exerciseName ?? "",
      ex.summary ?? "",
      ...(ex.objectives ?? []),
      ex.groundTruth?.organisationProfile ?? "",
      ex.groundTruth?.adversaryOrCause ?? "",
      ...(ex.groundTruth?.complications ?? []),
      ...(ex.groundTruth?.timeline ?? []).map((t) => `${t.time} ${t.event}`),
    ].join(" "),
  );
  const topicWords = (topic: string) => norm(topic).split(" ").filter((w) => w.length > 4);
  const normTags = injects.map((i) => norm(i.topicTag));
  const countFor = (topic: string) => {
    // Verbatim tags are authoritative; fall back to keyword matching only if none match.
    const exact = normTags.filter((t) => t && t === norm(topic)).length;
    if (exact) return exact;
    const words = topicWords(topic);
    return tagText.filter((t) => words.some((w) => t.includes(w))).length;
  };

  Object.entries(ctx.topics).forEach(([topic, weight]) => {
    const n = countFor(topic);
    if (n === 0) {
      f.push({
        id: `topic-missing-${norm(topic).slice(0, 20)}`,
        severity: "blocker",
        rule: "Every selected topic appears in the injects",
        detail: `"${topic}" (${weight}) is not tagged on any inject.`,
        fix: `Cover the topic "${topic}" as ${weight} and tag the matching injects with it.`,
      });
      return;
    }
    const want = weight === "Lead thread" ? [3, 4] : weight === "Core thread" ? [1, 2] : [1, 1];
    if (n < want[0] || n > want[1] + 1) {
      f.push({
        id: `topic-weight-${norm(topic).slice(0, 20)}`,
        severity: "warning",
        rule: "Topic weighting matches the inject distribution",
        detail: `"${topic}" is a ${weight} but appears in ${n} inject(s) (expected ${want[0]}–${want[1]}).`,
        fix: `Re-balance "${topic}" to ${want[0]}–${want[1]} injects as a ${weight}.`,
      });
    }
    // The narrative must carry the topic too, not only the inject tags.
    const words = topicWords(topic);
    if (words.length && !words.some((w) => narrativeText.includes(w))) {
      f.push({
        id: `topic-narrative-${norm(topic).slice(0, 20)}`,
        severity: weight === "Lead thread" ? "blocker" : "warning",
        rule: "Selected topics are woven into scenario narrative and ground truth",
        detail: `"${topic}" (${weight}) is tagged on injects but never referenced in the summary, objectives or ground truth.`,
        fix: `Weave "${topic}" explicitly into the scenario summary, at least one objective and the ground-truth timeline/root cause.`,
      });
    }
  });


  // ── Reporting obligations ────────────────────────────────
  const obs = ex.reportingObligations ?? [];
  ctx.obligationLabels.forEach((label) => {
    const words = norm(label).split(" ").filter((w) => w.length > 3);
    const hit = obs.some((o) => words.some((w) => norm(`${o.addressee} ${o.basis ?? ""}`).includes(w)));
    if (!hit) {
      f.push({
        id: `obligation-${norm(label).slice(0, 20)}`,
        severity: "warning",
        rule: "Selected reporting obligations are present",
        detail: `No entry covering "${label}".`,
        fix: `Add a reporting obligation for "${label}" with addressee, deadline and legal basis.`,
      });
    }
  });
  const vagueDeadlines = obs.filter((o) => !/\d/.test(o.deadline || ""));
  if (vagueDeadlines.length) {
    f.push({
      id: "deadline-vague",
      severity: "blocker",
      rule: "Deadlines are concrete",
      detail: `Without a number: ${vagueDeadlines.map((o) => o.addressee).join(", ")}.`,
      fix: 'Express every deadline as "T+<hours>h" or a clock time anchored to the classification time.',
    });
  }
  const KINDS = ["regulatory deadline", "internal escalation target", "company / contract / class target"];
  const untyped = obs.filter((o) => !KINDS.includes(norm(o.kind || "")));
  if (untyped.length) {
    f.push({
      id: "obligation-kind-missing",
      severity: "warning",
      rule: "Every reporting entry is typed",
      detail: `No valid kind on: ${untyped.map((o) => o.addressee).join(", ")}.`,
      fix: 'Set "kind" to "Regulatory deadline", "Internal escalation target" or "Company / contract / class target".',
    });
  }
  // Statutory clocks must not be shortened.
  const statutory = obs.filter((o) => /nis2|nis 2|art\.?\s*23|gdpr|art\.?\s*33/i.test(`${o.addressee} ${o.basis ?? ""}`));
  statutory.forEach((o) => {
    const hasLegalWindow = /(24\s*h|72\s*h|1\s*month|one month)/i.test(o.deadline || "");
    if (!hasLegalWindow) {
      f.push({
        id: `deadline-statutory-${norm(o.addressee).slice(0, 16)}`,
        severity: "blocker",
        rule: "Statutory clocks are reproduced as written in law",
        detail: `"${o.addressee}" states "${o.deadline}" instead of the legal window (NIS2: 24 h / 72 h / 1 month, GDPR Art. 33: 72 h).`,
        fix: "Use the statutory window and move any faster ambition to a separate entry with kind \"Internal escalation target\".",
      });
    }
  });
  // IMO guidance is not a deadline source.
  obs
    .filter((o) => /imo|msc-fal|circ\.?\s*3|class society|flag state|ship security officer|company security officer/i.test(`${o.addressee} ${o.basis ?? ""}`))
    .forEach((o) => {
      if (norm(o.kind || "") === "regulatory deadline") {
        f.push({
          id: `imo-not-regulatory-${norm(o.addressee).slice(0, 16)}`,
          severity: "blocker",
          rule: "IMO/ISPS notifications are not statutory deadlines",
          detail: `"${o.addressee}" is labelled as a regulatory deadline, but IMO MSC-FAL.1/Circ.3 is cyber-risk-management guidance and sets no reporting clock.`,
          fix: 'Label CSO/SSO, flag state and class notifications as "Company / contract / class target".',
        });
      }
    });


  // ── Roles ────────────────────────────────────────────────
  const roles = ex.roles ?? [];
  if (roles.length < ctx.roleCount) {
    f.push({
      id: "role-count",
      severity: "blocker",
      rule: "Role set matches the selected scope",
      detail: `${roles.length} role cards for a scope of ${ctx.roleCount}.`,
      fix: `Provide exactly ${ctx.roleCount} role cards with profile, tasks and tension.`,
    });
  }
  const weakTension = roles.filter((r) => !looksLikeTension(r.tension));
  if (weakTension.length) {
    f.push({
      id: "role-tension",
      severity: "warning",
      rule: "Every role tension names two competing goals",
      detail: `Not a conflict: ${weakTension.map((r) => r.name).join(", ")}.`,
      fix: 'Rewrite these tensions as "goal A vs. goal B" conflicts, not character descriptions.',
    });
  }
  const thinRoles = roles.filter((r) => (r.tasks ?? []).length < 3);
  if (thinRoles.length) {
    f.push({
      id: "role-tasks",
      severity: "warning",
      rule: "Role cards carry at least three tasks",
      detail: `Too few tasks: ${thinRoles.map((r) => r.name).join(", ")}.`,
      fix: "Give every role at least three concrete, exercise-specific tasks.",
    });
  }

  // ── Completeness of inject fields ────────────────────────
  const thin = injects.filter((i) =>
    !i.content?.trim() || !i.expectedResponse?.trim() || !i.facilitatorNote?.trim() ||
    (i.discussionPrompts ?? []).length === 0 || (i.clarifications ?? []).length === 0,
  );
  if (thin.length) {
    f.push({
      id: "inject-fields",
      severity: "blocker",
      rule: "Injects are complete",
      detail: `Missing fields: ${thin.map((i) => i.id).join(", ")}.`,
      fix: "Fill content, expected response, facilitator note, at least two discussion prompts and two clarification Q&As for every inject.",
    });
  }

  // ── Objectives: testable and decision-oriented ───────────
  const objectives = ex.objectives ?? [];
  if (objectives.length < 3) {
    f.push({
      id: "objectives",
      severity: "warning",
      rule: "Three to five testable exercise objectives are stated",
      detail: objectives.length ? `Only ${objectives.length} objective(s).` : "No objectives generated.",
      fix: "State three to five objectives, each naming an observable behaviour or decision that can be assessed during the exercise.",
    });
  }
  const vagueObjective = /^(understand|know|be aware|learn|appreciate|get to know|sensitis|sensitiz)/;
  const weakObjectives = objectives.filter((o) => vagueObjective.test(norm(o)));
  if (weakObjectives.length) {
    f.push({
      id: "objectives-vague",
      severity: "warning",
      rule: "Objectives are testable capabilities, not knowledge statements",
      detail: `Not observable: ${weakObjectives.slice(0, 3).map((o) => `"${o.slice(0, 60)}"`).join("; ")}.`,
      fix: 'Rewrite these objectives as testable capabilities with an observable decision or action (e.g. "activate the crisis team and confirm quorum within 20 minutes").',
    });
  }
  const objectivesText = norm(objectives.join(" "));
  Object.entries(ctx.topics)
    .filter(([, w]) => w === "Lead thread")
    .forEach(([topic]) => {
      const words = norm(topic).split(" ").filter((w) => w.length > 4);
      if (words.length && !words.some((w) => objectivesText.includes(w))) {
        f.push({
          id: `objective-topic-${norm(topic).slice(0, 20)}`,
          severity: "warning",
          rule: "Lead-thread topics are covered by an objective",
          detail: `No objective refers to "${topic}".`,
          fix: `Add or reword an objective so it tests the handling of "${topic}".`,
        });
      }
    });

  // ── Architecture assumption (plausible causal chain) ─────
  const arch = ex.groundTruth?.architectureAssumption ?? "";
  if (arch.trim().length < 80) {
    f.push({
      id: "architecture-assumption",
      severity: "blocker",
      rule: "The technical causal chain rests on an explicit architecture assumption",
      detail: arch.trim() ? "Architecture assumption too thin to carry the escalation." : "No architectureAssumption set.",
      fix: "State in groundTruth.architectureAssumption the concrete technical bridge that makes the escalation possible (e.g. a provider authentication API linking guest network and core platform) plus the shore-IT vs on-board IT/OT boundary, and align every technical inject with it.",
    });
  }

  // ── Internal fact sheet ─────────────────────────────────
  const facts = ex.groundTruth?.facts ?? [];
  if (facts.length < Math.max(4, injects.length)) {
    f.push({
      id: "fact-sheet",
      severity: facts.length ? "warning" : "blocker",
      rule: "Facilitators hold an internal fact sheet",
      detail: `${facts.length} resolved fact(s) for ${injects.length} injects.`,
      fix: `Provide at least ${Math.max(4, injects.length)} groundTruth.facts entries resolving what participants will ask: which data is actually affected, which artefacts exist, which trust relationships link provider, guest network and core systems, what the adversary actually did.`,
    });
  }
  const unknownFacts = facts.filter((c) => /not\s+known|unknown/i.test(c.answer || ""));
  if (unknownFacts.length) {
    f.push({
      id: "fact-sheet-unknown",
      severity: "warning",
      rule: "Fact-sheet answers are resolved truths",
      detail: `${unknownFacts.length} fact-sheet answer(s) left open.`,
      fix: "Replace every open fact-sheet answer with the resolved internal truth — the fact sheet is the facilitator's ground truth, not a list of unknowns.",
    });
  }
  const allClar = injects.flatMap((i) => i.clarifications ?? []);
  const unknownClar = allClar.filter((c) => /not\s+known|unknown|nicht bekannt/i.test(c.answer || ""));
  if (allClar.length >= 6 && unknownClar.length > allClar.length / 3) {
    f.push({
      id: "clarifications-unknown",
      severity: "warning",
      rule: "Most clarification answers are resolved from ground truth",
      detail: `${unknownClar.length} of ${allClar.length} clarification answers are "not known".`,
      fix: "Resolve the material clarification answers from the ground-truth timeline or the fact sheet; keep 'Not known - carry as an assumption' for genuinely open details only.",
    });
  }

  // ── ISPS wording ────────────────────────────────────────
  const ispsPattern = /isps[^.?]{0,60}(security\s+)?level|security\s+level\s*(1|2|3|one|two|three)[^.?]{0,40}(change|raise|set|declare)|(change|raise|set|declare|increase)[^.?]{0,40}(isps|security)\s+level/i;
  const ispsHits = injects.filter((i) =>
    [i.content, i.expectedResponse, ...(i.discussionPrompts ?? []), ...(i.clarifications ?? []).map((c) => c.question)]
      .some((t) => ispsPattern.test(t || "")),
  );
  if (ispsHits.length) {
    f.push({
      id: "isps-level-wording",
      severity: "warning",
      rule: "ISPS security levels are not set by company or Master",
      detail: `Asks about setting or changing an ISPS security level: ${ispsHits.map((i) => i.id).join(", ")}.`,
      fix: "Reword to: which immediate protective measures under the Ship Security Plan are appropriate, whom the Master informs (CSO, SSO, flag state, port facility security officer), and under which conditions escalation to authorities is recommended — a security level is set by the responsible SOLAS contracting state.",
    });
  }

  // ── Regulation as decision path, not knowledge quiz ─────
  const quizPattern = /which (?:reporting|notification|legal|regulatory)?\s*(?:obligations|duties|requirements|deadlines|regulations|laws)\s*(?:are|is|apply|applies|get|are being)?\s*(?:triggered|applicable|relevant)?\s*\??$|list (?:the )?(?:applicable )?(?:legal|regulatory) (?:norms|requirements)/i;
  const quizHits = injects.filter((i) => (i.discussionPrompts ?? []).some((p) => quizPattern.test((p || "").trim())));
  if (quizHits.length) {
    f.push({
      id: "regulation-quiz",
      severity: "warning",
      rule: "Regulatory prompts test a decision path, not recall",
      detail: `Enumeration-style regulatory prompt in: ${quizHits.map((i) => i.id).join(", ")}.`,
      fix: "Replace enumeration questions with decision questions: who is controller, which jurisdictions are in scope, which facts are still missing for the deadline assessment, and who tasks legal/privacy.",
    });
  }
  const thinBasis = obs.filter((o) => (o.basis || "").trim().length < 30);
  if (obs.length && thinBasis.length) {
    f.push({
      id: "obligation-owner",
      severity: "warning",
      rule: "Obligations name a decision owner and the facts needed",
      detail: `Basis too thin: ${thinBasis.map((o) => o.addressee).join(", ")}.`,
      fix: "Extend each obligation basis with the legal basis, the decision owner and the facts still required before the deadline can be assessed.",
    });
  }

  // ── Recovery phase ──────────────────────────────────────
  const recoveryWords = /(recovery|restor|resum|rebuild|failback|fallback|departure|return to (?:normal|service))/i;
  const hasRecoveryPhase = injects.some((i) => /recover|restor|resum/i.test(i.phase || ""));
  const lastInject = injects[injects.length - 1];
  const lastIsRecovery = !!lastInject && recoveryWords.test(`${lastInject.phase} ${lastInject.title} ${lastInject.content} ${lastInject.expectedResponse}`);
  if (injects.length && !hasRecoveryPhase && !lastIsRecovery) {
    f.push({
      id: "recovery-phase",
      severity: "blocker",
      rule: "The exercise closes with a recovery decision",
      detail: "No inject carries a recovery phase or a restoration/resumption decision — the script stops at the escalation peak.",
      fix: 'Make the final inject phase "Recovery" and force a decision on safe restoration, manual fallback processes, revoking and re-granting provider access, evidence preservation and the resumption/departure decision.',
    });
  }

  // ── Time model: room time vs simulation time ─────────────
  const agenda = ex.roomAgenda ?? [];
  const agendaMinutes = agenda.reduce((s, b) => s + (Number(b.minutes) || 0), 0);
  const booked = ctx.durationMinutes ?? 0;
  if (!agenda.length) {
    f.push({
      id: "room-agenda-missing",
      severity: "blocker",
      rule: "Room time and simulation time are separated",
      detail: "No roomAgenda: the simulation clock spans hours while the session is booked for a fixed slot.",
      fix: `Add a "roomAgenda" of real wall-clock blocks (minutes per inject/segment) summing to ${booked ? `${booked} minutes` : "the booked session length"}, and keep inject times as simulation time only.`,
    });
  } else if (booked && (agendaMinutes < booked * 0.8 || agendaMinutes > booked * 1.15)) {
    f.push({
      id: "room-agenda-length",
      severity: "warning",
      rule: "The room agenda fits the booked session length",
      detail: `roomAgenda totals ${agendaMinutes} minutes for a ${booked}-minute session.`,
      fix: `Re-balance the roomAgenda blocks so the minutes sum to about ${booked} minutes.`,
    });
  }
  const equatesClocks = /room time (?:equals|is|=)\s*(?:the\s*)?simulation time|simulation time equals room time/i;
  const equateHits = [
    ...(ex.schedule ?? []).map((s) => `${s.segment} ${s.content}`),
    ...(ex.roomAgenda ?? []).map((s) => s.activity || ""),
    ex.summary || "",
  ].filter((t) => equatesClocks.test(t));
  if (equateHits.length) {
    f.push({
      id: "clock-equation",
      severity: "blocker",
      rule: "Room time is never equated with simulation time",
      detail: "The material claims room time equals simulation time although the simulation clock is compressed.",
      fix: 'Replace with "The facilitator advances the simulation clock" and keep the real minute plan in roomAgenda.',
    });
  }
  // Times stated inside an inject must match that inject's own clock time.
  const stampPattern = /\b(?:sent|received|logged|timestamp(?:ed)?|dated|raised)\b[^.;\n]{0,30}?(\d{1,2}:\d{2})/gi;
  const stampMismatch = injects.filter((i) => {
    const own = (i.time || "").match(/\d{1,2}:\d{2}/)?.[0];
    if (!own) return false;
    const text = `${i.content} ${i.expectedResponse}`;
    let m: RegExpExecArray | null;
    stampPattern.lastIndex = 0;
    while ((m = stampPattern.exec(text))) if (m[1] !== own) return true;
    return false;
  });
  if (stampMismatch.length) {
    f.push({
      id: "inject-time-mismatch",
      severity: "warning",
      rule: "Times inside an inject match the inject's own clock time",
      detail: `Conflicting delivery times in: ${stampMismatch.map((i) => i.id).join(", ")}.`,
      fix: "Align every time written inside the inject text (e-mail headers, log entries, 'sent at') with that inject's own time.",
    });
  }

  // ── Closed role model: legal/DPA, fleet ops, Master ──────
  const supportCells = ex.supportCells ?? [];
  const roleUniverse = norm(
    [...roles.map((r) => `${r.name} ${r.profile} ${r.decisionRights ?? ""}`), ...supportCells.map((s) => `${s.name} ${s.availability} ${s.ownsDecisions}`)].join(" | "),
  );
  const requiredFunctions: [string, RegExp, Severity][] = [
    ["Legal / data protection (DPA)", /legal|counsel|data protection|privacy|dpo|dpa/, "blocker"],
    ["Fleet / vessel operations", /fleet|vessel operation|marine operation|ship operation|nautical/, "warning"],
    ["Master's authority on board", /master|captain|shipboard command/, "blocker"],
  ];
  requiredFunctions.forEach(([label, re, sev]) => {
    if (!re.test(roleUniverse)) {
      f.push({
        id: `role-gap-${norm(label).slice(0, 18)}`,
        severity: sev,
        rule: "The role model has no open decision owners",
        detail: `${label} is decision-relevant but appears neither as a role nor as a support cell.`,
        fix: `Add ${label} either as a played role or as a supportCells entry (e.g. "Legal/DPA on call, played by the facilitator") with the decisions it owns.`,
      });
    }
  });
  const noRights = roles.filter((r) => !(r.decisionRights || "").trim());
  if (noRights.length) {
    f.push({
      id: "role-decision-rights",
      severity: "warning",
      rule: "Every role states what it decides and what it escalates",
      detail: `No decisionRights: ${noRights.map((r) => r.name).join(", ")}.`,
      fix: 'Give every role a decisionRights line ("decides alone: … | escalates: …"); for shipboard matters name the Master as the decision holder.',
    });
  }

  // ── Terminology: SMS is the Safety Management System ─────
  const smsText = [
    ex.summary,
    ex.groundTruth?.organisationProfile,
    ex.groundTruth?.architectureAssumption,
    ...injects.map((i) => `${i.title} ${i.content} ${i.expectedResponse}`),
  ].join(" | ");
  if (/shipboard management system|\bSMS\b(?![^.]{0,20}safety)/.test(smsText) && !/safety management system\s*\(sms\)/i.test(smsText)) {
    f.push({
      id: "sms-abbreviation",
      severity: "warning",
      rule: "SMS is reserved for the Safety Management System",
      detail: 'The material uses "SMS" (or "Shipboard Management System") for an IT system — in the maritime sector SMS means Safety Management System.',
      fix: 'Rename the system to a plain descriptive name ("on-board vessel network", "cargo planning system") and use "SMS" only for the Safety Management System.',
    });
  }

  return f;

}

export const countBySeverity = (findings: Finding[]) => ({
  blockers: findings.filter((f) => f.severity === "blocker").length,
  warnings: findings.filter((f) => f.severity === "warning").length,
});
