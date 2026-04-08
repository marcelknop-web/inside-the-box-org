/**
 * IEC 62443 Audit Fixes — Rule-based corrections derived from existing data.
 * No content is invented.
 */
import type { IecThreat, IecReq, IecIntakeData } from '@/data/iec62443Data';
import { threatId } from '@/data/iec62443Data';
import type { QaCheck } from '@/utils/iec62443QualityCheck';

export interface FixResult {
  threats: IecThreat[];
  reqs: IecReq[];
  fixes: string[];
}

export function applyAuditFixes(
  threats: IecThreat[],
  reqs: IecReq[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de',
  _intakeData?: IecIntakeData
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedThreats = threats.map(th => ({ ...th, sources: [...th.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const check of failedChecks) {
    switch (check.id) {
      case 'A2-1': {
        fixedThreats.forEach(th => {
          if (!th.iecRef || th.iecRef.trim() === '') {
            const frToSr: Record<string, string> = {
              FR1: 'SR 1.1', FR2: 'SR 2.1', FR3: 'SR 3.4', FR4: 'SR 4.1',
              FR5: 'SR 5.1', FR6: 'SR 6.1', FR7: 'SR 7.1',
            };
            th.iecRef = frToSr[th.fr] || 'SR 1.1';
            fixes.push(t(`${threatId(th)}: SR-Verknuepfung abgeleitet -> ${th.iecRef}`, `${threatId(th)}: SR link derived -> ${th.iecRef}`, `${threatId(th)}: Lien SR derive -> ${th.iecRef}`));
          }
        });
        break;
      }

      case 'A2-2': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') {
            const linked = fixedThreats.filter(th => th.iecRef === r.article);
            if (linked.length === 0) {
              const nameMatch = fixedThreats.filter(th =>
                r.name.toLowerCase().split(' ').some(w => w.length > 4 && th.name.toLowerCase().includes(w))
              );
              if (nameMatch.length > 0) {
                nameMatch.forEach(th => {
                  th.iecRef = r.article;
                  fixes.push(t(`${threatId(th)}: Verknuepfung zu ${r.id} (Namensabgleich)`, `${threatId(th)}: Linked to ${r.id}`, `${threatId(th)}: Lie a ${r.id}`));
                });
              } else {
                r.rationale += (r.rationale ? ' — ' : '') + t('Hinweis: Keine Threats verknuepft, manuelle Pruefung erforderlich', 'Note: No linked threats, manual review required', 'Note : aucune menace liee');
                fixes.push(t(`${r.id}: Fehlende Threat-Verknuepfung dokumentiert`, `${r.id}: Missing threat link documented`, `${r.id}: Lien manquant documente`));
              }
            }
          }
        });
        break;
      }

      case 'A3-1': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedThreats.filter(th => th.iecRef === r.article && th.likelihood * th.impact >= 13);
          if (violating.length > 0) {
            const maxScore = Math.max(...violating.map(th => th.likelihood * th.impact));
            const top = violating.find(th => th.likelihood * th.impact === maxScore)!;
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            if (!r.gap) r.gap = top.name;
            fixes.push(t(`${r.id}: Status -> ${r.status} (${threatId(top)}, Score ${maxScore})`, `${r.id}: Status -> ${r.status} (${threatId(top)}, score ${maxScore})`, `${r.id}: Statut -> ${r.status}`));
          }
        });
        break;
      }

      case 'A3-1b': {
        fixedReqs.forEach(r => {
          if (r.status !== 'partial') return;
          const critical = fixedThreats.filter(th => th.iecRef === r.article && th.likelihood * th.impact >= 20);
          if (critical.length > 0) {
            r.status = 'fail';
            fixes.push(t(`${r.id}: "teilweise" -> "nicht konform" (kritischer Threat)`, `${r.id}: "partial" -> "fail" (critical threat)`, `${r.id}: "partiel" -> "non conforme"`));
          }
        });
        break;
      }

      case 'B1': {
        fixedReqs.forEach(r => {
          if (r.id.startsWith('FR1') && r.status === 'pass') {
            const authThreat = fixedThreats.find(th =>
              th.name.toLowerCase().includes('shared') || th.name.toLowerCase().includes('default') || th.name.toLowerCase().includes('fehlende authentifizierung')
            );
            if (authThreat) {
              r.status = 'fail';
              r.gap = authThreat.name;
              fixes.push(t(`${r.id}: -> nicht konform (${threatId(authThreat)})`, `${r.id}: -> fail (${threatId(authThreat)})`, `${r.id}: -> non conforme`));
            }
          }
        });
        break;
      }

      case 'B2': {
        const fr51 = fixedReqs.find(r => r.id === 'FR5-1');
        if (fr51 && fr51.status === 'pass') {
          const segThreat = fixedThreats.find(th => th.name.toLowerCase().includes('segmentierung'));
          fr51.status = 'fail';
          if (segThreat) fr51.gap = segThreat.name;
          fixes.push(t('FR5-1: -> nicht konform', 'FR5-1: -> fail', 'FR5-1: -> non conforme'));
        }
        break;
      }

      case 'B9': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.effort || r.effort.trim() === '')) {
            const linked = fixedThreats.filter(th => th.iecRef === r.article);
            const maxScore = linked.length > 0 ? Math.max(...linked.map(th => th.likelihood * th.impact)) : 0;
            r.effort = maxScore >= 20 ? '24-40h' : maxScore >= 13 ? '16-24h' : r.status === 'fail' ? '8-16h' : '4-8h';
            fixes.push(t(`${r.id}: Aufwand abgeleitet (${r.effort})`, `${r.id}: Effort derived (${r.effort})`, `${r.id}: Effort derive (${r.effort})`));
          }
        });
        break;
      }

      case 'B10': {
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.priority || r.priority.trim() === '')) {
            const linked = fixedThreats.filter(th => th.iecRef === r.article);
            const maxScore = linked.length > 0 ? Math.max(...linked.map(th => th.likelihood * th.impact)) : 0;
            r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0' : r.status === 'fail' ? 'P1' : maxScore >= 13 ? 'P2' : 'P3';
            fixes.push(t(`${r.id}: Prioritaet -> ${r.priority}`, `${r.id}: Priority -> ${r.priority}`, `${r.id}: Priorite -> ${r.priority}`));
          }
        });
        break;
      }

      case 'C1': {
        const weak = fixedThreats.filter(th => th.likelihood * th.impact >= 20 && th.evidenceQuality < 4);
        if (weak.length > 0) {
          fixes.push(t(`Hinweis: ${weak.length} Threat(s) mit unzureichender Evidenz: ${weak.map(threatId).join(', ')}`, `Note: ${weak.length} threat(s) with insufficient evidence`, `Note : ${weak.length} menace(s) avec preuve insuffisante`));
        }
        break;
      }

      case 'C2': {
        const noSrc = fixedThreats.filter(th => !th.sources || th.sources.length === 0);
        if (noSrc.length > 0) {
          fixes.push(t(`Hinweis: ${noSrc.length} Threat(s) ohne Quellen`, `Note: ${noSrc.length} threat(s) without sources`, `Note : ${noSrc.length} menace(s) sans references`));
        }
        break;
      }

      case 'E1': {
        fixedThreats.forEach(th => {
          if ((th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('sps') || th.component.toLowerCase().includes('plc')) && th.impact < 4) {
            const old = th.impact;
            th.impact = 5;
            fixes.push(t(`${threatId(th)}: OT-Impact ${old} -> 5 (Safety)`, `${threatId(th)}: OT impact ${old} -> 5 (safety)`, `${threatId(th)}: Impact OT ${old} -> 5`));
          }
        });
        break;
      }
    }
  }

  // Second pass: ensure all non-pass have effort+priority
  fixedReqs.forEach(r => {
    if (r.status !== 'pass') {
      const linked = fixedThreats.filter(th => th.iecRef === r.article);
      const maxScore = linked.length > 0 ? Math.max(...linked.map(th => th.likelihood * th.impact)) : 0;
      if (!r.effort || r.effort.trim() === '') {
        r.effort = maxScore >= 20 ? '24-40h' : maxScore >= 13 ? '16-24h' : r.status === 'fail' ? '8-16h' : '4-8h';
      }
      if (!r.priority || r.priority.trim() === '') {
        r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0' : r.status === 'fail' ? 'P1' : maxScore >= 13 ? 'P2' : 'P3';
      }
    }
  });

  if (fixes.length === 0) {
    fixes.push(t('Keine korrigierbaren Befunde', 'No fixable findings', 'Aucune constatation corrigeable'));
  }

  return { threats: fixedThreats, reqs: fixedReqs, fixes };
}
