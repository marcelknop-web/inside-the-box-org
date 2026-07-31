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
  const countFor = (topic: string) => {
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

  if (!(ex.objectives ?? []).length) {
    f.push({
      id: "objectives",
      severity: "warning",
      rule: "Exercise objectives are stated",
      detail: "No objectives generated.",
      fix: "Add three to five measurable exercise objectives.",
    });
  }

  return f;
}

export const countBySeverity = (findings: Finding[]) => ({
  blockers: findings.filter((f) => f.severity === "blocker").length,
  warnings: findings.filter((f) => f.severity === "warning").length,
});
