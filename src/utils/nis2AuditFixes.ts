/**
 * Apply audit recommendations automatically for NIS-2 compliance reports.
 * RULE: No content is invented. All corrections are derived from existing data.
 */
import type { Nis2Risk, Nis2Req, Nis2IntakeData } from '@/data/nis2ComplianceData';
import { riskId } from '@/data/nis2ComplianceData';
import type { QaCheck } from '@/utils/nis2QualityCheck';

function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  const baseRisk = riskRef.split(' Abs.')[0].split(' lit.')[0];
  const baseReq = reqArticle.split(' Abs.')[0].split(' lit.')[0];
  return baseRisk === baseReq;
}

export interface FixResult {
  risks: Nis2Risk[];
  reqs: Nis2Req[];
  fixes: string[];
}

export function applyNis2AuditFixes(
  risks: Nis2Risk[],
  reqs: Nis2Req[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de',
  _intakeData?: Nis2IntakeData
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedRisks = risks.map(r => ({ ...r, sources: [...r.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const check of failedChecks) {
    switch (check.id) {
      case 'A2-1': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') {
            const linkedRisks = fixedRisks.filter(ri => refsMatch(ri.nis2Ref, r.article));
            if (linkedRisks.length === 0) {
              const nameMatch = fixedRisks.filter(ri =>
                r.name.toLowerCase().split(' ').some(w => w.length > 4 && ri.name.toLowerCase().includes(w))
              );
              if (nameMatch.length > 0) {
                nameMatch.forEach(ri => {
                  ri.nis2Ref = r.article;
                  fixes.push(t(`${riskId(ri)}: Verknüpfung zu ${r.id} hergestellt`, `${riskId(ri)}: Linked to ${r.id}`, `${riskId(ri)}: Lié à ${r.id}`));
                });
              } else {
                r.rationale += (r.rationale ? ' — ' : '') + t('Hinweis: Keine Risiken verknüpft, manuelle Prüfung erforderlich', 'Note: No linked risks, manual review required', 'Note : aucun risque lié');
                fixes.push(t(`${r.id}: Fehlende Risiko-Verknüpfung dokumentiert`, `${r.id}: Missing risk link documented`, `${r.id}: Lien manquant documenté`));
              }
            }
          }
        });
        break;
      }
      case 'A3-1': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedRisks.filter(ri => refsMatch(ri.nis2Ref, r.article) && ri.likelihood * ri.impact >= 13);
          if (violating.length > 0) {
            const maxScore = Math.max(...violating.map(ri => ri.likelihood * ri.impact));
            const topRisk = violating.find(ri => ri.likelihood * ri.impact === maxScore)!;
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            if (!r.gap || r.gap.trim() === '') r.gap = topRisk.name;
            fixes.push(t(`${r.id}: Status -> ${r.status === 'fail' ? 'nicht konform' : 'teilweise'}`, `${r.id}: Status -> ${r.status}`, `${r.id}: Statut -> ${r.status}`));
          }
        });
        break;
      }
      case 'A3-1b': {
        fixedReqs.forEach(r => {
          if (r.status !== 'partial') return;
          const critical = fixedRisks.filter(ri => refsMatch(ri.nis2Ref, r.article) && ri.likelihood * ri.impact >= 20);
          if (critical.length > 0) {
            r.status = 'fail';
            fixes.push(t(`${r.id}: "teilweise" -> "nicht konform"`, `${r.id}: "partial" -> "fail"`, `${r.id}: "partiel" -> "non conforme"`));
          }
        });
        break;
      }
      case 'B1': {
        const n218 = fixedReqs.find(r => r.id === 'N21-8');
        if (n218 && n218.status !== 'fail') {
          n218.status = 'fail';
          fixes.push(t('N21-8 Kryptografie -> nicht konform', 'N21-8 Cryptography -> non-compliant', 'N21-8 -> non conforme'));
        }
        break;
      }
      case 'B3': {
        const n231 = fixedReqs.find(r => r.id === 'N23-1');
        if (n231 && n231.status === 'pass') {
          n231.status = 'fail';
          fixes.push(t('N23-1 Meldepflichten -> nicht konform', 'N23-1 Reporting -> fail', 'N23-1 -> non conforme'));
        }
        break;
      }
      case 'B4': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.effort || r.effort.trim() === '')) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.nis2Ref, r.article));
            const maxScore = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.effort = maxScore >= 20 ? '40-60h' : maxScore >= 13 ? '20-40h' : r.status === 'fail' ? '16-30h' : '8-16h';
            fixes.push(t(`${r.id}: Aufwandsschätzung (${r.effort})`, `${r.id}: Effort (${r.effort})`, `${r.id}: Effort (${r.effort})`));
          }
        });
        break;
      }
      case 'B5': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.priority || r.priority.trim() === '')) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.nis2Ref, r.article));
            const maxScore = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0' : r.status === 'fail' ? 'P1' : maxScore >= 13 ? 'P2' : 'P3';
            fixes.push(t(`${r.id}: Priorität -> ${r.priority}`, `${r.id}: Priority -> ${r.priority}`, `${r.id}: Priorité -> ${r.priority}`));
          }
        });
        break;
      }
      case 'D3': {
        const typoMap: [string, string][] = [['Netzwerkcan', 'Netzwerkscan'], ['SBM', 'SBOM'], ['Fur', 'für'], ['Uber', 'über']];
        let tc = 0;
        const fixField = (text: string): string => {
          let result = text;
          for (const [wrong, right] of typoMap) {
            const re = new RegExp(`\\b${wrong}\\b`, 'gi');
            const before = result;
            result = result.replace(re, right);
            if (result !== before) tc++;
          }
          return result;
        };
        fixedRisks.forEach(r => { r.evidence = fixField(r.evidence); r.rationale = fixField(r.rationale); r.name = fixField(r.name); });
        fixedReqs.forEach(r => { r.evidence = fixField(r.evidence); r.rationale = fixField(r.rationale); r.gap = fixField(r.gap); r.measure = fixField(r.measure); });
        if (tc > 0) fixes.push(t(`${tc} Tippfehler korrigiert`, `${tc} typos corrected`, `${tc} fautes corrigées`));
        break;
      }
      default: {
        if (!check.passed) {
          fixes.push(t(`${check.id}: Manuelle Prüfung erforderlich`, `${check.id}: Manual review required`, `${check.id}: Révision manuelle requise`));
        }
        break;
      }
    }
  }

  return { risks: fixedRisks, reqs: fixedReqs, fixes };
}
