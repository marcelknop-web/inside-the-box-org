/**
 * Generates a short, professional rationale for the consequence overlay.
 * Combines the verdict tier (excellent/solid/risky/severe) with the playbook
 * step phase (detection, containment, eradication, recovery, reporting…).
 *
 * This avoids hand-writing ~135 per-option reason strings. Individual options
 * can still set an explicit `reason` on PlaybookOption to override the
 * generic text in special cases.
 */

import type { Incident, Lang, PlaybookOption, PlaybookStep } from "@/data/socLifeData";
import { lookupReasonOverride } from "@/data/socLifeReasonOverrides";

type Tier = "excellent" | "solid" | "risky" | "severe";

/**
 * Heuristic: map step.id (and a couple of incident-specific ones) to a
 * NIST 800-61 / general SOC phase. Falls back to "general" when unknown.
 */
type Phase =
  | "detect"      // triage, validate, scope, exposure, analyse, verify
  | "contain"    // contain, isolate, block, mitigate, stop, stop_payment
  | "eradicate"  // remediate, harden, creds, rotate, patch
  | "recover"    // recover, restore, recovery
  | "report"     // report, comms, notify, hr_legal, lawful_basis, retention, incident_log, finding, gap, evidence, scope_meeting
  | "preserve"   // preserve, image, forensics
  | "general";

function phaseOf(stepId: string): Phase {
  const id = stepId.toLowerCase();
  if (/(detect|triage|validate|verify|scope|exposure|analyse|analyze|compromise)/.test(id)) return "detect";
  if (/(contain|isolate|block|mitigate|stop|act)/.test(id)) return "contain";
  if (/(remediate|harden|creds|rotate|patch)/.test(id)) return "eradicate";
  if (/(recover|restore)/.test(id)) return "recover";
  if (/(report|comms|notify|hr_legal|lawful_basis|retention|incident_log|finding|gap|evidence|scope_meeting|doc|greet)/.test(id)) return "report";
  if (/(preserve|image|forensic)/.test(id)) return "preserve";
  return "general";
}

/**
 * Sentence bank — 4 tiers × 7 phases × 3 languages.
 * Each sentence is one short, fachlich, kein Floskel.
 */
const REASONS: Record<Tier, Record<Phase, Record<Lang, string>>> = {
  excellent: {
    detect:    { de: "Saubere Triage — Evidenz vor Aktion.",
                 en: "Clean triage — evidence before action.",
                 fr: "Triage propre — preuve avant action." },
    contain:   { de: "Chirurgisch eingedämmt, Forensik intakt.",
                 en: "Surgical containment, forensics intact.",
                 fr: "Confinement chirurgical, forensique intacte." },
    eradicate: { de: "Persistenz konsequent entfernt.",
                 en: "Persistence removed thoroughly.",
                 fr: "Persistance entièrement éradiquée." },
    recover:   { de: "Recovery aus verifizierter Quelle.",
                 en: "Recovery from verified source.",
                 fr: "Restauration depuis source vérifiée." },
    report:    { de: "Meldekette sauber bedient.",
                 en: "Reporting chain done right.",
                 fr: "Chaîne de signalement respectée." },
    preserve:  { de: "Beweise lückenlos gesichert.",
                 en: "Evidence fully preserved.",
                 fr: "Preuves intégralement préservées." },
    general:   { de: "Lehrbuchgemäße Reaktion.",
                 en: "Textbook response.",
                 fr: "Réponse de manuel." },
  },
  solid: {
    detect:    { de: "Vertretbar — etwas mehr Korrelation hätte geholfen.",
                 en: "Defensible — tighter correlation would have helped.",
                 fr: "Acceptable — plus de corrélation aurait aidé." },
    contain:   { de: "Eindämmung trifft, könnte gezielter sein.",
                 en: "Containment hits, could be more targeted.",
                 fr: "Confinement atteint, pourrait être plus ciblé." },
    eradicate: { de: "Bereinigung okay, Restrisiko bleibt.",
                 en: "Cleanup okay, residual risk remains.",
                 fr: "Nettoyage acceptable, risque résiduel reste." },
    recover:   { de: "Recovery läuft — Backup-Validierung wäre ein Plus.",
                 en: "Recovery works — backup validation would be a plus.",
                 fr: "Restauration OK — valider le backup serait un plus." },
    report:    { de: "Meldung raus — präziserer Scope wäre besser.",
                 en: "Report out — sharper scope would land harder.",
                 fr: "Rapport sorti — un périmètre plus net serait mieux." },
    preserve:  { de: "Beweise teils gesichert — Memory-Dump fehlt.",
                 en: "Evidence partly preserved — memory dump missing.",
                 fr: "Preuves partielles — dump mémoire manquant." },
    general:   { de: "Tragfähig, Luft nach oben.",
                 en: "Workable, room to sharpen.",
                 fr: "Tenable, peut être affûté." },
  },
  risky: {
    detect:    { de: "Aktion vor Analyse — Kontext verloren.",
                 en: "Action before analysis — context lost.",
                 fr: "Action avant analyse — contexte perdu." },
    contain:   { de: "Zu grob oder zu eng — Kollateralschaden oder Lücken.",
                 en: "Too blunt or too narrow — collateral damage or gaps.",
                 fr: "Trop large ou étroit — dégâts ou lacunes." },
    eradicate: { de: "Symptom statt Ursache — Angreifer kann zurück.",
                 en: "Symptom not root cause — attacker can return.",
                 fr: "Symptôme, pas cause — l'attaquant peut revenir." },
    recover:   { de: "Recovery zu schnell — kompromittierte Daten möglich.",
                 en: "Recovery too quick — compromised data possible.",
                 fr: "Restauration trop rapide — données compromises possibles." },
    report:    { de: "Schwache Meldung — Stakeholder unterinformiert.",
                 en: "Weak reporting — stakeholders underinformed.",
                 fr: "Reporting faible — parties prenantes mal informées." },
    preserve:  { de: "Beweise gefährdet — Chain-of-Custody hat Lücken.",
                 en: "Evidence compromised — chain of custody has gaps.",
                 fr: "Preuves fragilisées — chaîne de garde trouée." },
    general:   { de: "Riskante Wahl mit spürbarem Schaden.",
                 en: "Risky call with tangible damage.",
                 fr: "Choix risqué avec dégâts palpables." },
  },
  severe: {
    detect:    { de: "Vorfall blind ignoriert — Eskalation absehbar.",
                 en: "Incident ignored blind — escalation predictable.",
                 fr: "Incident ignoré — escalade prévisible." },
    contain:   { de: "Containment komplett verfehlt.",
                 en: "Containment missed entirely.",
                 fr: "Confinement totalement raté." },
    eradicate: { de: "Persistenz unangetastet — Wiedereinstieg garantiert.",
                 en: "Persistence untouched — re-entry guaranteed.",
                 fr: "Persistance intacte — réintroduction garantie." },
    recover:   { de: "Recovery aus kontaminierter Quelle — Angriff erneut installiert.",
                 en: "Recovery from contaminated source — attack reinstalled.",
                 fr: "Restauration depuis source contaminée — attaque réinstallée." },
    report:    { de: "Meldepflicht verletzt — regulatorisches Risiko.",
                 en: "Notification duty breached — regulatory risk.",
                 fr: "Obligation de signalement bafouée — risque réglementaire." },
    preserve:  { de: "Beweise vernichtet — Aufklärung blockiert.",
                 en: "Evidence destroyed — investigation blocked.",
                 fr: "Preuves détruites — enquête bloquée." },
    general:   { de: "Schwerer Verfahrensfehler — klare Eskalation.",
                 en: "Serious procedural error — clear escalation.",
                 fr: "Erreur de procédure grave — escalade claire." },
  },
};

/**
 * Decide tier from correct flag + reputation delta magnitude.
 * Mirrors the logic in ConsequenceOverlay so the rationale and the verdict
 * always belong to the same bucket.
 */
function tierOf(opt: PlaybookOption): Tier {
  if (opt.correct) return opt.delta >= 6 ? "excellent" : "solid";
  return opt.delta <= -4 ? "severe" : "risky";
}

/**
 * Public API: returns the localized rationale for a chosen option.
 *
 * Resolution order (most specific wins):
 *   1. inline `option.reason` on the data (rare, per-option overrides)
 *   2. central per-option override map in socLifeReasonOverrides.ts
 *      (covers all 15 incidents × ~3 steps × ~3 options with tailored,
 *      domain-correct rationales)
 *   3. generic tier+phase fallback bank (only kicks in if a new option
 *      gets added without an entry in the override map)
 */
export function reasonFor(
  incident: Incident,
  step: PlaybookStep,
  option: PlaybookOption,
  lang: Lang,
): string {
  if (option.reason && option.reason[lang]) return option.reason[lang];
  const override = lookupReasonOverride(incident.id, step.id, option.id, lang);
  if (override) return override;
  return REASONS[tierOf(option)][phaseOf(step.id)][lang];
}
