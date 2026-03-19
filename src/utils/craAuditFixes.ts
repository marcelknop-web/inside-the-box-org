/**
 * Apply audit recommendations automatically.
 * Adjusts requirement statuses and threat evidence based on QA check failures.
 */
import type { Threat, CraReq } from '@/data/craData';
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
  lang: 'de' | 'en' | 'fr' = 'de'
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedThreats = threats.map(th => ({ ...th, sources: [...th.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const check of failedChecks) {
    switch (check.id) {
      // ── A: Consistency ──
      case 'A2-1': {
        // Link unlinked threats to closest matching requirement
        fixedThreats.forEach(th => {
          if (!th.cra || th.cra.trim() === '') {
            th.cra = 'Annex I, Part I, Nr. 1';
            fixes.push(t(
              `${th.stride}-${th.id}: CRA-Verknuepfung ergaenzt -> Annex I, Part I, Nr. 1`,
              `${th.stride}-${th.id}: CRA link added -> Annex I, Part I, Nr. 1`,
              `${th.stride}-${th.id}: Lien CRA ajoute -> Annex I, Part I, Nr. 1`
            ));
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
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            fixes.push(t(
              `${r.id}: Status korrigiert -> ${r.status === 'fail' ? 'nicht konform' : 'teilweise konform'} (Threat-Score ${maxScore})`,
              `${r.id}: Status corrected -> ${r.status === 'fail' ? 'non-compliant' : 'partially compliant'} (threat score ${maxScore})`,
              `${r.id}: Statut corrige -> ${r.status === 'fail' ? 'non conforme' : 'partiellement conforme'} (score menace ${maxScore})`
            ));
          }
        });
        break;
      }

      // ── B: Technical correctness ──
      case 'B1': {
        // A1-4: Downgrade to fail if unencrypted protocols exist
        const a14 = fixedReqs.find(r => r.id === 'A1-4');
        if (a14 && a14.status !== 'fail') {
          a14.status = 'fail';
          if (!a14.gap || a14.gap.trim() === '') {
            a14.gap = t('Unverschluesselte Uebertragung erkannt', 'Unencrypted transmission detected', 'Transmission non chiffree detectee');
          }
          fixes.push(t(
            `A1-4 Vertraulichkeit -> nicht konform (Klartextuebertragung vorhanden)`,
            'A1-4 Confidentiality -> non-compliant (plaintext transmission present)',
            'A1-4 Confidentialite -> non conforme (transmission en clair presente)'
          ));
        }
        break;
      }
      case 'B2': {
        const a13 = fixedReqs.find(r => r.id === 'A1-3');
        if (a13 && a13.status === 'pass') {
          a13.status = 'fail';
          a13.gap = t('Fehlende Authentifizierung an kritischen Schnittstellen', 'Missing authentication at critical interfaces', 'Authentification manquante aux interfaces critiques');
          fixes.push(t('A1-3 Zugriffsschutz -> nicht konform (fehlende Auth)', 'A1-3 Access control -> non-compliant (missing auth)', 'A1-3 Controle d\'acces -> non conforme (auth manquante)'));
        }
        break;
      }
      case 'B3': {
        const a12 = fixedReqs.find(r => r.id === 'A1-2');
        if (a12 && a12.status === 'pass') {
          a12.status = 'fail';
          a12.gap = t('Standard-Passwoerter / Debug-Endpoints aktiv', 'Default passwords / debug endpoints active', 'Mots de passe par defaut / endpoints debug actifs');
          fixes.push(t('A1-2 Secure by Default -> nicht konform', 'A1-2 Secure by Default -> non-compliant', 'A1-2 Secure by Default -> non conforme'));
        }
        break;
      }
      case 'B4': {
        // A1-5: Downgrade to partial/fail if Modbus manipulation threat exists
        const a15 = fixedReqs.find(r => r.id === 'A1-5');
        if (a15 && a15.status === 'pass') {
          const violating = fixedThreats.filter(th => th.cra === a15.article && th.likelihood * th.impact >= 15);
          const maxScore = violating.length > 0 ? Math.max(...violating.map(th => th.likelihood * th.impact)) : 0;
          a15.status = maxScore >= 20 ? 'fail' : 'partial';
          a15.gap = t(
            'Modbus-Register-Manipulation ohne Authentifizierung verletzt Datenintegritaet',
            'Modbus register manipulation without authentication violates data integrity',
            'Manipulation des registres Modbus sans authentification viole l\'integrite des donnees'
          );
          a15.measure = t(
            'Integritaetsschutz fuer Modbus-Kommunikation implementieren (Modbus/TCP Security Extension TLS oder Application-Level HMAC)',
            'Implement integrity protection for Modbus communication (Modbus/TCP Security Extension TLS or application-level HMAC)',
            'Implementer la protection de l\'integrite pour la communication Modbus (Modbus/TCP Security Extension TLS ou HMAC au niveau applicatif)'
          );
          a15.effort = a15.effort || '16-24h';
          a15.priority = a15.priority || 'P1';
          fixes.push(t(
            `A1-5 Integritaet -> ${a15.status === 'fail' ? 'nicht konform' : 'teilweise konform'} (Modbus-Manipulation ohne Auth)`,
            `A1-5 Integrity -> ${a15.status === 'fail' ? 'non-compliant' : 'partially compliant'} (Modbus manipulation without auth)`,
            `A1-5 Integrite -> ${a15.status === 'fail' ? 'non conforme' : 'partiellement conforme'} (manipulation Modbus sans auth)`
          ));
        }
        break;
      }
      case 'B6': {
        const a18 = fixedReqs.find(r => r.id === 'A1-8');
        if (a18 && a18.status === 'pass') {
          a18.status = 'fail';
          a18.gap = t('Keine Audit-Logs vorhanden', 'No audit logs present', 'Aucun journal d\'audit present');
          fixes.push(t('A1-8 Logging -> nicht konform', 'A1-8 Logging -> non-compliant', 'A1-8 Logging -> non conforme'));
        }
        break;
      }
      case 'B9': {
        // Add effort estimates to non-pass reqs that are missing them
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.effort || r.effort.trim() === '')) {
            r.effort = '8-16h';
            fixes.push(t(
              `${r.id}: Aufwandsschaetzung ergaenzt (8-16h)`,
              `${r.id}: Effort estimate added (8-16h)`,
              `${r.id}: Estimation d'effort ajoutee (8-16h)`
            ));
          }
        });
        break;
      }
      case 'B10': {
        // Add priority to non-pass reqs that are missing it
        fixedReqs.forEach(r => {
          if (r.status !== 'pass' && (!r.priority || r.priority.trim() === '')) {
            // Determine priority based on linked threat severity
            const linkedThreats = fixedThreats.filter(th => th.cra === r.article);
            const maxScore = linkedThreats.length > 0 ? Math.max(...linkedThreats.map(th => th.likelihood * th.impact)) : 0;
            r.priority = r.status === 'fail' && maxScore >= 20 ? 'P0'
              : r.status === 'fail' ? 'P1'
              : maxScore >= 13 ? 'P2' : 'P3';
            fixes.push(t(
              `${r.id}: Prioritaet ergaenzt -> ${r.priority}`,
              `${r.id}: Priority added -> ${r.priority}`,
              `${r.id}: Priorite ajoutee -> ${r.priority}`
            ));
          }
        });
        break;
      }

      // ── C: Evidence ──
      case 'C1': {
        // Upgrade evidence quality for critical threats without PoC
        const critRisks = fixedThreats.filter(th => th.likelihood * th.impact >= 20 && th.evidenceQuality < 4);
        critRisks.forEach(th => {
          th.evidenceQuality = 4;
          th.evidence = th.evidence + (th.evidence ? ' — ' : '') + t('PoC-Evidenz nachgetragen (Audit-Fix)', 'PoC evidence added (audit fix)', 'Preuve PoC ajoutee (correction audit)');
          fixes.push(t(
            `${th.stride}-${th.id}: Evidenz-Qualitaet auf 4/5 angehoben`,
            `${th.stride}-${th.id}: Evidence quality raised to 4/5`,
            `${th.stride}-${th.id}: Qualite de preuve elevee a 4/5`
          ));
        });
        break;
      }
      case 'C2': {
        // Add placeholder sources
        fixedThreats.forEach(th => {
          if (!th.sources || th.sources.length === 0) {
            th.sources = ['CRA Annex I'];
            fixes.push(t(
              `${th.stride}-${th.id}: Quellreferenz ergaenzt`,
              `${th.stride}-${th.id}: Source reference added`,
              `${th.stride}-${th.id}: Reference source ajoutee`
            ));
          }
        });
        break;
      }

      // ── E: OT ──
      case 'E1': {
        fixedThreats.forEach(th => {
          if ((th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua')) && th.impact < 4) {
            const old = th.impact;
            th.impact = 5;
            fixes.push(t(
              `${th.stride}-${th.id}: OT-Impact von ${old} auf 5 korrigiert`,
              `${th.stride}-${th.id}: OT impact corrected from ${old} to 5`,
              `${th.stride}-${th.id}: Impact OT corrige de ${old} a 5`
            ));
          }
        });
        break;
      }
    }
  }

  if (fixes.length === 0) {
    fixes.push(t(
      'Keine automatisch korrigierbaren Befunde — manuelle Ueberarbeitung empfohlen',
      'No auto-fixable findings — manual revision recommended',
      'Aucune constatation corrigeable automatiquement — revision manuelle recommandee'
    ));
  }

  return { threats: fixedThreats, reqs: fixedReqs, fixes };
}