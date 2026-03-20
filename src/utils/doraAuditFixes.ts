/**
 * Apply audit recommendations automatically for DORA compliance reports.
 * RULE: No content is invented. All corrections are derived from existing data.
 */
import type { DoraRisk, DoraReq, DoraIntakeData } from '@/data/doraData';
import { riskId } from '@/data/doraData';
import type { QaCheck } from '@/utils/doraQualityCheck';

function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  const baseRisk = riskRef.split(' Abs.')[0].split(' lit.')[0];
  const baseReq = reqArticle.split(' Abs.')[0].split(' lit.')[0];
  return baseRisk === baseReq;
}

export interface FixResult {
  risks: DoraRisk[];
  reqs: DoraReq[];
  fixes: string[];
}

export function applyDoraAuditFixes(
  risks: DoraRisk[],
  reqs: DoraReq[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: DoraIntakeData
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedRisks = risks.map(r => ({ ...r, sources: [...r.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const check of failedChecks) {
    switch (check.id) {

      case 'A2-1': {
        // Link non-pass reqs without risk references
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') {
            const linkedRisks = fixedRisks.filter(ri => refsMatch(ri.doraRef, r.article));
            if (linkedRisks.length === 0) {
              const nameMatch = fixedRisks.filter(ri =>
                r.name.toLowerCase().split(' ').some(w => w.length > 4 && ri.name.toLowerCase().includes(w))
              );
              if (nameMatch.length > 0) {
                nameMatch.forEach(ri => {
                  ri.doraRef = r.article;
                  fixes.push(t(
                    `${riskId(ri)}: Verknuepfung zu ${r.id} hergestellt`,
                    `${riskId(ri)}: Linked to ${r.id}`,
                    `${riskId(ri)}: Lie a ${r.id}`
                  ));
                });
              } else {
                r.rationale += (r.rationale ? ' — ' : '') + t(
                  'Hinweis: Keine Risiken verknuepft, manuelle Pruefung erforderlich',
                  'Note: No linked risks, manual review required',
                  'Note : aucun risque lie, revision manuelle requise'
                );
                fixes.push(t(`${r.id}: Fehlende Risiko-Verknuepfung dokumentiert`, `${r.id}: Missing risk link documented`, `${r.id}: Lien manquant documente`));
              }
            }
          }
        });
        break;
      }

      case 'A3-1': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedRisks.filter(ri => refsMatch(ri.doraRef, r.article) && ri.likelihood * ri.impact >= 13);
          if (violating.length > 0) {
            const maxScore = Math.max(...violating.map(ri => ri.likelihood * ri.impact));
            const topRisk = violating.find(ri => ri.likelihood * ri.impact === maxScore)!;
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            if (!r.gap || r.gap.trim() === '') r.gap = topRisk.name;
            fixes.push(t(
              `${r.id}: Status -> ${r.status === 'fail' ? 'nicht konform' : 'teilweise konform'} (${riskId(topRisk)}, Score ${maxScore})`,
              `${r.id}: Status -> ${r.status} (${riskId(topRisk)}, score ${maxScore})`,
              `${r.id}: Statut -> ${r.status} (${riskId(topRisk)}, score ${maxScore})`
            ));
          }
        });
        break;
      }

      case 'A3-1b': {
        fixedReqs.forEach(r => {
          if (r.status !== 'partial') return;
          const critical = fixedRisks.filter(ri => refsMatch(ri.doraRef, r.article) && ri.likelihood * ri.impact >= 20);
          if (critical.length > 0) {
            r.status = 'fail';
            fixes.push(t(
              `${r.id}: "teilweise" -> "nicht konform" (kritisches Risiko >= 20)`,
              `${r.id}: "partial" -> "fail" (critical risk >= 20)`,
              `${r.id}: "partiel" -> "non conforme" (risque critique >= 20)`
            ));
          }
        });
        break;
      }

      case 'B1': {
        const d81 = fixedReqs.find(r => r.id === 'D8-1');
        if (d81 && d81.status !== 'fail') {
          const unencRisk = fixedRisks.find(ri =>
            ri.name.toLowerCase().includes('unverschluessel') || ri.name.toLowerCase().includes('klartext') ||
            ri.name.toLowerCase().includes('unverschlüsselt') || ri.name.toLowerCase().includes('ohne tls')
          );
          d81.status = 'fail';
          if (unencRisk && (!d81.gap || d81.gap.trim() === '')) d81.gap = unencRisk.name;
          fixes.push(t(
            `D8-1 Schutzmaßnahmen -> nicht konform${unencRisk ? ` (${riskId(unencRisk)})` : ''}`,
            `D8-1 Protection -> non-compliant${unencRisk ? ` (${riskId(unencRisk)})` : ''}`,
            `D8-1 Protection -> non conforme${unencRisk ? ` (${riskId(unencRisk)})` : ''}`
          ));
        }
        break;
      }

      case 'B2': {
        const d92 = fixedReqs.find(r => r.id === 'D9-2');
        if (d92 && d92.status === 'pass') {
          const authRisk = fixedRisks.find(ri =>
            ri.name.toLowerCase().includes('idor') || ri.name.toLowerCase().includes('zugriffsschutz') ||
            ri.name.toLowerCase().includes('unauthentifiziert')
          );
          d92.status = 'fail';
          if (authRisk) d92.gap = authRisk.name;
          fixes.push(t(
            `D9-2 Zugangskontrolle -> nicht konform${authRisk ? ` (${riskId(authRisk)})` : ''}`,
            `D9-2 Access control -> non-compliant`,
            `D9-2 Controle d'acces -> non conforme`
          ));
        }
        break;
      }

      case 'B3': {
        const d191 = fixedReqs.find(r => r.id === 'D19-1');
        if (d191 && d191.status === 'pass') {
          d191.status = 'fail';
          fixes.push(t(`D19-1 Meldepflichten -> nicht konform`, `D19-1 Incident reporting -> fail`, `D19-1 -> non conforme`));
        }
        break;
      }

      case 'B4': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.effort || r.effort.trim() === '')) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.doraRef, r.article));
            const maxScore = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.effort = maxScore >= 20 ? '40-60h' : maxScore >= 13 ? '20-40h' : r.status === 'fail' ? '16-30h' : '8-16h';
            fixes.push(t(
              `${r.id}: Aufwandsschaetzung abgeleitet (${r.effort})`,
              `${r.id}: Effort derived (${r.effort})`,
              `${r.id}: Effort derive (${r.effort})`
            ));
          }
        });
        break;
      }

      case 'B5': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.priority || r.priority.trim() === '')) {
            const linked = fixedRisks.filter(ri => refsMatch(ri.doraRef, r.article));
            const maxScore = linked.length > 0 ? Math.max(...linked.map(ri => ri.likelihood * ri.impact)) : 0;
            r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0' : r.status === 'fail' ? 'P1' : maxScore >= 13 ? 'P2' : 'P3';
            fixes.push(t(
              `${r.id}: Prioritaet -> ${r.priority}`,
              `${r.id}: Priority -> ${r.priority}`,
              `${r.id}: Priorite -> ${r.priority}`
            ));
          }
        });
        break;
      }

      case 'C1':
      case 'C1b': {
        const threshold = check.id === 'C1' ? 20 : 15;
        const minQuality = check.id === 'C1' ? 4 : 3;
        const weak = fixedRisks.filter(r => r.likelihood * r.impact >= threshold && r.evidenceQuality < minQuality);
        if (weak.length > 0) {
          fixes.push(t(
            `Hinweis: ${weak.length} Risiko(en) mit unzureichender Evidenz — manuelle Nachpruefung: ${weak.map(riskId).join(', ')}`,
            `Note: ${weak.length} risk(s) with insufficient evidence — manual review: ${weak.map(riskId).join(', ')}`,
            `Note : ${weak.length} risque(s) avec preuve insuffisante : ${weak.map(riskId).join(', ')}`
          ));
        }
        break;
      }

      case 'C2': {
        const noSrc = fixedRisks.filter(r => !r.sources || r.sources.length === 0);
        if (noSrc.length > 0) {
          fixes.push(t(
            `Hinweis: ${noSrc.length} Risiko(en) ohne Quellen — manuelle Ergaenzung: ${noSrc.map(riskId).join(', ')}`,
            `Note: ${noSrc.length} risk(s) without sources: ${noSrc.map(riskId).join(', ')}`,
            `Note : ${noSrc.length} risque(s) sans sources : ${noSrc.map(riskId).join(', ')}`
          ));
        }
        break;
      }

      case 'D3': {
        const typoMap: [string, string][] = [
          ['Netzwerkcan', 'Netzwerkscan'], ['Aush', 'Auth'], ['SBM', 'SBOM'],
          ['Fur', 'fuer'], ['Uber', 'ueber'],
        ];
        let typoCount = 0;
        const fixField = (text: string): string => {
          let result = text;
          for (const [wrong, right] of typoMap) {
            const re = new RegExp(`\\b${wrong}\\b`, 'gi');
            const before = result;
            result = result.replace(re, right);
            if (result !== before) typoCount++;
          }
          return result;
        };
        fixedRisks.forEach(r => { r.evidence = fixField(r.evidence); r.rationale = fixField(r.rationale); r.name = fixField(r.name); });
        fixedReqs.forEach(r => { r.evidence = fixField(r.evidence); r.rationale = fixField(r.rationale); r.gap = fixField(r.gap); r.measure = fixField(r.measure); });
        if (typoCount > 0) fixes.push(t(`${typoCount} Tippfehler korrigiert`, `${typoCount} typos corrected`, `${typoCount} fautes corrigees`));
        break;
      }

      default: {
        if (!check.passed) {
          fixes.push(t(
            `${check.id}: Automatische Korrektur nicht moeglich — manuelle Pruefung erforderlich`,
            `${check.id}: Auto-correction not possible — manual review required`,
            `${check.id}: Correction auto impossible — revision manuelle requise`
          ));
        }
        break;
      }
    }
  }

  return { risks: fixedRisks, reqs: fixedReqs, fixes };
}
