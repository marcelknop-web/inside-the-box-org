/**
 * Apply audit recommendations automatically.
 * Adjusts requirement statuses, threat scores, and metadata based on QA check failures.
 *
 * RULE: No content is invented. All corrections are derived from existing data
 * (threat scores, component names, interface lists, status cross-references).
 */
import type { Threat, CraReq, IntakeData } from '@/data/craData';
import { threatId } from '@/data/craData';
import type { QaCheck } from '@/utils/craQualityCheck';

export interface FixResult {
  threats: Threat[];
  reqs: CraReq[];
  fixes: string[];
}

export function applyAuditFixes(
  threats: Threat[],
  reqs: CraReq[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: IntakeData
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedThreats = threats.map(th => ({ ...th, sources: [...th.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];
  const failedIds = new Set(failedChecks.map(c => c.id));

  for (const check of failedChecks) {
    switch (check.id) {

      // ═══ A: KONSISTENZ ═══

      case 'A2-1': {
        // Link unlinked threats to the closest matching requirement by component/STRIDE mapping
        fixedThreats.forEach(th => {
          if (!th.cra || th.cra.trim() === '') {
            // Derive CRA link from STRIDE category instead of generic assignment
            const strideToArticle: Record<string, string> = {
              S: 'Annex I, Part I, Nr. 2',  // Spoofing → Authentication
              T: 'Annex I, Part I, Nr. 5',  // Tampering → Integrity
              R: 'Annex I, Part I, Nr. 8',  // Repudiation → Logging
              I: 'Annex I, Part I, Nr. 4',  // Information Disclosure → Confidentiality
              D: 'Annex I, Part I, Nr. 6',  // Denial of Service → Availability
              E: 'Annex I, Part I, Nr. 1',  // Elevation → Security by Default
            };
            th.cra = strideToArticle[th.stride] || 'Annex I, Part I, Nr. 1';
            fixes.push(t(
              `${threatId(th)}: CRA-Verknuepfung aus STRIDE-Kategorie abgeleitet -> ${th.cra}`,
              `${threatId(th)}: CRA link derived from STRIDE category -> ${th.cra}`,
              `${threatId(th)}: Lien CRA derive de la categorie STRIDE -> ${th.cra}`
            ));
          }
        });
        break;
      }

      case 'A2-2': {
        // Bidirectional traceability: non-pass reqs without linked threats
        // → Downgrade to "pass" if no threats justify the status, OR keep and document
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') {
            const linkedThreats = fixedThreats.filter(th => th.cra === r.article);
            if (linkedThreats.length === 0) {
              // Check if there are threats referencing this req by name/component match
              const nameMatch = fixedThreats.filter(th =>
                r.name.toLowerCase().split(' ').some(w => w.length > 4 && th.name.toLowerCase().includes(w))
              );
              if (nameMatch.length > 0) {
                // Re-link matching threats
                nameMatch.forEach(th => {
                  th.cra = r.article;
                  fixes.push(t(
                    `${threatId(th)}: Verknuepfung zu ${r.id} hergestellt (Namensabgleich)`,
                    `${threatId(th)}: Linked to ${r.id} (name matching)`,
                    `${threatId(th)}: Lie a ${r.id} (correspondance de noms)`
                  ));
                });
              } else {
                // No matching threats → status must be documented as manual finding
                r.rationale = r.rationale + (r.rationale ? ' — ' : '') + t(
                  'Hinweis: Keine Threats verknuepft, manuelle Pruefung durch Auditor erforderlich',
                  'Note: No linked threats, manual review by auditor required',
                  'Note : aucune menace liee, revision manuelle par auditeur requise'
                );
                fixes.push(t(
                  `${r.id}: Fehlende Threat-Verknuepfung dokumentiert`,
                  `${r.id}: Missing threat link documented`,
                  `${r.id}: Lien de menace manquant documente`
                ));
              }
            }
          }
        });
        break;
      }

      case 'A3-1':
      case 'A3-2': {
        // Downgrade reqs marked "pass" that have violating threats
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedThreats.filter(th => th.cra === r.article && th.likelihood * th.impact >= 13);
          if (violating.length > 0) {
            const maxScore = Math.max(...violating.map(th => th.likelihood * th.impact));
            const topThreat = violating.find(th => th.likelihood * th.impact === maxScore)!;
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            if (!r.gap || r.gap.trim() === '') {
              r.gap = topThreat.name;
            }
            fixes.push(t(
              `${r.id}: Status korrigiert -> ${r.status === 'fail' ? 'nicht konform' : 'teilweise konform'} (${threatId(topThreat)}, Score ${maxScore})`,
              `${r.id}: Status corrected -> ${r.status === 'fail' ? 'non-compliant' : 'partially compliant'} (${threatId(topThreat)}, score ${maxScore})`,
              `${r.id}: Statut corrige -> ${r.status === 'fail' ? 'non conforme' : 'partiellement conforme'} (${threatId(topThreat)}, score ${maxScore})`
            ));
          }
        });
        break;
      }

      case 'A3-1b': {
        // Downgrade "partial" to "fail" when critical threats (>= 20) exist
        fixedReqs.forEach(r => {
          if (r.status !== 'partial') return;
          const critical = fixedThreats.filter(th => th.cra === r.article && th.likelihood * th.impact >= 20);
          if (critical.length > 0) {
            const topThreat = critical[0];
            r.status = 'fail';
            fixes.push(t(
              `${r.id}: "teilweise" -> "nicht konform" (kritischer Threat ${threatId(topThreat)}, Score >= 20)`,
              `${r.id}: "partial" -> "non-compliant" (critical threat ${threatId(topThreat)}, score >= 20)`,
              `${r.id}: "partiel" -> "non conforme" (menace critique ${threatId(topThreat)}, score >= 20)`
            ));
          }
        });
        break;
      }

      // ═══ B: FACHLICHE KORREKTHEIT ═══

      case 'B1': {
        // A1-4: Downgrade to fail if unencrypted protocols exist
        const a14 = fixedReqs.find(r => r.id === 'A1-4');
        if (a14 && a14.status !== 'fail') {
          const unencryptedThreat = fixedThreats.find(th =>
            th.name.toLowerCase().includes('klartext') ||
            th.name.toLowerCase().includes('unverschl') ||
            th.name.toLowerCase().includes('security mode none')
          );
          a14.status = 'fail';
          // Use the actual threat name for gap if available
          if (unencryptedThreat) {
            a14.gap = unencryptedThreat.name;
          } else if (intakeData?.interfaces.some(i => i.includes('unverschl') || i === 'HTTP')) {
            a14.gap = t(
              `Interface-Konfiguration: ${intakeData.interfaces.filter(i => i.includes('unverschl') || i === 'HTTP').join(', ')}`,
              `Interface configuration: ${intakeData.interfaces.filter(i => i.includes('unverschl') || i === 'HTTP').join(', ')}`,
              `Configuration interface : ${intakeData.interfaces.filter(i => i.includes('unverschl') || i === 'HTTP').join(', ')}`
            );
          }
          fixes.push(t(
            `A1-4 Vertraulichkeit -> nicht konform${unencryptedThreat ? ` (${threatId(unencryptedThreat)})` : ''}`,
            `A1-4 Confidentiality -> non-compliant${unencryptedThreat ? ` (${threatId(unencryptedThreat)})` : ''}`,
            `A1-4 Confidentialite -> non conforme${unencryptedThreat ? ` (${threatId(unencryptedThreat)})` : ''}`
          ));
        }
        break;
      }

      case 'B2': {
        const a13 = fixedReqs.find(r => r.id === 'A1-3');
        if (a13 && a13.status === 'pass') {
          const authThreat = fixedThreats.find(th =>
            th.name.toLowerCase().includes('unauthentifiziert') ||
            th.name.toLowerCase().includes('standard-passwort') ||
            th.name.toLowerCase().includes('default')
          );
          a13.status = 'fail';
          if (authThreat) {
            a13.gap = authThreat.name;
          }
          fixes.push(t(
            `A1-3 Zugriffsschutz -> nicht konform${authThreat ? ` (${threatId(authThreat)})` : ''}`,
            `A1-3 Access control -> non-compliant${authThreat ? ` (${threatId(authThreat)})` : ''}`,
            `A1-3 Controle d'acces -> non conforme${authThreat ? ` (${threatId(authThreat)})` : ''}`
          ));
        }
        break;
      }

      case 'B3': {
        const a12 = fixedReqs.find(r => r.id === 'A1-2');
        if (a12 && a12.status === 'pass') {
          const defaultThreat = fixedThreats.find(th =>
            th.name.toLowerCase().includes('standard-') || th.name.toLowerCase().includes('default') || th.name.toLowerCase().includes('debug')
          );
          a12.status = 'fail';
          if (defaultThreat) {
            a12.gap = defaultThreat.name;
          }
          fixes.push(t(
            `A1-2 Secure by Default -> nicht konform${defaultThreat ? ` (${threatId(defaultThreat)})` : ''}`,
            `A1-2 Secure by Default -> non-compliant${defaultThreat ? ` (${threatId(defaultThreat)})` : ''}`,
            `A1-2 Secure by Default -> non conforme${defaultThreat ? ` (${threatId(defaultThreat)})` : ''}`
          ));
        }
        break;
      }

      case 'B4': {
        const a15 = fixedReqs.find(r => r.id === 'A1-5');
        if (a15 && a15.status === 'pass') {
          const violating = fixedThreats.filter(th => th.cra === a15.article && th.likelihood * th.impact >= 15);
          const modbusManip = fixedThreats.find(th =>
            th.name.toLowerCase().includes('modbus') && th.name.toLowerCase().includes('manipulation')
          );
          const topThreat = modbusManip || violating[0];
          const maxScore = violating.length > 0 ? Math.max(...violating.map(th => th.likelihood * th.impact)) : (modbusManip ? modbusManip.likelihood * modbusManip.impact : 15);
          a15.status = maxScore >= 20 ? 'fail' : 'partial';
          if (topThreat) {
            a15.gap = topThreat.name;
          }
          // Derive effort from threat score
          a15.effort = a15.effort || (maxScore >= 20 ? '24-40h' : '16-24h');
          a15.priority = a15.priority || (maxScore >= 20 ? 'P0' : 'P1');
          fixes.push(t(
            `A1-5 Integritaet -> ${a15.status === 'fail' ? 'nicht konform' : 'teilweise konform'}${topThreat ? ` (${threatId(topThreat)}, Score ${maxScore})` : ''}`,
            `A1-5 Integrity -> ${a15.status === 'fail' ? 'non-compliant' : 'partially compliant'}${topThreat ? ` (${threatId(topThreat)}, score ${maxScore})` : ''}`,
            `A1-5 Integrite -> ${a15.status === 'fail' ? 'non conforme' : 'partiellement conforme'}${topThreat ? ` (${threatId(topThreat)}, score ${maxScore})` : ''}`
          ));
        }
        break;
      }

      case 'B6': {
        const a18 = fixedReqs.find(r => r.id === 'A1-8');
        if (a18 && a18.status === 'pass') {
          const logThreat = fixedThreats.find(th =>
            th.name.toLowerCase().includes('audit-log') || th.name.toLowerCase().includes('logging')
          );
          a18.status = 'fail';
          if (logThreat) {
            a18.gap = logThreat.name;
          }
          fixes.push(t(
            `A1-8 Logging -> nicht konform${logThreat ? ` (${threatId(logThreat)})` : ''}`,
            `A1-8 Logging -> non-compliant${logThreat ? ` (${threatId(logThreat)})` : ''}`,
            `A1-8 Logging -> non conforme${logThreat ? ` (${threatId(logThreat)})` : ''}`
          ));
        }
        break;
      }

      case 'B9': {
        // Add effort estimates derived from threat severity, not generic values
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.effort || r.effort.trim() === '')) {
            const linkedThreats = fixedThreats.filter(th => th.cra === r.article);
            const maxScore = linkedThreats.length > 0 ? Math.max(...linkedThreats.map(th => th.likelihood * th.impact)) : 0;
            // Derive effort from severity: higher score = more remediation work
            if (maxScore >= 20) {
              r.effort = '24-40h';
            } else if (maxScore >= 13) {
              r.effort = '16-24h';
            } else if (r.status === 'fail') {
              r.effort = '8-16h';
            } else {
              r.effort = '4-8h';
            }
            fixes.push(t(
              `${r.id}: Aufwandsschaetzung abgeleitet (${r.effort}, basierend auf Threat-Score ${maxScore})`,
              `${r.id}: Effort estimate derived (${r.effort}, based on threat score ${maxScore})`,
              `${r.id}: Estimation d'effort derivee (${r.effort}, basee sur score menace ${maxScore})`
            ));
          }
        });
        break;
      }

      case 'B10': {
        // Add priority derived from threat severity and status
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.priority || r.priority.trim() === '')) {
            const linkedThreats = fixedThreats.filter(th => th.cra === r.article);
            const maxScore = linkedThreats.length > 0 ? Math.max(...linkedThreats.map(th => th.likelihood * th.impact)) : 0;
            r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0'
              : r.status === 'fail' ? 'P1'
              : maxScore >= 13 ? 'P2' : 'P3';
            fixes.push(t(
              `${r.id}: Prioritaet abgeleitet -> ${r.priority} (Status ${r.status}, Threat-Score ${maxScore})`,
              `${r.id}: Priority derived -> ${r.priority} (status ${r.status}, threat score ${maxScore})`,
              `${r.id}: Priorite derivee -> ${r.priority} (statut ${r.status}, score menace ${maxScore})`
            ));
          }
        });
        break;
      }

      // ═══ C: EVIDENZ ═══

      case 'C1':
      case 'C1b': {
        // Flag critical/high threats with weak evidence — do NOT invent evidence
        const threshold = check.id === 'C1' ? 20 : 15;
        const minQuality = check.id === 'C1' ? 4 : 3;
        const weakThreats = fixedThreats.filter(th => th.likelihood * th.impact >= threshold && th.evidenceQuality < minQuality);
        if (weakThreats.length > 0) {
          fixes.push(t(
            `Hinweis: ${weakThreats.length} Threat(s) mit unzureichender Evidenz — manuelle Nachpruefung erforderlich: ${weakThreats.map(threatId).join(', ')}`,
            `Note: ${weakThreats.length} threat(s) with insufficient evidence — manual review required: ${weakThreats.map(threatId).join(', ')}`,
            `Note : ${weakThreats.length} menace(s) avec preuve insuffisante — verification manuelle requise : ${weakThreats.map(threatId).join(', ')}`
          ));
        }
        break;
      }

      case 'C2': {
        // Flag threats without sources — do NOT invent sources
        const noSrc = fixedThreats.filter(th => !th.sources || th.sources.length === 0);
        if (noSrc.length > 0) {
          fixes.push(t(
            `Hinweis: ${noSrc.length} Threat(s) ohne Quellenreferenzen — manuelle Ergaenzung erforderlich: ${noSrc.map(threatId).join(', ')}`,
            `Note: ${noSrc.length} threat(s) without source references — manual addition required: ${noSrc.map(threatId).join(', ')}`,
            `Note : ${noSrc.length} menace(s) sans references — ajout manuel requis : ${noSrc.map(threatId).join(', ')}`
          ));
        }
        break;
      }

      // ═══ D: REDAKTION ═══

      case 'D4': {
        // Fix detectable typos — use string replace (no global regex + test pitfall)
        const typoMap: [string, string][] = [
          ['Netzwerkcan', 'Netzwerkscan'],
          ['Aush', 'Auth'],
          ['SBM', 'SBOM'],
          ['Fur', 'fuer'],
          ['Uber', 'ueber'],
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
        fixedThreats.forEach(th => {
          th.evidence = fixField(th.evidence);
          th.rationale = fixField(th.rationale);
          th.name = fixField(th.name);
        });
        fixedReqs.forEach(r => {
          r.evidence = fixField(r.evidence);
          r.rationale = fixField(r.rationale);
          r.gap = fixField(r.gap);
          r.measure = fixField(r.measure);
        });
        if (typoCount > 0) {
          fixes.push(t(
            `${typoCount} Tippfehler korrigiert`,
            `${typoCount} typos corrected`,
            `${typoCount} fautes de frappe corrigees`
          ));
        }
        break;
      }

      // ═══ E: OT ═══

      case 'E1': {
        fixedThreats.forEach(th => {
          if ((th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua')) && th.impact < 4) {
            const old = th.impact;
            th.impact = 5;
            fixes.push(t(
              `${threatId(th)}: OT-Impact von ${old} auf 5 korrigiert (Safety-Relevanz)`,
              `${threatId(th)}: OT impact corrected from ${old} to 5 (safety relevance)`,
              `${threatId(th)}: Impact OT corrige de ${old} a 5 (pertinence securite)`
            ));
          }
        });
        break;
      }

      // ═══ Non-automatable checks: document as manual tasks ═══

      case 'A4-1': {
        // STRIDE distribution per component — cannot auto-generate threats
        const components = new Map<string, Set<string>>();
        for (const th of fixedThreats) {
          const comp = th.component.split('—')[0].trim();
          if (!components.has(comp)) components.set(comp, new Set());
          components.get(comp)!.add(th.stride);
        }
        const underCovered = [...components.entries()].filter(([, s]) => s.size < 2);
        if (underCovered.length > 0) {
          fixes.push(t(
            `Hinweis: ${underCovered.map(([c, s]) => `${c} (${s.size} STRIDE-Kat.)`).join(', ')} — zusaetzliche Threat-Analyse empfohlen`,
            `Note: ${underCovered.map(([c, s]) => `${c} (${s.size} STRIDE cat.)`).join(', ')} — additional threat analysis recommended`,
            `Note : ${underCovered.map(([c, s]) => `${c} (${s.size} cat. STRIDE)`).join(', ')} — analyse de menaces supplementaire recommandee`
          ));
        }
        break;
      }

      case 'B7': {
        fixes.push(t(
          'Hinweis: SBOM-Anforderung (A2-8) fehlt im Anforderungskatalog — manuelle Ergaenzung erforderlich',
          'Note: SBOM requirement (A2-8) missing from requirements — manual addition required',
          'Note : exigence SBOM (A2-8) manquante dans le catalogue — ajout manuel requis'
        ));
        break;
      }

      case 'B8': {
        fixes.push(t(
          'Hinweis: Art. 14 Meldepflichten fehlt im Anforderungskatalog — manuelle Ergaenzung erforderlich',
          'Note: Art. 14 incident reporting missing from requirements — manual addition required',
          'Note : Art. 14 obligations de signalement manquant — ajout manuel requis'
        ));
        break;
      }
    }
  }

  // ═══ Second pass: ALWAYS ensure all non-pass reqs have effort+priority ═══
  // (needed after any status downgrade from A3-1/A3-2/B1-B6)
  {
    const secondPassFixes: string[] = [];
    fixedReqs.forEach(r => {
      if (r.status !== 'pass') {
        const linkedThreats = fixedThreats.filter(th => th.cra === r.article);
        const maxScore = linkedThreats.length > 0 ? Math.max(...linkedThreats.map(th => th.likelihood * th.impact)) : 0;

        if (!r.effort || r.effort.trim() === '') {
          if (maxScore >= 20) r.effort = '24-40h';
          else if (maxScore >= 13) r.effort = '16-24h';
          else if (r.status === 'fail') r.effort = '8-16h';
          else r.effort = '4-8h';
          secondPassFixes.push(`${r.id}:effort=${r.effort}`);
        }
        if (!r.priority || r.priority.trim() === '') {
          r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0'
            : r.status === 'fail' ? 'P1'
            : maxScore >= 13 ? 'P2' : 'P3';
          secondPassFixes.push(`${r.id}:prio=${r.priority}`);
        }
      }
    });
    if (secondPassFixes.length > 0) {
      fixes.push(t(
        `Second-Pass: ${secondPassFixes.length} fehlende Effort/Priority-Felder ergaenzt (${secondPassFixes.slice(0, 5).join(', ')}${secondPassFixes.length > 5 ? ' ...' : ''})`,
        `Second pass: ${secondPassFixes.length} missing effort/priority fields added (${secondPassFixes.slice(0, 5).join(', ')}${secondPassFixes.length > 5 ? ' ...' : ''})`,
        `Second pass : ${secondPassFixes.length} champs effort/priorite manquants ajoutes (${secondPassFixes.slice(0, 5).join(', ')}${secondPassFixes.length > 5 ? ' ...' : ''})`
      ));
    }
  }

  if (fixes.length === 0) {
    fixes.push(t(
      'Keine korrigierbaren Befunde — manuelle Ueberarbeitung empfohlen',
      'No fixable findings — manual revision recommended',
      'Aucune constatation corrigeable — revision manuelle recommandee'
    ));
  }

  return { threats: fixedThreats, reqs: fixedReqs, fixes };
}
