/**
 * Generates a short, professional rationale for the consequence overlay.
 * Combines the verdict tier (excellent/solid/risky/severe) with the playbook
 * step phase (detection, containment, eradication, recovery, reporting…).
 *
 * This avoids hand-writing ~135 per-option reason strings. Individual options
 * can still set an explicit `reason` on PlaybookOption to override the
 * generic text in special cases.
 */

import type { Lang, PlaybookOption, PlaybookStep } from "@/data/socLifeData";

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
    detect:    { de: "Saubere Triage: erst Evidenz, dann Aktion — verhindert Fehlbehandlung.",
                 en: "Clean triage: evidence before action — prevents mishandling.",
                 fr: "Triage propre : preuve avant action — évite les erreurs." },
    contain:   { de: "Eindämmung mit chirurgischer Präzision — Blutung gestoppt, Forensik intakt.",
                 en: "Surgical containment — bleeding stopped, forensics preserved.",
                 fr: "Confinement chirurgical — saignement stoppé, forensique préservée." },
    eradicate: { de: "Persistenz konsequent entfernt — Angreifer hat keinen Wiedereinstieg.",
                 en: "Persistence removed thoroughly — adversary loses re-entry.",
                 fr: "Persistance éradiquée — l’attaquant perd son point d’entrée." },
    recover:   { de: "Recovery aus verifizierter Quelle — kein Re-Infect-Risiko.",
                 en: "Recovery from verified source — no re-infection risk.",
                 fr: "Restauration depuis une source vérifiée — pas de risque de ré-infection." },
    report:    { de: "Meldekette sauber bedient — Pflichten erfüllt, Vertrauen gestärkt.",
                 en: "Reporting chain done right — duties met, trust reinforced.",
                 fr: "Chaîne de signalement respectée — obligations remplies, confiance renforcée." },
    preserve:  { de: "Beweise lückenlos gesichert — Chain-of-Custody hält vor Gericht.",
                 en: "Evidence fully preserved — chain of custody will hold in court.",
                 fr: "Preuves intégralement préservées — chaîne de garde tient en justice." },
    general:   { de: "Lehrbuchgemäße Reaktion — risikoarm und vollständig.",
                 en: "Textbook response — low risk, complete.",
                 fr: "Réponse de manuel — peu risquée et complète." },
  },
  solid: {
    detect:    { de: "Vertretbar — die Aktion stimmt, aber etwas mehr Korrelation hätte schneller Klarheit gebracht.",
                 en: "Defensible — the action is right, but tighter correlation would have brought clarity sooner.",
                 fr: "Acceptable — l’action est correcte, mais plus de corrélation aurait clarifié plus vite." },
    contain:   { de: "Eindämmung erreicht das Ziel — knapper, gezielter Schnitt wäre eleganter.",
                 en: "Containment hits the goal — a tighter, more targeted cut would be cleaner.",
                 fr: "Le confinement atteint l’objectif — une coupe plus ciblée serait plus propre." },
    eradicate: { de: "Bereinigung okay — Restrisiko bleibt, weil nicht alle Vektoren adressiert sind.",
                 en: "Cleanup okay — residual risk remains, not every vector addressed.",
                 fr: "Nettoyage acceptable — un risque résiduel reste, tous les vecteurs ne sont pas traités." },
    recover:   { de: "Recovery funktioniert — Validierung der Backup-Integrität wäre ein Plus.",
                 en: "Recovery works — backup integrity validation would be a plus.",
                 fr: "Restauration fonctionnelle — valider l’intégrité du backup serait un plus." },
    report:    { de: "Meldung ist raus — präzisere Aussagen zu Scope und Impact wären stärker.",
                 en: "Report is out — sharper scope and impact statements would land harder.",
                 fr: "Le rapport est sorti — des affirmations plus nettes sur le périmètre seraient plus fortes." },
    preserve:  { de: "Beweise teilweise gesichert — Memory-Dump hätte den Fall robuster gemacht.",
                 en: "Evidence partly preserved — a memory dump would have made the case sturdier.",
                 fr: "Preuves partiellement préservées — un dump mémoire aurait renforcé le dossier." },
    general:   { de: "Tragfähig, aber Luft nach oben.",
                 en: "Workable, but room to sharpen.",
                 fr: "Tenable, mais peut être affûté." },
  },
  risky: {
    detect:    { de: "Aktion vor Analyse — du verlierst Kontext und riskierst falsche Eindämmung.",
                 en: "Action before analysis — you lose context and risk wrong-shape containment.",
                 fr: "Action avant analyse — tu perds le contexte et risques un confinement mal calibré." },
    contain:   { de: "Zu grob oder zu eng — entweder Kollateralschaden oder unentdeckte Lateral-Pfade.",
                 en: "Too blunt or too narrow — either collateral damage or undetected lateral paths.",
                 fr: "Trop large ou trop étroit — dégâts collatéraux ou chemins latéraux non détectés." },
    eradicate: { de: "Symptombehandlung statt Ursache — Angreifer kann zurückkehren.",
                 en: "Symptom over root cause — the adversary can return.",
                 fr: "Symptôme plutôt que cause racine — l’attaquant peut revenir." },
    recover:   { de: "Recovery zu schnell — Wiedereinspielung kompromittierter Daten möglich.",
                 en: "Recovery too quick — risk of restoring compromised data.",
                 fr: "Restauration trop rapide — risque de restaurer des données compromises." },
    report:    { de: "Schwache Meldung — Stakeholder sind unterinformiert, Reputation bröckelt.",
                 en: "Weak reporting — stakeholders underinformed, trust slips.",
                 fr: "Reporting faible — parties prenantes mal informées, la confiance s’effrite." },
    preserve:  { de: "Beweise gefährdet — Chain-of-Custody hat Lücken.",
                 en: "Evidence compromised — chain of custody has gaps.",
                 fr: "Preuves fragilisées — la chaîne de garde a des trous." },
    general:   { de: "Riskante Wahl mit spürbarem Kollateralschaden.",
                 en: "Risky call with tangible collateral damage.",
                 fr: "Choix risqué avec dégâts collatéraux palpables." },
  },
  severe: {
    detect:    { de: "Vorfall blind ignoriert — Eskalation war absehbar.",
                 en: "Incident ignored blind — escalation was predictable.",
                 fr: "Incident ignoré à l’aveugle — l’escalade était prévisible." },
    contain:   { de: "Containment komplett verfehlt — der Angreifer hat freie Bahn.",
                 en: "Containment missed entirely — adversary has free movement.",
                 fr: "Confinement totalement raté — l’attaquant a le champ libre." },
    eradicate: { de: "Persistenz unangetastet — Wiedereinstieg garantiert.",
                 en: "Persistence untouched — re-entry guaranteed.",
                 fr: "Persistance intacte — réintroduction garantie." },
    recover:   { de: "Recovery aus kontaminierter Quelle — du installierst den Angriff erneut.",
                 en: "Recovery from contaminated source — you reinstall the attack.",
                 fr: "Restauration depuis une source contaminée — tu réinstalles l’attaque." },
    report:    { de: "Meldepflicht verletzt — regulatorisches und Reputationsrisiko erheblich.",
                 en: "Notification duty breached — material regulatory and reputational risk.",
                 fr: "Obligation de signalement bafouée — risque réglementaire et réputationnel majeur." },
    preserve:  { de: "Beweise vernichtet — Strafverfolgung und interne Aufklärung blockiert.",
                 en: "Evidence destroyed — prosecution and internal investigation blocked.",
                 fr: "Preuves détruites — poursuites et enquête interne bloquées." },
    general:   { de: "Schwerer Verfahrensfehler — Vorfall eskaliert klar erkennbar.",
                 en: "Serious procedural error — incident clearly escalates.",
                 fr: "Erreur de procédure grave — l’incident escalade nettement." },
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
 * Per-option `reason` (if set on the data) wins over the generic bank.
 */
export function reasonFor(
  step: PlaybookStep,
  option: PlaybookOption,
  lang: Lang,
): string {
  if (option.reason && option.reason[lang]) return option.reason[lang];
  return REASONS[tierOf(option)][phaseOf(step.id)][lang];
}
