/**
 * Apply automated audit corrections for EU AI Act readiness reports.
 * RULE: No content is invented. All corrections are derived from existing data.
 */
import type { AiActRisk, AiActReq, AiActIntakeData } from '@/data/aiActData';
import { riskId } from '@/data/aiActData';
import type { QaCheck } from '@/utils/aiActQualityCheck';

function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  const baseRisk = riskRef.split(' Abs.')[0].trim();
  const baseReq = reqArticle.split(' Abs.')[0].trim();
  return baseRisk === baseReq;
}

export interface FixResult {
  risks: AiActRisk[];
  reqs: AiActReq[];
  fixes: string[];
}

export function applyAiActAuditFixes(
  risks: AiActRisk[],
  reqs: AiActReq[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de',
  _intake?: AiActIntakeData,
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedRisks = risks.map(r => ({ ...r, sources: [...r.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const c of failedChecks) {
    switch (c.id) {
      case 'A2-1': {
        fixedReqs.forEach(r => {
          if (r.status === 'pass') return;
          const linked = fixedRisks.filter(ri => refsMatch(ri.aiActRef, r.article));
          if (linked.length === 0) {
            const nameMatch = fixedRisks.filter(ri => r.name.toLowerCase().split(' ').some(w => w.length > 4 && ri.name.toLowerCase().includes(w)));
            if (nameMatch.length > 0) {
              nameMatch.forEach(ri => { ri.aiActRef = r.article; fixes.push(t(`${riskId(ri)}: Verknüpfung zu ${r.id}`, `${riskId(ri)}: Linked to ${r.id}`, `${riskId(ri)}: Lié à ${r.id}`)); });
            } else {
              r.rationale += (r.rationale ? ' — ' : '') + t('Hinweis: Keine Risiken verknüpft, manuelle Prüfung erforderlich', 'Note: No linked risks, manual review required', 'Note : aucun risque lié');
              fixes.push(t(`${r.id}: Fehlende Verknüpfung dokumentiert`, `${r.id}: Missing link documented`, `${r.id}: Lien manquant documenté`));
            }
          }
        });
        break;
      }
      case 'A3-1': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedRisks.filter(ri => refsMatch(ri.aiActRef, r.article) && ri.likelihood * ri.impact >= 13);
          if (violating.length > 0) {
            const max = Math.max(...violating.map(ri => ri.likelihood * ri.impact));
            r.status = max >= 20 ? 'fail' : 'partial';
            const top = violating.find(ri => ri.likelihood * ri.impact === max)!;
            if (!r.gap) r.gap = top.name;
            fixes.push(t(`${r.id}: Status -> ${r.status === 'fail' ? 'nicht konform' : 'teilweise'}`, `${r.id}: Status -> ${r.status}`, `${r.id}: Statut -> ${r.status}`));
          }
        });
        break;
      }
      case 'B1': {
        const a09 = fixedReqs.find(r => r.id === 'A09-1');
        if (a09 && a09.status === 'pass') { a09.status = 'fail'; fixes.push(t('A09-1 RMS -> nicht konform', 'A09-1 RMS -> fail', 'A09-1 SGR -> non conforme')); }
        break;
      }
      case 'B2': {
        const a10 = fixedReqs.find(r => r.id === 'A10-1');
        if (a10 && a10.status === 'pass') { a10.status = 'fail'; fixes.push(t('A10-1 Bias -> nicht konform', 'A10-1 Bias -> fail', 'A10-1 Biais -> non conforme')); }
        break;
      }
      case 'B3': {
        const a155 = fixedReqs.find(r => r.id === 'A15-5');
        if (a155 && a155.status === 'pass') { a155.status = 'fail'; fixes.push(t('A15-5 Cybersicherheit -> nicht konform', 'A15-5 Cybersecurity -> fail', 'A15-5 Cybersécurité -> non conforme')); }
        break;
      }
      case 'B4': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && !r.effort?.trim()) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.aiActRef, r.article));
            const max = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.effort = max >= 20 ? '40-60h' : max >= 13 ? '20-40h' : r.status === 'fail' ? '16-30h' : '8-16h';
            fixes.push(t(`${r.id}: Aufwand (${r.effort})`, `${r.id}: Effort (${r.effort})`, `${r.id}: Effort (${r.effort})`));
          }
        });
        break;
      }
      case 'B5': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && !r.priority?.trim()) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.aiActRef, r.article));
            const max = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.priority = r.status === 'fail' && max >= 20 ? 'P0' : r.status === 'fail' ? 'P1' : max >= 13 ? 'P2' : 'P3';
            fixes.push(t(`${r.id}: Priorität -> ${r.priority}`, `${r.id}: Priority -> ${r.priority}`, `${r.id}: Priorité -> ${r.priority}`));
          }
        });
        break;
      }
      default: {
        if (!c.passed) fixes.push(t(`${c.id}: Manuelle Prüfung erforderlich`, `${c.id}: Manual review required`, `${c.id}: Révision manuelle requise`));
        break;
      }
    }
  }

  return { risks: fixedRisks, reqs: fixedReqs, fixes };
}
