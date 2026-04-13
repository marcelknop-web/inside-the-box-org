/**
 * Generic localizer for compliance tool findings data.
 * Applies EN/FR translations on top of the German base data.
 */

export interface TranslatedThreatFields {
  name?: string; component?: string; attacker?: string; path?: string;
  evidence?: string; rationale?: string;
}

export interface TranslatedReqFields {
  name?: string; gap?: string; evidence?: string; rationale?: string;
  measure?: string; criteria?: string[];
}

export type ThreatMap = Record<string, TranslatedThreatFields>;
export type ReqMap = Record<string, TranslatedReqFields>;

export function localizeThreats<T extends Record<string, any>>(
  threats: T[], lang: string, enMap: ThreatMap, frMap: ThreatMap
): T[] {
  if (lang === 'de') return threats;
  const map = lang === 'fr' ? frMap : enMap;
  return threats.map(th => {
    const key = String(th.id);
    const tr = map[key];
    if (!tr) return th;
    return { ...th, ...tr };
  });
}

export function localizeReqs<T extends Record<string, any>>(
  reqs: T[], lang: string, enMap: ReqMap, frMap: ReqMap
): T[] {
  if (lang === 'de') return reqs;
  const map = lang === 'fr' ? frMap : enMap;
  return reqs.map(r => {
    const tr = map[r.id];
    if (!tr) return r;
    const out = { ...r };
    if (tr.name !== undefined) out.name = tr.name;
    if (tr.gap !== undefined) out.gap = tr.gap;
    if (tr.evidence !== undefined) out.evidence = tr.evidence;
    if (tr.rationale !== undefined) out.rationale = tr.rationale;
    if (tr.measure !== undefined) out.measure = tr.measure;
    if (tr.criteria !== undefined) out.criteria = tr.criteria;
    return out;
  });
}
