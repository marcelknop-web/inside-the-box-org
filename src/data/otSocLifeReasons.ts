/**
 * OT-SOC Life rationale resolver — mirrors socLifeReasons.ts but consults the
 * OT-specific override map. Falls back to the same generic tier+phase bank
 * used by the IT variant when a key is missing.
 */

import type { Incident, Lang, PlaybookOption, PlaybookStep } from "@/data/socLifeData";
import { reasonFor as itReasonFor } from "@/data/socLifeReasons";
import { lookupOtReasonOverride } from "@/data/otSocLifeReasonOverrides";

export function otReasonFor(
  incident: Incident,
  step: PlaybookStep,
  option: PlaybookOption,
  lang: Lang,
): string {
  if (option.reason && option.reason[lang]) return option.reason[lang];
  const override = lookupOtReasonOverride(incident.id, step.id, option.id, lang);
  if (override) return override;
  // Fall through to the IT generic tier+phase bank (it is content-agnostic).
  return itReasonFor(incident, step, option, lang);
}
